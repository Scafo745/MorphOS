import { CloudConfig } from './types';

/**
 * Prioritized Gemini model candidates, shared by both the QA answerer here and
 * the theme compiler in prompt-compiler.ts. We try them in order until one
 * returns HTTP 200 with usable content, so a single retired or overloaded
 * model no longer forces the whole feature offline.
 *
 * Order rationale:
 *  1. gemini-flash-latest   - stable self-updating alias, most future-proof.
 *  2. gemini-2.5-flash      - confirmed-working stable model.
 *  3. gemini-2.0-flash      - older stable fallback.
 *  4. gemini-2.5-flash-lite - lightweight last resort.
 */
export const GEMINI_MODELS = [
  'gemini-flash-latest',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.5-flash-lite',
] as const;

/**
 * Per-attempt network timeout (milliseconds). Each candidate attempt owns its
 * own AbortController wired to this timeout.
 */
export const GEMINI_ATTEMPT_TIMEOUT_MS = 4000;

/**
 * Backoff before the single quick retry we allow a model on a transient
 * (503/429) status. We allow at most ONE retry per model so the candidate walk
 * cannot balloon: with 4 models this keeps the attempt budget small while the
 * overall deadline below is the hard ceiling.
 */
export const GEMINI_RETRY_BACKOFF_MS = 600;

/**
 * Overall wall-clock budget for the whole candidate walk (milliseconds). A bad
 * network could otherwise cost 4 models x 2 attempts x 4s = ~32s; this deadline
 * guarantees we stop trying new candidates and fall back to the offline / local
 * engine within ~13s, keeping the chat UI responsive.
 */
export const GEMINI_TOTAL_DEADLINE_MS = 13000;

/**
 * Transient server statuses worth a short retry: 503 (model overloaded /
 * UNAVAILABLE) and 429 (rate limited). Anything else (400/403/404 etc) is a
 * hard error for that model, so we skip straight to the next candidate.
 */
export function isRetryableGeminiStatus(status: number): boolean {
  return status === 503 || status === 429;
}

/**
 * Outcome of the most recent Gemini attempt. This is purely observable
 * diagnostics so the UI can explain WHY a request fell back to the local
 * engine instead of silently showing a vague offline message. It never holds
 * or logs the API key, only the HTTP status and a short human reason.
 */
export interface GeminiDiagnostic {
  ok: boolean;
  status: number | null;
  reason: string;
}

let lastGeminiDiagnostic: GeminiDiagnostic | null = null;

/**
 * Read why the most recent Gemini call succeeded or failed. Returns null when
 * no call has been attempted yet this session. Reason strings are stable and
 * UI-friendly: 'no-key', 'http-400 invalid or revoked key', 'http-429 rate
 * limited', 'http-403 forbidden', 'network error/timeout', 'ok', etc.
 */
export function getLastGeminiDiagnostic(): GeminiDiagnostic | null {
  return lastGeminiDiagnostic;
}

/** Human-readable reason for a non-OK HTTP status from the Gemini endpoint. */
function reasonForStatus(status: number): string {
  if (status === 400) return 'http-400 invalid or revoked key';
  if (status === 403) return 'http-403 forbidden';
  if (status === 429) return 'http-429 rate limited';
  if (status === 404) return 'http-404 model not found';
  return `http-${status} request failed`;
}

/**
 * Shared Gemini caller. Walks GEMINI_MODELS in priority order and returns the
 * first candidate's raw response text (candidates[0].content.parts[0].text),
 * or null when every candidate is exhausted / the deadline is hit / all throw.
 *
 * Discipline per the orchestrator brief:
 *  - Each attempt owns its own AbortController + GEMINI_ATTEMPT_TIMEOUT_MS.
 *  - HTTP 200 with usable text -> return it (caller tags source 'gemini').
 *  - Transient 503/429 -> ONE quick bounded retry on the SAME model, then move
 *    on to the next candidate.
 *  - Hard status (400/403/404 etc) -> no retry, move on immediately.
 *  - Network/catch -> move on to the next candidate.
 *  - Honors GEMINI_TOTAL_DEADLINE_MS so the whole walk stays under ~13s.
 *
 * The caller supplies the per-request body (QA sends plain text, the compiler
 * adds generationConfig.responseMimeType 'application/json') via buildBody, so
 * each call site keeps its own request shape and response parsing.
 */
export async function callGeminiCandidates(
  apiKey: string,
  buildBody: () => Record<string, unknown>
): Promise<string | null> {
  const deadline = Date.now() + GEMINI_TOTAL_DEADLINE_MS;

  // Detect the no-key case before the loop so the UI can distinguish "no key
  // configured" from "key present but rejected / unreachable".
  if (!apiKey) {
    lastGeminiDiagnostic = { ok: false, status: null, reason: 'no-key' };
    return null;
  }

  // Track the most recent failure across all attempts so, if every candidate
  // is exhausted, the exported diagnostic reflects the real last reason.
  let lastStatus: number | null = null;
  let lastReason = 'network error/timeout';

  for (const model of GEMINI_MODELS) {
    // At most 2 attempts per model (initial + one quick retry on 503/429).
    for (let attempt = 0; attempt < 2; attempt++) {
      if (Date.now() >= deadline) {
        return null;
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), GEMINI_ATTEMPT_TIMEOUT_MS);

        let res: Response;
        try {
          res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(buildBody()),
              signal: controller.signal,
            }
          );
        } finally {
          clearTimeout(timeoutId);
        }

        if (res.ok) {
          const json = await res.json();
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (typeof text === 'string' && text.trim()) {
            lastGeminiDiagnostic = { ok: true, status: res.status, reason: 'ok' };
            return text;
          }
          // 200 but empty/unusable: this model will not do better, move on.
          lastStatus = res.status;
          lastReason = 'empty response';
          break;
        }

        // Record this non-ok status as the latest failure reason.
        lastStatus = res.status;
        lastReason = reasonForStatus(res.status);

        // Transient overload / rate limit: one quick retry on the same model
        // (only if the first attempt and the deadline still allows it).
        if (
          isRetryableGeminiStatus(res.status) &&
          attempt === 0 &&
          Date.now() + GEMINI_RETRY_BACKOFF_MS < deadline
        ) {
          await new Promise((r) => setTimeout(r, GEMINI_RETRY_BACKOFF_MS));
          continue;
        }

        // Hard status, or retry already spent: move on to the next candidate.
        break;
      } catch {
        // Network error / abort / timeout: move on to the next candidate.
        lastStatus = null;
        lastReason = 'network error/timeout';
        break;
      }
    }
  }

  // Every candidate exhausted: surface the most recent failure reason.
  lastGeminiDiagnostic = { ok: false, status: lastStatus, reason: lastReason };
  return null;
}

/**
 * Centralized keyword set that classifies a prompt as an OS reconfiguration /
 * tool intent (theme, color, security, process, payments, Juspay, etc) rather
 * than a general question. This consolidates the keyword branches that drive
 * Copilot's synthesis cascade so classification stays consistent everywhere.
 */
export const SYNTHESIS_KEYWORDS: string[] = [
  // reconfiguration verbs
  'reconfigure',
  'morph',
  'switch',
  'change',
  'make it',
  'make the',
  // theme / look
  'theme',
  'macos',
  'windows',
  'gothic',
  'dark',
  'color',
  'colour',
  'cyber',
  'style',
  'look',
  'icon',
  'custom',
  // palette moods
  'gold',
  'red',
  'green',
  'pink',
  'blue',
  'synthwave',
  'pastel',
  'sakura',
  'royal',
  'luxury',
  'nordic',
  'arctic',
  'vercel',
  'geist',
  // fintech / payments
  'compliance',
  'juspay',
  'hyperswitch',
  'payment',
  'transaction',
  'audit',
  'pci',
  // processes / security / destructive
  'daemon',
  'process',
  'rm -rf',
  'wipe',
  'delete root',
  'security',
];

/**
 * Pure predicate: returns true when the prompt looks like an OS
 * reconfiguration / tool intent (i.e. it contains any synthesis keyword as a
 * substring). Mirrors the existing Copilot branch logic so general questions
 * fall through to the conversational answerer instead of being synthesized.
 */
export function isOsSynthesisIntent(prompt: string): boolean {
  const p = prompt.toLowerCase();
  return SYNTHESIS_KEYWORDS.some((keyword) => p.includes(keyword));
}

/**
 * Genuinely useful offline answer. Used when no Gemini key is configured, when
 * engineMode is 'local', or when the cloud call fails / times out / is
 * unreachable. Never returns a bare error.
 */
function localAnswer(question: string): string {
  const q = question.toLowerCase().trim();

  if (/^(hi|hello|hey|yo|howdy|hiya|greetings)\b/.test(q) || q === 'hi' || q === 'hello' || q === 'hey') {
    return "Hey! I am Morph Copilot, your assistant inside MorphOS. Ask me anything, or tell me to reconfigure the OS, audit payments, or inspect processes.";
  }

  if (q.includes('what is morphos') || q.includes('what can you do') || q === 'help' || q.includes('what can i do')) {
    return "MorphOS is a browser-based operating system you shape with natural language. I can synthesize new themes and layouts on demand, audit Hyperswitch payments, inspect running processes and daemons, test the security guards, and answer general questions. Just tell me what you want.";
  }

  if (q.includes('what is juspay') || q.includes('who is juspay')) {
    return "Juspay is a payments technology company that builds infrastructure for secure, high-scale digital transactions, including the open-source Hyperswitch payment orchestration stack. MorphOS is a demo built for a Juspay hackathon.";
  }

  if (q.includes('what is hyperswitch') || q.includes('who is hyperswitch')) {
    return "Hyperswitch is Juspay's open-source payment orchestration layer. It routes transactions across many payment processors, with smart routing, retries, and PCI-DSS aware compliance. You can open the Hyperswitch app here to watch routing and audits in action.";
  }

  if (q.includes('who are you') || q.includes('your name') || q.includes('what are you')) {
    return "I am Morph Copilot, the assistant built into MorphOS. I can reconfigure the operating system from a prompt, audit payments, inspect processes, test the security guards, and chat about general questions.";
  }

  return "I can answer that fully once a Gemini API key is configured in Cloud Gateway settings (the Cloud icon, or press Ctrl/Cmd+K). In the meantime I can reconfigure the OS, audit payments, inspect processes, or test the security guards, just ask.";
}

/**
 * Fallback used when a Gemini key IS configured but the cloud call failed,
 * timed out, or returned a non-OK response. First tries localAnswer's useful
 * canned replies (greetings, what-is-MorphOS, Juspay, Hyperswitch, etc) so the
 * user still gets a real answer when one matches, then explains that the AI
 * service could not be reached and it is answering offline. Never tells the
 * user to configure a key they already configured.
 */
function offlineAnswer(question: string): string {
  const q = question.toLowerCase().trim();
  const canned = localAnswer(question);
  const configureHint =
    /^(hi|hello|hey|yo|howdy|hiya|greetings)\b/.test(q) ||
    q === 'hi' ||
    q === 'hello' ||
    q === 'hey' ||
    q.includes('what is morphos') ||
    q.includes('what can you do') ||
    q === 'help' ||
    q.includes('what can i do') ||
    q.includes('what is juspay') ||
    q.includes('who is juspay') ||
    q.includes('what is hyperswitch') ||
    q.includes('who is hyperswitch') ||
    q.includes('who are you') ||
    q.includes('your name') ||
    q.includes('what are you');

  if (configureHint) {
    return canned;
  }

  return "I could not reach the AI service just now (it may be a network issue or a timeout), so I am answering offline. I can still reconfigure the OS, audit payments, inspect processes, or test the security guards right away, and you can ask your question again in a moment.";
}

/**
 * General-purpose conversational answerer. Shares the candidate-model walk in
 * callGeminiCandidates with compilePromptAsync (same prioritized model list,
 * per-attempt AbortController timeout, bounded retries, overall deadline) but
 * asks for a plain-text answer instead of JSON, so the OS gains normal chatbot
 * replies alongside its synthesis powers.
 */
export async function answerQuestionAsync(
  question: string,
  config?: CloudConfig
): Promise<{ answer: string; source: 'gemini' | 'local' }> {
  if (config?.geminiApiKey && config.engineMode !== 'local') {
    const systemPrompt =
      'You are Morph Copilot, a helpful general-purpose assistant that lives inside MorphOS, a browser-based prompt-synthesized operating system built for the Juspay hackathon. Answer general questions naturally and accurately like any good assistant. You are also aware you can reconfigure the OS, audit payments, and inspect processes, but for general questions just answer them. Keep answers reasonably short, a few sentences at most, and use plain conversational text.';

    try {
      // Plain-text QA body: no responseMimeType so Gemini replies conversationally.
      const text = await callGeminiCandidates(config.geminiApiKey, () => ({
        contents: [{ parts: [{ text: `${systemPrompt}\n\nUser: "${question}"` }] }],
      }));
      if (text) {
        const answer = text.trim();
        if (answer) {
          return { answer, source: 'gemini' };
        }
      }
    } catch {
      console.warn('Gemini QA call failed or timed out, using local fallback.');
    }

    // A key was configured but every candidate model failed, timed out, or
    // returned a non-OK/empty response. Be honest about why we fell back
    // instead of asking the user to configure a key they already have.
    return { answer: offlineAnswer(question), source: 'local' };
  }

  return { answer: localAnswer(question), source: 'local' };
}
