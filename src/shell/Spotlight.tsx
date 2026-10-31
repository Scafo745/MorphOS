import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOSStore } from '../core/store';
import { compilePromptAsync } from '../core/prompt-compiler';
import { isOsSynthesisIntent, answerQuestionAsync } from '../core/ai-chat';
import { OS_PRESETS } from '../core/presets';
import { ArrowRight, ShieldCheck, LayoutGrid, Terminal, Wand2, Mic, MicOff, Cloud, Sparkles } from 'lucide-react';

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
  const [answer, setAnswer] = useState<{ text: string; source: 'gemini' | 'local' } | null>(null);
  const [answering, setAnswering] = useState(false);
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
    if (isSpotlightOpen) {
      setTimeout(() => inputRef.current?.focus(), 60);
    } else {
      // Clear any inline answer so it does not linger on reopen.
      setAnswer(null);
      setAnswering(false);
    }
  }, [isSpotlightOpen]);

  const synthesize = async (text?: string) => {
    const q = (text ?? prompt).trim();
    if (!q) return;

    // General question: do not recompile the theme. Answer it inline, right
    // here in the Spotlight panel where the user typed, keeping Spotlight open.
    if (!isOsSynthesisIntent(q)) {
      setAnswer(null);
      setAnswering(true);
      setBusy(true);
      try {
        const { answer: text, source } = await answerQuestionAsync(q, cloudConfig);
        setAnswer({ text, source });
        addToast(
          source === 'gemini' ? 'Answered via Gemini' : 'Answered offline (local assistant)',
          source === 'gemini' ? 'success' : 'info'
        );
      } catch {
        addToast('Could not answer right now, please try again', 'error');
      } finally {
        setBusy(false);
        setAnswering(false);
      }
      return;
    }

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
        addToast('Synthesized via Gemini', 'success');
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
            style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(6px)' }}
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
              className="rounded-md overflow-hidden"
              style={{
                background: 'var(--spotlight-bg, #ffffff)',
                backdropFilter: 'blur(56px) saturate(200%)',
                WebkitBackdropFilter: 'blur(56px) saturate(200%)',
                border: '1px solid var(--spotlight-border, var(--hairline, #ebebeb))',
                boxShadow: 'var(--window-shadow-active, 0 1px 2px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.10))',
              }}
            >
              {/* ── Input row ── */}
              <div className="flex items-center gap-2.5 px-4 py-3.5 border-b" style={{ borderColor: 'var(--hairline, #ebebeb)' }}>
                <motion.div
                  animate={{ rotate: busy ? 360 : 0 }}
                  transition={{ duration: 0.8, ease: 'linear', repeat: busy ? Infinity : 0 }}
                >
                  <Wand2 className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                </motion.div>

                <input
                  ref={inputRef}
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    if (answer) setAnswer(null);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && synthesize()}
                  aria-label="Describe your operating system"
                  className="flex-1 bg-transparent text-[15px] text-geist-ink placeholder-geist-mute rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-0"
                  placeholder={isListening ? 'Listening to your voice...' : PLACEHOLDERS[phIdx]}
                  disabled={busy}
                />

                {/* Voice Recognition Button */}
                <button
                  type="button"
                  onClick={startVoice}
                  title="Voice Prompt (Web Speech API)"
                  aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                  className={`p-1.5 rounded-[6px] border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-0 ${
                    isListening
                      ? 'bg-rose-500/20 border-rose-500 text-rose-500 animate-pulse'
                      : 'bg-geist-canvasElevated hover:bg-geist-hairlineSoft border-geist-hairline text-geist-mute hover:text-geist-ink'
                  }`}
                >
                  {isListening ? <MicOff className="w-4 h-4 text-rose-500" /> : <Mic className="w-4 h-4" />}
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
                  className="p-1.5 rounded-[6px] bg-geist-canvasElevated hover:bg-geist-hairlineSoft border border-geist-hairline text-geist-mute hover:text-geist-link transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-0"
                >
                  <Cloud className="w-4 h-4" />
                </button>

                <motion.button
                  onClick={() => synthesize()}
                  disabled={busy || !prompt.trim()}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Synthesize operating system from prompt"
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-pill text-xs font-semibold text-white disabled:opacity-30 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-0"
                  style={{ background: 'var(--accent, #171717)', boxShadow: '0 0 20px var(--accent-glow)' }}
                >
                  <span>{busy ? 'Compiling...' : 'Synthesize'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </motion.button>
              </div>

              {/* ── Inline answer (general questions) ── */}
              {(answering || answer) && (
                <div className="p-3 border-b" style={{ borderColor: 'var(--hairline, #ebebeb)' }}>
                  {answering ? (
                    <div className="flex items-center gap-2 px-1 py-2 text-[13px]" style={{ color: 'var(--text-body, #454545)' }}>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, ease: 'linear', repeat: Infinity }}
                      >
                        <Wand2 className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                      </motion.div>
                      <span>Thinking...</span>
                    </div>
                  ) : answer ? (
                    <div
                      className="rounded-md"
                      style={{
                        background: 'var(--canvas-elevated, #ffffff)',
                        border: '1px solid var(--hairline, #ebebeb)',
                      }}
                    >
                      <div
                        className="flex items-center gap-1.5 px-3 py-2 border-b"
                        style={{ borderColor: 'var(--hairline, #ebebeb)' }}
                      >
                        <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                        <span className="text-[10px] font-semibold tracking-[0.14em] uppercase text-geist-mute">
                          {answer.source === 'gemini'
                            ? 'Answered via Gemini'
                            : 'Answered offline (local assistant)'}
                        </span>
                      </div>
                      <div
                        className="px-3 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap overflow-y-auto max-h-[240px]"
                        style={{ color: 'var(--text-body, #454545)' }}
                      >
                        {answer.text}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* ── Preset grid ── */}
              {!(answering || answer) && (
              <div className="p-3">
                <div className="flex items-center justify-between px-1 mb-2">
                  <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-geist-mute">
                    Instant Architectures
                  </p>
                  <span className="text-[10px] text-geist-link font-mono">
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
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-start gap-3 p-3 rounded-md text-left transition-colors hover:bg-geist-hairlineSoft"
                        style={{ background: 'var(--canvas-elevated, #ffffff)', border: '1px solid var(--hairline, #ebebeb)' }}
                      >
                        <div
                          className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 text-base"
                          style={{ background: 'var(--canvas, #fafafa)', border: '1px solid var(--hairline, #ebebeb)' }}
                        >
                          {p.emoji ? (
                            <span>{p.emoji}</span>
                          ) : Icon ? (
                            <Icon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[13px] font-semibold text-geist-ink truncate">{p.name}</div>
                          <div className="text-[11px] text-geist-mute truncate mt-0.5">{p.sub}</div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
              )}

              {/* ── Footer ── */}
              <div
                className="flex items-center justify-between px-4 py-2 text-[10px] font-mono border-t"
                style={{ borderColor: 'var(--hairline, #ebebeb)', color: 'var(--text-faint, #a1a1a1)' }}
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
