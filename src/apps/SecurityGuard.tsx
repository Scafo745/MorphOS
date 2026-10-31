import React from 'react';
import { useOSStore } from '../core/store';
import { ShieldCheck, ShieldAlert, Lock, AlertTriangle, RefreshCw, Activity, Terminal } from 'lucide-react';

export const SecurityGuard: React.FC = () => {
  const { profile, selinux, setSELinuxMode, auditLogs, setProfile } = useOSStore();

  const handleLockdown = () => {
    setProfile({
      ...profile,
      name: 'Lockdown Protected State',
      tagline: 'Emergency zero-trust containment mode active',
      securityLevel: 'zero-trust',
      userRole: 'intern',
      aiSummary: 'Workstation placed into high-alert containment. System writes blocked, strict audit logging enabled.',
    });
  };

  return (
    <div className="h-full flex flex-col bg-slate-950/95 text-slate-200 text-xs font-sans overflow-hidden select-none">
      {/* Top Banner */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/40">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-white tracking-wide">Security & Compliance Guard</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[9px] uppercase font-bold tracking-wider">
                PCI-DSS 4.0 READY
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Policy: {profile.securityLevel.toUpperCase()} • Role: {profile.userRole}
            </p>
          </div>
        </div>

        <button
          onClick={handleLockdown}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/40 text-rose-300 font-semibold text-xs transition-colors shadow-lg shadow-rose-950/50"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Emergency Lockdown</span>
        </button>
      </div>

      {/* Main Content Dashboard */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Card 1: SELinux Status */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-medium">
              <span>LSM / SELinux State</span>
              <Activity className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="text-lg font-bold text-white font-mono flex items-center space-x-2">
              <span className={selinux.mode === 'Enforcing' ? 'text-emerald-400' : 'text-amber-400'}>
                {selinux.mode}
              </span>
              <span className="text-[10px] text-slate-500 font-normal">({selinux.policy})</span>
            </div>
            <div className="flex items-center space-x-1 pt-1">
              {(['Enforcing', 'Permissive', 'Disabled'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setSELinuxMode(m)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                    selinux.mode === m
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-400 font-semibold'
                      : 'bg-white/5 hover:bg-white/10 text-slate-400'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Card 2: Active Security Rules */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-medium">
              <span>Active Kernel Rules</span>
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-lg font-bold text-white font-mono">{selinux.activeRules} ACL Rules</div>
            <p className="text-[10px] text-slate-400">
              Zero-Trust POSIX DAC + MLS Multi-Level Security context matrix
            </p>
          </div>

          {/* Card 3: Violations Blocked */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-medium">
              <span>Threats Intercepted</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-lg font-bold text-emerald-400 font-mono">
              {auditLogs.filter((l) => l.status === 'BLOCKED').length} Prevented
            </div>
            <p className="text-[10px] text-slate-400">
              Accidental data loss & unauthorized read attempts neutralized
            </p>
          </div>
        </div>

        {/* Real-time Audit Trail Section */}
        <div className="rounded-xl bg-black/40 border border-white/10 overflow-hidden">
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/10 bg-white/5">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-white tracking-wide">
                Live PCI-DSS & Syscall Audit Trail
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">auditd daemon pid: 4</span>
          </div>

          <div className="p-2 divide-y divide-white/5 max-h-56 overflow-y-auto font-mono text-[11px]">
            {auditLogs.map((log) => {
              const statusColor =
                log.status === 'ALLOWED'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : log.status === 'BLOCKED'
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30';

              return (
                <div key={log.id} className="py-2 px-2 flex items-start justify-between space-x-3 hover:bg-white/5 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500 text-[10px]">{log.timestamp}</span>
                      <span className="text-sky-400 font-semibold">{log.user}</span>
                      <span className="text-slate-400">→</span>
                      <span className="text-white font-medium">{log.command}</span>
                    </div>
                    {log.reason && <p className="text-[10px] text-slate-400">{log.reason}</p>}
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border tracking-wider flex-shrink-0 ${statusColor}`}>
                    {log.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

