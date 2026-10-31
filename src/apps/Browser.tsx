import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Home, Search, Globe, Shield, Terminal, Folder, Sparkles, ExternalLink, Loader2 } from 'lucide-react';
import { useOSStore } from '../core/store';
import { answerQuestionAsync, getLastGeminiDiagnostic } from '../core/ai-chat';
import type { CloudConfig } from '../core/types';

const HOME_URL = 'morphos://start';

/** Launch the real Google results for a query in a new real browser tab. */
const openInGoogle = (query: string) => {
  window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer');
};

interface QuickLink {
  label: string;
  url: string;
  hint: string;
  icon: (color?: string) => React.ReactNode;
  color: string;
}

const QUICK_LINKS: QuickLink[] = [
  { label: 'Start Page', url: HOME_URL, hint: 'MorphOS new tab', icon: (c) => <Sparkles className="w-5 h-5" style={{ color: c }} />, color: '#2dd4bf' },
  { label: 'Docs', url: 'morphos://docs', hint: 'System handbook', icon: (c) => <Folder className="w-5 h-5" style={{ color: c }} />, color: '#38bdf8' },
  { label: 'Shell Guide', url: 'morphos://shell', hint: 'Terminal reference', icon: (c) => <Terminal className="w-5 h-5" style={{ color: c }} />, color: '#34d399' },
  { label: 'Security', url: 'morphos://security', hint: 'Zero-trust policy', icon: (c) => <Shield className="w-5 h-5" style={{ color: c }} />, color: '#fbbf24' },
];

/** Normalize whatever the user typed into a usable URL string. */
const normalizeUrl = (raw: string): string => {
  const trimmed = raw.trim();
  if (!trimmed) return HOME_URL;
  if (trimmed.startsWith('morphos://')) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // Looks like a bare domain (has a dot, no spaces) -> treat as https site.
  if (/^[^\s]+\.[^\s]+$/.test(trimmed)) return `https://${trimmed}`;
  // Otherwise treat it as a search query against the local start page.
  return `morphos://search?q=${encodeURIComponent(trimmed)}`;
};

const isExternal = (url: string): boolean => /^https?:\/\//i.test(url);

export const Browser: React.FC = () => {
  const { cloudConfig } = useOSStore();
  const [history, setHistory] = useState<string[]>([HOME_URL]);
  const [index, setIndex] = useState(0);
  const [address, setAddress] = useState(HOME_URL);
  const [reloadKey, setReloadKey] = useState(0);
  const [frameError, setFrameError] = useState(false);

  const currentUrl = history[index];
  const canGoBack = index > 0;
  const canGoForward = index < history.length - 1;

  const navigate = (raw: string) => {
    const url = normalizeUrl(raw);
    setFrameError(false);
    setHistory((prev) => {
      const next = prev.slice(0, index + 1);
      next.push(url);
      return next;
    });
    setIndex((i) => i + 1);
    setAddress(url);
  };

  const goBack = () => {
    if (!canGoBack) return;
    const next = index - 1;
    setIndex(next);
    setAddress(history[next]);
    setFrameError(false);
  };

  const goForward = () => {
    if (!canGoForward) return;
    const next = index + 1;
    setIndex(next);
    setAddress(history[next]);
    setFrameError(false);
  };

  const reload = () => {
    setFrameError(false);
    setReloadKey((k) => k + 1);
  };

  const goHome = () => navigate(HOME_URL);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(address);
  };

  const searchQuery = useMemo(() => {
    if (!currentUrl.startsWith('morphos://search')) return null;
    const q = currentUrl.split('q=')[1] ?? '';
    try {
      return decodeURIComponent(q);
    } catch {
      return q;
    }
  }, [currentUrl]);

  const toolbarBtn =
    'flex items-center justify-center w-8 h-8 rounded-[8px] transition-colors hover:bg-geist-hairlineSoft disabled:opacity-30 disabled:cursor-not-allowed';

  return (
    <div
      className="h-full flex flex-col text-xs font-sans select-none overflow-hidden"
      style={{ background: 'var(--canvas, #fafafa)', color: 'var(--text-body, #4d4d4d)' }}
    >
      {/* ── Toolbar ─────────────────────────────── */}
      <div
        className="flex items-center gap-1.5 px-2.5 py-2 border-b flex-shrink-0"
        style={{ borderColor: 'var(--hairline, #ebebeb)', background: 'var(--canvas-elevated, #ffffff)' }}
      >
        <button onClick={goBack} disabled={!canGoBack} className={toolbarBtn} style={{ color: 'var(--ink, #171717)' }} title="Back" aria-label="Back">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button onClick={goForward} disabled={!canGoForward} className={toolbarBtn} style={{ color: 'var(--ink, #171717)' }} title="Forward" aria-label="Forward">
          <ArrowRight className="w-4 h-4" />
        </button>
        <button onClick={reload} className={toolbarBtn} style={{ color: 'var(--ink, #171717)' }} title="Reload" aria-label="Reload">
          <RotateCw className="w-4 h-4" />
        </button>
        <button onClick={goHome} className={toolbarBtn} style={{ color: 'var(--ink, #171717)' }} title="Start page" aria-label="Start page">
          <Home className="w-4 h-4" />
        </button>

        <form onSubmit={onSubmit} className="flex-1 flex items-center ml-1">
          <div
            className="flex-1 flex items-center gap-2 px-2.5 h-8 rounded-[10px] border"
            style={{ borderColor: 'var(--hairline, #ebebeb)', background: 'var(--canvas, #fafafa)' }}
          >
            <Globe className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-faint, #a1a1a1)' }} />
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              spellCheck={false}
              placeholder="Search MorphOS or type a URL"
              className="flex-1 bg-transparent outline-none text-[12px] font-mono"
              style={{ color: 'var(--ink, #171717)' }}
              aria-label="Address bar"
            />
          </div>
          <button
            type="submit"
            className="ml-1.5 flex items-center gap-1 px-3 h-8 rounded-[10px] text-[12px] font-medium transition-opacity hover:opacity-90"
            style={{ background: 'var(--link, #0070f3)', color: '#ffffff' }}
          >
            <Search className="w-3.5 h-3.5" />
            Go
          </button>
        </form>

        {searchQuery && (
          <button
            type="button"
            onClick={() => openInGoogle(searchQuery)}
            className="ml-1.5 flex items-center gap-1 px-2.5 h-8 rounded-[10px] text-[12px] font-medium border transition-colors hover:bg-geist-hairlineSoft flex-shrink-0"
            style={{ borderColor: 'var(--hairline, #ebebeb)', color: 'var(--ink, #171717)' }}
            title="Open this search on Google in a new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Google
          </button>
        )}
      </div>

      {/* ── Content ─────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-auto">
        {isExternal(currentUrl) ? (
          frameError ? (
            <ExternalError url={currentUrl} onHome={goHome} />
          ) : (
            <iframe
              key={`${currentUrl}-${reloadKey}`}
              src={currentUrl}
              title="External site"
              className="w-full h-full border-0 bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms"
              onError={() => setFrameError(true)}
            />
          )
        ) : searchQuery ? (
          <SearchResults key={`${searchQuery}-${reloadKey}`} query={searchQuery} cloudConfig={cloudConfig} onNavigate={navigate} />
        ) : (
          <StartPage key={reloadKey} query={searchQuery} onNavigate={navigate} />
        )}
      </div>
    </div>
  );
};

/** Friendly fallback when an external site refuses to load in the sandbox. */
const ExternalError: React.FC<{ url: string; onHome: () => void }> = ({ url, onHome }) => (
  <div className="h-full flex flex-col items-center justify-center text-center px-8 gap-3">
    <Globe className="w-10 h-10" style={{ color: 'var(--text-faint, #a1a1a1)' }} />
    <h2 className="text-sm font-semibold" style={{ color: 'var(--ink, #171717)' }}>
      This site cannot be displayed in the sandbox
    </h2>
    <p className="text-[12px] max-w-md leading-relaxed" style={{ color: 'var(--text-mute, #8f8f8f)' }}>
      MorphOS runs inside an isolated tab, and many sites block embedding for security. The address you entered was{' '}
      <span className="font-mono" style={{ color: 'var(--link, #0070f3)' }}>{url}</span>.
    </p>
    <button
      onClick={onHome}
      className="mt-1 px-3.5 py-1.5 rounded-[10px] text-[12px] font-medium transition-opacity hover:opacity-90"
      style={{ background: 'var(--link, #0070f3)', color: '#ffffff' }}
    >
      Back to start page
    </button>
  </div>
);

/**
 * Real answer-engine style results page. Runs the query through the shared
 * Gemini helper (answerQuestionAsync) and renders the returned answer as a
 * Perplexity-like answer card, with a loading state, a graceful local fallback,
 * and an Open in Google escape hatch for full web results.
 */
const SearchResults: React.FC<{
  query: string;
  cloudConfig: CloudConfig;
  onNavigate: (url: string) => void;
}> = ({ query, cloudConfig, onNavigate }) => {
  const [search, setSearch] = useState(query);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState('');
  const [source, setSource] = useState<'gemini' | 'local'>('local');
  const [failed, setFailed] = useState(false);
  const [geminiNote, setGeminiNote] = useState<string | null>(null);
  const reqId = useRef(0);

  useEffect(() => {
    const id = ++reqId.current;
    setLoading(true);
    setFailed(false);
    setAnswer('');
    setGeminiNote(null);

    answerQuestionAsync(query, cloudConfig)
      .then((result) => {
        if (id !== reqId.current) return; // stale response, ignore
        setAnswer(result.answer);
        setSource(result.source);
        // When we fell back to local with a key configured, surface the real
        // HTTP reason Gemini could not be reached instead of a vague message.
        if (result.source === 'local') {
          const diag = getLastGeminiDiagnostic();
          if (diag && !diag.ok && diag.reason !== 'no-key' && diag.status !== null) {
            setGeminiNote(
              `Gemini could not be reached (${diag.reason}). Check the key in Cloud Gateway settings.`
            );
          } else if (diag && !diag.ok && diag.reason === 'network error/timeout') {
            setGeminiNote(
              'Gemini could not be reached (network error or timeout). Check your connection and the key in Cloud Gateway settings.'
            );
          }
        }
        setLoading(false);
      })
      .catch(() => {
        if (id !== reqId.current) return;
        setFailed(true);
        setLoading(false);
      });
  }, [query, cloudConfig]);

  const hasGeminiKey = Boolean(cloudConfig.geminiApiKey) && cloudConfig.engineMode !== 'local';

  return (
    <div className="min-h-full flex flex-col items-center px-6 py-8 gap-6">
      {/* Search box so the user can refine the query from the results page. */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onNavigate(search);
        }}
        className="w-full max-w-2xl flex items-center gap-2 px-3.5 h-11 rounded-[14px] border flex-shrink-0"
        style={{ borderColor: 'var(--hairline, #ebebeb)', background: 'var(--canvas-elevated, #ffffff)', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
      >
        <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-faint, #a1a1a1)' }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          spellCheck={false}
          placeholder="Search or enter a URL"
          className="flex-1 bg-transparent outline-none text-[13px]"
          style={{ color: 'var(--ink, #171717)' }}
          aria-label="Search"
        />
        <button
          type="button"
          onClick={() => openInGoogle(query)}
          className="flex items-center gap-1 px-2.5 h-8 rounded-[10px] text-[12px] font-medium border transition-colors hover:bg-geist-hairlineSoft flex-shrink-0"
          style={{ borderColor: 'var(--hairline, #ebebeb)', color: 'var(--ink, #171717)' }}
          title="Open this search on Google in a new tab"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open in Google
        </button>
      </form>

      {/* Answer card. */}
      <div className="w-full max-w-2xl">
        <div className="mb-2 flex items-center gap-2">
          <h2 className="text-base font-semibold tracking-tight" style={{ color: 'var(--ink, #171717)' }}>
            {query}
          </h2>
        </div>

        <div
          className="rounded-[14px] border p-4"
          style={{ borderColor: 'var(--hairline, #ebebeb)', background: 'var(--canvas-elevated, #ffffff)', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
        >
          {loading ? (
            <div className="flex items-center gap-2 py-6 justify-center" style={{ color: 'var(--text-mute, #8f8f8f)' }}>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-[12px]">Searching...</span>
            </div>
          ) : failed ? (
            <div className="flex flex-col gap-3">
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-body, #4d4d4d)' }}>
                Sorry, I could not complete the search just now. You can try again, or open the full web results on Google.
              </p>
              <button
                onClick={() => openInGoogle(query)}
                className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[12px] font-medium transition-opacity hover:opacity-90"
                style={{ background: 'var(--link, #0070f3)', color: '#ffffff' }}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open in Google
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--link, #0070f3)' }} />
                <span className="text-[11px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-faint, #a1a1a1)' }}>
                  {source === 'gemini' ? 'Answer by Gemini' : 'Offline answer (local assistant)'}
                </span>
              </div>

              <p className="text-[13px] leading-[1.7] whitespace-pre-wrap" style={{ color: 'var(--text-body, #4d4d4d)' }}>
                {answer}
              </p>

              {source === 'local' && !hasGeminiKey && (
                <p className="text-[11px] leading-relaxed pt-1 border-t" style={{ color: 'var(--text-faint, #a1a1a1)', borderColor: 'var(--hairline, #ebebeb)' }}>
                  Add a Gemini API key in Cloud Gateway settings (the Cloud icon, or press Ctrl/Cmd+K) to get fuller web-backed answers here.
                </p>
              )}

              {source === 'local' && hasGeminiKey && geminiNote && (
                <p className="text-[11px] leading-relaxed pt-1 border-t" style={{ color: 'var(--link, #0070f3)', borderColor: 'var(--hairline, #ebebeb)' }}>
                  {geminiNote}
                </p>
              )}

              <div className="pt-1">
                <button
                  onClick={() => openInGoogle(query)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[12px] font-medium border transition-colors hover:bg-geist-hairlineSoft"
                  style={{ borderColor: 'var(--hairline, #ebebeb)', color: 'var(--ink, #171717)' }}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open in Google for full web results
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/** MorphOS-branded local start / new-tab page. */
const StartPage: React.FC<{ query: string | null; onNavigate: (url: string) => void }> = ({ query, onNavigate }) => {
  const [search, setSearch] = useState(query ?? '');

  return (
    <div className="min-h-full flex flex-col items-center px-6 py-10 gap-8">
      <div className="flex flex-col items-center gap-3 mt-4">
        <div
          className="w-14 h-14 rounded-[18px] flex items-center justify-center"
          style={{ background: 'linear-gradient(145deg, #042f2e, #0e7490)', boxShadow: '0 8px 24px rgba(0,0,0,0.18)' }}
        >
          <Globe className="w-7 h-7" style={{ color: '#5eead4' }} />
        </div>
        <h1 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--ink, #171717)' }}>
          MorphOS Browser
        </h1>
        <p className="text-[12px]" style={{ color: 'var(--text-mute, #8f8f8f)' }}>
          A sandboxed, private start page for your morphable OS
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onNavigate(search);
        }}
        className="w-full max-w-md flex items-center gap-2 px-3.5 h-11 rounded-[14px] border"
        style={{ borderColor: 'var(--hairline, #ebebeb)', background: 'var(--canvas-elevated, #ffffff)', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
      >
        <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-faint, #a1a1a1)' }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          spellCheck={false}
          autoFocus
          placeholder="Search or enter a URL"
          className="flex-1 bg-transparent outline-none text-[13px]"
          style={{ color: 'var(--ink, #171717)' }}
          aria-label="Start page search"
        />
      </form>

      <div className="w-full max-w-md -mt-4 text-[12px] text-center" style={{ color: 'var(--text-mute, #8f8f8f)' }}>
        Searches run through the configured AI engine for a real answer, with Open in Google for full web results.
      </div>

      <div className="w-full max-w-md grid grid-cols-2 gap-3">
        {QUICK_LINKS.map((link) => (
          <button
            key={link.url}
            onClick={() => onNavigate(link.url)}
            className="flex items-center gap-3 p-3 rounded-[12px] border text-left transition-colors hover:bg-geist-hairlineSoft"
            style={{ borderColor: 'var(--hairline, #ebebeb)', background: 'var(--canvas-elevated, #ffffff)' }}
          >
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--canvas, #fafafa)', border: '1px solid var(--hairline, #ebebeb)' }}
            >
              {link.icon(link.color)}
            </div>
            <div className="min-w-0">
              <div className="text-[12px] font-medium truncate" style={{ color: 'var(--ink, #171717)' }}>{link.label}</div>
              <div className="text-[11px] truncate" style={{ color: 'var(--text-faint, #a1a1a1)' }}>{link.hint}</div>
            </div>
          </button>
        ))}
      </div>

      <p className="text-[11px] mt-auto pt-4" style={{ color: 'var(--text-faint, #a1a1a1)' }}>
        Tip: run <span className="font-mono" style={{ color: 'var(--link, #0070f3)' }}>browser init</span> in the terminal to launch this window.
      </p>
    </div>
  );
};
