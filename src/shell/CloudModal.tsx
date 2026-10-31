import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOSStore } from '../core/store';
import { Cloud, CheckCircle2, AlertCircle, X, ExternalLink, Zap, Shield } from 'lucide-react';

export const CloudModal: React.FC = () => {
  const { isCloudModalOpen, toggleCloudModal, cloudConfig, setCloudConfig } = useOSStore();
  const [webhookUrl, setWebhookUrl] = useState(cloudConfig.n8nWebhookUrl);
  const [geminiKey, setGeminiKey] = useState(cloudConfig.geminiApiKey);
  const [mode, setMode] = useState(cloudConfig.engineMode);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testMessage, setTestMessage] = useState('');

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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-lg rounded-2xl bg-slate-900 border border-white/15 p-6 shadow-2xl backdrop-blur-2xl text-slate-200 text-xs font-sans"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Cloud Gateway & n8n Integration</h3>
                <p className="text-[11px] text-slate-400">Configure cloud orchestration and AI inference pipelines</p>
              </div>
            </div>
            <button
              onClick={() => toggleCloudModal(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-4 space-y-4">
            {/* n8n Webhook input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-white flex items-center space-x-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>n8n Cloud Webhook URL</span>
                </label>
                <span className="text-[10px] text-emerald-400 font-mono">1-MONTH PRO CREDIT</span>
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://your-instance.app.n8n.cloud/webhook/morph-prompt"
                  className="flex-1 px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-mono text-xs"
                />
                <button
                  onClick={handleTestWebhook}
                  disabled={testStatus === 'testing'}
                  className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition-colors whitespace-nowrap"
                >
                  {testStatus === 'testing' ? 'Testing...' : 'Test'}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
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
                <label className="text-xs font-semibold text-white flex items-center space-x-1.5">
                  <Shield className="w-3.5 h-3.5 text-sky-400" />
                  <span>Google AI Studio / Gemini API Key (Optional)</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">FREE TIER</span>
              </div>
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-mono text-xs"
              />
            </div>

            {/* Engine Mode */}
            <div>
              <label className="text-xs font-semibold text-white block mb-1.5">
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
                        ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-xs">{opt.title}</div>
                    <div className="text-[10px] text-slate-400">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <span className="text-[11px] text-slate-400 flex items-center space-x-1">
              <span>Settings stored in local browser state</span>
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => toggleCloudModal(false)}
                className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 font-medium text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-colors"
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

