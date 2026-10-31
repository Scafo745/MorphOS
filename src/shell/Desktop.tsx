import React, { useState } from 'react';
import { useOSStore } from '../core/store';
import { motion, AnimatePresence } from 'framer-motion';
import { MenuBar } from './MenuBar';
import { Dock } from './Dock';
import { Spotlight } from './Spotlight';
import { SudoModal } from './SudoModal';
import { CloudModal } from './CloudModal';
import { Window } from '../wm/Window';
import { SnapGuides } from '../wm/SnapGuides';
import { SnapZone } from '../core/types';
import { Toasts } from './Toasts';
import { Terminal, Folder, Sparkles, Settings, Shield, Bot, Cloud, Zap } from 'lucide-react';
import { getIconTheme } from '../core/icon-theme';
import { usePrefersReducedMotion } from '../core/usePrefersReducedMotion';

export const Desktop: React.FC = () => {
  const { profile, windows, openApp, toggleSpotlight, toggleCloudModal } = useOSStore();
  const [snapZone, setSnapZone] = useState<SnapZone['type']>(null);
  const [ctx, setCtx] = useState<{ x: number; y: number } | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const isCyber = profile.theme === 'cyber';
  const orbTransition = prefersReducedMotion ? '' : 'transition-all duration-700';

  return (
    <div
      onContextMenu={e => { e.preventDefault(); setCtx({ x: e.clientX, y: e.clientY }); }}
      onClick={() => ctx && setCtx(null)}
      className={`fixed inset-0 overflow-hidden select-none font-sans transition-all duration-700 theme-${profile.theme}`}
      style={{
        background: profile.customTokens?.bgDesktop || 'var(--bg-desktop)',
        '--bg-desktop': profile.customTokens?.bgDesktop,
        '--bg-orb-1': profile.customTokens?.bgOrb1,
        '--bg-orb-2': profile.customTokens?.bgOrb2,
        '--accent': profile.customTokens?.accentColor,
        '--accent-glow': profile.customTokens?.accentGlow,
        '--accent-text': profile.customTokens?.accentText,
        '--window-bg': profile.customTokens?.windowBg,
        '--window-border': profile.customTokens?.windowBorder,
        '--window-radius': profile.customTokens?.windowRadius,
        '--window-blur': profile.customTokens?.windowBlur,
        '--dock-bg': profile.customTokens?.dockBg,
        '--dock-border': profile.customTokens?.dockBorder,
        '--dock-radius': profile.customTokens?.dockRadius,
      } as React.CSSProperties}
    >
      {/* ── Ambient orbs ─────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className={`absolute inset-0 ${orbTransition}`}
          style={{ background: profile.customTokens?.bgOrb1 || 'var(--bg-orb-1)' }}
        />
        <div
          className={`absolute inset-0 ${orbTransition}`}
          style={{ background: profile.customTokens?.bgOrb2 || 'var(--bg-orb-2)' }}
        />
      </div>

      {/* ── Cyber grid ───────────────────────────────── */}
      {isCyber && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,255,180,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,180,0.04) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      )}

      {/* ── Menu Bar ─────────────────────────────────── */}
      <MenuBar />

      {/* ── Desktop file icons ───────────────────────── */}
      <div className="absolute top-11 left-3 flex flex-col gap-3 z-10">
        {[
          { app: 'hyperswitch' as const, label: 'Hyperswitch', icon: (c: string) => <Zap className="w-6 h-6" style={{ color: c }} /> },
          { app: 'copilot' as const, label: 'Copilot', icon: (c: string) => <Bot className="w-6 h-6" style={{ color: c }} /> },
          { app: 'terminal' as const, label: 'Terminal', icon: (c: string) => <Terminal className="w-6 h-6" style={{ color: c }} /> },
          { app: 'filemanager' as const, label: 'Files', icon: (c: string) => <Folder className="w-6 h-6" style={{ color: c }} /> },
        ].map(item => {
          const t = getIconTheme(item.app, profile.customTokens?.iconStyle, profile.customTokens?.iconShape);
          return (
            <motion.button
              key={item.app}
              onDoubleClick={() => openApp(item.app)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-1 p-1.5 rounded-xl group w-[68px]"
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              <div
                className="w-12 h-12 flex items-center justify-center shadow-xl relative overflow-hidden transition-all duration-300"
                style={{
                  background: t.bg,
                  border: t.border,
                  borderRadius: t.borderRadius,
                  boxShadow: `${t.boxShadow}, 0 0 15px ${t.glow}`,
                }}
              >
                {item.icon(t.iconColor)}
                <div
                  className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent"
                  style={{ opacity: t.sheenOpacity }}
                />
              </div>
              <span
                className="text-[11px] font-medium text-white/80 group-hover:text-white transition-colors"
                style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}
              >
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* ── Active profile pill ───────────────────────── */}
      <div className="fixed top-10 right-3 z-20 pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={profile.name}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: 'spring', damping: 28, stiffness: 340 }}
            className="flex items-center gap-2.5 pl-2 pr-3.5 py-2 rounded-xl"
            style={{
              background: 'rgba(5,5,15,0.7)',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.09)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            }}
          >
            {/* Pulsing status dot */}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{ background: 'var(--accent)' }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'var(--accent)' }} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-semibold text-white/90">{profile.name}</span>
                <span
                  className="text-[9px] font-mono font-bold uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-md"
                  style={{ background: 'var(--accent-dim)', color: 'var(--accent-text)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {profile.theme}
                </span>
              </div>
              <p className="text-[10px] text-white/30 max-w-[230px] truncate mt-0.5">{profile.tagline}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Snap guides ──────────────────────────────── */}
      <SnapGuides activeZone={snapZone} />

      {/* ── Windows ──────────────────────────────────── */}
      <main className="absolute inset-0 pt-8 pb-16">
        {windows.map(win => (
          <Window key={win.id} window={win} onSnapZoneChange={setSnapZone} />
        ))}
      </main>

      {/* ── Dock ─────────────────────────────────────── */}
      <Dock />

      {/* ── Overlays ─────────────────────────────────── */}
      <Spotlight />
      <SudoModal />
      <CloudModal />
      <Toasts />

      {/* ── Context menu ─────────────────────────────── */}
      <AnimatePresence>
        {ctx && (
          <motion.div
            key="ctx"
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
            className="fixed z-[80] w-52 py-1.5 px-1 rounded-xl overflow-hidden"
            style={{
              top: ctx.y,
              left: ctx.x,
              background: 'rgba(6,6,18,0.92)',
              backdropFilter: 'blur(48px) saturate(200%)',
              WebkitBackdropFilter: 'blur(48px) saturate(200%)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
            }}
          >
            {[
              { label: 'Synthesize OS...', icon: <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />, action: () => toggleSpotlight(true) },
              { label: 'Morph Copilot',    icon: <Bot className="w-3.5 h-3.5 text-purple-400" />, action: () => openApp('copilot') },
              null,
              { label: 'Open Terminal',    icon: <Terminal className="w-3.5 h-3.5 text-emerald-400" />, action: () => openApp('terminal') },
              { label: 'Open Files',       icon: <Folder className="w-3.5 h-3.5 text-sky-400" />,     action: () => openApp('filemanager') },
              { label: 'OS Synthesizer',   icon: <Settings className="w-3.5 h-3.5 text-violet-400" />, action: () => openApp('settings') },
              { label: 'Audit & Guard',    icon: <Shield className="w-3.5 h-3.5 text-amber-400" />,    action: () => openApp('security') },
              null,
              { label: 'Cloud & n8n Gateway', icon: <Cloud className="w-3.5 h-3.5 text-sky-400" />, action: () => toggleCloudModal(true) },
            ].map((item, i) =>
              item === null ? (
                <div key={`sep-${i}`} className="mx-2 my-1 h-px bg-white/8" />
              ) : (
                <button
                  key={item.label}
                  onClick={() => { item.action(); setCtx(null); }}
                  className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg text-xs text-white/80 hover:bg-white/8 hover:text-white transition-colors text-left"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
