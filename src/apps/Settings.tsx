import React, { useState } from 'react';
import { useOSStore } from '../core/store';
import { OS_PRESETS } from '../core/presets';
import { DockStyle, SnapMode, SecurityLevel, CustomTokens } from '../core/types';
import { compilePromptLocal, synthesizeTokensFromPrompt, compilePromptAsync } from '../core/prompt-compiler';
import { Sliders, Shield, Monitor, Sparkles, Cpu, Wand2, Palette, Box, Check } from 'lucide-react';

export const Settings: React.FC = () => {
  const { profile, setProfile, cloudConfig, openApp } = useOSStore();
  const [promptInput, setPromptInput] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);

  const handleSynthesizePrompt = async (pText?: string) => {
    const text = (pText || promptInput).trim();
    if (!text) return;
    setIsCompiling(true);
    try {
      const { profile: newProfile } = await compilePromptAsync(text, cloudConfig);
      setProfile(newProfile);
      if (text.toLowerCase().includes('juspay') || text.toLowerCase().includes('hyperswitch') || text.toLowerCase().includes('payment')) {
        openApp('hyperswitch');
      }
      setPromptInput('');
    } catch {
      const local = compilePromptLocal(text);
      setProfile(local);
      if (text.toLowerCase().includes('juspay') || text.toLowerCase().includes('hyperswitch') || text.toLowerCase().includes('payment')) {
        openApp('hyperswitch');
      }
    } finally {
      setIsCompiling(false);
    }
  };

  const handleThemeSwitch = (themeKey: string) => {
    const synth = synthesizeTokensFromPrompt(themeKey);
    setProfile({
      ...profile,
      theme: synth.theme,
      name: synth.name,
      tagline: synth.tagline,
      dockStyle: synth.dockStyle,
      controlsStyle: synth.controlsStyle,
      customTokens: synth.tokens,
      aiSummary: `MorphOS recompiled aesthetics to ${synth.name} with ${synth.tokens.iconStyle} icons and custom shader tokens.`,
    });
  };

  const handleIconStyleSwitch = (iconStyle: CustomTokens['iconStyle']) => {
    setProfile({
      ...profile,
      customTokens: {
        ...profile.customTokens,
        iconStyle,
      },
      aiSummary: `Updated system icon style to ${iconStyle}.`,
    });
  };

  const handleIconShapeSwitch = (iconShape: CustomTokens['iconShape']) => {
    setProfile({
      ...profile,
      customTokens: {
        ...profile.customTokens,
        iconShape,
      },
      aiSummary: `Updated system icon geometry to ${iconShape}.`,
    });
  };

  const handleUpdate = (partial: Partial<typeof profile>) => {
    setProfile({
      ...profile,
      ...partial,
    });
  };

  const QUICK_PROMPTS = [
    { label: '🦇 Gothic Obsidian Dark', prompt: 'make the colors dark, like gothic theme with crimson red icons' },
    { label: '⚡ Arch Cyber Matrix', prompt: 'arch linux hyprland matrix green neon cyber tiling' },
    { label: '👑 Royal Gold Luxury', prompt: 'royal gold luxury midnight black theme with 24k gold icons' },
    { label: '🌇 Synthwave 1984', prompt: 'synthwave 1984 neon magenta and electric purple outrun theme' },
    { label: '🌸 Kawaii Sakura Pastel', prompt: 'kawaii sakura pastel pink anime theme with rounded bubbly icons' },
    { label: '💳 Juspay FinTech Shield', prompt: 'juspay enterprise fintech windows snap zero trust pci compliance' },
    { label: '🍏 Cupertino Sonoma Glass', prompt: 'macos sonoma cupertino glass aesthetics with fluid dock' },
    { label: '🧊 Nordic Arctic Ice', prompt: 'nordic arctic ice blue frost glass theme' },
  ];

  const cardStyle: React.CSSProperties = {
    background: 'var(--canvas-elevated, #ffffff)',
    borderColor: 'var(--hairline, #ebebeb)',
  };

  return (
    <div
      className="h-full flex flex-col text-xs font-sans overflow-y-auto p-4 select-none space-y-5"
      style={{ background: 'var(--canvas, #fafafa)', color: 'var(--text-body, #4d4d4d)' }}
    >
      {/* ── Top Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--hairline, #ebebeb)' }}>
        <div className="flex items-center space-x-2.5">
          <div
            className="p-2 rounded-[12px] border"
            style={{ borderColor: 'var(--hairline, #ebebeb)', color: profile.customTokens?.accentColor || 'var(--accent, #171717)' }}
          >
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight" style={{ color: 'var(--ink, #171717)' }}>MorphOS System Synthesizer</h2>
            <p className="text-[11px]" style={{ color: 'var(--text-mute, #8f8f8f)' }}>Prompt-Synthesized Adaptive Operating System Architecture</p>
          </div>
        </div>

        <div
          className="flex items-center space-x-1.5 px-3 py-1 rounded-[6px] font-mono text-[10px] border"
          style={{ borderColor: 'var(--hairline, #ebebeb)', color: 'var(--text-mute, #8f8f8f)' }}
        >
          <Cpu className="w-3 h-3" />
          <span>MICROKERNEL ACTIVE</span>
        </div>
      </div>

      {/* ── 1. Universal AI Prompt Synthesizer Bar ───────────── */}
      <div className="p-3.5 rounded-[12px] border" style={{ ...cardStyle, boxShadow: 'var(--window-shadow, 0 1px 2px rgba(0,0,0,0.04))' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--ink, #171717)' }}>
            <Wand2 className="w-4 h-4" style={{ color: profile.customTokens?.accentColor || 'var(--accent, #171717)' }} />
            <span>Customize Everything with a Prompt</span>
          </div>
          <span className="text-[10px] font-mono" style={{ color: 'var(--text-mute, #8f8f8f)' }}>Synthesizes Theme, Icons, Windows & Security</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSynthesizePrompt()}
            placeholder="Type any prompt: 'make colors dark like gothic theme', 'royal gold luxury', 'matrix cyber'..."
            className="flex-1 rounded-[6px] border px-3 py-2 text-xs placeholder-geist-mute focus:outline-none transition-colors"
            style={{ background: 'var(--canvas, #fafafa)', borderColor: 'var(--hairline, #ebebeb)', color: 'var(--ink, #171717)' }}
          />
          <button
            onClick={() => handleSynthesizePrompt()}
            disabled={isCompiling}
            className="px-4 py-2 rounded-[6px] font-semibold text-xs transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-geist-link/60"
            style={{
              background: profile.customTokens?.accentColor || 'var(--accent, #171717)',
              color: profile.customTokens?.accentText || '#ffffff',
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isCompiling ? 'Synthesizing...' : '⚡ Morph OS'}</span>
          </button>
        </div>

        {/* Quick prompt pills */}
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {QUICK_PROMPTS.map((qp) => (
            <button
              key={qp.label}
              onClick={() => handleSynthesizePrompt(qp.prompt)}
              className="px-2.5 py-1 rounded-[6px] text-[10px] border transition-all hover:scale-105 active:scale-95 hover:bg-geist-hairlineSoft focus:outline-none focus-visible:ring-2 focus-visible:ring-geist-link/60"
              style={{ borderColor: 'var(--hairline, #ebebeb)', color: 'var(--text-body, #4d4d4d)' }}
            >
              {qp.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 2. Preset Target Architectures Grid ──────────────── */}
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider mb-2 flex items-center space-x-1" style={{ color: 'var(--text-mute, #8f8f8f)' }}>
          <Sparkles className="w-3 h-3" style={{ color: '#f5a623' }} />
          <span>Preset Target Architectures (1-Click Switch)</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(OS_PRESETS).map(([key, preset]) => {
            const isActive = profile.name === preset.name;
            return (
              <button
                key={key}
                onClick={() => setProfile(preset)}
                className="p-2.5 rounded-[12px] border text-left transition-all"
                style={
                  isActive
                    ? { background: 'var(--accent-dim, rgba(23,23,23,0.06))', borderColor: preset.customTokens.accentColor || 'var(--ink, #171717)', color: 'var(--ink, #171717)' }
                    : { ...cardStyle, color: 'var(--text-body, #4d4d4d)' }
                }
              >
                <div className="font-semibold text-xs truncate flex items-center justify-between" style={{ color: 'var(--ink, #171717)' }}>
                  <span>{preset.name}</span>
                  {isActive && <Check className="w-3.5 h-3.5" style={{ color: '#15803d' }} />}
                </div>
                <div className="text-[10px] truncate mt-0.5" style={{ color: 'var(--text-mute, #8f8f8f)' }}>
                  {preset.theme.toUpperCase()} • {preset.customTokens.iconStyle}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. Icon Style & Shape Synthesizer ────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Icon Theme Pack */}
        <div className="p-3.5 rounded-[12px] border space-y-2" style={cardStyle}>
          <div className="font-semibold flex items-center space-x-1.5" style={{ color: 'var(--ink, #171717)' }}>
            <Box className="w-4 h-4" style={{ color: 'var(--accent, #171717)' }} />
            <span>Icon Style & Luminescence</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {[
              { id: 'gothic-dark' as const, label: '🦇 Gothic Crimson', color: '#f43f5e' },
              { id: 'neon-glow' as const, label: '⚡ Matrix Cyber Glow', color: '#00ffb4' },
              { id: 'golden-luxury' as const, label: '👑 24K Royal Gold', color: '#fbbf24' },
              { id: 'retro-pixel' as const, label: '🌇 Synthwave Neon', color: '#f472b6' },
              { id: 'pastel-cute' as const, label: '🌸 Sakura Bubble', color: '#f472b6' },
              { id: 'minimal-outline' as const, label: '💳 FinTech Cyan', color: '#38bdf8' },
              { id: 'glass-gradient' as const, label: '🍏 Cupertino Glass', color: '#a5b4fc' },
            ].map((ic) => {
              const active = profile.customTokens?.iconStyle === ic.id;
              return (
                <button
                  key={ic.id}
                  onClick={() => handleIconStyleSwitch(ic.id)}
                  className="px-2.5 py-1.5 rounded-[6px] text-left text-[11px] transition-all border flex items-center justify-between hover:bg-geist-hairlineSoft"
                  style={
                    active
                      ? { background: 'var(--accent-dim, rgba(23,23,23,0.06))', color: 'var(--ink, #171717)', fontWeight: 600, borderColor: ic.color }
                      : { color: 'var(--text-body, #4d4d4d)', borderColor: 'var(--hairline, #ebebeb)' }
                  }
                >
                  <span className="truncate">{ic.label}</span>
                  <span className="w-2 h-2 rounded-full" style={{ background: ic.color }} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Icon Geometry Shape */}
        <div className="p-3.5 rounded-[12px] border space-y-2" style={cardStyle}>
          <div className="font-semibold flex items-center space-x-1.5" style={{ color: 'var(--ink, #171717)' }}>
            <Palette className="w-4 h-4" style={{ color: 'var(--link, #0070f3)' }} />
            <span>Icon Corner Geometry</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {[
              { id: 'rounded' as const, label: 'Rounded Square' },
              { id: 'squircle' as const, label: 'Apple Squircle' },
              { id: 'sharp' as const, label: 'Terminal Sharp (0px)' },
              { id: 'circle' as const, label: 'Bubble Circular' },
            ].map((geom) => {
              const active = (profile.customTokens?.iconShape || 'squircle') === geom.id;
              return (
                <button
                  key={geom.id}
                  onClick={() => handleIconShapeSwitch(geom.id)}
                  className="px-2.5 py-1.5 rounded-[6px] text-left text-[11px] transition-all border hover:bg-geist-hairlineSoft"
                  style={
                    active
                      ? { background: 'var(--accent-dim, rgba(23,23,23,0.06))', borderColor: 'var(--link, #0070f3)', color: 'var(--ink, #171717)', fontWeight: 600 }
                      : { borderColor: 'var(--hairline, #ebebeb)', color: 'var(--text-body, #4d4d4d)' }
                  }
                >
                  {geom.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 4. Shell Aesthetics & Window Compositor ──────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Layer 1: Visual Theme Switch */}
        <div className="p-3.5 rounded-[12px] border space-y-2" style={cardStyle}>
          <div className="font-semibold flex items-center space-x-1.5" style={{ color: 'var(--ink, #171717)' }}>
            <Monitor className="w-4 h-4" style={{ color: '#15803d' }} />
            <span>Shell Aesthetic Profiles</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
            {[
              { id: 'gothic', label: '🦇 Gothic' },
              { id: 'cyber', label: '⚡ Cyber' },
              { id: 'gold', label: '👑 Gold' },
              { id: 'synthwave', label: '🌇 Synthwave' },
              { id: 'sakura', label: '🌸 Sakura' },
              { id: 'enterprise', label: '💳 Enterprise' },
              { id: 'macos', label: '🍏 macOS' },
              { id: 'windows', label: '🪟 Windows' },
            ].map((t) => {
              const active = profile.theme === t.id || (t.id === 'gothic' && profile.theme === 'gothic');
              return (
                <button
                  key={t.id}
                  onClick={() => handleThemeSwitch(t.id)}
                  className="px-2.5 py-1.5 rounded-[6px] text-left text-[11px] capitalize transition-all border hover:bg-geist-hairlineSoft"
                  style={
                    active
                      ? { background: 'var(--accent-dim, rgba(23,23,23,0.06))', borderColor: 'var(--ink, #171717)', color: 'var(--ink, #171717)', fontWeight: 600 }
                      : { borderColor: 'var(--hairline, #ebebeb)', color: 'var(--text-body, #4d4d4d)' }
                  }
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Layer 2: Window Manager */}
        <div className="p-3.5 rounded-[12px] border space-y-2" style={cardStyle}>
          <div className="font-semibold flex items-center space-x-1.5" style={{ color: 'var(--ink, #171717)' }}>
            <Sliders className="w-4 h-4" style={{ color: 'var(--link, #0070f3)' }} />
            <span>Window Manager (WM) Compositor</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {(['free', 'windows-snap', 'tiling'] as SnapMode[]).map((s) => (
              <button
                key={s}
                onClick={() => handleUpdate({ snapMode: s })}
                className="px-2 py-1.5 rounded-[6px] text-center capitalize transition-colors text-[11px] border hover:bg-geist-hairlineSoft"
                style={
                  profile.snapMode === s
                    ? { background: 'var(--accent-dim, rgba(23,23,23,0.06))', borderColor: 'var(--link, #0070f3)', color: 'var(--ink, #171717)', fontWeight: 600 }
                    : { borderColor: 'var(--hairline, #ebebeb)', color: 'var(--text-mute, #8f8f8f)' }
                }
              >
                {s.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Layer 3: Dock / Taskbar Layout */}
        <div className="p-3.5 rounded-[12px] border space-y-2" style={cardStyle}>
          <div className="font-semibold flex items-center space-x-1.5" style={{ color: 'var(--ink, #171717)' }}>
            <Monitor className="w-4 h-4" style={{ color: '#15803d' }} />
            <span>Dock & Launcher Style</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {(['macos-magnify', 'windows-center', 'cyber-minimal'] as DockStyle[]).map((d) => (
              <button
                key={d}
                onClick={() => handleUpdate({ dockStyle: d })}
                className="px-2 py-1.5 rounded-[6px] text-center capitalize transition-colors text-[11px] border hover:bg-geist-hairlineSoft"
                style={
                  profile.dockStyle === d
                    ? { background: 'var(--accent-dim, rgba(23,23,23,0.06))', borderColor: '#15803d', color: 'var(--ink, #171717)', fontWeight: 600 }
                    : { borderColor: 'var(--hairline, #ebebeb)', color: 'var(--text-mute, #8f8f8f)' }
                }
              >
                {d.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Layer 4: Security & Zero-Trust Sandbox */}
        <div className="p-3.5 rounded-[12px] border space-y-2" style={cardStyle}>
          <div className="font-semibold flex items-center space-x-1.5" style={{ color: 'var(--ink, #171717)' }}>
            <Shield className="w-4 h-4" style={{ color: '#f5a623' }} />
            <span>Microkernel Security Level</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {(['standard', 'strict-sudo', 'zero-trust', 'pci-dss-compliance'] as SecurityLevel[]).map((sec) => (
              <button
                key={sec}
                onClick={() => handleUpdate({ securityLevel: sec })}
                className="px-2 py-1.5 rounded-[6px] text-left capitalize transition-colors text-[11px] border hover:bg-geist-hairlineSoft"
                style={
                  profile.securityLevel === sec
                    ? { background: 'rgba(245,166,35,0.12)', borderColor: '#f5a623', color: '#b4760a', fontWeight: 600 }
                    : { borderColor: 'var(--hairline, #ebebeb)', color: 'var(--text-mute, #8f8f8f)' }
                }
              >
                {sec.replace(/-/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── AI Synthesis Telemetry Card ────────────────────── */}
      {profile.aiSummary && (
        <div
          className="p-3 rounded-[12px] border font-mono text-[11px]"
          style={{ background: 'var(--canvas, #fafafa)', borderColor: 'var(--hairline, #ebebeb)', color: 'var(--text-body, #4d4d4d)' }}
        >
          <span className="font-bold" style={{ color: profile.customTokens?.accentColor || 'var(--link, #0070f3)' }}>
            [KERNEL RECOMPILER]:{' '}
          </span>
          {profile.aiSummary}
        </div>
      )}
    </div>
  );
};
