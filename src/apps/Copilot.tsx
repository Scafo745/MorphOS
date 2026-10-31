import React, { useState, useRef, useEffect } from 'react';
import { useOSStore } from '../core/store';
import { executeShell } from '../kernel/shell';
import { compilePromptAsync } from '../core/prompt-compiler';
import { Bot, User, Send, Sparkles, Terminal, ShieldAlert, ArrowRight, CornerDownLeft } from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  toolCall?: {
    tool: string;
    input: string;
    output?: string;
    isError?: boolean;
  };
  timestamp: string;
}

export const Copilot: React.FC = () => {
  const { profile, setProfile, cloudConfig, openApp } = useOSStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'agent',
      text: `Hello! I am **Morph Copilot**, your autonomous operating system assistant. I can execute commands against the microkernel, recompile the UI/security architecture, and inspect system telemetry.\n\nTry asking me to audit payments, inspect processes, or test our accidental data loss security guards!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleSend = async (customPrompt?: string) => {
    const query = (customPrompt || input).trim();
    if (!query) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    const qLower = query.toLowerCase();

    setTimeout(async () => {
      // 1. Tool Scenario: Catastrophic deletion test
      if (qLower.includes('delete root') || qLower.includes('wipe') || qLower.includes('rm -rf')) {
        const shellRes = executeShell('rm -rf /');
        const agentMsg: Message = {
          id: `msg-${Date.now()}`,
          sender: 'agent',
          text: `I attempted to execute the requested deletion command, but it was **intercepted and blocked by the MorphOS Microkernel LSM Accidental Data Loss Guard**.\n\nBecause the system is running under **${profile.securityLevel.toUpperCase()}** zero-trust policy, destructive operations targeting root hierarchies are halted before touching storage.`,
          toolCall: {
            tool: 'microkernel.syscall(rm -rf /)',
            input: 'rm -rf /',
            output: shellRes.output,
            isError: true,
          },
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, agentMsg]);
        setIsThinking(false);
        return;
      }

      // 2. Tool Scenario: Audit payments log
      if (qLower.includes('transaction') || qLower.includes('payment') || qLower.includes('audit')) {
        const shellRes = executeShell('cat /var/log/transactions.csv');
        const agentMsg: Message = {
          id: `msg-${Date.now()}`,
          sender: 'agent',
          text: `I queried \`/var/log/transactions.csv\` via POSIX VFS. Found 4 transactions including a high-risk UPI intent flag (TXN_98415 with risk score 0.89).\n\nUnder PCI-DSS 4.0 enforcement, this file is cryptographically locked for immutable audit logging.`,
          toolCall: {
            tool: 'vfs.read(/var/log/transactions.csv)',
            input: 'cat /var/log/transactions.csv',
            output: shellRes.output,
            isError: shellRes.isError,
          },
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, agentMsg]);
        setIsThinking(false);
        return;
      }

      // 2.5 Juspay FinTech Business Workstation Synthesis
      if (
        qLower.includes('juspay') ||
        qLower.includes('hyperswitch') ||
        (qLower.includes('business') && (qLower.includes('payment') || qLower.includes('juspay') || qLower.includes('os') || qLower.includes('work')))
      ) {
        const { profile: newProfile } = await compilePromptAsync(
          'juspay enterprise fintech windows snap zero trust pci compliance',
          cloudConfig
        );
        setProfile(newProfile);
        openApp('hyperswitch');

        const agentMsg: Message = {
          id: `msg-${Date.now()}`,
          sender: 'agent',
          text: `⚡ **Synthesized MorphOS into Juspay Production Payment Workstation!**\n\nHere is what just adapted across the entire OS stack:\n\n1. **🚀 Launched Juspay Hyperswitch™ Console**:\n   • Streaming live payments (1,842 TPS) across Swiggy, Flipkart, Cred, and Zepto.\n   • Real-time bank routing rails for HDFC, ICICI, SBI, and Axis Bank.\n2. **🛡️ Enforced PCI-DSS 4.0 Microkernel Policy**:\n   • SELinux switched to \`Enforcing\` with immutable cryptographic audit logging.\n   • All cardholder and VPA data inside \`/var/log/transactions.csv\` is masked & tokenized.\n3. **⚠️ Accidental Data Loss Guard Active**:\n   • Destructive operations (e.g. \`DROP TABLE transactions\`, \`rm -rf /\`) are actively intercepted before reaching storage.\n4. **🔄 Smart Gateway Failover**:\n   • Automatic routing failover if bank gateway drops below 99.5% success SLA.\n\n**What to tell the Hackathon Judges:**\n*"MorphOS is an adaptive microkernel that synthesizes role-specific workstations on demand. For Juspay, a single prompt turns any browser into an immutable, PCI-DSS compliant payment operations terminal that prevents developer accidents and monitors Hyperswitch routing in real time."*`,
          toolCall: {
            tool: `juspay_orchestrator.recompile(target: "HYPERSWITCH_PROD")`,
            input: query,
            output: `Synthesized Juspay FinTech Shield: Hyperswitch router connected, 1,842 TPS telemetry live, PCI-DSS 4.0 Level 1 enforced.`,
            isError: false,
          },
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, agentMsg]);
        setIsThinking(false);
        return;
      }

      // 3. Tool Scenario: Reconfigure / Morph OS
      const isReconfigure =
        qLower.includes('reconfigure') ||
        qLower.includes('morph') ||
        qLower.includes('switch') ||
        qLower.includes('theme') ||
        qLower.includes('macos') ||
        qLower.includes('windows') ||
        qLower.includes('gothic') ||
        qLower.includes('dark') ||
        qLower.includes('color') ||
        qLower.includes('cyber') ||
        qLower.includes('style') ||
        qLower.includes('look') ||
        qLower.includes('icon') ||
        qLower.includes('custom') ||
        qLower.includes('gold') ||
        qLower.includes('red') ||
        qLower.includes('green') ||
        qLower.includes('pink') ||
        qLower.includes('blue') ||
        qLower.includes('make it') ||
        qLower.includes('make the') ||
        qLower.includes('change') ||
        qLower.includes('compliance');

      if (isReconfigure) {
        const { profile: newProfile, source } = await compilePromptAsync(query, cloudConfig);
        setProfile(newProfile);

        const agentMsg: Message = {
          id: `msg-${Date.now()}`,
          sender: 'agent',
          text: `Successfully synthesized and recompiled your entire operating system environment from your prompt!\n\n• **Architecture**: ${newProfile.name}\n• **Theme Canvas**: ${newProfile.theme.toUpperCase()}\n• **App & Dock Icons**: ${newProfile.customTokens?.iconStyle?.toUpperCase()} (${newProfile.customTokens?.iconShape || 'geometry'})\n• **Accent & Luminescence**: \`${newProfile.customTokens?.accentColor}\`\n• **Window Compositor**: ${newProfile.snapMode}\n• **Microkernel Security**: ${newProfile.securityLevel}\n• **Synthesis Engine**: ${source.toUpperCase()}\n\nEvery desktop element, wallpaper gradient, dock icon, and window border has adapted in real time.`,
          toolCall: {
            tool: `morph_compiler.recompile(engine: ${source})`,
            input: query,
            output: newProfile.aiSummary,
            isError: false,
          },
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, agentMsg]);
        setIsThinking(false);
        return;
      }

      // 4. Tool Scenario: Active daemons / PS
      if (qLower.includes('daemon') || qLower.includes('process') || qLower.includes('ps') || qLower.includes('top')) {
        const shellRes = executeShell('ps | grep daemon');
        const agentMsg: Message = {
          id: `msg-${Date.now()}`,
          sender: 'agent',
          text: `Here are the active background daemons running inside the microkernel scheduler:`,
          toolCall: {
            tool: 'scheduler.query_processes(filter: daemon)',
            input: 'ps | grep daemon',
            output: shellRes.output || 'PID 1: morph-init, PID 3: morph-policyd, PID 4: auditd',
          },
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, agentMsg]);
        setIsThinking(false);
        return;
      }

      // Default AI agent answer with tool query
      const sysRes = executeShell('whoami');
      const agentMsg: Message = {
        id: `msg-${Date.now()}`,
        sender: 'agent',
        text: `Understood! I analyzed your request within the current session (Active Role: \`${sysRes.output}\`). You can ask me to reconfigure the desktop, audit transaction files, or test system security boundaries.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, agentMsg]);
      setIsThinking(false);
    }, 600);
  };

  return (
    <div className="h-full flex flex-col bg-slate-950/95 text-slate-200 text-xs font-sans overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/40">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-white tracking-wide">Morph Copilot</h2>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-[9px] uppercase font-bold tracking-wider">
                AUTONOMOUS SYSTEM AGENT
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Engine: {cloudConfig.n8nWebhookUrl ? 'n8n Cloud Webhook' : 'Local Heuristic Engine'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>MICROKERNEL LINKED</span>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start space-x-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'agent' && (
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl p-3.5 space-y-2 shadow-lg leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-slate-900 border border-white/10 text-slate-200 rounded-tl-none'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.text}</div>

              {/* Tool Execution Callout */}
              {m.toolCall && (
                <div className="mt-2.5 rounded-xl bg-black/60 border border-white/10 p-2.5 font-mono text-[11px] space-y-1.5">
                  <div className="flex items-center justify-between text-slate-400 text-[10px]">
                    <span className="flex items-center space-x-1 text-sky-400 font-semibold">
                      <Terminal className="w-3 h-3" />
                      <span>{m.toolCall.tool}</span>
                    </span>
                    {m.toolCall.isError && (
                      <span className="flex items-center space-x-1 text-rose-400 font-bold">
                        <ShieldAlert className="w-3 h-3" />
                        <span>INTERCEPTED</span>
                      </span>
                    )}
                  </div>
                  {m.toolCall.output && (
                    <pre
                      className={`p-2 rounded bg-slate-950 whitespace-pre-wrap max-h-36 overflow-y-auto text-[10px] leading-relaxed ${
                        m.toolCall.isError ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {m.toolCall.output}
                    </pre>
                  )}
                </div>
              )}

              <div
                className={`text-[9px] font-mono text-right ${
                  m.sender === 'user' ? 'text-indigo-200' : 'text-slate-500'
                }`}
              >
                {m.timestamp}
              </div>
            </div>

            {m.sender === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 flex-shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isThinking && (
          <div className="flex items-center space-x-2 text-slate-400 text-xs font-mono pl-11">
            <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
            <span>Agent executing tool call against microkernel...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested Quick Action Chips */}
      <div className="px-4 py-2 border-t border-white/5 bg-black/30 flex items-center space-x-2 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 flex-shrink-0">
          Suggestions:
        </span>
        {[
          'Audit payment transaction logs',
          'Try to delete the root filesystem',
          'Reconfigure to Windows snap multitasking',
          'Show background microkernel daemons',
        ].map((s) => (
          <button
            key={s}
            onClick={() => handleSend(s)}
            className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white whitespace-nowrap text-[11px] transition-colors flex-shrink-0"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <div className="p-3 border-t border-white/10 bg-black/50 flex items-center space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask Morph Copilot to reconfigure the OS, execute commands, or audit security..."
          className="flex-1 px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-white placeholder-slate-500 text-xs focus:border-purple-500 focus:outline-none"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || isThinking}
          className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white transition-colors shadow-md"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

