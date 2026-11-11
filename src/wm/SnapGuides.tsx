import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SnapZone } from '../core/types';

interface SnapGuidesProps {
  activeZone: SnapZone['type'];
}

const ZONE_CLASS: Record<string, string> = {
  'left-half': 'w-1/2 h-full',
  'right-half': 'w-1/2 h-full ml-auto',
  maximize: 'w-full h-full',
};

export const SnapGuides: React.FC<SnapGuidesProps> = ({ activeZone }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-30 pt-8 pb-16 px-2">
      <AnimatePresence>
        {activeZone && (
          <motion.div
            key={activeZone}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className={`${ZONE_CLASS[activeZone]} rounded-2xl backdrop-blur-xs`}
            style={{ background: 'var(--accent-dim)', border: '2px solid var(--accent)', boxShadow: '0 0 24px var(--accent-glow)' }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
