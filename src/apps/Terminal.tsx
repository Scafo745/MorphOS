import React, { useState, useRef, useEffect } from 'react';
import { useOSStore } from '../core/store';
import { executeShell } from '../kernel/shell';

interface HistoryItem {
  command?: string;
  output: string;
  isError?: boolean;
}

export const Terminal: React.FC = () => {
  const { profile, currentPath, triggerSudoChallenge, addAuditLog } = useOSStore();
  const [history, setHistory] = useState<HistoryItem[]>([
    {
      output: `MorphOS Microkernel Terminal (v2.4.0-WASM)\nType 'help' for available commands, or 'morph <prompt>' to recompile the OS.\nSecurity policy active: ${profile.securityLevel.toUpperCase()}`,
    },
  ]);
  const [input, setInput] = useState('');
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const raw = input.trim();
      if (!raw) return;

      setCmdHistory((prev) => [raw, ...prev]);
      setHistoryIdx(-1);
      setInput('');

      // Check if command is sudo
      if (raw.startsWith('sudo ')) {
        const targetCommand = raw.replace(/^sudo\s+/, '');
        addAuditLog(raw, 'CHALLENGE_REQUIRED', 'Sudo elevation requested');
        triggerSudoChallenge(`Authorize sudo elevation for command: "${targetCommand}"`, () => {
          // Temporarily elevate to root
          const oldRole = useOSStore.getState().profile.userRole;
          useOSStore.setState((state) => ({
            profile: { ...state.profile, userRole: 'root' },
          }));

          const res = executeShell(targetCommand);

          // Restore role
          useOSStore.setState((state) => ({
            profile: { ...state.profile, userRole: oldRole },
          }));

          addAuditLog(raw, 'ALLOWED', 'Authorized via sudo biometric challenge');
          setHistory((prev) => [
            ...prev,
            { command: raw, output: `[sudo] Authorization accepted.\n${res.output}` },
          ]);
        });
        return;
      }

      const res = executeShell(raw);
      if (res.output === '__CLEAR__') {
        setHistory([]);
      } else {
        setHistory((prev) => [...prev, { command: raw, output: res.output, isError: res.isError }]);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const nextIdx = Math.min(historyIdx + 1, cmdHistory.length - 1);
      setHistoryIdx(nextIdx);
      setInput(cmdHistory[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx > 0) {
        const nextIdx = historyIdx - 1;
        setHistoryIdx(nextIdx);
        setInput(cmdHistory[nextIdx]);
      } else if (historyIdx === 0) {
        setHistoryIdx(-1);
        setInput('');
      }
    }
  };

  const isCyber = profile.theme === 'cyber';
  const promptSymbol = profile.userRole === 'root' ? '#' : '$';

  // Geist code-block surface by default; keep the neon cyber terminal for the cyber theme.
  const userColor = profile.customTokens?.accentColor || (isCyber ? '#f472b6' : 'var(--link, #0070f3)');

  return (
    <div
      className={`h-full flex flex-col font-mono text-xs p-3 overflow-y-auto ${
        isCyber ? 'bg-black/95 text-emerald-400 selection:bg-emerald-500 selection:text-black' : ''
      }`}
      style={
        isCyber
          ? undefined
          : {
              background: 'var(--canvas-elevated, #ffffff)',
              color: 'var(--text-body, #4d4d4d)',
            }
      }
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex-1 space-y-2">
        {history.map((item, idx) => (
          <div key={idx} className="space-y-0.5">
            {item.command && (
              <div className="flex items-center space-x-1.5 opacity-90">
                <span className="font-medium" style={{ color: userColor }}>
                  {profile.userRole}@morphos
                </span>
                <span style={isCyber ? undefined : { color: 'var(--text-faint, #a1a1a1)' }} className={isCyber ? 'text-slate-400' : ''}>:</span>
                <span style={isCyber ? undefined : { color: 'var(--link-deep, #0761d1)' }} className={isCyber ? 'text-amber-400' : ''}>{currentPath}</span>
                <span className="font-bold" style={isCyber ? undefined : { color: 'var(--text-mute, #8f8f8f)' }}>{promptSymbol}</span>
                <span className="font-semibold" style={isCyber ? { color: '#fff' } : { color: 'var(--ink, #171717)' }}>{item.command}</span>
              </div>
            )}
            <pre
              className={`whitespace-pre-wrap font-mono leading-relaxed ${
                item.isError ? 'font-semibold' : ''
              }`}
              style={
                item.isError
                  ? { color: isCyber ? '#fb7185' : '#ee0000' }
                  : isCyber
                  ? { color: '#6ee7b7' }
                  : { color: 'var(--text-body, #4d4d4d)' }
              }
            >
              {item.output}
            </pre>
          </div>
        ))}
      </div>

      {/* Active Input Line */}
      <div
        className="flex items-center space-x-1.5 pt-2 mt-2 flex-shrink-0 border-t"
        style={{ borderColor: isCyber ? 'rgba(255,255,255,0.08)' : 'var(--hairline, #ebebeb)' }}
      >
        <span className="font-medium" style={{ color: userColor }}>
          {profile.userRole}@morphos
        </span>
        <span style={isCyber ? undefined : { color: 'var(--text-faint, #a1a1a1)' }} className={isCyber ? 'text-slate-400' : ''}>:</span>
        <span style={isCyber ? undefined : { color: 'var(--link-deep, #0761d1)' }} className={isCyber ? 'text-amber-400' : ''}>{currentPath}</span>
        <span className="font-bold" style={isCyber ? undefined : { color: 'var(--text-mute, #8f8f8f)' }}>{promptSymbol}</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          className="flex-1 bg-transparent border-none outline-none font-mono"
          style={{ color: isCyber ? '#fff' : 'var(--ink, #171717)' }}
        />
      </div>
      <div ref={bottomRef} />
    </div>
  );
};

