import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOSStore } from '../core/store';
import { GEMINI_MODELS } from '../core/ai-chat';
import { Cloud, CheckCircle2, AlertCircle, X, ExternalLink, Zap, Shield } from 'lucide-react';

export const CloudModal: React.FC = () => {
  const { isCloudModalOpen, toggleCloudModal, cloudConfig, setCloudConfig } = useOSStore();
  const [webhookUrl, setWebhookUrl] = useState(cloudConfig.n8nWebhookUrl);
  const [geminiKey, setGeminiKey] = useState(cloudConfig.geminiApiKey);
  const [mode, setMode] = useState(cloudConfig.engineMode);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [geminiTestStatus, setGeminiTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [geminiTestMessage, setGeminiTestMessage] = useState('');

  if (!isCloudModalOpen) return null;

  const handleSave = () => {
    setCloudConfig({
      n8nWebhookUrl: webhookUrl.trim(),
      geminiApiKey: geminiKey.trim(),
      engineMode: mode,
    });
    toggleCloudModal(false);
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl.trim()) {
      setTestStatus('failed');
      setTestMessage('Please enter an n8n webhook URL first.');
      return;
    }

    setTestStatus('testing');
    try {
      const res = await fetch(webhookUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'ping test', timestamp: new Date().toISOString() }),
      });

      if (res.ok) {
        setTestStatus('success');
        setTestMessage('Webhook responded with HTTP 200 OK! Connected to n8n Cloud.');
      } else {
        setTestStatus('failed');
        setTestMessage(`Webhook returned HTTP ${res.status}. Check workflow activation in n8n.`);
      }
    } catch (err: any) {
      setTestStatus('failed');
      setTestMessage(err.message || 'Network error connecting to webhook URL.');
    }
  };

  const handleTestGemini = async () => {
    const key = geminiKey.trim();
    if (!key) {
      setGeminiTestStatus('failed');
      setGeminiTestMessage('Please enter a Gemini API key first.');
      return;
    }

    const model = GEMINI_MODELS[0];
    setGeminiTestStatus('testing');
    setGeminiTestMessage('');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: 'ping' }] }] }),
          signal: controller.signal,
        }
      );

      if (res.ok) {
        setGeminiTestStatus('success');
        setGeminiTestMessage(`Gemini API key is valid. Connected to ${model}.`);
        return;
      }

      let message: string;
      switch (res.status) {
        case 400:
          message =
            'HTTP 400: the API key looks invalid or malformed. Generate a fresh key in Google AI Studio.';
          break;
        case 403:
          message =
            'HTTP 403: this key is not authorized for the Generative Language API. Enable it in Google AI Studio / Google Cloud.';
          break;
        case 429:
          message = 'HTTP 429: rate limited or quota exceeded. Wait a moment and try again.';
          break;
        case 404:
          message =
            'HTTP 404: model not available for this key. The app will try other models automatically.';
          break;
        default:
          message = `HTTP ${res.status}: Gemini request failed.`;
      }

      const body = await res.json().catch(() => null);
      const apiMessage = body?.error?.message;
      if (typeof apiMessage === 'string' && apiMessage.trim()) {
        message = `${message} ${apiMessage.trim()}`;
      }

      setGeminiTestStatus('failed');
      setGeminiTestMessage(message);
    } catch {
      setGeminiTestStatus('failed');
      setGeminiTestMessage('Network error or timeout reaching the Gemini API. Check your connection.');
    } finally {
      clearTimeout(timeout);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-lg rounded-2xl p-6 text-xs font-sans"
          style={{
            background: 'var(--spotlight-bg, #ffffff)',
            border: '1px solid var(--hairline, #ebebeb)',
            boxShadow: 'var(--window-shadow-active, 0 1px 2px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.10))',
            color: 'var(--text-body, #4d4d4d)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--hairline, #ebebeb)' }}>
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-geist-link/10 border border-geist-link/20 text-geist-link">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-geist-ink">Cloud Gateway & n8n Integration</h3>
                <p className="text-[11px] text-geist-mute">Configure cloud orchestration and AI inference pipelines</p>
              </div>
            </div>
            <button
              onClick={() => toggleCloudModal(false)}
              className="p-1 rounded-lg hover:bg-geist-hairlineSoft text-geist-mute hover:text-geist-ink transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-4 space-y-4">
            {/* n8n Webhook input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-geist-ink flex items-center space-x-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>n8n Cloud Webhook URL</span>
                </label>
                <span className="text-[10px] text-emerald-500 font-mono">1-MONTH PRO CREDIT</span>
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://your-instance.app.n8n.cloud/webhook/morph-prompt"
                  className="flex-1 px-3 py-2 rounded-lg bg-geist-canvas border border-geist-hairline text-geist-ink placeholder-geist-faint focus:border-geist-link focus:outline-none font-mono text-xs"
                />
                <button
                  onClick={handleTestWebhook}
                  disabled={testStatus === 'testing'}
                  className="px-3 py-2 rounded-lg bg-geist-canvas hover:bg-geist-hairlineSoft border border-geist-hairline text-geist-ink font-medium text-xs transition-colors whitespace-nowrap"
                >
                  {testStatus === 'testing' ? 'Testing...' : 'Test'}
                </button>
              </div>
              <p className="text-[10px] text-geist-mute mt-1">
                Triggered automatically when a user prompts MorphOS to synthesize or recompile runtime parameters.
              </p>

              {testStatus !== 'idle' && (
                <div
                  className={`mt-2 p-2.5 rounded-lg flex items-start space-x-2 border text-[11px] ${
                    testStatus === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : testStatus === 'testing'
                      ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {testStatus === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  )}
                  <span>{testMessage}</span>
                </div>
              )}
            </div>

            {/* Gemini API Key input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-geist-ink flex items-center space-x-1.5">
                  <Shield className="w-3.5 h-3.5 text-geist-link" />
                  <span>Google AI Studio / Gemini API Key (Optional)</span>
                </label>
                <span className="text-[10px] text-geist-mute font-mono">FREE TIER</span>
              </div>
              <div className="flex space-x-2">
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="flex-1 px-3 py-2 rounded-lg bg-geist-canvas border border-geist-hairline text-geist-ink placeholder-geist-faint focus:border-geist-link focus:outline-none font-mono text-xs"
                />
                <button
                  onClick={handleTestGemini}
                  disabled={geminiTestStatus === 'testing'}
                  className="px-3 py-2 rounded-lg bg-geist-canvas hover:bg-geist-hairlineSoft border border-geist-hairline text-geist-ink font-medium text-xs transition-colors whitespace-nowrap"
                >
                  {geminiTestStatus === 'testing' ? 'Testing...' : 'Test'}
                </button>
              </div>
              <p className="text-[10px] text-geist-mute mt-1">
                Needed for AI answers in Copilot, Spotlight, and the Browser.
              </p>

              {geminiTestStatus !== 'idle' && (
                <div
                  className={`mt-2 p-2.5 rounded-lg flex items-start space-x-2 border text-[11px] ${
                    geminiTestStatus === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : geminiTestStatus === 'testing'
                      ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {geminiTestStatus === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  )}
                  <span>{geminiTestMessage}</span>
                </div>
              )}
            </div>

            {/* Engine Mode */}
            <div>
              <label className="text-xs font-semibold text-geist-ink block mb-1.5">
                Compiler Execution Engine
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'auto', title: 'Auto (n8n → Gemini → Local)', desc: 'Best hackathon resilience' },
                  { id: 'n8n', title: 'n8n Cloud Webhook Only', desc: 'Direct workflow pipeline' },
                  { id: 'gemini', title: 'Gemini API Only', desc: 'Google AI Studio direct' },
                  { id: 'local', title: 'Local Heuristic (Offline)', desc: 'Zero latency instant demo' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setMode(opt.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition-colors ${
                      mode === opt.id
                        ? 'bg-geist-link/10 border-geist-link text-geist-ink shadow-sm'
                        : 'bg-geist-canvas hover:bg-geist-hairlineSoft border-geist-hairline text-geist-body'
                    }`}
                  >
                    <div className="font-semibold text-xs">{opt.title}</div>
                    <div className="text-[10px] text-geist-mute">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--hairline, #ebebeb)' }}>
            <span className="text-[11px] text-geist-mute flex items-center space-x-1">
              <span>Settings stored in local browser state</span>
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => toggleCloudModal(false)}
                className="px-3.5 py-1.5 rounded-lg bg-geist-canvas hover:bg-geist-hairlineSoft border border-geist-hairline text-geist-body font-medium text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-1.5 rounded-pill bg-geist-ink hover:opacity-90 text-white font-semibold text-xs shadow-geist transition-opacity"
              >
                Save & Apply
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

