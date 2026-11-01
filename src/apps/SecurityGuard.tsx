import React from 'react';
import { useOSStore } from '../core/store';
import { ShieldCheck, ShieldAlert, Lock, AlertTriangle, Activity, Terminal } from 'lucide-react';

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

  const cardStyle: React.CSSProperties = {
    background: 'var(--canvas-elevated, #ffffff)',
    borderColor: 'var(--hairline, #ebebeb)',
  };

  return (
    <div
      className="h-full flex flex-col text-xs font-sans overflow-hidden select-none"
      style={{ background: 'var(--canvas, #fafafa)', color: 'var(--text-body, #4d4d4d)' }}
    >
      {/* Top Banner */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'var(--hairline, #ebebeb)', background: 'var(--canvas-elevated, #ffffff)' }}
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-[12px] border" style={{ borderColor: 'var(--hairline, #ebebeb)', color: '#15803d' }}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold tracking-tight" style={{ color: 'var(--ink, #171717)' }}>Security & Compliance Guard</h2>
              <span
                className="px-2 py-0.5 rounded-[6px] border font-mono text-[9px] uppercase font-bold tracking-wider"
                style={{ borderColor: 'var(--hairline, #ebebeb)', color: '#15803d' }}
              >
                PCI-DSS 4.0 READY
              </span>
            </div>
            <p className="text-[11px] font-mono" style={{ color: 'var(--text-mute, #8f8f8f)' }}>
              Policy: {profile.securityLevel.toUpperCase()} • Role: {profile.userRole}
            </p>
          </div>
        </div>

        <button
          onClick={handleLockdown}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-[6px] border font-semibold text-xs transition-colors"
          style={{ borderColor: 'rgba(238,0,0,0.35)', color: '#ee0000', background: 'rgba(238,0,0,0.06)' }}
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
          <div className="p-3.5 rounded-[12px] border space-y-2" style={cardStyle}>
            <div className="flex items-center justify-between text-[11px] font-medium" style={{ color: 'var(--text-mute, #8f8f8f)' }}>
              <span>LSM / SELinux State</span>
              <Activity className="w-3.5 h-3.5" style={{ color: 'var(--link, #0070f3)' }} />
            </div>
            <div className="text-lg font-bold font-mono flex items-center space-x-2">
              <span style={{ color: selinux.mode === 'Enforcing' ? '#15803d' : '#b4760a' }}>
                {selinux.mode}
              </span>
              <span className="text-[10px] font-normal" style={{ color: 'var(--text-faint, #a1a1a1)' }}>({selinux.policy})</span>
            </div>
            <div className="flex items-center space-x-1 pt-1">
              {(['Enforcing', 'Permissive', 'Disabled'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setSELinuxMode(m)}
                  className="px-2 py-0.5 rounded-[6px] text-[10px] font-mono transition-colors border"
                  style={
                    selinux.mode === m
                      ? { background: 'var(--accent-dim, rgba(23,23,23,0.06))', color: 'var(--ink, #171717)', borderColor: 'var(--hairline, #ebebeb)', fontWeight: 600 }
                      : { color: 'var(--text-mute, #8f8f8f)', borderColor: 'transparent' }
                  }
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Card 2: Active Security Rules */}
          <div className="p-3.5 rounded-[12px] border space-y-2" style={cardStyle}>
            <div className="flex items-center justify-between text-[11px] font-medium" style={{ color: 'var(--text-mute, #8f8f8f)' }}>
              <span>Active Kernel Rules</span>
              <ShieldAlert className="w-3.5 h-3.5" style={{ color: 'var(--link, #0070f3)' }} />
            </div>
            <div className="text-lg font-bold font-mono" style={{ color: 'var(--ink, #171717)' }}>{selinux.activeRules} ACL Rules</div>
            <p className="text-[10px]" style={{ color: 'var(--text-mute, #8f8f8f)' }}>
              Zero-Trust POSIX DAC + MLS Multi-Level Security context matrix
            </p>
          </div>

          {/* Card 3: Violations Blocked */}
          <div className="p-3.5 rounded-[12px] border space-y-2" style={cardStyle}>
            <div className="flex items-center justify-between text-[11px] font-medium" style={{ color: 'var(--text-mute, #8f8f8f)' }}>
              <span>Threats Intercepted</span>
              <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#f5a623' }} />
            </div>
            <div className="text-lg font-bold font-mono" style={{ color: '#15803d' }}>
              {auditLogs.filter((l) => l.status === 'BLOCKED').length} Prevented
            </div>
            <p className="text-[10px]" style={{ color: 'var(--text-mute, #8f8f8f)' }}>
              Accidental data loss & unauthorized read attempts neutralized
            </p>
          </div>
        </div>

        {/* Real-time Audit Trail Section */}
        <div className="rounded-[12px] border overflow-hidden" style={cardStyle}>
          <div
            className="flex items-center justify-between px-3.5 py-2.5 border-b"
            style={{ borderColor: 'var(--hairline, #ebebeb)', background: 'var(--canvas, #fafafa)' }}
          >
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4" style={{ color: 'var(--link, #0070f3)' }} />
              <span className="text-xs font-semibold tracking-tight" style={{ color: 'var(--ink, #171717)' }}>
                Live PCI-DSS & Syscall Audit Trail
              </span>
            </div>
            <span className="text-[10px] font-mono" style={{ color: 'var(--text-mute, #8f8f8f)' }}>auditd daemon pid: 4</span>
          </div>

          <div className="p-2 max-h-56 overflow-y-auto font-mono text-[11px]">
            {auditLogs.map((log) => {
              const statusStyle: React.CSSProperties =
                log.status === 'ALLOWED'
                  ? { color: '#15803d', borderColor: 'rgba(21,128,61,0.3)', background: 'rgba(21,128,61,0.08)' }
                  : log.status === 'BLOCKED'
                  ? { color: '#ee0000', borderColor: 'rgba(238,0,0,0.3)', background: 'rgba(238,0,0,0.08)' }
                  : { color: '#b4760a', borderColor: 'rgba(245,166,35,0.35)', background: 'rgba(245,166,35,0.1)' };

              return (
                <div
                  key={log.id}
                  className="py-2 px-2 flex items-start justify-between space-x-3 border-t first:border-t-0"
                  style={{ borderColor: 'var(--hairline-soft, #f2f2f2)' }}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px]" style={{ color: 'var(--text-faint, #a1a1a1)' }}>{log.timestamp}</span>
                      <span className="font-semibold" style={{ color: 'var(--link, #0070f3)' }}>{log.user}</span>
                      <span style={{ color: 'var(--text-mute, #8f8f8f)' }}>→</span>
                      <span className="font-medium" style={{ color: 'var(--ink, #171717)' }}>{log.command}</span>
                    </div>
                    {log.reason && <p className="text-[10px]" style={{ color: 'var(--text-mute, #8f8f8f)' }}>{log.reason}</p>}
                  </div>

                  <span className="px-2 py-0.5 rounded-[6px] text-[9px] font-bold border tracking-wider flex-shrink-0" style={statusStyle}>
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

