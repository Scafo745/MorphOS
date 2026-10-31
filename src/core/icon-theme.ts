import { AppId, CustomTokens } from './types';

export interface IconStyleTheme {
  bg: string;
  border: string;
  glow: string;
  iconColor: string;
  borderRadius: string;
  boxShadow: string;
  sheenOpacity: number;
}

export function getIconTheme(
  appId: AppId | 'spotlight',
  iconStyle: CustomTokens['iconStyle'] = 'glass-gradient',
  shape?: CustomTokens['iconShape']
): IconStyleTheme {
  const getBorderRadius = () => {
    if (shape === 'sharp' || shape === 'square') return '0px';
    if (shape === 'circle') return '9999px';
    if (shape === 'squircle') return '22%';
    if (shape === 'rounded') {
      switch (iconStyle) {
        case 'neon-glow': return '0px';
        case 'gothic-dark': return '8px';
        case 'retro-pixel': return '6px';
        case 'minimal-outline': return '10px';
        case 'golden-luxury': return '12px';
        case 'pastel-cute': return '9999px';
        case 'geist-minimal': return '6px';
        default: return '22%';
      }
    }

    switch (iconStyle) {
      case 'neon-glow': return '0px';
      case 'gothic-dark': return '8px';
      case 'retro-pixel': return '6px';
      case 'minimal-outline': return '10px';
      case 'golden-luxury': return '12px';
      case 'pastel-cute': return '9999px';
      case 'geist-minimal': return '6px';
      case 'glass-gradient':
      default: return '22%';
    }
  };

  const borderRadius = getBorderRadius();

  // ── 0. GEIST MINIMAL (Vercel base) ──
  // Light canvas-elevated chrome, 1px hairline border, ink glyph,
  // near-zero glow, whisper-soft shadow, low sheen.
  if (iconStyle === 'geist-minimal') {
    return {
      bg: '#ffffff',
      border: '1px solid #ebebeb',
      glow: 'rgba(23,23,23,0.04)',
      iconColor: '#171717',
      borderRadius,
      boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.05)',
      sheenOpacity: 0.04,
    };
  }

  // ── 1. GOTHIC OBSIDIAN DARK ──
  if (iconStyle === 'gothic-dark') {
    return {
      bg: 'linear-gradient(145deg, #18020a, #070003)',
      border: '1px solid rgba(244, 63, 94, 0.65)',
      glow: 'rgba(244, 63, 94, 0.55)',
      iconColor: '#f43f5e',
      borderRadius,
      boxShadow: '0 8px 24px rgba(0,0,0,0.85), 0 0 14px rgba(244,63,94,0.3)',
      sheenOpacity: 0.15,
    };
  }

  // ── 2. NEON CYBER MATRIX ──
  if (iconStyle === 'neon-glow') {
    return {
      bg: 'linear-gradient(145deg, #01140e, #000403)',
      border: '1px solid #00ffb4',
      glow: 'rgba(0, 255, 180, 0.75)',
      iconColor: '#00ffb4',
      borderRadius,
      boxShadow: '0 0 16px rgba(0,255,180,0.45), inset 0 0 8px rgba(0,255,180,0.2)',
      sheenOpacity: 0.05,
    };
  }

  // ── 3. GOLDEN LUXURY ──
  if (iconStyle === 'golden-luxury') {
    return {
      bg: 'linear-gradient(145deg, #241902, #0c0800)',
      border: '1px solid rgba(245, 158, 11, 0.75)',
      glow: 'rgba(245, 158, 11, 0.6)',
      iconColor: '#fbbf24',
      borderRadius,
      boxShadow: '0 8px 24px rgba(0,0,0,0.8), 0 0 18px rgba(245,158,11,0.4)',
      sheenOpacity: 0.2,
    };
  }

  // ── 4. RETRO SYNTHWAVE ──
  if (iconStyle === 'retro-pixel') {
    return {
      bg: 'linear-gradient(145deg, #3b0764, #18022b)',
      border: '1px solid rgba(236, 72, 153, 0.7)',
      glow: 'rgba(236, 72, 153, 0.6)',
      iconColor: '#f472b6',
      borderRadius,
      boxShadow: '0 8px 24px rgba(0,0,0,0.7), 0 0 18px rgba(236,72,153,0.4)',
      sheenOpacity: 0.25,
    };
  }

  // ── 5. PASTEL CUTE SAKURA ──
  if (iconStyle === 'pastel-cute') {
    return {
      bg: 'linear-gradient(145deg, #4a1532, #200718)',
      border: '1px solid rgba(244, 114, 182, 0.6)',
      glow: 'rgba(244, 114, 182, 0.55)',
      iconColor: '#fbcfe8',
      borderRadius,
      boxShadow: '0 8px 24px rgba(0,0,0,0.6), 0 0 20px rgba(244,114,182,0.4)',
      sheenOpacity: 0.2,
    };
  }

  // ── 6. MINIMAL OUTLINE (FinTech / Windows) ──
  if (iconStyle === 'minimal-outline') {
    return {
      bg: 'linear-gradient(145deg, #07192f, #030d1a)',
      border: '1px solid rgba(56, 189, 248, 0.5)',
      glow: 'rgba(56, 189, 248, 0.45)',
      iconColor: '#38bdf8',
      borderRadius,
      boxShadow: '0 8px 24px rgba(0,0,0,0.65), 0 0 14px rgba(56,189,248,0.25)',
      sheenOpacity: 0.12,
    };
  }

  // ── 7. GLASS GRADIENT (Cupertino default) - Per-app rich gradients ──
  const defaultAppMap: Record<AppId | 'spotlight', { bg: string; border: string; glow: string; text: string }> = {
    copilot: {
      bg: 'linear-gradient(145deg, #3b0764, #6b21a8)',
      border: 'rgba(168,85,247,0.35)',
      glow: 'rgba(168,85,247,0.5)',
      text: '#e9d5ff',
    },
    terminal: {
      bg: 'linear-gradient(145deg, #052e16, #14532d)',
      border: 'rgba(34,197,94,0.3)',
      glow: 'rgba(34,197,94,0.4)',
      text: '#86efac',
    },
    filemanager: {
      bg: 'linear-gradient(145deg, #0c1a3a, #1e3a5f)',
      border: 'rgba(56,189,248,0.3)',
      glow: 'rgba(56,189,248,0.4)',
      text: '#7dd3fc',
    },
    settings: {
      bg: 'linear-gradient(145deg, #1a103a, #2e1a6e)',
      border: 'rgba(139,92,246,0.3)',
      glow: 'rgba(139,92,246,0.4)',
      text: '#c4b5fd',
    },
    security: {
      bg: 'linear-gradient(145deg, #3a1f00, #78350f)',
      border: 'rgba(245,158,11,0.3)',
      glow: 'rgba(245,158,11,0.4)',
      text: '#fcd34d',
    },
    notes: {
      bg: 'linear-gradient(145deg, #3a0a22, #6d1a3a)',
      border: 'rgba(244,114,182,0.3)',
      glow: 'rgba(244,114,182,0.4)',
      text: '#f9a8d4',
    },
    hyperswitch: {
      bg: 'linear-gradient(145deg, #02203c, #075985)',
      border: 'rgba(14,165,233,0.4)',
      glow: 'rgba(14,165,233,0.55)',
      text: '#38bdf8',
    },
    browser: {
      bg: 'linear-gradient(145deg, #042f2e, #0e7490)',
      border: 'rgba(45,212,191,0.35)',
      glow: 'rgba(45,212,191,0.5)',
      text: '#5eead4',
    },
    spotlight: {
      bg: 'linear-gradient(145deg, #1e1b4b, #312e81)',
      border: 'rgba(129,140,248,0.3)',
      glow: 'rgba(129,140,248,0.6)',
      text: '#a5b4fc',
    },
  };

  const appMeta = defaultAppMap[appId] || defaultAppMap.terminal;
  return {
    bg: appMeta.bg,
    border: `1px solid ${appMeta.border}`,
    glow: appMeta.glow,
    iconColor: appMeta.text,
    borderRadius,
    boxShadow: `0 8px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.12)`,
    sheenOpacity: 0.2,
  };
}

