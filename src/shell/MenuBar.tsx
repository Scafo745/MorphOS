import React, { useState, useEffect } from 'react';
import { useOSStore } from '../core/store';
import { Wifi, Battery, Volume2, Search, Lock, ChevronRight, Cloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const MenuBar: React.FC = () => {
  const { profile, toggleSpotlight, activeWindowId, windows, toggleCloudModal, cloudConfig } = useOSStore();
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [appleMenuOpen, setAppleMenuOpen] = useState(false);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setDate(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const activeWindow = windows.find(w => w.id === activeWindowId);
  const appName = activeWindow?.title?.split('—')[0]?.trim() ?? 'MorphOS';

  const isCyber = profile.theme === 'cyber';
  const isWin = profile.theme === 'windows';
  const isGothic = profile.theme === 'gothic' || profile.customTokens?.iconStyle === 'gothic-dark';
  const isGold = profile.customTokens?.iconStyle === 'golden-luxury';

  const appleItems = [
    { label: 'About MorphOS', hint: 'v2.4.0' },
    null,
    { label: 'Synthesize OS...', hint: '⌘K' },
    { label: 'Cloud & n8n Gateway...', hint: 'n8n' },
    { label: 'Security Policy', hint: profile.securityLevel },
    null,
    { label: 'Lock Session', hint: '⌃⌘Q' },
    { label: 'Shut Down...', hint: '' },
  ];

  return (
    <header
      className="fixed top-0 left-0 right-0 h-8 z-50 select-none"
      style={{
        background: 'var(--menubar-bg, rgba(250,250,250,0.8))',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderBottom: '1px solid var(--menubar-border, var(--hairline, #ebebeb))',
      }}
    >
      <div className="h-full flex items-center justify-between px-3">

        {/* ── LEFT: OS logo + active app name ────────────── */}
        <div className="flex items-center gap-1.5">
          {/* OS Logo button */}
          <div className="relative">
            <button
              onClick={() => setAppleMenuOpen(v => !v)}
              className="flex items-center justify-center w-7 h-6 rounded-md hover:bg-geist-hairlineSoft transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-geist-link/60"
              title="MorphOS menu"
              aria-label="Open MorphOS menu"
              aria-expanded={appleMenuOpen}
            >
              {isCyber ? (
                <span className="font-mono text-[10px] font-bold" style={{ color: 'var(--accent)' }}>&gt;_</span>
              ) : isGothic ? (
                <span className="text-xs font-bold drop-shadow-[0_0_8px_rgba(244,63,94,0.9)]" style={{ color: '#f43f5e' }}>⚔</span>
              ) : isGold ? (
                <span className="text-xs font-bold drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]" style={{ color: '#fbbf24' }}>👑</span>
              ) : isWin ? (
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <rect x="0" y="0" width="6" height="6" fill="#38bdf8" rx="1" />
                  <rect x="7" y="0" width="6" height="6" fill="#38bdf8" rx="1" />
                  <rect x="0" y="7" width="6" height="6" fill="#38bdf8" rx="1" />
                  <rect x="7" y="7" width="6" height="6" fill="#38bdf8" rx="1" />
                </svg>
              ) : (
                <svg width="14" height="17" viewBox="0 0 14 17" fill="none">
                  <path d="M9.9 0C9.9 1.93-1.1 3.25 0.88 5.37 2.64 3.04 9.9 3.1 9.9 0Z" fill="var(--ink, #171717)" />
                  <path d="M10.5 5.7C8.5 5.7 6.9 6.8 5.9 6.8c-1 0-2.5-1-4.1-1C-.2 5.8-2.3 7.6-3 10c-1.3 4.5 1 9 2.5 11 .7 1 1.6 2 2.7 2 1.1 0 1.5-.7 2.8-.7 1.3 0 1.7.7 2.8.7 1.2 0 2.1-1.1 2.8-2.1.7-1 1-1.9 1-1.9s-2-.8-2-3.1c0-2 1.6-3 1.7-3C12 11 11 10 10.5 9.8c-.4-.2-1-.3-1-.3.1 0 .6-.2 1-.6.8-.5 1.4-1.3 1.4-2.5 0-.1 0-.2 0-.3-.1 0-.2.1-.4.1-.5.1-.8-.1-1-.8z" fill="var(--ink, #171717)" />
                </svg>
              )}
            </button>

            {/* Apple-style dropdown menu */}
            <AnimatePresence>
              {appleMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setAppleMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute left-0 top-full mt-1 w-52 z-50 rounded-xl overflow-hidden"
                    style={{
                      background: 'var(--spotlight-bg, #ffffff)',
                      backdropFilter: 'blur(48px) saturate(200%)',
                      WebkitBackdropFilter: 'blur(48px) saturate(200%)',
                      border: '1px solid var(--hairline, #ebebeb)',
                      boxShadow: 'var(--window-shadow-active, 0 1px 2px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.10))',
                    }}
                  >
                    <div className="py-1.5 px-1">
                      {appleItems.map((item, i) =>
                        item === null ? (
                          <div key={`sep-${i}`} className="mx-2 my-1 h-px" style={{ background: 'var(--hairline, #ebebeb)' }} />
                        ) : (
                          <button
                            key={item.label}
                            onClick={() => {
                              if (item.label === 'Synthesize OS...') toggleSpotlight(true);
                              if (item.label === 'Cloud & n8n Gateway...') toggleCloudModal(true);
                              setAppleMenuOpen(false);
                            }}
                            className="flex items-center justify-between w-full px-3 py-1.5 rounded-lg text-xs hover:bg-geist-hairlineSoft transition-colors text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-geist-link/60"
                          >
                            <span style={{ color: 'var(--ink, #171717)' }}>{item.label}</span>
                            {item.hint && (
                              <span className="font-mono text-[10px]" style={{ color: 'var(--text-mute, #8f8f8f)' }}>
                                {item.hint}
                              </span>
                            )}
                          </button>
                        )
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* App name */}
          <div className="h-4 w-px mx-0.5" style={{ background: 'var(--hairline, #ebebeb)' }} />
          <span className="text-[12px] font-semibold tracking-tight" style={{ color: 'var(--ink, #171717)' }}>{appName}</span>
        </div>

        {/* ── CENTER: Prompt trigger ──────────────────────── */}
        <motion.button
          onClick={() => toggleSpotlight(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-3 py-1 rounded-full text-xs transition-all"
          style={{
            background: 'var(--canvas-elevated, #ffffff)',
            border: '1px solid var(--hairline, #ebebeb)',
            color: 'var(--text-mute, #8f8f8f)',
          }}
        >
          <Search className="w-3 h-3" style={{ color: 'var(--accent)' }} />
          <span className="hidden sm:inline">Synthesize OS with a prompt...</span>
          <kbd
            className="hidden sm:inline-flex items-center px-1.5 h-4 rounded text-[9px] font-mono"
            style={{
              background: 'var(--canvas, #fafafa)',
              border: '1px solid var(--hairline, #ebebeb)',
              color: 'var(--text-faint, #a1a1a1)',
            }}
          >
            ⌘K
          </kbd>
        </motion.button>

        {/* ── RIGHT: Status icons + time ──────────────────── */}
        <div className="flex items-center gap-3">
          {/* Cloud Gateway Pill */}
          <button
            onClick={() => toggleCloudModal(true)}
            title="Configure Cloud & n8n Gateway"
            aria-label="Configure Cloud and n8n Gateway"
            className="hidden lg:flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono hover:bg-geist-hairlineSoft transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-geist-link/60"
            style={{
              background: cloudConfig.n8nWebhookUrl ? 'var(--accent-dim)' : 'var(--canvas, #fafafa)',
              color: cloudConfig.n8nWebhookUrl ? 'var(--accent)' : 'var(--text-mute, #8f8f8f)',
              border: '1px solid var(--hairline, #ebebeb)',
            }}
          >
            <Cloud className="w-3 h-3" />
            <span>{cloudConfig.n8nWebhookUrl ? 'n8n LINKED' : 'CLOUD'}</span>
          </button>

          {/* Security badge */}
          <div
            className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase tracking-wider"
            style={{
              background: 'var(--accent-dim)',
              color: 'var(--accent)',
              border: '1px solid var(--hairline, #ebebeb)',
            }}
          >
            <Lock className="w-2.5 h-2.5" />
            <span>{profile.securityLevel.replace(/-/g, ' ')}</span>
          </div>

          {/* System icons */}
          <div className="flex items-center gap-2.5" style={{ color: 'var(--text-mute, #8f8f8f)' }}>
            <Wifi className="w-3.5 h-3.5" />
            <Volume2 className="w-3.5 h-3.5" />
            <Battery className="w-3.5 h-3.5" />
          </div>

          {/* User role chip */}
          <div className="flex items-center gap-1 text-[11px] font-mono" style={{ color: 'var(--text-mute, #8f8f8f)' }}>
            <span style={{ color: 'var(--accent-text)', opacity: 0.7 }}>{profile.userRole}</span>
            <ChevronRight className="w-2.5 h-2.5" />
          </div>

          {/* Clock */}
          <div className="text-right">
            <div className="text-[12px] font-semibold tabular-nums leading-tight" style={{ color: 'var(--ink, #171717)' }}>{time}</div>
            <div className="text-[9px] font-mono leading-tight" style={{ color: 'var(--text-mute, #8f8f8f)' }}>{date}</div>
          </div>
        </div>
      </div>
    </header>
  );
};
