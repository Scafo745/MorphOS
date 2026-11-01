import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useOSStore } from '../core/store';
import { AppId } from '../core/types';
import { Terminal, Folder, Settings, ShieldAlert, FileText, Sparkles, Bot, Zap, Globe } from 'lucide-react';
import { getIconTheme } from '../core/icon-theme';
import { usePrefersReducedMotion } from '../core/usePrefersReducedMotion';

interface DockItemDef {
  id: AppId | 'spotlight';
  label: string;
  icon: (color?: string) => React.ReactNode;
}

const ITEMS: DockItemDef[] = [
  {
    id: 'hyperswitch',
    label: 'Juspay Hyperswitch',
    icon: (c) => <Zap className="w-6 h-6" style={{ color: c }} />,
  },
  {
    id: 'copilot',
    label: 'Morph Copilot',
    icon: (c) => <Bot className="w-6 h-6" style={{ color: c }} />,
  },
  {
    id: 'terminal',
    label: 'Terminal',
    icon: (c) => <Terminal className="w-6 h-6" style={{ color: c }} />,
  },
  {
    id: 'filemanager',
    label: 'Files',
    icon: (c) => <Folder className="w-6 h-6" style={{ color: c }} />,
  },
  {
    id: 'settings',
    label: 'Synthesizer',
    icon: (c) => <Settings className="w-6 h-6" style={{ color: c }} />,
  },
  {
    id: 'security',
    label: 'Audit Guard',
    icon: (c) => <ShieldAlert className="w-6 h-6" style={{ color: c }} />,
  },
  {
    id: 'browser',
    label: 'Browser',
    icon: (c) => <Globe className="w-6 h-6" style={{ color: c }} />,
  },
  {
    id: 'notes',
    label: 'Notes',
    icon: (c) => <FileText className="w-6 h-6" style={{ color: c }} />,
  },
];

const SPOTLIGHT_ITEM: DockItemDef = {
  id: 'spotlight',
  label: 'Synthesize',
  icon: (c) => <Sparkles className="w-6 h-6" style={{ color: c }} />,
};

/* ── Individual dock icon with spring magnification ── */
const DockIcon: React.FC<{
  item: DockItemDef;
  mouseX: ReturnType<typeof useMotionValue<number>>;
  onClick: () => void;
  isRunning: boolean;
  isMagnify: boolean;
}> = ({ item, mouseX, onClick, isRunning, isMagnify }) => {
  const { profile } = useOSStore();
  const ref = useRef<HTMLButtonElement>(null);

  const iconTheme = getIconTheme(item.id, profile.customTokens?.iconStyle, profile.customTokens?.iconShape);

  // Distance from mouse to icon center
  const distance = useTransform(mouseX, val => {
    if (!ref.current || !isMagnify) return 999;
    const { left, width } = ref.current.getBoundingClientRect();
    return Math.abs(val - (left + width / 2));
  });

  // Animate a GPU-composited `scale` transform instead of width/height so no
  // browser layout runs per pointer move (the magnify stays smooth). 1.5 * 44
  // ≈ 66, close to the previous 68px max.
  const scaleRaw = useTransform(distance, [0, 80, 150], [1.5, 1.28, 1]);
  const scale = useSpring(scaleRaw, { stiffness: 700, damping: 40, mass: 0.1 });
  const yRaw = useTransform(distance, [0, 80, 150], [-14, -6, 0]);
  const y = useSpring(yRaw, { stiffness: 700, damping: 40, mass: 0.1 });

  return (
    <div className="relative flex flex-col items-center group">
      {/* Tooltip */}
      <motion.div
        initial={false}
        className="absolute -top-9 px-2.5 py-1 rounded-lg text-[11px] font-medium pointer-events-none
                   opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-10"
        style={{
          background: 'var(--spotlight-bg, #ffffff)',
          color: 'var(--ink, #171717)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--hairline, #ebebeb)',
          boxShadow: 'var(--window-shadow, 0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.08))',
        }}
      >
        {item.label}
      </motion.div>

      {/* Icon button */}
      <motion.button
        ref={ref}
        onClick={onClick}
        style={{
          width: 44,
          height: 44,
          scale: isMagnify ? scale : 1,
          y: isMagnify ? y : 0,
          transformOrigin: 'bottom center',
          borderRadius: iconTheme.borderRadius,
        }}
        whileTap={{ scale: 0.88 }}
        className="relative flex items-center justify-center overflow-hidden transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-0"
        title={item.label}
        aria-label={item.label}
      >
        {/* App icon background */}
        <div
          className="absolute inset-0 transition-colors duration-300"
          style={{
            background: iconTheme.bg,
            border: iconTheme.border,
            borderRadius: iconTheme.borderRadius,
            boxShadow: `${iconTheme.boxShadow}, 0 0 12px ${iconTheme.glow}`,
          }}
        />
        {/* Glow on hover */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{
            borderRadius: iconTheme.borderRadius,
            boxShadow: `0 0 28px ${iconTheme.glow}`,
            background: `radial-gradient(circle at 50% 50%, ${iconTheme.glow}, transparent 70%)`,
          }}
        />

        {/* Icon */}
        <div className="relative z-10">
          {item.icon(iconTheme.iconColor)}
        </div>

        {/* Top-edge sheen */}
        <div
          className="absolute top-0 left-0 right-0 h-1/3"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.18), transparent)',
            borderRadius: iconTheme.borderRadius,
            opacity: iconTheme.sheenOpacity,
          }}
        />
      </motion.button>

      {/* Running dot */}
      {isRunning && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -bottom-1.5 w-1 h-1 rounded-full shadow-[0_0_8px_currentColor]"
          style={{
            background: profile.customTokens?.accentColor || 'var(--accent)',
            color: profile.customTokens?.accentColor || 'var(--accent)',
          }}
        />
      )}
    </div>
  );
};

export const Dock: React.FC = () => {
  const { profile, windows, openApp, toggleSpotlight } = useOSStore();
  const prefersReducedMotion = usePrefersReducedMotion();
  const mouseX = useMotionValue(-999);

  const isMagnify = profile.dockStyle === 'macos-magnify' && !prefersReducedMotion;
  const isWindowsStyle = profile.dockStyle === 'windows-center';

  const handleClick = (id: DockItemDef['id']) => {
    if (id === 'spotlight') toggleSpotlight(true);
    else openApp(id as AppId);
  };

  const allItems = [...ITEMS, SPOTLIGHT_ITEM];

  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-center items-end pb-2.5 z-40 pointer-events-none px-2">
      <motion.nav
        onMouseMove={e => mouseX.set(e.clientX)}
        onMouseLeave={() => mouseX.set(-999)}
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 24, stiffness: 220, delay: 0.1 }}
        className="pointer-events-auto flex items-end gap-1 sm:gap-2 px-2 sm:px-3 py-2.5 max-w-full transition-colors duration-300"
        style={{
          background: profile.customTokens?.dockBg || 'var(--dock-bg)',
          backdropFilter: `blur(${profile.customTokens?.windowBlur || 'var(--dock-blur)'}) saturate(180%)`,
          WebkitBackdropFilter: `blur(${profile.customTokens?.windowBlur || 'var(--dock-blur)'}) saturate(180%)`,
          border: `1px solid ${profile.customTokens?.dockBorder || 'var(--dock-border)'}`,
          borderRadius: profile.customTokens?.dockRadius || (isWindowsStyle ? '8px' : '22px'),
          boxShadow: `var(--dock-shadow, 0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.08)), 0 0 25px ${profile.customTokens?.accentGlow || 'transparent'}`,
        }}
      >
        {/* Separator before spotlight */}
        {allItems.map((item, i) => (
          <React.Fragment key={item.id}>
            {i === allItems.length - 1 && (
              <div className="self-stretch w-px my-1.5 mx-0.5" style={{ background: 'var(--hairline, #ebebeb)' }} />
            )}
            <DockIcon
              item={item}
              mouseX={mouseX}
              onClick={() => handleClick(item.id)}
              isRunning={windows.some(w => w.appId === item.id)}
              isMagnify={isMagnify}
            />
          </React.Fragment>
        ))}
      </motion.nav>
    </div>
  );
};
