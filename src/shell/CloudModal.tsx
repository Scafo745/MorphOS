import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOSStore } from '../core/store';
import { GEMINI_MODELS, OPENAI_COMPATIBLE_PRESETS, defaultModelForBaseUrl } from '../core/ai-chat';
import type { AiProvider } from '../core/types';
import { Cloud, CheckCircle2, AlertCircle, X, Zap, Shield, Plus, Trash2, Loader2 } from 'lucide-react';

type ProviderTestStatus = 'idle' | 'testing' | 'valid' | 'invalid' | 'rate-limited' | 'network';

interface ProviderTestState {
  status: ProviderTestStatus;
  message: string;
}

const newProviderId = (): string => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // fall through to the fallback below
  }
  return `provider-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const makeProvider = (): AiProvider => ({
  id: newProviderId(),
  vendor: 'gemini',
  label: '',
  apiKey: '',
  baseUrl: '',
  model: '',
  enabled: true,
});

export const CloudModal: React.FC = () => {
  const { isCloudModalOpen, toggleCloudModal, cloudConfig, setCloudConfig } = useOSStore();
  const [webhookUrl, setWebhookUrl] = useState(cloudConfig.n8nWebhookUrl);
  const [mode, setMode] = useState(cloudConfig.engineMode);
  const [providers, setProviders] = useState<AiProvider[]>(() =>
    (cloudConfig.providers ?? []).map((p) => ({ ...p }))
  );
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [providerTests, setProviderTests] = useState<Record<string, ProviderTestState>>({});

  if (!isCloudModalOpen) return null;

  const updateProvider = (id: string, patch: Partial<AiProvider>) => {
    setProviders((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const removeProvider = (id: string) => {
    setProviders((prev) => prev.filter((p) => p.id !== id));
    setProviderTests((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const addProvider = () => {
    setProviders((prev) => [...prev, makeProvider()]);
  };

  const setProviderTest = (id: string, state: ProviderTestState) => {
    setProviderTests((prev) => ({ ...prev, [id]: state }));
  };

  const handleSave = () => {
    const cleaned: AiProvider[] = providers.map((p) => ({
      ...p,
      apiKey: p.apiKey.trim(),
      baseUrl: p.baseUrl?.trim() || undefined,
      model: p.model?.trim() || undefined,
      label: p.label?.trim() || undefined,
    }));

    const firstEnabledGemini = cleaned.find((p) => p.vendor === 'gemini' && p.enabled !== false && p.apiKey);

    setCloudConfig({
      n8nWebhookUrl: webhookUrl.trim(),
      engineMode: mode,
      providers: cleaned,
      geminiApiKey: firstEnabledGemini?.apiKey ?? '',
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

  const testGeminiProvider = async (provider: AiProvider) => {
    const key = provider.apiKey.trim();
    if (!key) {
      setProviderTest(provider.id, { status: 'invalid', message: 'Please enter a Gemini API key first.' });
      return;
    }

    const model = GEMINI_MODELS[0];
    setProviderTest(provider.id, { status: 'testing', message: '' });

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
        setProviderTest(provider.id, { status: 'valid', message: `Gemini API key is valid. Connected to ${model}.` });
        return;
      }

      let status: ProviderTestStatus = 'invalid';
      let message: string;
      switch (res.status) {
        case 400:
          message = 'HTTP 400: the API key looks invalid or malformed. Generate a fresh key in Google AI Studio.';
          break;
        case 403:
          message =
            'HTTP 403: this key is not authorized for the Generative Language API. Enable it in Google AI Studio / Google Cloud.';
          break;
        case 429:
          status = 'rate-limited';
          message = 'HTTP 429: rate limited or quota exceeded. Wait a moment and try again.';
          break;
        case 404:
          message = 'HTTP 404: model not available for this key. The app will try other models automatically.';
          break;
        default:
          message = `HTTP ${res.status}: Gemini request failed.`;
      }

      const body = await res.json().catch(() => null);
      const apiMessage = body?.error?.message;
      if (typeof apiMessage === 'string' && apiMessage.trim()) {
        message = `${message} ${apiMessage.trim()}`;
      }

      setProviderTest(provider.id, { status, message });
    } catch {
      setProviderTest(provider.id, {
        status: 'network',
        message: 'Network error or timeout reaching the Gemini API. Check your connection.',
      });
    } finally {
      clearTimeout(timeout);
    }
  };

  const testOpenAiProvider = async (provider: AiProvider) => {
    const key = provider.apiKey.trim();
    if (!key) {
      setProviderTest(provider.id, { status: 'invalid', message: 'Please enter an API key first.' });
      return;
    }

    const baseUrl = (provider.baseUrl?.trim() || OPENAI_COMPATIBLE_PRESETS[0].baseUrl).replace(/\/+$/, '');
    const model = provider.model?.trim() || defaultModelForBaseUrl(provider.baseUrl);
    setProviderTest(provider.id, { status: 'testing', message: '' });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: 'ping' }] }),
        signal: controller.signal,
      });

      if (res.ok) {
        setProviderTest(provider.id, { status: 'valid', message: `API key is valid. Connected to ${model}.` });
        return;
      }

      if (res.status === 401 || res.status === 403) {
        setProviderTest(provider.id, {
          status: 'invalid',
          message: `HTTP ${res.status}: the API key is invalid or unauthorized for this endpoint.`,
        });
        return;
      }

      if (res.status === 429) {
        setProviderTest(provider.id, {
          status: 'rate-limited',
          message: 'HTTP 429: rate limited or quota exceeded. Wait a moment and try again.',
        });
        return;
      }

      if (res.status >= 500) {
        setProviderTest(provider.id, {
          status: 'network',
          message: `HTTP ${res.status}: the endpoint is unreachable right now. Try again later.`,
        });
        return;
      }

      setProviderTest(provider.id, { status: 'invalid', message: `HTTP ${res.status}: request failed.` });
    } catch {
      setProviderTest(provider.id, {
        status: 'network',
        message: 'Network error or timeout reaching the endpoint. Check the base URL and your connection.',
      });
    } finally {
      clearTimeout(timeout);
    }
  };

  const runProviderTest = (provider: AiProvider) => {
    if (provider.vendor === 'gemini') {
      void testGeminiProvider(provider);
    } else {
      void testOpenAiProvider(provider);
    }
  };

  const applyPreset = (provider: AiProvider, preset: (typeof OPENAI_COMPATIBLE_PRESETS)[number]) => {
    updateProvider(provider.id, {
      baseUrl: preset.baseUrl,
      model: preset.model,
      label: provider.label?.trim() ? provider.label : preset.label,
    });
  };

  const statusTone = (status: ProviderTestStatus) => {
    if (status === 'valid') return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300';
    if (status === 'testing') return 'bg-sky-500/10 border-sky-500/30 text-sky-300';
    return 'bg-rose-500/10 border-rose-500/30 text-rose-300';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl p-6 text-xs font-sans"
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
                <p className="text-[11px] text-geist-mute">
                  Configure n8n orchestration and multiple AI providers with automatic failover
                </p>
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

            {/* AI Providers manager */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-geist-ink flex items-center space-x-1.5">
                  <Shield className="w-3.5 h-3.5 text-geist-link" />
                  <span>AI Providers (Optional)</span>
                </label>
                <span className="text-[10px] text-geist-mute font-mono">AUTOMATIC FAILOVER</span>
              </div>
              <p className="text-[10px] text-geist-mute mb-2">
                Add one or more providers for AI answers in Copilot, Spotlight, and the Browser. The engine tries each
                enabled provider in order and falls back to the next one if a provider is unavailable.
              </p>

              <div className="space-y-3">
                {providers.length === 0 && (
                  <div
                    className="p-3 rounded-lg border text-[11px] text-geist-mute"
                    style={{ borderColor: 'var(--hairline, #ebebeb)', background: 'var(--canvas, #fafafa)' }}
                  >
                    No providers configured yet. Add a Gemini or OpenAI-compatible provider to enable cloud AI answers.
                  </div>
                )}

                {providers.map((provider) => {
                  const test = providerTests[provider.id] ?? { status: 'idle' as ProviderTestStatus, message: '' };
                  const isOpenAi = provider.vendor === 'openai-compatible';
                  return (
                    <div
                      key={provider.id}
                      className="p-3 rounded-xl border space-y-2"
                      style={{ borderColor: 'var(--hairline, #ebebeb)', background: 'var(--canvas, #fafafa)' }}
                    >
                      <div className="flex items-center gap-2">
                        <select
                          value={provider.vendor}
                          onChange={(e) =>
                            updateProvider(provider.id, { vendor: e.target.value as AiProvider['vendor'] })
                          }
                          className="px-2 py-1.5 rounded-lg bg-geist-canvasElevated border border-geist-hairline text-geist-ink text-xs focus:border-geist-link focus:outline-none"
                        >
                          <option value="gemini">Gemini</option>
                          <option value="openai-compatible">OpenAI-compatible</option>
                        </select>
                        <input
                          type="text"
                          value={provider.label ?? ''}
                          onChange={(e) => updateProvider(provider.id, { label: e.target.value })}
                          placeholder="Label (optional)"
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-geist-canvasElevated border border-geist-hairline text-geist-ink placeholder-geist-faint focus:border-geist-link focus:outline-none text-xs"
                        />
                        <label className="flex items-center gap-1 text-[10px] text-geist-mute whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={provider.enabled !== false}
                            onChange={(e) => updateProvider(provider.id, { enabled: e.target.checked })}
                          />
                          <span>Enabled</span>
                        </label>
                        <button
                          onClick={() => removeProvider(provider.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/10 text-geist-mute hover:text-rose-400 transition-colors"
                          title="Remove provider"
                          aria-label="Remove provider"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <input
                        type="password"
                        value={provider.apiKey}
                        onChange={(e) => updateProvider(provider.id, { apiKey: e.target.value })}
                        placeholder={isOpenAi ? 'API key (sk-...)' : 'Gemini API key (AIzaSy...)'}
                        className="w-full px-3 py-2 rounded-lg bg-geist-canvasElevated border border-geist-hairline text-geist-ink placeholder-geist-faint focus:border-geist-link focus:outline-none font-mono text-xs"
                      />

                      {isOpenAi && (
                        <>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={provider.baseUrl ?? ''}
                              onChange={(e) => updateProvider(provider.id, { baseUrl: e.target.value })}
                              placeholder="Base URL (https://api.openai.com/v1)"
                              className="flex-1 px-3 py-2 rounded-lg bg-geist-canvasElevated border border-geist-hairline text-geist-ink placeholder-geist-faint focus:border-geist-link focus:outline-none font-mono text-xs"
                            />
                            <input
                              type="text"
                              value={provider.model ?? ''}
                              onChange={(e) => updateProvider(provider.id, { model: e.target.value })}
                              placeholder="Model (gpt-4o-mini)"
                              className="w-40 px-3 py-2 rounded-lg bg-geist-canvasElevated border border-geist-hairline text-geist-ink placeholder-geist-faint focus:border-geist-link focus:outline-none font-mono text-xs"
                            />
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] text-geist-mute">Presets:</span>
                            {OPENAI_COMPATIBLE_PRESETS.map((preset) => (
                              <button
                                key={preset.label}
                                onClick={() => applyPreset(provider, preset)}
                                className="px-2 py-1 rounded-lg bg-geist-canvasElevated hover:bg-geist-hairlineSoft border border-geist-hairline text-geist-body text-[10px] font-medium transition-colors"
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => runProviderTest(provider)}
                          disabled={test.status === 'testing'}
                          className="px-3 py-1.5 rounded-lg bg-geist-canvasElevated hover:bg-geist-hairlineSoft border border-geist-hairline text-geist-ink font-medium text-xs transition-colors whitespace-nowrap"
                        >
                          {test.status === 'testing' ? 'Testing...' : 'Test'}
                        </button>
                        {test.status !== 'idle' && (
                          <div
                            className={`flex-1 p-2 rounded-lg flex items-start space-x-2 border text-[11px] ${statusTone(
                              test.status
                            )}`}
                          >
                            {test.status === 'valid' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            ) : test.status === 'testing' ? (
                              <Loader2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 animate-spin" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            )}
                            <span>
                              {test.status === 'testing' ? 'Testing provider...' : test.message}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={addProvider}
                className="mt-3 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-geist-canvas hover:bg-geist-hairlineSoft border border-geist-hairline text-geist-ink font-medium text-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add provider
              </button>
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
