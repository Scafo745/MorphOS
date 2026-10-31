import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOSStore } from '../core/store';

const BOOT_STEPS = [
  { label: 'KERNEL', msg: 'Initializing dynamic microkernel modules...' },
  { label: 'VFS',    msg: 'Mounting POSIX virtual filesystem with ACLs...' },
  { label: 'WM',     msg: 'Binding adaptive window management layer...' },
  { label: 'SEC',    msg: 'Compiling zero-trust policy enforcement engine...' },
  { label: 'SYNTH',  msg: 'Prompt-synthesis runtime online. System ready.' },
];

export const BootScreen: React.FC = () => {
  const { isBooting, setBooting } = useOSStore();
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!isBooting) return;
    const interval = setInterval(() => {
      setStep(prev => {
        if (prev < BOOT_STEPS.length - 1) return prev + 1;
        clearInterval(interval);
        setTimeout(() => { setExiting(true); setTimeout(() => setBooting(false), 700); }, 600);
        return prev;
      });
    }, 380);
    return () => clearInterval(interval);
  }, [isBooting, setBooting]);

  if (!isBooting) return null;

  const progress = ((step + 1) / BOOT_STEPS.length) * 100;

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          key="boot"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(8px)', scale: 1.02 }}
          transition={{ duration: 0.7, ease: [0.32, 0, 0.67, 0] }}
          onClick={() => { setExiting(true); setTimeout(() => setBooting(false), 300); }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#020208] cursor-pointer overflow-hidden"
        >
          {/* Background ambient glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-600/8 blur-[120px]" />
            <div className="absolute top-2/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-sky-500/6 blur-[100px]" />
          </div>

          {/* Orb logo */}
          <div className="relative mb-12">
            {/* Outer glow ring */}
            <motion.div
              animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.55, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full bg-indigo-500/20 blur-2xl scale-150"
            />
            {/* Logo mark */}
            <motion.div
              initial={{ scale: 0.75, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-24 h-24 rounded-[28px] flex items-center justify-center"
              style={{
                background: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 50%, #1e3a5f 100%)',
                boxShadow: '0 0 0 1px rgba(129,140,248,0.25), 0 32px 64px rgba(99,102,241,0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
            >
              {/* Animated morphing shape */}
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                <motion.path
                  d="M22 4 L38 14 L38 30 L22 40 L6 30 L6 14 Z"
                  stroke="rgba(165,180,252,0.9)"
                  strokeWidth="1.5"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                />
                <motion.circle
                  cx="22"
                  cy="22"
                  r="6"
                  fill="rgba(129,140,248,0.9)"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
                />
              </svg>
            </motion.div>
          </div>

          {/* Wordmark */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-10"
          >
            <h1
              className="text-3xl font-bold tracking-[-0.04em] text-white mb-1"
              style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.04em' }}
            >
              Morph<span style={{ color: 'rgba(165,180,252,0.9)' }}>OS</span>
            </h1>
            <p className="text-xs font-mono text-white/25 tracking-[0.18em] uppercase">
              Prompt-Synthesized OS
            </p>
          </motion.div>

          {/* Progress section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="w-64 space-y-3"
          >
            {/* Thin progress bar */}
            <div className="h-px w-full bg-white/8 relative overflow-hidden rounded-full">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ background: 'linear-gradient(90deg, rgba(129,140,248,0.6), rgba(56,189,248,0.8))' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>

            {/* Step labels row */}
            <div className="flex items-center justify-between px-0.5">
              {BOOT_STEPS.map((s, i) => (
                <motion.span
                  key={s.label}
                  animate={{ opacity: i <= step ? 1 : 0.2, color: i === step ? '#a5b4fc' : '#ffffff40' }}
                  className="text-[9px] font-mono font-semibold tracking-widest"
                >
                  {s.label}
                </motion.span>
              ))}
            </div>

            {/* Current message */}
            <AnimatePresence mode="wait">
              <motion.p
                key={step}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="text-[11px] font-mono text-white/30 text-center"
              >
                {BOOT_STEPS[step].msg}
              </motion.p>
            </AnimatePresence>
          </motion.div>

          <p className="absolute bottom-8 text-[10px] text-white/15 font-mono tracking-widest uppercase">
            Click to skip
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
