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
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center cursor-pointer overflow-hidden"
          style={{ background: 'var(--canvas, #fafafa)' }}
        >
          {/* Single subtle Vercel mesh bloom behind the logo (the one allowed flourish) */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[640px] rounded-full blur-[120px]"
              style={{
                opacity: 0.1,
                background:
                  'conic-gradient(from 180deg at 50% 50%, #00dfd8, #007cf0, #7928ca, #ff0080, #f9cb28, #00dfd8)',
              }}
            />
          </div>

          {/* Logo mark */}
          <div className="relative mb-12">
            {/* Logo mark */}
            <motion.div
              initial={{ scale: 0.75, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-24 h-24 flex items-center justify-center"
              style={{
                background: 'var(--ink, #171717)',
                borderRadius: 'var(--radius-lg, 16px)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.10)',
              }}
            >
              {/* Animated morphing shape */}
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                <motion.path
                  d="M22 4 L38 14 L38 30 L22 40 L6 30 L6 14 Z"
                  stroke="#ffffff"
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
                  fill="var(--link, #0070f3)"
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
              className="text-3xl font-bold tracking-[-0.04em] mb-1"
              style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.04em', color: 'var(--ink, #171717)' }}
            >
              Morph<span style={{ color: 'var(--link, #0070f3)' }}>OS</span>
            </h1>
            <p
              className="text-xs font-mono tracking-[0.18em] uppercase"
              style={{ color: 'var(--text-mute, #8f8f8f)' }}
            >
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
            <div
              className="h-px w-full relative overflow-hidden rounded-full"
              style={{ background: 'var(--hairline, #ebebeb)' }}
            >
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ background: 'var(--ink, #171717)' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>

            {/* Step labels row */}
            <div className="flex items-center justify-between px-0.5">
              {BOOT_STEPS.map((s, i) => (
                <motion.span
                  key={s.label}
                  animate={{ color: i === step ? '#0070f3' : i < step ? '#171717' : '#a1a1a1' }}
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
                className="text-[11px] font-mono text-center"
                style={{ color: 'var(--text-mute, #8f8f8f)' }}
              >
                {BOOT_STEPS[step].msg}
              </motion.p>
            </AnimatePresence>
          </motion.div>

          <p
            className="absolute bottom-8 text-[10px] font-mono tracking-widest uppercase"
            style={{ color: 'var(--text-faint, #a1a1a1)' }}
          >
            Click to skip
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
