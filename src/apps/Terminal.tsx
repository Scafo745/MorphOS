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

  return (
    <div
      className={`h-full flex flex-col font-mono text-xs p-3 overflow-y-auto ${
        isCyber
          ? 'bg-black/95 text-emerald-400 selection:bg-emerald-500 selection:text-black'
          : 'bg-slate-950/90 text-slate-200 selection:bg-indigo-500 selection:text-white'
      }`}
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex-1 space-y-2">
        {history.map((item, idx) => (
          <div key={idx} className="space-y-0.5">
            {item.command && (
              <div className="flex items-center space-x-1.5 opacity-90">
                <span
                  className="font-medium"
                  style={{ color: profile.customTokens?.accentColor || (isCyber ? '#f472b6' : '#38bdf8') }}
                >
                  {profile.userRole}@morphos
                </span>
                <span className="text-slate-400">:</span>
                <span className="text-amber-400">{currentPath}</span>
                <span className="text-slate-300 font-bold">{promptSymbol}</span>
                <span className="text-white font-semibold">{item.command}</span>
              </div>
            )}
            <pre
              className={`whitespace-pre-wrap font-mono leading-relaxed ${
                item.isError
                  ? 'text-rose-400 font-semibold'
                  : isCyber
                  ? 'text-emerald-300'
                  : 'text-slate-300'
              }`}
            >
              {item.output}
            </pre>
          </div>
        ))}
      </div>

      {/* Active Input Line */}
      <div className="flex items-center space-x-1.5 pt-2 border-t border-white/5 mt-2 flex-shrink-0">
        <span
          className="font-medium"
          style={{ color: profile.customTokens?.accentColor || (isCyber ? '#f472b6' : '#38bdf8') }}
        >
          {profile.userRole}@morphos
        </span>
        <span className="text-slate-400">:</span>
        <span className="text-amber-400">{currentPath}</span>
        <span className="text-slate-300 font-bold">{promptSymbol}</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          className="flex-1 bg-transparent border-none outline-none font-mono text-white"
        />
      </div>
      <div ref={bottomRef} />
    </div>
  );
};

