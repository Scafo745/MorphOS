import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { useOSStore } from '../core/store';
import { ToastVariant } from '../core/types';
import { usePrefersReducedMotion } from '../core/usePrefersReducedMotion';

const VARIANT_CONFIG: Record<
  ToastVariant,
  { icon: React.ReactNode; accent: string; glow: string }
> = {
  success: {
    icon: <CheckCircle className="w-4 h-4" style={{ color: '#34d399' }} />,
    accent: 'rgba(52,211,153,0.5)',
    glow: 'rgba(52,211,153,0.25)',
  },
  warning: {
    icon: <AlertTriangle className="w-4 h-4" style={{ color: '#fbbf24' }} />,
    accent: 'rgba(251,191,36,0.5)',
    glow: 'rgba(251,191,36,0.25)',
  },
  error: {
    icon: <XCircle className="w-4 h-4" style={{ color: '#fb7185' }} />,
    accent: 'rgba(251,113,133,0.5)',
    glow: 'rgba(251,113,133,0.25)',
  },
  info: {
    icon: <Info className="w-4 h-4" style={{ color: '#38bdf8' }} />,
    accent: 'rgba(56,189,248,0.5)',
    glow: 'rgba(56,189,248,0.25)',
  },
};

export const Toasts: React.FC = () => {
  const { toasts, dismissToast } = useOSStore();
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div className="fixed bottom-24 right-4 z-[90] flex flex-col items-end gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const cfg = VARIANT_CONFIG[toast.variant];
          return (
            <motion.div
              key={toast.id}
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 24, scale: 0.96 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 24, scale: 0.96 }}
              transition={
                prefersReducedMotion
                  ? { duration: 0.12 }
                  : { type: 'spring', damping: 28, stiffness: 360 }
              }
              className="pointer-events-auto flex items-center gap-2.5 pl-3 pr-2 py-2.5 rounded-xl max-w-[340px]"
              style={{
                background: 'rgba(5,5,15,0.82)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                border: `1px solid ${cfg.accent}`,
                boxShadow: `0 12px 40px rgba(0,0,0,0.5), 0 0 18px ${cfg.glow}`,
              }}
            >
              <span className="flex-shrink-0">{cfg.icon}</span>
              <span className="text-[12px] font-medium text-white/90 leading-snug">{toast.message}</span>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="flex-shrink-0 p-1 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
