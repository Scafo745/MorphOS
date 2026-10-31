import { CloudConfig } from './types';

/**
 * Single source of truth for the Gemini model segment used by both the QA
 * answerer here and the theme compiler in prompt-compiler.ts. Keeping it in one
 * place stops the two call sites from drifting apart when Google retires a
 * model.
 */
export const GEMINI_MODEL = 'gemini-3.8-flash';

/**
 * Transient server statuses worth a short retry: 503 (model overloaded /
 * UNAVAILABLE) and 429 (rate limited). Anything else (400/403/404 etc) is not
 * retryable and should fall straight through to the offline fallback.
 */
export function isRetryableGeminiStatus(status: number): boolean {
  return status === 503 || status === 429;
}

/**
 * Bounded backoff schedule for the extra retry attempts (milliseconds). Two
 * entries means up to 2 additional attempts after the first, so worst case is
 * 3 attempts total with ~0.5s then ~1s of backoff between them.
 */
export const GEMINI_RETRY_BACKOFF_MS = [500, 1000] as const;

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
 * General-purpose conversational answerer. Mirrors the Gemini call discipline
 * in compilePromptAsync (same endpoint, 4000ms AbortController timeout,
 * try/catch fallback) but asks for a plain-text answer instead of JSON, so the
 * OS gains normal chatbot replies alongside its synthesis powers.
 */
export async function answerQuestionAsync(
  question: string,
  config?: CloudConfig
): Promise<{ answer: string; source: 'gemini' | 'local' }> {
  if (config?.geminiApiKey && config.engineMode !== 'local') {
    const systemPrompt =
      'You are Morph Copilot, a helpful general-purpose assistant that lives inside MorphOS, a browser-based prompt-synthesized operating system built for the Juspay hackathon. Answer general questions naturally and accurately like any good assistant. You are also aware you can reconfigure the OS, audit payments, and inspect processes, but for general questions just answer them. Keep answers reasonably short, a few sentences at most, and use plain conversational text.';

    // Up to GEMINI_RETRY_BACKOFF_MS.length additional attempts after the first,
    // but only for transient 503/429 responses. Each attempt owns its own
    // AbortController + 4000ms timeout so total time stays bounded.
    for (let attempt = 0; attempt <= GEMINI_RETRY_BACKOFF_MS.length; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${config.geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${systemPrompt}\n\nUser: "${question}"` }] }],
            }),
            signal: controller.signal,
          }
        );
        clearTimeout(timeoutId);

        if (res.ok) {
          const json = await res.json();
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (typeof text === 'string') {
            const answer = text.trim();
            if (answer) {
              return { answer, source: 'gemini' };
            }
          }
          break;
        }

        // Transient overload / rate limit: wait a short backoff and retry.
        if (isRetryableGeminiStatus(res.status) && attempt < GEMINI_RETRY_BACKOFF_MS.length) {
          await new Promise((r) => setTimeout(r, GEMINI_RETRY_BACKOFF_MS[attempt]));
          continue;
        }

        // Non-retryable status, or retries exhausted: fall through to offline.
        break;
      } catch {
        console.warn('Gemini QA call failed or timed out, using local fallback.');
        break;
      }
    }

    // A key was configured but the cloud call failed, timed out, or returned a
    // non-OK/empty response. Be honest about why we fell back instead of asking
    // the user to configure a key they already have.
    return { answer: offlineAnswer(question), source: 'local' };
  }

  return { answer: localAnswer(question), source: 'local' };
}
