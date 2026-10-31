import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOSStore } from '../core/store';
import { compilePromptAsync } from '../core/prompt-compiler';
import { OS_PRESETS } from '../core/presets';
import { ArrowRight, ShieldCheck, LayoutGrid, Terminal, Wand2, Mic, MicOff, Cloud } from 'lucide-react';

const PRESETS = [
  { key: 'cupertino-dev',      emoji: '🍎', name: 'Cupertino Pro',            sub: 'macOS glass · fluid dock · standard ACL' },
  { key: 'gothic-obsidian',    emoji: '🦇', name: 'Gothic Obsidian OS',      sub: 'Pitch-black glass · crimson icons · zero-trust' },
  { key: 'cyber-hacker',       icon: Terminal,    name: 'Arch Hyprland Cyber',   sub: 'Matrix neon · auto-tiling · root shell' },
  { key: 'enterprise-fintech', icon: ShieldCheck, name: 'Juspay FinTech Shield', sub: 'Win11 snap · PCI-DSS · zero-trust audit' },
  { key: 'golden-luxury',      emoji: '👑', name: 'Royal Sovereign OS',       sub: '24K gold borders · midnight amber glow' },
  { key: 'synthwave-retro',    emoji: '🌇', name: 'Synthwave 1984 OS',        sub: 'Neon magenta · electric purple outrun' },
];

const PLACEHOLDERS = [
  'make the colors dark, like gothic theme with crimson red icons...',
  'royal gold luxury theme with 24k gold icons on midnight black...',
  'arch linux hyprland matrix green neon cyber tiling...',
  'macOS glass design with Windows snap tiling and strict Linux security...',
  'fintech workstation for Juspay — compliance mode, PCI-DSS enforced...',
  'kawaii sakura pastel pink anime theme with rounded bubbly icons...',
];

export const Spotlight: React.FC = () => {
  const { isSpotlightOpen, toggleSpotlight, setProfile, cloudConfig, toggleCloudModal, addToast } = useOSStore();
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [phIdx, setPhIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cycle placeholders
  useEffect(() => {
    const id = setInterval(() => setPhIdx((i) => (i + 1) % PLACEHOLDERS.length), 3500);
    return () => clearInterval(id);
  }, []);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggleSpotlight();
      }
      if (e.key === 'Escape') toggleSpotlight(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleSpotlight]);

  useEffect(() => {
    if (isSpotlightOpen) setTimeout(() => inputRef.current?.focus(), 60);
  }, [isSpotlightOpen]);

  const synthesize = async (text?: string) => {
    const q = (text ?? prompt).trim();
    if (!q) return;
    setBusy(true);

    try {
      const { profile: resProfile, source } = await compilePromptAsync(q, cloudConfig);
      setProfile(resProfile);

      const expectedCloud =
        cloudConfig.engineMode !== 'local' &&
        Boolean(cloudConfig.n8nWebhookUrl || cloudConfig.geminiApiKey);

      if (source === 'n8n') {
        addToast('Synthesized via n8n Cloud Webhook', 'success');
      } else if (source === 'gemini') {
        addToast('Synthesized via Gemini 1.5 Flash', 'success');
      } else if (source === 'local' && expectedCloud) {
        addToast('Cloud engine unreachable — fell back to local 0ms compiler', 'warning');
      } else {
        addToast('Synthesized via 0ms local engine', 'info');
      }
    } catch {
      addToast('Synthesis failed — please try again', 'error');
    } finally {
      setBusy(false);
      toggleSpotlight(false);
      setPrompt('');
    }
  };

  const applyPreset = (key: string) => {
    setBusy(true);
    setTimeout(() => {
      setProfile(OS_PRESETS[key]);
      setBusy(false);
      toggleSpotlight(false);
    }, 250);
  };

  const startVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addToast('Speech recognition is not supported in this browser. Please use Chrome or Edge.', 'warning');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setPrompt(transcript);
          setTimeout(() => synthesize(transcript), 300);
        }
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  return (
    <AnimatePresence>
      {isSpotlightOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => toggleSpotlight(false)}
            className="fixed inset-0 z-[60]"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.97, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -12 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 z-[70] w-full max-w-[640px] px-4"
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(6,6,18,0.92)',
                backdropFilter: 'blur(56px) saturate(200%)',
                WebkitBackdropFilter: 'blur(56px) saturate(200%)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 40px 100px rgba(0,0,0,0.85), 0 0 0 0.5px rgba(255,255,255,0.06)',
              }}
            >
              {/* ── Input row ── */}
              <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-white/8">
                <motion.div
                  animate={{ rotate: busy ? 360 : 0 }}
                  transition={{ duration: 0.8, ease: 'linear', repeat: busy ? Infinity : 0 }}
                >
                  <Wand2 className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                </motion.div>

                <input
                  ref={inputRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && synthesize()}
                  aria-label="Describe your operating system"
                  className="flex-1 bg-transparent text-[15px] text-white placeholder-white/20 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-0"
                  placeholder={isListening ? 'Listening to your voice...' : PLACEHOLDERS[phIdx]}
                  disabled={busy}
                />

                {/* Voice Recognition Button */}
                <button
                  type="button"
                  onClick={startVoice}
                  title="Voice Prompt (Web Speech API)"
                  aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                  className={`p-1.5 rounded-lg border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-0 ${
                    isListening
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {isListening ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Cloud Config Shortcut */}
                <button
                  type="button"
                  onClick={() => {
                    toggleSpotlight(false);
                    toggleCloudModal(true);
                  }}
                  title="Cloud & n8n Gateway Settings"
                  aria-label="Open cloud and n8n gateway settings"
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-sky-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-0"
                >
                  <Cloud className="w-4 h-4" />
                </button>

                <motion.button
                  onClick={() => synthesize()}
                  disabled={busy || !prompt.trim()}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Synthesize operating system from prompt"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-30 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-0"
                  style={{ background: 'var(--accent)', boxShadow: `0 0 20px var(--accent-glow)` }}
                >
                  <span>{busy ? 'Compiling...' : 'Synthesize'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </motion.button>
              </div>

              {/* ── Preset grid ── */}
              <div className="p-3">
                <div className="flex items-center justify-between px-1 mb-2">
                  <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-white/25">
                    Instant Architectures
                  </p>
                  <span className="text-[10px] text-indigo-400 font-mono">
                    {cloudConfig.n8nWebhookUrl ? 'n8n Cloud Webhook Linked' : 'Dual-Engine Local/Cloud'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {PRESETS.map((p) => {
                    const Icon = p.icon;
                    return (
                      <motion.button
                        key={p.key}
                        onClick={() => applyPreset(p.key)}
                        whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.06)' }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-start gap-3 p-3 rounded-xl text-left transition-colors"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base"
                          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                          {p.emoji ? (
                            <span>{p.emoji}</span>
                          ) : Icon ? (
                            <Icon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[13px] font-semibold text-white/90 truncate">{p.name}</div>
                          <div className="text-[11px] text-white/30 truncate mt-0.5">{p.sub}</div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* ── Footer ── */}
              <div
                className="flex items-center justify-between px-4 py-2 text-[10px] font-mono border-t"
                style={{ borderColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.22)' }}
              >
                <span>↵ synthesize · 🎙️ voice enabled</span>
                <span>ESC to close</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
