import { CloudConfig, AiProvider } from './types';

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
 * Overall wall-clock budget across ALL providers in a single multi-provider
 * run (milliseconds). Each individual attempt still owns its own ~4s
 * AbortController; this ceiling guarantees the UI never hangs even when
 * several providers are configured and all are slow or unreachable.
 */
export const AI_TOTAL_DEADLINE_MS = 18000;

/**
 * How long a provider stays "cooling down" after it reports a rate-limit /
 * quota exhaustion (429 / RESOURCE_EXHAUSTED). While cooling it is tried LAST
 * (after every non-cooling provider) so a single throttled key does not block
 * healthy ones. Short window so a transient throttle self-heals quickly.
 */
export const COOLDOWN_MS = 60000;

/**
 * Default base URLs + default models for well-known OpenAI-compatible
 * providers. Exported so CloudModal can offer one-click presets. A provider
 * may still override `baseUrl` and `model` explicitly.
 */
export const OPENAI_COMPATIBLE_PRESETS = [
  { label: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  { label: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.1-8b-instant' },
  { label: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4o-mini' },
] as const;

/** Trim a single trailing slash from a base URL so path joins stay clean. */
function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

/**
 * Pick a sensible default model for a given OpenAI-compatible base URL by
 * matching it against OPENAI_COMPATIBLE_PRESETS. Falls back to a widely
 * available small model when the base URL is unknown.
 */
export function defaultModelForBaseUrl(baseUrl: string | undefined): string {
  const trimmed = trimTrailingSlash((baseUrl || '').trim());
  const preset = OPENAI_COMPATIBLE_PRESETS.find((p) => trimTrailingSlash(p.baseUrl) === trimmed);
  return preset?.model || 'gpt-4o-mini';
}

/**
 * Module-scoped cooldown memory keyed by provider id -> timestamp (ms) of the
 * last rate-limit / quota failure. Side-effect contained to this module.
 */
const providerCooldowns = new Map<string, number>();

/** True when a provider reported a rate-limit / quota error within COOLDOWN_MS. */
export function isCoolingDown(providerId: string): boolean {
  const ts = providerCooldowns.get(providerId);
  if (ts === undefined) return false;
  if (Date.now() - ts >= COOLDOWN_MS) {
    providerCooldowns.delete(providerId);
    return false;
  }
  return true;
}

/** Record that a provider is now cooling down (called on 429 / quota). */
function markCoolingDown(providerId: string): void {
  providerCooldowns.set(providerId, Date.now());
}

/**
 * Outcome of the most recent AI attempt (across any vendor). This is purely
 * observable diagnostics so the UI can explain WHY a request fell back to the
 * local engine instead of silently showing a vague offline message. It never
 * holds or logs the API key, only the HTTP status and a short human reason.
 *
 * The exported getLastGeminiDiagnostic() keeps returning the { ok, status,
 * reason } shape the existing consumers depend on; the richer vendor/label
 * fields here are internal only.
 */
export interface AiDiagnostic {
  ok: boolean;
  status: number | null;
  reason: string;
  vendor?: 'gemini' | 'openai-compatible';
  label?: string;
}

/**
 * Back-compat alias for the diagnostic shape the three UI consumers read. Kept
 * so Browser.tsx and friends continue to type-check against { ok, status,
 * reason }.
 */
export type GeminiDiagnostic = Pick<AiDiagnostic, 'ok' | 'status' | 'reason'>;

let lastGeminiDiagnostic: AiDiagnostic | null = null;

/**
 * Read why the most recent AI call succeeded or failed. Returns null when no
 * call has been attempted yet this session. Reason strings are stable and
 * UI-friendly: 'no-key', 'http-400 invalid or revoked key', 'http-429 rate
 * limited', 'http-403 forbidden', 'network error/timeout', 'ok', etc.
 *
 * The RETURN SHAPE is intentionally unchanged ({ ok, status, reason }) for
 * backward compatibility with existing consumers, even though internally the
 * diagnostic may carry extra vendor/label fields.
 */
export function getLastGeminiDiagnostic(): GeminiDiagnostic | null {
  if (!lastGeminiDiagnostic) return null;
  const { ok, status, reason } = lastGeminiDiagnostic;
  return { ok, status, reason };
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
    lastGeminiDiagnostic = { ok: false, status: null, reason: 'no-key', vendor: 'gemini' };
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
            lastGeminiDiagnostic = { ok: true, status: res.status, reason: 'ok', vendor: 'gemini' };
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
  lastGeminiDiagnostic = { ok: false, status: lastStatus, reason: lastReason, vendor: 'gemini' };
  return null;
}

/** Human-readable reason for a non-OK HTTP status from an OpenAI-compatible endpoint. */
function reasonForOpenAiStatus(status: number): string {
  if (status === 401) return 'http-401 invalid or revoked key';
  if (status === 403) return 'http-403 forbidden';
  if (status === 429) return 'http-429 rate limited';
  if (status === 404) return 'http-404 model not found';
  if (status === 503) return 'http-503 overloaded';
  return `http-${status} request failed`;
}

/**
 * OpenAI-compatible chat-completions adapter. POSTs to
 * `${baseUrl}/chat/completions` with Bearer auth and returns the first
 * choice's message content, or null on any failure.
 *
 * Classification (mirrors the Gemini walk's spirit):
 *  - res.ok with non-empty choices[0].message.content -> return it.
 *  - 429 -> transient, mark the provider cooling down, return null.
 *  - 503 / 5xx -> transient, return null.
 *  - 401 / 403 -> auth error, return null.
 *  - other non-ok -> hard error, return null.
 *  - network / abort / timeout -> return null.
 *
 * Each call owns its own AbortController wired to GEMINI_ATTEMPT_TIMEOUT_MS.
 * The apiKey is never logged.
 */
export async function callOpenAiCompatible(
  provider: AiProvider,
  messages: { role: string; content: string }[],
  opts?: { json?: boolean }
): Promise<string | null> {
  if (!provider.apiKey) {
    lastGeminiDiagnostic = {
      ok: false,
      status: null,
      reason: 'no-key',
      vendor: 'openai-compatible',
      label: provider.label,
    };
    return null;
  }

  const baseUrl = trimTrailingSlash((provider.baseUrl || OPENAI_COMPATIBLE_PRESETS[0].baseUrl).trim());
  const model = provider.model || defaultModelForBaseUrl(provider.baseUrl);

  const body: Record<string, unknown> = { model, messages };
  if (opts?.json) {
    body.response_format = { type: 'json_object' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GEMINI_ATTEMPT_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (res.ok) {
      const json = await res.json();
      const content = json.choices?.[0]?.message?.content;
      if (typeof content === 'string' && content.trim()) {
        lastGeminiDiagnostic = {
          ok: true,
          status: res.status,
          reason: 'ok',
          vendor: 'openai-compatible',
          label: provider.label,
        };
        return content;
      }
      lastGeminiDiagnostic = {
        ok: false,
        status: res.status,
        reason: 'empty response',
        vendor: 'openai-compatible',
        label: provider.label,
      };
      return null;
    }

    // Non-ok: classify and record. A 429 also marks the provider cooling down.
    if (res.status === 429) {
      markCoolingDown(provider.id);
    }
    lastGeminiDiagnostic = {
      ok: false,
      status: res.status,
      reason: reasonForOpenAiStatus(res.status),
      vendor: 'openai-compatible',
      label: provider.label,
    };
    return null;
  } catch {
    // Network error / abort / timeout.
    lastGeminiDiagnostic = {
      ok: false,
      status: null,
      reason: 'network error/timeout',
      vendor: 'openai-compatible',
      label: provider.label,
    };
    return null;
  }
}

/**
 * Multi-provider orchestrator. Walks the ENABLED providers in order (enabled
 * !== false and a non-empty apiKey), trying non-cooling providers first and
 * cooling ones last, and fails over on any null result until one returns
 * usable text or the overall AI_TOTAL_DEADLINE_MS budget is hit.
 *
 *  - vendor 'gemini' reuses callGeminiCandidates(apiKey, geminiBody) so the
 *    per-key model-candidate walk behavior is preserved.
 *  - vendor 'openai-compatible' uses callOpenAiCompatible(provider, messages).
 *
 * Returns { text, vendor, label } on the first non-empty answer, or null when
 * every provider is exhausted or the deadline is reached.
 */
export async function runProvidersForText(
  config: CloudConfig,
  build: {
    geminiBody: () => Record<string, unknown>;
    openAiMessages: { role: string; content: string }[];
    json?: boolean;
  }
): Promise<{ text: string; vendor: 'gemini' | 'openai-compatible'; label?: string } | null> {
  const deadline = Date.now() + AI_TOTAL_DEADLINE_MS;

  const usable = (config.providers || []).filter(
    (p) => p.enabled !== false && typeof p.apiKey === 'string' && p.apiKey.trim() !== ''
  );

  // Non-cooling providers first, cooling ones last (tried before local).
  const ordered = [
    ...usable.filter((p) => !isCoolingDown(p.id)),
    ...usable.filter((p) => isCoolingDown(p.id)),
  ];

  for (const provider of ordered) {
    if (Date.now() >= deadline) break;

    let text: string | null = null;
    if (provider.vendor === 'gemini') {
      text = await callGeminiCandidates(provider.apiKey, build.geminiBody);
    } else if (provider.vendor === 'openai-compatible') {
      text = await callOpenAiCompatible(provider, build.openAiMessages, { json: build.json });
    }

    if (text && text.trim()) {
      return { text, vendor: provider.vendor, label: provider.label };
    }
  }

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
): Promise<{ answer: string; source: 'gemini' | 'openai-compatible' | 'local'; providerLabel?: string }> {
  const hasUsableProvider =
    !!config &&
    (config.providers || []).some(
      (p) => p.enabled !== false && typeof p.apiKey === 'string' && p.apiKey.trim() !== ''
    );

  if (config && config.engineMode !== 'local' && hasUsableProvider) {
    const systemPrompt =
      'You are Morph Copilot, a helpful general-purpose assistant that lives inside MorphOS, a browser-based prompt-synthesized operating system built for the Juspay hackathon. Answer general questions naturally and accurately like any good assistant. You are also aware you can reconfigure the OS, audit payments, and inspect processes, but for general questions just answer them. Keep answers reasonably short, a few sentences at most, and use plain conversational text.';

    try {
      const result = await runProvidersForText(config, {
        // Plain-text QA body: no responseMimeType so Gemini replies conversationally.
        geminiBody: () => ({
          contents: [{ parts: [{ text: `${systemPrompt}\n\nUser: "${question}"` }] }],
        }),
        openAiMessages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
        ],
        json: false,
      });

      if (result) {
        const answer = result.text.trim();
        if (answer) {
          const source = result.vendor === 'gemini' ? 'gemini' : 'openai-compatible';
          return { answer, source, providerLabel: result.label };
        }
      }
    } catch {
      console.warn('AI QA call failed or timed out, using local fallback.');
    }

    // Providers were configured but every one failed, timed out, or returned a
    // non-OK/empty response. Be honest about why we fell back instead of asking
    // the user to configure a key they already have.
    return { answer: offlineAnswer(question), source: 'local' };
  }

  return { answer: localAnswer(question), source: 'local' };
}
