import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOSStore } from '../core/store';
import { ShieldAlert, KeyRound } from 'lucide-react';

export const SudoModal: React.FC = () => {
  const { isSudoModalOpen, sudoPromptMessage, resolveSudoChallenge, profile } = useOSStore();
  const [password, setPassword] = useState('');
  const [shaking, setShaking] = useState(false);

  if (!isSudoModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setShaking(true);
      setTimeout(() => setShaking(false), 600);
      return;
    }
    resolveSudoChallenge(true);
    setPassword('');
  };

  const isCyber = profile.theme === 'cyber';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 10 }}
          animate={shaking
            ? { scale: 1, opacity: 1, y: 0, x: [0, -10, 10, -8, 8, -4, 4, 0] }
            : { scale: 1, opacity: 1, y: 0, x: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 10 }}
          transition={{ type: 'spring', damping: 28, stiffness: 380 }}
          className="w-full max-w-sm rounded-2xl overflow-hidden"
          style={{
            background: isCyber ? 'rgba(2,10,16,0.97)' : 'var(--spotlight-bg, #ffffff)',
            backdropFilter: 'blur(48px) saturate(200%)',
            WebkitBackdropFilter: 'blur(48px) saturate(200%)',
            border: isCyber ? '1px solid rgba(0,255,180,0.3)' : '1px solid var(--hairline, #ebebeb)',
            boxShadow: isCyber
              ? '0 0 60px rgba(0,255,180,0.08), 0 32px 80px rgba(0,0,0,0.8)'
              : 'var(--window-shadow-active, 0 1px 2px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.10))',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-5 pt-5 pb-4"
            style={{ borderBottom: isCyber ? '1px solid rgba(255,255,255,0.06)' : '1px solid var(--hairline, #ebebeb)' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: isCyber ? 'rgba(0,255,180,0.08)' : 'rgba(245,158,11,0.10)',
                border: isCyber ? '1px solid rgba(0,255,180,0.2)' : '1px solid rgba(245,158,11,0.2)',
              }}
            >
              <ShieldAlert className="w-5 h-5" style={{ color: isCyber ? 'var(--accent)' : '#f59e0b' }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: isCyber ? '#fff' : 'var(--ink, #171717)' }}>Privilege Escalation</h3>
              <p className="text-[10px] font-mono mt-0.5" style={{ color: isCyber ? 'rgba(255,255,255,0.3)' : 'var(--text-mute, #8f8f8f)' }}>
                policy: {profile.securityLevel}
              </p>
            </div>
          </div>

          <div className="px-5 py-4">
            {/* Command display */}
            <div
              className="px-3 py-2.5 rounded-lg mb-4 font-mono text-[11px] leading-relaxed"
              style={{
                background: isCyber ? 'rgba(0,0,0,0.4)' : 'var(--canvas, #fafafa)',
                border: isCyber ? '1px solid rgba(255,255,255,0.06)' : '1px solid var(--hairline, #ebebeb)',
                color: isCyber ? 'rgba(255,255,255,0.5)' : 'var(--text-body, #4d4d4d)',
              }}
            >
              {sudoPromptMessage || 'Administrative authorization required.'}
            </div>

            {/* Password input */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <KeyRound
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                  style={{ color: isCyber ? 'rgba(255,255,255,0.25)' : 'var(--text-faint, #a1a1a1)' }}
                />
                <input
                  type="password"
                  autoFocus
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter sudo password"
                  className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-sm focus:outline-none font-mono transition-all ${isCyber ? 'text-white placeholder-white/20' : 'text-geist-ink placeholder-geist-mute'}`}
                  style={{
                    background: isCyber ? 'rgba(255,255,255,0.04)' : 'var(--canvas, #fafafa)',
                    border: isCyber
                      ? `1px solid ${password ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)'}`
                      : `1px solid ${password ? 'var(--text-faint, #a1a1a1)' : 'var(--hairline, #ebebeb)'}`,
                  }}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { resolveSudoChallenge(false); setPassword(''); }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-colors ${isCyber ? 'text-white/50 hover:text-white/80' : 'text-geist-body hover:text-geist-ink'}`}
                  style={{
                    background: isCyber ? 'rgba(255,255,255,0.04)' : 'var(--canvas, #fafafa)',
                    border: isCyber ? '1px solid rgba(255,255,255,0.08)' : '1px solid var(--hairline, #ebebeb)',
                  }}
                >
                  Deny Access
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white transition-all"
                  style={{
                    background: isCyber ? 'rgba(0,255,180,0.15)' : 'rgba(245,158,11,0.2)',
                    border: isCyber ? '1px solid rgba(0,255,180,0.35)' : '1px solid rgba(245,158,11,0.35)',
                    color: isCyber ? 'var(--accent)' : '#f59e0b',
                    boxShadow: isCyber ? '0 0 16px rgba(0,255,180,0.15)' : '0 0 16px rgba(245,158,11,0.15)',
                  }}
                >
                  Authorize sudo
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
