import { OSProfile, ThemeMode, DockStyle, WindowControlsStyle, SnapMode, SecurityLevel, CloudConfig, CustomTokens } from './types';
import { OS_PRESETS } from './presets';
import { GEMINI_MODEL, GEMINI_RETRY_BACKOFF_MS, isRetryableGeminiStatus } from './ai-chat';

/**
 * Synthesizes dynamic CSS & design tokens from arbitrary natural language prompt
 */
export function synthesizeTokensFromPrompt(prompt: string): { tokens: CustomTokens; theme: ThemeMode; name: string; tagline: string; dockStyle: DockStyle; controlsStyle: WindowControlsStyle; snapMode: SnapMode; securityLevel: SecurityLevel; userRole: OSProfile['userRole'] } {
  const p = prompt.toLowerCase().trim();

  // ── 0. VERCEL / GEIST BASE (near-white developer-platform minimalism) ──
  // Placed first so the stark light base is not swallowed by the broad
  // gothic `dark` match or other keyword branches below.
  //
  // `geist`/`vercel`/`developer platform` are STRONG, unambiguous matches and
  // always win. The softer keywords (`minimal`/`clean`/`monochrome`/bare
  // `light`) only win when the prompt is NOT dark-leaning — otherwise a prompt
  // like "clean dark terminal" or "minimal gothic" should fall through to the
  // competing mood branch rather than resolve to the light base.
  const geistStrong =
    p.includes('geist') ||
    p.includes('vercel') ||
    p.includes('developer platform') ||
    p.includes('developer-platform');
  const darkLeaning =
    p.includes('dark') ||
    p.includes('night') ||
    p.includes('black') ||
    p.includes('neon') ||
    p.includes('gothic') ||
    p.includes('cyber') ||
    p.includes('hacker') ||
    p.includes('matrix') ||
    p.includes('synthwave') ||
    p.includes('vaporwave') ||
    p.includes('obsidian');
  const geistSoft =
    !darkLeaning &&
    (p.includes('minimal') ||
      p.includes('minimalist') ||
      p.includes('monochrome') ||
      p.includes('clean') ||
      (p.includes('light') && !p.includes('lightning')));
  if (geistStrong || geistSoft) {
    return {
      theme: 'geist',
      name: 'Vercel Geist',
      tagline: 'Stark black-on-near-white developer-platform aesthetic with hairline elevation',
      dockStyle: 'macos-magnify',
      controlsStyle: 'traffic-lights',
      snapMode: 'free',
      securityLevel: 'standard',
      userRole: 'developer',
      tokens: { ...OS_PRESETS['geist-base'].customTokens },
    };
  }

  // ── 1. GOTHIC / OBSIDIAN / BLOOD / HORROR ──
  if (
    p.includes('gothic') ||
    p.includes('dracula') ||
    p.includes('blood') ||
    p.includes('obsidian') ||
    p.includes('vampire') ||
    p.includes('horror') ||
    (p.includes('dark') && (p.includes('theme') || p.includes('color') || p.includes('red') || p.includes('black') || p.includes('crimson') || p.includes('make')))
  ) {
    return {
      theme: 'gothic',
      name: 'Gothic Obsidian OS',
      tagline: 'Deep obsidian glass with blood-crimson illumination',
      dockStyle: 'macos-magnify',
      controlsStyle: 'traffic-lights',
      snapMode: 'free',
      securityLevel: 'strict-sudo',
      userRole: 'root',
      tokens: { ...OS_PRESETS['gothic-obsidian'].customTokens },
    };
  }

  // ── 2. ARCH / MATRIX / CYBER NEON ──
  if (
    p.includes('cyber') ||
    p.includes('hacker') ||
    p.includes('matrix') ||
    p.includes('green') ||
    p.includes('hyprland') ||
    p.includes('arch') ||
    p.includes('tiling') ||
    p.includes('terminal')
  ) {
    return {
      theme: 'cyber',
      name: 'Arch Hyprland Cyber',
      tagline: 'Matrix neon terminal agility with 0-latency boundaries',
      dockStyle: 'cyber-minimal',
      controlsStyle: 'cyber-minimal',
      snapMode: 'tiling',
      securityLevel: 'strict-sudo',
      userRole: 'root',
      tokens: { ...OS_PRESETS['cyber-hacker'].customTokens },
    };
  }

  // ── 3. ROYAL / GOLD / LUXURY ──
  if (
    p.includes('gold') ||
    p.includes('royal') ||
    p.includes('luxury') ||
    p.includes('wealth') ||
    p.includes('king') ||
    p.includes('emperor') ||
    p.includes('sovereign')
  ) {
    return {
      theme: 'custom',
      name: 'Royal Sovereign OS',
      tagline: '24K gold filigree on midnight velvet glass with imperial elegance',
      dockStyle: 'macos-magnify',
      controlsStyle: 'traffic-lights',
      snapMode: 'free',
      securityLevel: 'strict-sudo',
      userRole: 'root',
      tokens: { ...OS_PRESETS['golden-luxury'].customTokens },
    };
  }

  // ── 4. SYNTHWAVE / RETRO / PURPLE NEON ──
  if (
    p.includes('synthwave') ||
    p.includes('retro') ||
    p.includes('neon pink') ||
    p.includes('outrun') ||
    p.includes('vaporwave') ||
    p.includes('purple') ||
    p.includes('80s')
  ) {
    return {
      theme: 'custom',
      name: 'Synthwave 1984 OS',
      tagline: 'Neon magenta & electric violet cyberpunk sunset aesthetics',
      dockStyle: 'macos-magnify',
      controlsStyle: 'traffic-lights',
      snapMode: 'free',
      securityLevel: 'standard',
      userRole: 'developer',
      tokens: { ...OS_PRESETS['synthwave-retro'].customTokens },
    };
  }

  // ── 5. PASTEL / SAKURA / KAWAII / CUTE / ANIME ──
  if (
    p.includes('sakura') ||
    p.includes('pastel') ||
    p.includes('kawaii') ||
    p.includes('cute') ||
    p.includes('anime') ||
    p.includes('pink') ||
    p.includes('bubble')
  ) {
    return {
      theme: 'custom',
      name: 'Kawaii Sakura OS',
      tagline: 'Soft pastel pink blossoms with frosted bubbly glass',
      dockStyle: 'macos-magnify',
      controlsStyle: 'traffic-lights',
      snapMode: 'free',
      securityLevel: 'standard',
      userRole: 'developer',
      tokens: { ...OS_PRESETS['sakura-pastel'].customTokens },
    };
  }

  // ── 6. JUSPAY / ENTERPRISE FINTECH / BLUE ──
  if (
    p.includes('juspay') ||
    p.includes('hyperswitch') ||
    p.includes('fintech') ||
    p.includes('compliance') ||
    p.includes('bank') ||
    p.includes('pci') ||
    p.includes('payment') ||
    p.includes('business')
  ) {
    return {
      theme: 'enterprise',
      name: 'Juspay FinTech Workstation',
      tagline: 'Hyperswitch payment routing with PCI-DSS 4.0 zero-trust auditing',
      dockStyle: 'windows-center',
      controlsStyle: 'windows-squares',
      snapMode: 'windows-snap',
      securityLevel: 'pci-dss-compliance',
      userRole: 'fintech_auditor',
      tokens: { ...OS_PRESETS['enterprise-fintech'].customTokens },
    };
  }

  // ── 7. WINDOWS 11 FLUENT ──
  if (
    p.includes('windows') ||
    p.includes('fluent') ||
    p.includes('microsoft') ||
    p.includes('acrylic') ||
    p.includes('snap')
  ) {
    return {
      theme: 'windows',
      name: 'Windows 11 Fluent Workstation',
      tagline: 'Modern acrylic surfaces with centered taskbar and snap grids',
      dockStyle: 'windows-center',
      controlsStyle: 'windows-squares',
      snapMode: 'windows-snap',
      securityLevel: 'standard',
      userRole: 'developer',
      tokens: {
        bgDesktop: 'linear-gradient(145deg, #071428 0%, #0a1f3a 40%, #060e1c 100%)',
        bgOrb1: 'radial-gradient(circle at 30% 40%, rgba(0,120,212,0.22) 0%, transparent 55%)',
        bgOrb2: 'radial-gradient(circle at 70% 60%, rgba(0,180,255,0.15) 0%, transparent 50%)',
        accentColor: '#38bdf8',
        accentGlow: 'rgba(56,189,248,0.4)',
        accentText: '#bae6fd',
        windowBg: 'rgba(10, 18, 32, 0.88)',
        windowBorder: 'rgba(255, 255, 255, 0.12)',
        windowRadius: '8px',
        windowBlur: '20px',
        dockBg: 'rgba(10, 18, 32, 0.92)',
        dockBorder: 'rgba(255, 255, 255, 0.15)',
        dockRadius: '8px',
        iconStyle: 'minimal-outline',
        iconShape: 'rounded',
      },
    };
  }

  // ── 8. NORDIC / ARCTIC / ICE / FROST ──
  if (
    p.includes('nordic') ||
    p.includes('arctic') ||
    p.includes('ice') ||
    p.includes('frost') ||
    p.includes('cold') ||
    p.includes('snow')
  ) {
    return {
      theme: 'custom',
      name: 'Nordic Arctic Frost OS',
      tagline: 'Glacial blue frosted crystal with sub-zero latency',
      dockStyle: 'macos-magnify',
      controlsStyle: 'traffic-lights',
      snapMode: 'free',
      securityLevel: 'standard',
      userRole: 'developer',
      tokens: {
        bgDesktop: 'radial-gradient(ellipse 130% 90% at 50% -10%, #0c2d48 0%, #06192c 50%, #020810 100%)',
        bgOrb1: 'radial-gradient(circle at 25% 25%, rgba(56,189,248,0.3) 0%, transparent 60%)',
        bgOrb2: 'radial-gradient(circle at 75% 75%, rgba(186,230,253,0.2) 0%, transparent 55%)',
        accentColor: '#38bdf8',
        accentGlow: 'rgba(56,189,248,0.5)',
        accentText: '#f0f9ff',
        windowBg: 'rgba(6, 20, 36, 0.90)',
        windowBorder: 'rgba(56, 189, 248, 0.35)',
        windowRadius: '14px',
        windowBlur: '40px',
        dockBg: 'rgba(8, 24, 44, 0.92)',
        dockBorder: 'rgba(56, 189, 248, 0.4)',
        dockRadius: '20px',
        iconStyle: 'minimal-outline',
        iconShape: 'rounded',
        // Geist ladder (dark) — theme 'custom' has no .theme-* block, so the
        // dark structural tokens must ride on customTokens.
        canvas: 'rgba(6, 20, 36, 0.90)',
        canvasElevated: 'rgba(10, 28, 48, 0.92)',
        ink: '#eaf6ff',
        textBody: '#bcdcf2',
        textMute: '#80a4bd',
        textFaint: '#5d7f98',
        hairline: 'rgba(56,189,248,0.32)',
        hairlineSoft: 'rgba(56,189,248,0.14)',
        link: '#38bdf8',
        statusSuccess: '#4ade80',
        statusWarn: '#fbbf24',
        statusError: '#ff6b6b',
        statusReroute: '#c084fc',
      },
    };
  }

  // ── 9. DEFAULT = VERCEL / GEIST BASE ──
  // Unknown prompts default to the Geist structural base; mood/accent
  // customizations layer on top of it.
  return {
    theme: 'geist',
    name: 'Vercel Geist',
    tagline: 'Stark black-on-near-white developer-platform aesthetic with hairline elevation',
    dockStyle: 'macos-magnify',
    controlsStyle: 'traffic-lights',
    snapMode: 'free',
    securityLevel: 'standard',
    userRole: 'developer',
    tokens: { ...OS_PRESETS['geist-base'].customTokens },
  };
}

/**
 * Local high-precision semantic compiler (0ms latency, 100% demo-proof)
 */
export function compilePromptLocal(prompt: string): OSProfile {
  const synth = synthesizeTokensFromPrompt(prompt);
  const p = prompt.toLowerCase();

  let securityLevel = synth.securityLevel;
  let userRole = synth.userRole;

  if (p.includes('strict') || p.includes('sudo') || p.includes('root') || p.includes('zero-trust')) {
    securityLevel = 'strict-sudo';
    userRole = 'root';
  } else if (p.includes('pci') || p.includes('compliance') || p.includes('audit')) {
    securityLevel = 'pci-dss-compliance';
    userRole = 'fintech_auditor';
  } else if (p.includes('intern') || p.includes('safeguard') || p.includes('junior')) {
    securityLevel = 'zero-trust';
    userRole = 'intern';
  }

  return {
    name: synth.name,
    tagline: synth.tagline,
    theme: synth.theme,
    dockStyle: synth.dockStyle,
    controlsStyle: synth.controlsStyle,
    snapMode: synth.snapMode,
    securityLevel,
    userRole,
    customTokens: synth.tokens,
    aiSummary: `Synthesized ${synth.name} with ${synth.tokens.iconStyle} icons, bespoke shader canvas, and ${securityLevel} kernel enforcement.`,
  };
}

export const compilePromptToProfile = compilePromptLocal;

/**
 * Async compiler that queries n8n Webhook or Gemini API with intelligent local token synthesis
 */
export async function compilePromptAsync(
  prompt: string,
  config?: CloudConfig
): Promise<{ profile: OSProfile; source: 'n8n' | 'gemini' | 'local' }> {
  const localSynth = compilePromptLocal(prompt);

  // 1. Try n8n Webhook if configured
  if (config?.n8nWebhookUrl && config.engineMode !== 'local') {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(config.n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, timestamp: new Date().toISOString() }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && (data.theme || data.name)) {
          // Preserve local high-precision tokens unless n8n explicitly provided customTokens
          const chosenTheme = (data.theme && data.theme !== 'macos') ? data.theme : localSynth.theme;
          const profile: OSProfile = {
            name: data.name && data.name !== 'n8n Synthesized OS' ? data.name : localSynth.name,
            tagline: data.tagline && !data.tagline.includes('developer') ? data.tagline : localSynth.tagline,
            theme: chosenTheme,
            dockStyle: data.dockStyle || localSynth.dockStyle,
            controlsStyle: data.controlsStyle || localSynth.controlsStyle,
            snapMode: data.snapMode || localSynth.snapMode,
            securityLevel: data.securityLevel || localSynth.securityLevel,
            userRole: data.userRole || localSynth.userRole,
            customTokens: data.customTokens || localSynth.customTokens,
            aiSummary: data.aiSummary || `Compiled by n8n Cloud Webhook workflow for prompt: "${prompt}"`,
          };
          return { profile, source: 'n8n' };
        }
      }
    } catch {
      console.warn('n8n Webhook request timed out or failed, using fallback.');
    }
  }

  // 2. Try Gemini API if configured
  if (config?.geminiApiKey && config.engineMode !== 'local') {
    const systemPrompt = `You are the MorphOS compiler. Output valid JSON with keys: name (string), tagline (string), theme ("geist"|"macos"|"windows"|"cyber"|"enterprise"|"gothic"|"custom"), dockStyle ("macos-magnify"|"windows-center"|"cyber-minimal"), controlsStyle ("traffic-lights"|"windows-squares"|"cyber-minimal"), snapMode ("free"|"windows-snap"|"tiling"), securityLevel ("standard"|"strict-sudo"|"zero-trust"|"pci-dss-compliance"), userRole ("developer"|"root"|"intern"|"fintech_auditor"), aiSummary (string).`;

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
              contents: [{ parts: [{ text: `${systemPrompt}\n\nUser request: "${prompt}"` }] }],
              generationConfig: { responseMimeType: 'application/json' },
            }),
            signal: controller.signal,
          }
        );
        clearTimeout(timeoutId);

        if (res.ok) {
          const json = await res.json();
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = JSON.parse(text);
            return {
              profile: {
                name: parsed.name || localSynth.name,
                tagline: parsed.tagline || localSynth.tagline,
                theme: parsed.theme || localSynth.theme,
                dockStyle: parsed.dockStyle || localSynth.dockStyle,
                controlsStyle: parsed.controlsStyle || localSynth.controlsStyle,
                snapMode: parsed.snapMode || localSynth.snapMode,
                securityLevel: parsed.securityLevel || localSynth.securityLevel,
                userRole: parsed.userRole || localSynth.userRole,
                customTokens: localSynth.customTokens,
                aiSummary: parsed.aiSummary || `Gemini Flash compiled: ${prompt}`,
              },
              source: 'gemini',
            };
          }
          break;
        }

        // Transient overload / rate limit: wait a short backoff and retry.
        if (isRetryableGeminiStatus(res.status) && attempt < GEMINI_RETRY_BACKOFF_MS.length) {
          await new Promise((r) => setTimeout(r, GEMINI_RETRY_BACKOFF_MS[attempt]));
          continue;
        }

        // Non-retryable status, or retries exhausted: fall through to fallback.
        break;
      } catch {
        console.warn('Gemini API call failed or timed out, using fallback.');
        break;
      }
    }
  }

  // 3. Fallback to local heuristic engine
  return { profile: localSynth, source: 'local' };
}
