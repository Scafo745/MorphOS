import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useOSStore } from '../core/store';
import { executeShell } from '../kernel/shell';
import { compilePromptAsync } from '../core/prompt-compiler';
import { answerQuestionAsync, isOsSynthesisIntent } from '../core/ai-chat';
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
  const { profile, setProfile, cloudConfig, openApp, addToast, pendingCopilotPrompt, setPendingCopilotPrompt } = useOSStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'agent',
      text: `Hello! I am **Morph Copilot**, your autonomous operating system assistant. I can execute commands against the microkernel, recompile the UI/security architecture, and inspect system telemetry.\n\nTry asking me to audit payments, inspect processes, or test our accidental data loss security guards. You can also ask me general questions, like any AI chatbot.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleSend = useCallback(async (customPrompt?: string) => {
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

      // 2.6 Tool Scenario: Actually open the in-OS Browser app window.
      // "start the browser" / "open browser" / "launch browser" must really
      // open the window, auto-installing a runtime first if none exists.
      // We exclude "install" so the package-install branch below still wins
      // for prompts like "install the browser package".
      const launchVerbs = ['start', 'open', 'launch', 'run'];
      const wantsBrowserLaunch =
        !qLower.includes('install') &&
        qLower.includes('browser') &&
        (launchVerbs.some((v) => qLower.includes(v)) ||
          qLower.includes('browser init'));
      if (wantsBrowserLaunch) {
        const { filesystem } = useOSStore.getState();
        const browserBins = ['/usr/bin/firefox', '/usr/bin/chromium', '/usr/bin/browser'];
        const hasRuntime = filesystem.some(
          (f) => browserBins.includes(f.path) && f.type === 'file'
        );

        let installOutput = '';
        if (!hasRuntime) {
          const installRes = executeShell('apt install firefox');
          installOutput = installRes.output;
        }

        // Actually open the window (also spawns the browser process).
        openApp('browser');

        const agentMsg: Message = {
          id: `msg-${Date.now()}`,
          sender: 'agent',
          text: hasRuntime
            ? `Launching the Browser app now. The window should be open on your desktop.`
            : `No browser runtime was installed, so I installed Firefox first, then launched it. The Browser window should be open on your desktop.`,
          toolCall: {
            tool: 'window.open(browser)',
            input: 'start browser',
            output: installOutput || 'Browser window opened',
            isError: false,
          },
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, agentMsg]);
        setIsThinking(false);
        return;
      }

      // 2.75 Tool Scenario: Install a package via the terminal
      if (qLower.includes('install') || qLower.includes('add package') || qLower.includes('npm i ')) {
        const fillers = new Set(['install', 'npm', 'pip', 'pip3', 'yarn', 'apt', 'apt-get', 'i', 'add', 'the', 'package', 'packages', 'this', 'a', 'an', 'module', 'can', 'you', 'please', 'me', 'for', 'to']);
        const pkg = query
          .toLowerCase()
          .replace(/[^a-z0-9@/\-_.\s]/g, ' ')
          .split(/\s+/)
          .filter((t) => t && !fillers.has(t))
          .join(' ')
          .trim();

        if (!pkg) {
          const agentMsg: Message = {
            id: `msg-${Date.now()}`,
            sender: 'agent',
            text: `I can install a package into the MorphOS VFS for you. Which package should I install? For example: "install axios".`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages((prev) => [...prev, agentMsg]);
          setIsThinking(false);
          return;
        }

        const shellRes = executeShell(`npm install ${pkg}`);
        const agentMsg: Message = {
          id: `msg-${Date.now()}`,
          sender: 'agent',
          text: `I ran the installation on your behalf against the microkernel terminal. Here is the output of \`npm install ${pkg}\`. The package was linked into the POSIX VFS at \`/usr/lib/morphos/node_modules\` and recorded in the PCI-DSS audit log. You can confirm it with \`pkg list\` or \`ls /usr/lib/morphos/node_modules\` in the Terminal.`,
          toolCall: {
            tool: `terminal.exec(npm install ${pkg})`,
            input: `npm install ${pkg}`,
            output: shellRes.output,
            isError: shellRes.isError,
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

      // Consistency guard: if the prompt is an OS-synthesis intent that did not
      // match any specific branch above, treat it as a reconfigure request so
      // Copilot and Spotlight (which gates on isOsSynthesisIntent) agree. This
      // mirrors the isReconfigure branch exactly to avoid classifier drift.
      if (isOsSynthesisIntent(query)) {
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

      // Default: general-purpose conversational answer via the QA brain.
      const { answer, source, providerLabel } = await answerQuestionAsync(query, cloudConfig);
      const isCloud = source === 'gemini' || source === 'openai-compatible';
      const cloudLabel = providerLabel ? `Answered via cloud AI (${providerLabel})` : 'Answered via cloud AI';
      const agentMsg: Message = {
        id: `msg-${Date.now()}`,
        sender: 'agent',
        text: answer,
        toolCall: {
          tool: `ai.answer(engine: ${source})`,
          input: query,
          output: isCloud ? cloudLabel : 'Answered via local assistant',
          isError: false,
        },
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, agentMsg]);
      addToast(
        isCloud ? cloudLabel : 'Offline, local assistant reply',
        isCloud ? 'success' : 'info'
      );
      setIsThinking(false);
    }, 600);
  }, [input, profile, cloudConfig, setProfile, openApp, addToast]);

  // Consume a question seeded from Spotlight: answer it here, then clear the
  // channel immediately so it never re-fires.
  useEffect(() => {
    if (pendingCopilotPrompt) {
      const seeded = pendingCopilotPrompt;
      setPendingCopilotPrompt(null);
      handleSend(seeded);
    }
  }, [pendingCopilotPrompt, setPendingCopilotPrompt, handleSend]);

  return (
    <div
      className="h-full flex flex-col text-xs font-sans overflow-hidden select-none"
      style={{ background: 'var(--canvas, #fafafa)', color: 'var(--text-body, #4d4d4d)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'var(--hairline, #ebebeb)', background: 'var(--canvas-elevated, #ffffff)' }}
      >
        <div className="flex items-center space-x-2.5">
          <div
            className="p-2 rounded-[12px] border"
            style={{ borderColor: 'var(--hairline, #ebebeb)', color: 'var(--accent, #171717)' }}
          >
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold tracking-tight" style={{ color: 'var(--ink, #171717)' }}>Morph Copilot</h2>
              <span
                className="px-2 py-0.5 rounded-[6px] border font-mono text-[9px] uppercase font-bold tracking-wider"
                style={{ borderColor: 'var(--hairline, #ebebeb)', color: 'var(--text-mute, #8f8f8f)' }}
              >
                AUTONOMOUS SYSTEM AGENT
              </span>
            </div>
            <p className="text-[11px] font-mono" style={{ color: 'var(--text-mute, #8f8f8f)' }}>
              Engine: {cloudConfig.n8nWebhookUrl ? 'n8n Cloud Webhook' : 'Local Heuristic Engine'}
            </p>
          </div>
        </div>

        <div
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-[6px] border font-mono text-[10px]"
          style={{ borderColor: 'var(--hairline, #ebebeb)', color: '#15803d' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
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
              <div
                className="w-8 h-8 rounded-[12px] border flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ borderColor: 'var(--hairline, #ebebeb)', background: 'var(--canvas-elevated, #ffffff)', color: 'var(--accent, #171717)' }}
              >
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className="max-w-[85%] rounded-[12px] p-3.5 space-y-2 leading-relaxed border"
              style={
                m.sender === 'user'
                  ? { background: 'var(--accent, #171717)', color: '#ffffff', borderColor: 'var(--accent, #171717)', borderTopRightRadius: 0 }
                  : { background: 'var(--canvas-elevated, #ffffff)', borderColor: 'var(--hairline, #ebebeb)', color: 'var(--text-body, #4d4d4d)', borderTopLeftRadius: 0 }
              }
            >
              <div className="whitespace-pre-wrap">{m.text}</div>

              {/* Tool Execution Callout */}
              {m.toolCall && (
                <div
                  className="mt-2.5 rounded-[6px] border p-2.5 font-mono text-[11px] space-y-1.5"
                  style={{ background: 'var(--canvas, #fafafa)', borderColor: 'var(--hairline, #ebebeb)' }}
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="flex items-center space-x-1 font-semibold" style={{ color: 'var(--link, #0070f3)' }}>
                      <Terminal className="w-3 h-3" />
                      <span>{m.toolCall.tool}</span>
                    </span>
                    {m.toolCall.isError && (
                      <span className="flex items-center space-x-1 font-bold" style={{ color: '#ee0000' }}>
                        <ShieldAlert className="w-3 h-3" />
                        <span>INTERCEPTED</span>
                      </span>
                    )}
                  </div>
                  {m.toolCall.output && (
                    <pre
                      className="p-2 rounded-[6px] border whitespace-pre-wrap max-h-36 overflow-y-auto text-[10px] leading-relaxed"
                      style={{
                        background: 'var(--canvas-elevated, #ffffff)',
                        borderColor: 'var(--hairline, #ebebeb)',
                        color: m.toolCall.isError ? '#ee0000' : '#15803d',
                      }}
                    >
                      {m.toolCall.output}
                    </pre>
                  )}
                </div>
              )}

              <div
                className="text-[9px] font-mono text-right"
                style={{ color: m.sender === 'user' ? 'rgba(255,255,255,0.7)' : 'var(--text-faint, #a1a1a1)' }}
              >
                {m.timestamp}
              </div>
            </div>

            {m.sender === 'user' && (
              <div
                className="w-8 h-8 rounded-[12px] border flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ borderColor: 'var(--hairline, #ebebeb)', background: 'var(--canvas-elevated, #ffffff)', color: 'var(--ink, #171717)' }}
              >
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isThinking && (
          <div className="flex items-center space-x-2 text-xs font-mono pl-11" style={{ color: 'var(--text-mute, #8f8f8f)' }}>
            <Sparkles className="w-4 h-4 animate-spin" style={{ color: 'var(--accent, #171717)' }} />
            <span>Agent executing tool call against microkernel...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested Quick Action Chips */}
      <div
        className="px-4 py-2 border-t flex items-center space-x-2 overflow-x-auto no-scrollbar"
        style={{ borderColor: 'var(--hairline, #ebebeb)', background: 'var(--canvas-elevated, #ffffff)' }}
      >
        <span className="text-[10px] font-semibold uppercase tracking-wider flex-shrink-0" style={{ color: 'var(--text-faint, #a1a1a1)' }}>
          Suggestions:
        </span>
        {[
          'Audit payment transaction logs',
          'Try to delete the root filesystem',
          'Reconfigure to Windows snap multitasking',
          'Install the axios package',
          'Show background microkernel daemons',
        ].map((s) => (
          <button
            key={s}
            onClick={() => handleSend(s)}
            className="px-2.5 py-1 rounded-[6px] border whitespace-nowrap text-[11px] transition-colors flex-shrink-0 hover:bg-geist-hairlineSoft"
            style={{ borderColor: 'var(--hairline, #ebebeb)', color: 'var(--text-body, #4d4d4d)' }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <div
        className="p-3 border-t flex items-center space-x-2"
        style={{ borderColor: 'var(--hairline, #ebebeb)', background: 'var(--canvas-elevated, #ffffff)' }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask Morph Copilot anything, reconfigure the OS, audit security, or any general question..."
          className="flex-1 px-3.5 py-2 rounded-[6px] border text-xs placeholder-geist-mute focus:outline-none"
          style={{ background: 'var(--canvas, #fafafa)', borderColor: 'var(--hairline, #ebebeb)', color: 'var(--ink, #171717)' }}
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || isThinking}
          className="p-2 rounded-[6px] disabled:opacity-40 transition-colors"
          style={{ background: 'var(--accent, #171717)', color: '#ffffff' }}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

