import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SnapZone } from '../core/types';

interface SnapGuidesProps {
  activeZone: SnapZone['type'];
}

export const SnapGuides: React.FC<SnapGuidesProps> = ({ activeZone }) => {
  if (!activeZone) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 pointer-events-none z-30 pt-8 pb-16 px-2">
        {activeZone === 'left-half' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-1/2 h-full rounded-2xl backdrop-blur-xs"
            style={{ background: 'var(--accent-dim)', border: '2px solid var(--accent)', boxShadow: '0 0 24px var(--accent-glow)' }}
          />
        )}

        {activeZone === 'right-half' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-1/2 h-full ml-auto rounded-2xl backdrop-blur-xs"
            style={{ background: 'var(--accent-dim)', border: '2px solid var(--accent)', boxShadow: '0 0 24px var(--accent-glow)' }}
          />
        )}

        {activeZone === 'maximize' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full rounded-2xl backdrop-blur-xs"
            style={{ background: 'var(--accent-dim)', border: '2px solid var(--accent)', boxShadow: '0 0 24px var(--accent-glow)' }}
          />
        )}
      </div>
    </AnimatePresence>
  );
};

