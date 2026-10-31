import React from 'react';
import { useOSStore } from '../core/store';
import { Minus, Square, X } from 'lucide-react';

interface WindowControlsProps {
  windowId: string;
}

export const WindowControls: React.FC<WindowControlsProps> = ({ windowId }) => {
  const { profile, closeWindow, minimizeWindow, maximizeWindow } = useOSStore();

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    closeWindow(windowId);
  };

  const handleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    minimizeWindow(windowId);
  };

  const handleMaximize = (e: React.MouseEvent) => {
    e.stopPropagation();
    maximizeWindow(windowId);
  };

  // Geist base: 6px-square button-ghost-sm chrome (ink glyphs, hairline border, whisper hover)
  if (profile.theme === 'geist') {
    const btnBase =
      'w-6 h-6 flex items-center justify-center rounded-[6px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-geist-link/60';
    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleMinimize}
          title="Minimize"
          className={btnBase}
          style={{
            background: 'var(--canvas-elevated, #ffffff)',
            border: '1px solid var(--hairline, #ebebeb)',
            color: 'var(--ink, #171717)',
          }}
        >
          <Minus className="w-3 h-3" />
        </button>
        <button
          onClick={handleMaximize}
          title="Maximize"
          className={btnBase}
          style={{
            background: 'var(--canvas-elevated, #ffffff)',
            border: '1px solid var(--hairline, #ebebeb)',
            color: 'var(--ink, #171717)',
          }}
        >
          <Square className="w-2.5 h-2.5" />
        </button>
        <button
          onClick={handleClose}
          title="Close"
          className={btnBase}
          style={{
            background: 'var(--canvas-elevated, #ffffff)',
            border: '1px solid var(--hairline, #ebebeb)',
            color: 'var(--ink, #171717)',
          }}
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  if (profile.controlsStyle === 'traffic-lights') {
    const isGothic = profile.theme === 'gothic' || profile.customTokens?.iconStyle === 'gothic-dark';

    if (isGothic) {
      return (
        <div className="flex items-center space-x-2 group">
          <button
            onClick={handleClose}
            aria-label="Close window"
            className="w-3 h-3 rounded-full bg-rose-600 hover:bg-rose-500 border border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)] flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-0"
            title="Close"
          >
            <X className="w-2 h-2 text-black font-bold opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <button
            onClick={handleMinimize}
            aria-label="Minimize window"
            className="w-3 h-3 rounded-full bg-rose-900 hover:bg-rose-800 border border-rose-700/60 flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-0"
            title="Minimize"
          >
            <Minus className="w-2 h-2 text-rose-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <button
            onClick={handleMaximize}
            aria-label="Maximize window"
            className="w-3 h-3 rounded-full bg-rose-800 hover:bg-rose-700 border border-rose-600/70 flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-0"
            title="Maximize"
          >
            <Square className="w-1.5 h-1.5 text-rose-200 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2 group">
        <button
          onClick={handleClose}
          aria-label="Close window"
          className="w-3 h-3 rounded-full bg-rose-500 hover:bg-rose-600 border border-rose-600 flex items-center justify-center transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-0"
          title="Close"
        >
          <X className="w-2 h-2 text-rose-950 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
        <button
          onClick={handleMinimize}
          aria-label="Minimize window"
          className="w-3 h-3 rounded-full bg-amber-500 hover:bg-amber-600 border border-amber-600 flex items-center justify-center transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-0"
          title="Minimize"
        >
          <Minus className="w-2 h-2 text-amber-950 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
        <button
          onClick={handleMaximize}
          aria-label="Maximize window"
          className="w-3 h-3 rounded-full bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 flex items-center justify-center transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-0"
          title="Zoom/Maximize"
        >
          <Square className="w-1.5 h-1.5 text-emerald-950 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>
    );
  }

  if (profile.controlsStyle === 'cyber-minimal') {
    return (
      <div className="flex items-center space-x-1.5 font-mono text-[11px]">
        <button
          onClick={handleMinimize}
          aria-label="Minimize window"
          className="px-1.5 py-0.5 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-0"
          title="Minimize"
        >
          _
        </button>
        <button
          onClick={handleMaximize}
          aria-label="Maximize window"
          className="px-1.5 py-0.5 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-0"
          title="Tile/Full"
        >
          [ ]
        </button>
        <button
          onClick={handleClose}
          aria-label="Close window"
          className="px-1.5 py-0.5 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-0"
          title="Kill"
        >
          X
        </button>
      </div>
    );
  }

  // Windows 11 Square Controls
  return (
    <div className="flex items-center">
      <button
        onClick={handleMinimize}
        aria-label="Minimize window"
        className="w-8 h-7 flex items-center justify-center hover:bg-white/10 text-slate-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-0"
        title="Minimize"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={handleMaximize}
        aria-label="Maximize window"
        className="w-8 h-7 flex items-center justify-center hover:bg-white/10 text-slate-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-0"
        title="Maximize / Snap"
      >
        <Square className="w-3 h-3" />
      </button>
      <button
        onClick={handleClose}
        aria-label="Close window"
        className="w-9 h-7 flex items-center justify-center hover:bg-rose-600 text-slate-300 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-0"
        title="Close"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

