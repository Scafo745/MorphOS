import React, { useState } from 'react';
import { useOSStore } from '../core/store';
import { OS_PRESETS } from '../core/presets';
import { ThemeMode, DockStyle, SnapMode, SecurityLevel, CustomTokens } from '../core/types';
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

  return (
    <div className="h-full flex flex-col bg-slate-950/95 text-slate-200 text-xs font-sans overflow-y-auto p-4 select-none space-y-5">
      {/* ── Top Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center space-x-2.5">
          <div
            className="p-2 rounded-xl"
            style={{
              background: profile.customTokens?.accentColor ? `${profile.customTokens.accentColor}25` : 'rgba(99,102,241,0.2)',
              color: profile.customTokens?.accentColor || '#818cf8',
            }}
          >
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">MorphOS System Synthesizer</h2>
            <p className="text-[11px] text-slate-400">Prompt-Synthesized Adaptive Operating System Architecture</p>
          </div>
        </div>

        <div
          className="flex items-center space-x-1.5 px-3 py-1 rounded-full font-mono text-[10px] border"
          style={{
            borderColor: profile.customTokens?.accentColor ? `${profile.customTokens.accentColor}50` : 'rgba(99,102,241,0.3)',
            color: profile.customTokens?.accentColor || '#a5b4fc',
            background: profile.customTokens?.accentColor ? `${profile.customTokens.accentColor}15` : 'rgba(99,102,241,0.1)',
          }}
        >
          <Cpu className="w-3 h-3" />
          <span>MICROKERNEL ACTIVE</span>
        </div>
      </div>

      {/* ── 1. Universal AI Prompt Synthesizer Bar ───────────── */}
      <div
        className="p-3.5 rounded-2xl border"
        style={{
          background: 'rgba(255,255,255,0.03)',
          borderColor: profile.customTokens?.windowBorder || 'rgba(255,255,255,0.12)',
          boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${profile.customTokens?.accentGlow || 'rgba(0,0,0,0.2)'}`,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
            <Wand2 className="w-4 h-4" style={{ color: profile.customTokens?.accentColor || '#818cf8' }} />
            <span>Customize Everything with a Prompt</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Synthesizes Theme, Icons, Windows & Security</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSynthesizePrompt()}
            placeholder="Type any prompt: 'make colors dark like gothic theme', 'royal gold luxury', 'matrix cyber'..."
            className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
          />
          <button
            onClick={() => handleSynthesizePrompt()}
            disabled={isCompiling}
            className="px-4 py-2 rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5 shadow-lg shrink-0 disabled:opacity-50"
            style={{
              background: profile.customTokens?.accentColor || '#6366f1',
              color: '#000',
              boxShadow: `0 0 16px ${profile.customTokens?.accentGlow || 'rgba(99,102,241,0.5)'}`,
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
              className="px-2.5 py-1 rounded-lg text-[10px] bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-300 transition-all hover:scale-105 active:scale-95"
            >
              {qp.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 2. Preset Target Architectures Grid ──────────────── */}
      <div>
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1">
          <Sparkles className="w-3 h-3 text-yellow-400" />
          <span>Preset Target Architectures (1-Click Switch)</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(OS_PRESETS).map(([key, preset]) => {
            const isActive = profile.name === preset.name;
            return (
              <button
                key={key}
                onClick={() => setProfile(preset)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isActive
                    ? 'border-white/40 shadow-xl scale-[1.02]'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                }`}
                style={{
                  background: isActive ? `${preset.customTokens.accentColor}25` : undefined,
                  borderColor: isActive ? preset.customTokens.accentColor : undefined,
                  boxShadow: isActive ? `0 0 20px ${preset.customTokens.accentGlow}` : undefined,
                }}
              >
                <div className="font-semibold text-xs truncate flex items-center justify-between">
                  <span>{preset.name}</span>
                  {isActive && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
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
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
          <div className="font-semibold text-white flex items-center space-x-1.5">
            <Box className="w-4 h-4 text-purple-400" />
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
                  className={`px-2.5 py-1.5 rounded-lg text-left text-[11px] transition-all border flex items-center justify-between ${
                    active
                      ? 'bg-white/15 text-white font-semibold'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
                  }`}
                  style={{ borderColor: active ? ic.color : undefined }}
                >
                  <span className="truncate">{ic.label}</span>
                  <span className="w-2 h-2 rounded-full" style={{ background: ic.color }} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Icon Geometry Shape */}
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
          <div className="font-semibold text-white flex items-center space-x-1.5">
            <Palette className="w-4 h-4 text-sky-400" />
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
                  className={`px-2.5 py-1.5 rounded-lg text-left text-[11px] transition-all border ${
                    active
                      ? 'bg-sky-500/20 border-sky-400 text-sky-200 font-semibold'
                      : 'bg-white/5 hover:bg-white/10 border-white/5 text-slate-300'
                  }`}
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
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
          <div className="font-semibold text-white flex items-center space-x-1.5">
            <Monitor className="w-4 h-4 text-emerald-400" />
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
                  className={`px-2.5 py-1.5 rounded-lg text-left text-[11px] capitalize transition-all border ${
                    active
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-semibold'
                      : 'bg-white/5 hover:bg-white/10 border-white/5 text-slate-300'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Layer 2: Window Manager */}
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
          <div className="font-semibold text-white flex items-center space-x-1.5">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>Window Manager (WM) Compositor</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {(['free', 'windows-snap', 'tiling'] as SnapMode[]).map((s) => (
              <button
                key={s}
                onClick={() => handleUpdate({ snapMode: s })}
                className={`px-2 py-1.5 rounded-lg text-center capitalize transition-colors text-[11px] border ${
                  profile.snapMode === s
                    ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300 font-semibold'
                    : 'bg-white/5 hover:bg-white/10 border-white/5 text-slate-400'
                }`}
              >
                {s.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Layer 3: Dock / Taskbar Layout */}
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
          <div className="font-semibold text-white flex items-center space-x-1.5">
            <Monitor className="w-4 h-4 text-emerald-400" />
            <span>Dock & Launcher Style</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {(['macos-magnify', 'windows-center', 'cyber-minimal'] as DockStyle[]).map((d) => (
              <button
                key={d}
                onClick={() => handleUpdate({ dockStyle: d })}
                className={`px-2 py-1.5 rounded-lg text-center capitalize transition-colors text-[11px] border ${
                  profile.dockStyle === d
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-semibold'
                    : 'bg-white/5 hover:bg-white/10 border-white/5 text-slate-400'
                }`}
              >
                {d.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Layer 4: Security & Zero-Trust Sandbox */}
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
          <div className="font-semibold text-white flex items-center space-x-1.5">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>Microkernel Security Level</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {(['standard', 'strict-sudo', 'zero-trust', 'pci-dss-compliance'] as SecurityLevel[]).map((sec) => (
              <button
                key={sec}
                onClick={() => handleUpdate({ securityLevel: sec })}
                className={`px-2 py-1.5 rounded-lg text-left capitalize transition-colors text-[11px] border ${
                  profile.securityLevel === sec
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-semibold'
                    : 'bg-white/5 hover:bg-white/10 border-white/5 text-slate-400'
                }`}
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
          className="p-3 rounded-xl border font-mono text-[11px]"
          style={{
            background: 'rgba(5, 5, 15, 0.8)',
            borderColor: profile.customTokens?.windowBorder || 'rgba(255,255,255,0.1)',
            color: profile.customTokens?.accentText || '#e2e8f0',
          }}
        >
          <span className="font-bold" style={{ color: profile.customTokens?.accentColor || '#38bdf8' }}>
            [KERNEL RECOMPILER]:{' '}
          </span>
          {profile.aiSummary}
        </div>
      )}
    </div>
  );
};
