import { useOSStore } from '../core/store';
import { compilePromptToProfile } from '../core/prompt-compiler';
import { checkDestructiveSignature, evaluateFileSecurity } from './security';
import { FileItem } from '../core/types';

export interface ShellCommandResult {
  output: string;
  isError?: boolean;
}

/**
 * Resolves a path relative to the current directory
 */
function resolvePath(currentPath: string, target: string): string {
  if (!target) return currentPath;
  if (target === '/') return '/';
  if (target.startsWith('/')) {
    const parts = target.split('/').filter(Boolean);
    return '/' + parts.join('/');
  }
  if (target === '..') {
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    return '/' + parts.join('/') || '/';
  }
  const base = currentPath === '/' ? '' : currentPath;
  return `${base}/${target}`;
}

/**
 * Core command executor for single stage
 */
function executeSingleCommand(
  rawCmd: string,
  pipedInput: string = ''
): ShellCommandResult {
  const parts = rawCmd.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { output: pipedInput };

  const cmd = parts[0];
  const args = parts.slice(1);
  const store = useOSStore.getState();
  const { currentPath, filesystem, profile, processes, selinux } = store;

  // ── 0. DESTRUCTIVE COMMAND DEFENSE (Accidental Data Loss Prevention) ──
  const destCheck = checkDestructiveSignature(rawCmd);
  if (destCheck.isDestructive) {
    store.addAuditLog(rawCmd, 'BLOCKED', destCheck.reason, 'CRITICAL');
    return {
      output: `[CRITICAL SECURITY ALERT] Accidental Data Loss Guard:
Violation: ${destCheck.reason}
Action: Intercepted and blocked by MorphOS Microkernel LSM.
Syscall terminated with SIGABRT (exit code 134).`,
      isError: true,
    };
  }

  // ── 1. CLEAR ──
  if (cmd === 'clear') {
    return { output: '__CLEAR__' };
  }

  // ── 2. HELP ──
  if (cmd === 'help') {
    return {
      output: `MorphOS Microkernel Terminal Commands:
  System & Security:
    neofetch             Display MorphOS system specs & microkernel telemetry
    getenforce           Display active SELinux enforcement state
    setenforce <1|0>     Toggle SELinux mode (Enforcing vs Permissive)
    audit                Display real-time PCI-DSS security event logs
    morph <prompt>       Synthesize and recompile entire OS from CLI prompt!
    hyperswitch [status|reroute] Juspay financial switch telemetry & smart router
    whoami               Display current user role and security profile

  Packages:
    npm/pip install <pkg>      Install a node package into the VFS
    apt/pkg install <pkg>      Install a system package (e.g. firefox, tor, git)
    browser [init]             Start the installed browser runtime

  Processes & IPC:
    ps [-aux]            List active processes with PIDs and memory usage
    top                  Live microkernel scheduler telemetry
    kill [-9] <pid>      Terminate process by PID

  POSIX Storage & VFS:
    ls [-la]             List files and directories with ACL permissions
    cd <dir>             Change working directory
    pwd                  Print current working directory
    cat <file>           Read file contents (enforces ACL / Sudo rules)
    touch <file>         Create an empty file
    mkdir [-p] <dir>     Create a new directory
    rm [-rf] <file>      Remove file or directory (protected by Anti-Data Loss)
    chmod <octal> <file> Modify file permissions (e.g. chmod 755 app.ts)
    grep <pattern>       Search piped input or file for matching pattern
    echo <text>          Print text (supports > and >> redirection)
    sudo <command>       Execute command with root biometric authorization`,
    };
  }

  // ── 3. WHOAMI ──
  if (cmd === 'whoami') {
    return {
      output: `${profile.userRole} (context: u:r:${profile.userRole}_t:s0, selinux: ${selinux.mode})`,
    };
  }

  // ── 4. PWD ──
  if (cmd === 'pwd') {
    return { output: currentPath };
  }

  // ── 5. GETENFORCE & SETENFORCE ──
  if (cmd === 'getenforce') {
    return { output: selinux.mode };
  }

  if (cmd === 'setenforce') {
    const val = args[0];
    if (profile.userRole !== 'root') {
      store.addAuditLog(rawCmd, 'BLOCKED', 'setenforce requires root elevation', 'WARNING');
      return { output: 'setenforce: setenforce() failed: Permission denied (requires root)', isError: true };
    }
    const newMode = val === '1' || val === 'Enforcing' ? 'Enforcing' : 'Permissive';
    store.setSELinuxMode(newMode);
    return { output: `SELinux mode set to: ${newMode}` };
  }

  // ── 6. PS ──
  if (cmd === 'ps') {
    const header = `PID   PPID  USER             %CPU  MEM (MB)  STATUS   COMMAND`;
    const rows = processes.map((p) => {
      const pidStr = String(p.pid).padEnd(6);
      const ppidStr = String(p.ppid).padEnd(6);
      const userStr = p.user.padEnd(16);
      const cpuStr = p.cpu.toFixed(1).padStart(5);
      const memStr = `${p.memory.toFixed(1)}`.padStart(8);
      const statStr = p.status.padEnd(9);
      const cmdStr = p.name + (p.isDaemon ? ' [kthread]' : '');
      return `${pidStr}${ppidStr}${userStr}${cpuStr}  ${memStr}  ${statStr}${cmdStr}`;
    });
    return { output: `${header}\n${rows.join('\n')}` };
  }

  // ── 7. TOP ──
  if (cmd === 'top') {
    const totalMem = processes.reduce((acc, p) => acc + p.memory, 0);
    const avgCpu = processes.reduce((acc, p) => acc + p.cpu, 0);
    return {
      output: `top - ${new Date().toLocaleTimeString()} up 1:24,  1 user,  load average: 0.12, 0.08, 0.05
Tasks: ${processes.length} total,   2 running,   ${processes.length - 2} sleeping,   0 stopped,   0 zombie
%Cpu(s):  ${avgCpu.toFixed(1)} us,  0.4 sy,  0.0 ni, 97.2 id,  0.1 wa,  0.0 hi,  0.1 si
MiB Mem :   4096.0 total,   ${(4096 - totalMem).toFixed(1)} free,    ${totalMem.toFixed(1)} used,    256.0 buff/cache
SELinux: ${selinux.mode} (${selinux.activeRules} active rules loaded, policy: ${selinux.policy})

PID   USER             PR  NI    VIRT    RES  %CPU  %MEM     TIME+ COMMAND
${processes
  .slice(0, 6)
  .map(
    (p) =>
      `${String(p.pid).padEnd(6)}${p.user.padEnd(16)}20   0  128.4M  ${p.memory.toFixed(1).padStart(5)}M  ${p.cpu.toFixed(1).padStart(4)}   ${((p.memory / 4096) * 100).toFixed(1)}   0:04.12 ${p.name}`
  )
  .join('\n')}`,
    };
  }

  // ── 8. KILL ──
  if (cmd === 'kill') {
    const pidStr = args[args.length - 1];
    const pid = parseInt(pidStr, 10);
    if (isNaN(pid)) {
      return { output: 'usage: kill [-9] <pid>', isError: true };
    }
    const result = store.killProcess(pid);
    store.addAuditLog(rawCmd, result.success ? 'ALLOWED' : 'BLOCKED', result.message, result.success ? 'INFO' : 'WARNING');
    return { output: result.message, isError: !result.success };
  }

  // ── 9. GREP ──
  if (cmd === 'grep') {
    const pattern = args[0];
    if (!pattern) return { output: 'usage: grep <pattern> [file]', isError: true };

    let textToSearch = pipedInput;
    if (args.length > 1) {
      const fileTarget = resolvePath(currentPath, args[1]);
      const file = filesystem.find((f) => f.path === fileTarget && f.type === 'file');
      if (!file) return { output: `grep: ${args[1]}: No such file or directory`, isError: true };
      textToSearch = file.content || '';
    }

    const lines = textToSearch.split('\n');
    const matched = lines.filter((l) => l.toLowerCase().includes(pattern.toLowerCase()));
    return { output: matched.join('\n') };
  }

  // ── 10. ECHO ──
  if (cmd === 'echo') {
    const text = args.join(' ').replace(/^["']|["']$/g, '');
    return { output: text };
  }

  // ── 11. NEOFETCH ──
  if (cmd === 'neofetch') {
    return {
      output: `
   █████████   █████████   █████████   █████████    ${profile.name}
  ███     ███ ███     ███ ███     ███ ███     ███   -------------------
  ███     ███ ███     ███ ███     ███ ███           OS: MorphOS 2.4.0 (Enterprise Dynamic Runtime)
  ███████████ ███████████ ███████████  █████████    Kernel: Dynamic Adaptive Microkernel (v2.4.0-WASM)
  ███   ███   ███   ███   ███   ███          ███    Theme Engine: ${profile.theme.toUpperCase()} (Glass/Acrylic)
  ███    ███  ███    ███  ███    ███  █████████     Window Manager: ${profile.snapMode}
                                                    Security Policy: ${profile.securityLevel}
                                                    SELinux Status: ${selinux.mode} (${selinux.activeRules} rules)
                                                    User Identity: ${profile.userRole}
                                                    Active Processes: ${processes.length} tasks
                                                    Storage: In-Memory POSIX VFS
                                                    PCI-DSS Audit: Active
`,
    };
  }

  // ── 12. AUDIT ──
  if (cmd === 'audit') {
    const logs = store.auditLogs.slice(0, 8);
    const formatted = logs
      .map(
        (l) =>
          `[${l.timestamp}] [${l.status}] [${l.severity || 'INFO'}] by ${l.user}: "${l.command}" ${
            l.reason ? `(${l.reason})` : ''
          }`
      )
      .join('\n');
    return { output: `=== MorphOS Security & Compliance Audit Log (PCI-DSS) ===\n${formatted}` };
  }

  // ── 13. MORPH (CLI prompt synthesis) ──
  if (cmd === 'morph') {
    const promptText = args.join(' ');
    if (!promptText) {
      return {
        output: `Usage: morph <natural language prompt>\nExample: morph give me macos design with windows snap and strict linux security`,
        isError: true,
      };
    }
    const newProfile = compilePromptToProfile(promptText);
    store.setProfile(newProfile);
    return {
      output: `[MORPH MICROKERNEL] Compiling configuration tokens...
✓ Theme Engine: ${newProfile.theme}
✓ Window Compositor: ${newProfile.snapMode}
✓ Security Policy: ${newProfile.securityLevel} (SELinux: ${newProfile.securityLevel === 'pci-dss-compliance' ? 'Enforcing' : 'Targeted'})
✓ Active Role: ${newProfile.userRole}
✓ Summary: ${newProfile.aiSummary}`,
    };
  }

  // ── 13.5 HYPERSWITCH (Juspay financial router) ──
  if (cmd === 'hyperswitch' || cmd === 'juspay') {
    const sub = args[0] || 'status';
    if (sub === 'reroute') {
      return {
        output: `[JUSPAY HYPERSWITCH] Dynamic failover executed via ML router.
Traffic redistributed to HDFC (60%) and ICICI (40%). Active SR: 99.98%.`,
      };
    }
    return {
      output: `Juspay Hyperswitch™ Financial Core (PROD-BLR-01)
TPS: 1,842 txns/sec | Success Rate: 99.98% | P99: 16ms
Bank Rails:
  [HDFC UPI]   SR: 99.6% | Latency: 12ms | HEALTHY
  [ICICI Pay]  SR: 99.2% | Latency: 14ms | HEALTHY
  [AXIS Turbo] SR: 99.8% | Latency: 08ms | HEALTHY
  [SBI Direct] SR: 98.8% | Latency: 28ms | HEALTHY
PCI-DSS 4.0: Level 1 Enforced | LSM Cryptographic Tokenization: ACTIVE`,
    };
  }

  // ── 13.6 PACKAGE INSTALL (npm/yarn/pip/apt/pkg/systemctl — simulated) ──
  // Built-in catalog of known "system packages" so installs feel real.
  const SYSTEM_PACKAGES: Record<string, { version: string; description: string; browser?: boolean; alias?: string }> = {
    firefox: { version: '121.0', description: 'Mozilla Firefox web browser', browser: true },
    chromium: { version: '120.0.6099', description: 'Chromium open source browser', browser: true },
    chrome: { version: '120.0.6099', description: 'Chromium open source browser', browser: true, alias: 'chromium' },
    browser: { version: '1.0.0', description: 'MorphOS basic browser runtime', browser: true },
    tor: { version: '0.4.8.10', description: 'Tor anonymity network client' },
    git: { version: '2.43.0', description: 'Distributed version control system' },
    curl: { version: '8.5.0', description: 'Command line URL transfer tool' },
    wget: { version: '1.21.4', description: 'Network file retriever' },
    nodejs: { version: '20.11.0', description: 'Node.js JavaScript runtime' },
    node: { version: '20.11.0', description: 'Node.js JavaScript runtime', alias: 'nodejs' },
    python3: { version: '3.12.1', description: 'Python 3 interpreter' },
    vim: { version: '9.1', description: 'Vi IMproved text editor' },
    htop: { version: '3.3.0', description: 'Interactive process viewer' },
  };

  const nodeManagers = ['npm', 'yarn', 'pip', 'pip3'];
  const systemManagers = ['apt', 'apt-get', 'pkg'];
  const pkgManagers = [...nodeManagers, ...systemManagers];
  const isPkgManager = pkgManagers.includes(cmd);
  const installVerbs = ['install', 'i', 'add'];
  // Lenient: `systemctl install <pkg>` is not valid systemctl, but we treat it as an install.
  const isSystemctlInstall = cmd === 'systemctl' && args[0] === 'install';
  if (cmd === 'install' || isSystemctlInstall || (isPkgManager && installVerbs.includes(args[0]))) {
    const pkgArgs = (cmd === 'install' ? args : args.slice(1)).filter((a) => !a.startsWith('-'));
    if (pkgArgs.length === 0) {
      return { output: `usage: ${isPkgManager ? cmd : 'apt'} install <package>`, isError: true };
    }

    // System-package style output for apt/apt-get/pkg/systemctl, npm-style for node managers.
    const useSystemStyle = systemManagers.includes(cmd) || isSystemctlInstall;
    const lines: string[] = [];
    for (const rawPkg of pkgArgs) {
      const catalogKey = SYSTEM_PACKAGES[rawPkg]?.alias || rawPkg;
      const entry = SYSTEM_PACKAGES[catalogKey];

      if (entry) {
        const version = entry.version;
        if (useSystemStyle) {
          lines.push('Reading package lists... Done');
          lines.push('Building dependency tree... Done');
          lines.push(`The following NEW package will be installed:\n  ${catalogKey}`);
          lines.push(`Fetching ${catalogKey} ${version} (${entry.description})...`);
          lines.push(`Unpacking ${catalogKey} (${version})...`);
          lines.push(`Setting up ${catalogKey} (${version})...`);
          if (entry.browser) lines.push('Browser runtime registered');
          store.writeFile(
            `/usr/bin/${catalogKey}`,
            `#!/usr/bin/env morphos\n# ${catalogKey} ${version} - ${entry.description}\n`
          );
        } else {
          // Node-style install of a known package.
          store.writeFile(
            `/usr/lib/morphos/node_modules/${catalogKey}`,
            `${catalogKey}@${version} (${entry.description})`
          );
          lines.push(`[MorphOS PKG] Resolving ${catalogKey} from registry...`);
          lines.push(`✓ Fetched ${catalogKey}@${version}`);
          lines.push(`✓ Verified integrity (sha512) and SELinux policy (${selinux.mode})`);
          lines.push(`✓ Linked 1 package into /usr/lib/morphos/node_modules`);
          lines.push(`added 1 package in 0.${String(Math.floor(Math.random() * 900) + 100)}s`);
        }
        store.addAuditLog(rawCmd, 'ALLOWED', `Installed package ${catalogKey}`, 'INFO');
      } else {
        // Unknown package: keep the generic npm-style behavior so nothing regresses.
        const version = `${(rawPkg.length % 9) + 1}.${(rawPkg.length % 7) + 2}.${rawPkg.length % 10}`;
        const rand = String(Math.floor(Math.random() * 900) + 100);
        store.writeFile(
          `/usr/lib/morphos/node_modules/${rawPkg}`,
          `${rawPkg}@${version} (installed by MorphOS pkg manager)`
        );
        store.addAuditLog(rawCmd, 'ALLOWED', `Installed package ${rawPkg}`, 'INFO');
        lines.push(`[MorphOS PKG] Resolving ${rawPkg} from registry...`);
        lines.push(`✓ Fetched ${rawPkg}@${version}`);
        lines.push(`✓ Verified integrity (sha512) and SELinux policy (${selinux.mode})`);
        lines.push(`✓ Linked 1 package into /usr/lib/morphos/node_modules`);
        lines.push(`added 1 package in 0.${rand}s`);
      }
    }
    return { output: lines.join('\n') };
  }

  // ── 13.7 BROWSER INIT (simulated browser runtime) ──
  const isBrowserInit =
    cmd === 'browser' || (cmd === 'start' && args[0] === 'browser');
  if (isBrowserInit) {
    const browserBins = ['/usr/bin/firefox', '/usr/bin/chromium', '/usr/bin/browser'];
    const installed = filesystem.find((f) => browserBins.includes(f.path) && f.type === 'file');
    if (!installed) {
      return {
        output: 'No browser runtime found. Install one with: apt install firefox',
        isError: true,
      };
    }
    const pid = Math.floor(Math.random() * 9000) + 1000;
    store.addAuditLog(rawCmd, 'ALLOWED', `Started browser runtime from ${installed.path}`, 'INFO');
    return {
      output: `[MorphOS] Starting browser runtime...
✓ Spawned sandboxed browser process (pid ${pid})
✓ Loaded GPU compositor + network stack
✓ Browser ready. Navigate with: open <url>`,
    };
  }

  // ── 14. LS ──
  if (cmd === 'ls') {
    const showAll = args.includes('-la') || args.includes('-l') || args.includes('-a');
    const items = filesystem.filter((f) => {
      if (currentPath === '/') {
        return f.path.split('/').length === 2 && f.path !== '/';
      }
      return f.path.startsWith(currentPath + '/') && f.path.slice(currentPath.length + 1).indexOf('/') === -1;
    });

    if (items.length === 0) return { output: '' };

    if (showAll) {
      const rows = items.map((f) => {
        const classBadge =
          f.classification === 'RESTRICTED'
            ? '[RESTRICTED]'
            : f.classification === 'CONFIDENTIAL'
            ? '[CONFIDENTIAL]'
            : '';
        return `${f.permissions}  ${f.owner.padEnd(10)}  ${f.size.padStart(7)}  ${f.updatedAt}  ${f.name}${
          f.type === 'directory' ? '/' : ''
        } ${classBadge}`;
      });
      return { output: `total ${items.length}\n` + rows.join('\n') };
    }

    return { output: items.map((f) => `${f.name}${f.type === 'directory' ? '/' : ''}`).join('   ') };
  }

  // ── 15. CD ──
  if (cmd === 'cd') {
    const target = args[0] || '/home/developer';
    const resolved = resolvePath(currentPath, target);
    const exists = filesystem.some((f) => f.path === resolved && f.type === 'directory');

    if (!exists) {
      return { output: `cd: no such file or directory: ${target}`, isError: true };
    }

    // Role security check
    if (resolved === '/etc' && profile.securityLevel === 'pci-dss-compliance' && profile.userRole !== 'root') {
      store.addAuditLog(`cd ${target}`, 'BLOCKED', 'PCI-DSS restricts access to /etc without root elevation', 'WARNING');
      return { output: `cd: Permission denied: /etc is restricted under PCI-DSS compliance policy.`, isError: true };
    }

    useOSStore.setState({ currentPath: resolved });
    return { output: '' };
  }

  // ── 16. TOUCH ──
  if (cmd === 'touch') {
    const fileName = args[0];
    if (!fileName) return { output: 'usage: touch <filename>', isError: true };
    const resolved = resolvePath(currentPath, fileName);
    store.writeFile(resolved, '');
    store.addAuditLog(`touch ${fileName}`, 'ALLOWED', `Created empty file ${resolved}`);
    return { output: '' };
  }

  // ── 17. MKDIR ──
  if (cmd === 'mkdir') {
    const dirName = args.filter((a) => !a.startsWith('-'))[0];
    if (!dirName) return { output: 'usage: mkdir [-p] <dirname>', isError: true };
    const resolved = resolvePath(currentPath, dirName);
    const ok = store.mkdir(resolved);
    if (!ok) return { output: `mkdir: cannot create directory '${dirName}': File exists`, isError: true };
    store.addAuditLog(`mkdir ${dirName}`, 'ALLOWED', `Created directory ${resolved}`);
    return { output: '' };
  }

  // ── 18. CHMOD ──
  if (cmd === 'chmod') {
    if (args.length < 2) return { output: 'usage: chmod <octal|mode> <file>', isError: true };
    const mode = args[0];
    const target = resolvePath(currentPath, args[1]);
    const ok = store.chmodFile(target, mode);
    if (!ok) return { output: `chmod: cannot access '${args[1]}': No such file or directory`, isError: true };
    store.addAuditLog(`chmod ${mode} ${args[1]}`, 'ALLOWED', `Updated permissions on ${target}`);
    return { output: '' };
  }

  // ── 19. RM ──
  if (cmd === 'rm') {
    const targetName = args.filter((a) => !a.startsWith('-'))[0];
    if (!targetName) return { output: 'usage: rm [-rf] <file>', isError: true };
    const resolved = resolvePath(currentPath, targetName);
    const ok = store.deleteFile(resolved);
    if (!ok) return { output: `rm: cannot remove '${targetName}': No such file or directory`, isError: true };
    store.addAuditLog(`rm ${targetName}`, 'ALLOWED', `Deleted file/directory ${resolved}`);
    return { output: '' };
  }

  // ── 20. CAT ──
  if (cmd === 'cat') {
    const target = args[0];
    if (!target) return { output: pipedInput || 'usage: cat <file>', isError: !pipedInput };

    const resolved = resolvePath(currentPath, target);
    const file = filesystem.find((f) => f.path === resolved && f.type === 'file');

    if (!file) {
      return { output: `cat: ${target}: No such file or directory`, isError: true };
    }

    // Run deep security check
    const secEval = evaluateFileSecurity(file, 'read', profile, selinux);
    if (!secEval.allowed) {
      store.addAuditLog(`cat ${target}`, 'CHALLENGE_REQUIRED', secEval.message, secEval.auditSeverity);
      return {
        output: `cat: ${target}: Permission denied (${file.permissions} ${file.owner}:${file.owner})
[SECURITY GUARD] ${secEval.message}
Execute with 'sudo cat ${target}' to authenticate with biometric elevation.`,
        isError: true,
      };
    }

    store.addAuditLog(`cat ${target}`, 'ALLOWED', `Authorized read of ${file.path}`);
    return { output: file.content || '(empty file)' };
  }

  // ── 21. SUDO ──
  if (cmd === 'sudo') {
    const subCommand = args.join(' ');
    if (!subCommand) return { output: 'usage: sudo <command>', isError: true };
    // Elevate and actually run the wrapped command. The inner command goes back
    // through executeSingleCommand, so the destructive-command guard still applies.
    const inner = executeSingleCommand(subCommand, pipedInput);
    const authNote = `[sudo] authorization accepted for ${profile.userRole}`;
    return {
      output: inner.output ? `${authNote}\n${inner.output}` : authNote,
      isError: inner.isError,
    };
  }

  return {
    output: `zsh: command not found: ${cmd}. Type 'help' for available commands.`,
    isError: true,
  };
}

/**
 * Handles pipelines (e.g. `ps | grep daemon`) and redirection (e.g. `echo "hi" > test.txt`)
 */
export function executeShell(rawInput: string): ShellCommandResult {
  const input = rawInput.trim();
  if (!input) return { output: '' };

  const store = useOSStore.getState();

  // 1. Check for output redirection (> or >>)
  if (input.includes(' > ') || input.includes(' >> ')) {
    const isAppend = input.includes(' >> ');
    const [commandPart, filePart] = input.split(isAppend ? ' >> ' : ' > ');
    const targetFile = filePart.trim();
    const result = executeShell(commandPart.trim());

    if (!result.isError && targetFile) {
      const resolved = resolvePath(store.currentPath, targetFile);
      const existing = store.filesystem.find((f: FileItem) => f.path === resolved);
      const newContent = isAppend && existing ? `${existing.content}\n${result.output}` : result.output;
      store.writeFile(resolved, newContent);
      store.addAuditLog(input, 'ALLOWED', `Redirected output to ${resolved}`);
      return { output: '' };
    }
    return result;
  }

  // 2. Check for pipe (|)
  if (input.includes('|')) {
    const stages = input.split('|').map((s) => s.trim()).filter(Boolean);
    let pipedOutput = '';

    for (let i = 0; i < stages.length; i++) {
      const stageResult = executeSingleCommand(stages[i], pipedOutput);
      if (stageResult.isError) {
        return stageResult;
      }
      pipedOutput = stageResult.output;
    }

    return { output: pipedOutput };
  }

  // 3. Single command execution
  return executeSingleCommand(input);
}
