import React, { useState, Suspense } from 'react';
import { Rnd } from 'react-rnd';
import { WindowState } from '../core/types';
import { useOSStore } from '../core/store';
import { WindowControls } from './WindowControls';
import { Terminal as TermIcon, Folder, Settings as SettingsIcon, Shield, FileText, Bot, Zap, Globe, Loader2 } from 'lucide-react';
import { getIconTheme } from '../core/icon-theme';

// Lazily load each app body so it ships in its own chunk and the initial
// bundle shrinks. The app components are NAMED exports, so re-map to default.
const Terminal = React.lazy(() => import('../apps/Terminal').then(m => ({ default: m.Terminal })));
const FileManager = React.lazy(() => import('../apps/FileManager').then(m => ({ default: m.FileManager })));
const Settings = React.lazy(() => import('../apps/Settings').then(m => ({ default: m.Settings })));
const SecurityGuard = React.lazy(() => import('../apps/SecurityGuard').then(m => ({ default: m.SecurityGuard })));
const Copilot = React.lazy(() => import('../apps/Copilot').then(m => ({ default: m.Copilot })));
const Hyperswitch = React.lazy(() => import('../apps/Hyperswitch').then(m => ({ default: m.Hyperswitch })));
const Browser = React.lazy(() => import('../apps/Browser').then(m => ({ default: m.Browser })));

const APP_ICONS: Record<string, (color?: string) => React.ReactNode> = {
  terminal:    (c) => <TermIcon className="w-3.5 h-3.5" style={{ color: c || '#34d399' }} />,
  filemanager: (c) => <Folder className="w-3.5 h-3.5" style={{ color: c || '#38bdf8' }} />,
  settings:    (c) => <SettingsIcon className="w-3.5 h-3.5" style={{ color: c || '#a78bfa' }} />,
  security:    (c) => <Shield className="w-3.5 h-3.5" style={{ color: c || '#fbbf24' }} />,
  copilot:     (c) => <Bot className="w-3.5 h-3.5" style={{ color: c || '#c084fc' }} />,
  notes:       (c) => <FileText className="w-3.5 h-3.5" style={{ color: c || '#fda4af' }} />,
  hyperswitch: (c) => <Zap className="w-3.5 h-3.5" style={{ color: c || '#38bdf8' }} />,
  browser:     (c) => <Globe className="w-3.5 h-3.5" style={{ color: c || '#2dd4bf' }} />,
};

interface WindowProps {
  window: WindowState;
  onSnapZoneChange?: (zone: 'left-half' | 'right-half' | 'maximize' | null) => void;
}

export const Window: React.FC<WindowProps> = ({ window: win, onSnapZoneChange }) => {
  const { profile, activeWindowId, focusWindow, updateWindowBounds, snapWindow } = useOSStore();
  const [dragZone, setDragZone] = useState<'left-half' | 'right-half' | 'maximize' | null>(null);

  if (win.isMinimized) return null;

  const isActive = activeWindowId === win.id;
  const isCyber = profile.theme === 'cyber';
  const isWin = profile.controlsStyle === 'windows-squares';
  const iconTheme = getIconTheme(win.appId, profile.customTokens?.iconStyle, profile.customTokens?.iconShape);

  const renderApp = () => {
    switch (win.appId) {
      case 'terminal':    return <Terminal />;
      case 'filemanager': return <FileManager />;
      case 'settings':    return <Settings />;
      case 'security':    return <SecurityGuard />;
      case 'copilot':     return <Copilot />;
      case 'hyperswitch': return <Hyperswitch />;
      case 'browser':     return <Browser />;
      default:
        return (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs font-mono" style={{ color: 'var(--text-faint, #a1a1a1)' }}>App not found</p>
          </div>
        );
    }
  };

  return (
    <Rnd
      size={{ width: win.size.width, height: win.size.height }}
      position={{ x: win.position.x, y: win.position.y }}
      minWidth={340}
      minHeight={220}
      bounds="parent"
      dragHandleClassName="win-drag"
      onDragStart={() => focusWindow(win.id)}
      onDrag={(_e, d) => {
        if (profile.snapMode !== 'windows-snap') return;
        const sw = window.innerWidth;
        let zone: typeof dragZone = null;
        if (d.x <= 12) zone = 'left-half';
        else if (d.x + win.size.width >= sw - 12) zone = 'right-half';
        else if (d.y <= 38) zone = 'maximize';
        setDragZone(zone);
        onSnapZoneChange?.(zone);
      }}
      onDragStop={(_e, d) => {
        onSnapZoneChange?.(null);
        if (dragZone && profile.snapMode === 'windows-snap') {
          snapWindow(win.id, dragZone);
        } else {
          updateWindowBounds(win.id, { x: d.x, y: d.y }, win.size);
        }
        setDragZone(null);
      }}
      onResizeStop={(_e, _dir, ref, _delta, pos) => {
        updateWindowBounds(win.id, pos, {
          width: parseInt(ref.style.width, 10),
          height: parseInt(ref.style.height, 10),
        });
      }}
      className="flex flex-col overflow-hidden"
      style={{
        zIndex: win.zIndex,
        background: profile.customTokens?.windowBg || 'var(--window-bg)',
        backdropFilter: `blur(${profile.customTokens?.windowBlur || 'var(--window-blur)'}) saturate(160%)`,
        WebkitBackdropFilter: `blur(${profile.customTokens?.windowBlur || 'var(--window-blur)'}) saturate(160%)`,
        border: `1px solid ${isActive ? (profile.customTokens?.accentColor || 'var(--window-border, #ebebeb)') : (profile.customTokens?.windowBorder || 'var(--window-border)')}`,
        borderRadius: profile.customTokens?.windowRadius || 'var(--window-radius)',
        boxShadow: isActive
          ? `var(--window-shadow-active, 0 1px 2px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.10)), 0 0 25px ${profile.customTokens?.accentGlow || 'transparent'}`
          : 'var(--window-shadow, 0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06))',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
      }}
    >
      {/* ── Inner container capturing pointer down to guarantee instant focus ── */}
      <div
        className="w-full h-full flex flex-col overflow-hidden"
        onPointerDownCapture={() => focusWindow(win.id)}
      >
        {/* ── Title bar ──────────────────────────────── */}
        <div
          className="win-drag flex items-center justify-between px-3 flex-shrink-0 cursor-move"
          style={{
            height: '36px',
            background: 'var(--window-header-bg, rgba(250,250,250,0.9))',
            borderBottom: `1px solid ${profile.customTokens?.windowBorder || 'var(--window-header-border, var(--hairline, #ebebeb))'}`,
            borderTopLeftRadius: `calc(${profile.customTokens?.windowRadius || 'var(--window-radius)'} - 1px)`,
            borderTopRightRadius: `calc(${profile.customTokens?.windowRadius || 'var(--window-radius)'} - 1px)`,
          }}
        >
          {/* macOS / Gothic layout: controls left, title center */}
          {!isWin && !isCyber ? (
            <>
              <WindowControls windowId={win.id} />
              <div className="flex items-center gap-1.5 text-[11px] font-medium">
                {APP_ICONS[win.appId]?.(iconTheme.iconColor)}
                <span className="truncate max-w-[200px]" style={{ color: isActive ? 'var(--ink, #171717)' : 'var(--text-mute, #8f8f8f)' }}>
                  {win.title}
                </span>
              </div>
              <div className="w-14" /> {/* spacer */}
            </>
          ) : (
            /* Windows / Cyber layout: icon+title left, controls right */
            <>
              <div className="flex items-center gap-2">
                {APP_ICONS[win.appId]?.(iconTheme.iconColor)}
                <span
                  className={`text-[11px] font-medium truncate max-w-[240px] ${isCyber ? 'font-mono text-[10px]' : ''}`}
                  style={{ color: isActive ? (profile.customTokens?.accentColor || 'var(--accent)') : 'rgba(255,255,255,0.6)' }}
                >
                  {win.title}
                </span>
              </div>
              <WindowControls windowId={win.id} />
            </>
          )}
        </div>

        {/* ── Window body ────────────────────────────── */}
        <div className="flex-1 overflow-hidden relative min-h-0">
          <Suspense
            fallback={
              <div className="h-full flex items-center justify-center">
                <Loader2
                  className="w-5 h-5 animate-spin"
                  style={{ color: 'var(--accent, #a1a1a1)' }}
                  aria-label="Loading app"
                />
              </div>
            }
          >
            {renderApp()}
          </Suspense>
        </div>

        {/* ── Top-edge specular sheen (macOS only) ───── */}
        {!isCyber && (
          <div
            className="absolute top-0 left-0 right-0 h-px pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.18) 50%, transparent 95%)' }}
          />
        )}
      </div>
    </Rnd>
  );
};
