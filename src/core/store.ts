import { create } from 'zustand';
import { OSProfile, WindowState, AppId, FileItem, AuditLog, SnapZone, ProcessInfo, SELinuxState, CloudConfig, AiProvider, Toast, ToastVariant } from './types';
import { OS_PRESETS } from './presets';
import { INITIAL_FILESYSTEM } from '../kernel/filesystem';
import { INITIAL_PROCESSES } from '../kernel/process';

interface OSStore {
  // OS Shell State
  profile: OSProfile;
  isBooting: boolean;
  isSpotlightOpen: boolean;
  isCloudModalOpen: boolean;
  cloudConfig: CloudConfig;
  activeWindowId: string | null;
  windows: WindowState[];
  maxZIndex: number;

  // Microkernel Processes & SELinux
  processes: ProcessInfo[];
  selinux: SELinuxState;

  // File System & Security State
  filesystem: FileItem[];
  currentPath: string;
  auditLogs: AuditLog[];
  isSudoModalOpen: boolean;
  sudoPendingAction: (() => void) | null;
  sudoPromptMessage: string;

  // Toast notifications
  toasts: Toast[];

  // Seeding channel: a question routed from Spotlight into Copilot
  pendingCopilotPrompt: string | null;

  // Actions
  setProfile: (profile: OSProfile) => void;
  setBooting: (booting: boolean) => void;
  toggleSpotlight: (open?: boolean) => void;
  toggleCloudModal: (open?: boolean) => void;
  setCloudConfig: (config: Partial<CloudConfig>) => void;
  openApp: (appId: AppId, title?: string) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindowBounds: (id: string, pos: { x: number; y: number }, size: { width: number; height: number }) => void;
  snapWindow: (id: string, zone: SnapZone['type']) => void;

  // Process & Microkernel
  killProcess: (pid: number) => { success: boolean; message: string };
  setSELinuxMode: (mode: SELinuxState['mode']) => void;

  // VFS Manipulation
  writeFile: (path: string, content: string, classification?: FileItem['classification']) => void;
  deleteFile: (path: string) => boolean;
  chmodFile: (path: string, permissions: string) => boolean;
  mkdir: (path: string) => boolean;

  // Security & Audit
  triggerSudoChallenge: (message: string, onAuthorized: () => void) => void;
  resolveSudoChallenge: (success: boolean) => void;
  addAuditLog: (command: string, status: AuditLog['status'], reason?: string, severity?: AuditLog['severity']) => void;

  // Toasts
  addToast: (message: string, variant?: ToastVariant) => void;
  dismissToast: (id: string) => void;

  // Seeding channel action
  setPendingCopilotPrompt: (prompt: string | null) => void;
}

const generateProviderId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `gemini-${Date.now()}`;
};

const getSavedCloudConfig = (): CloudConfig => {
  try {
    const raw = localStorage.getItem('morphos_cloud_config');
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CloudConfig>;
      const providers: AiProvider[] = Array.isArray(parsed.providers) ? parsed.providers : [];
      const geminiApiKey = parsed.geminiApiKey ?? '';

      // Migrate a legacy single-key config into a gemini provider entry.
      if (providers.length === 0 && geminiApiKey) {
        providers.push({
          id: generateProviderId(),
          vendor: 'gemini',
          label: 'Gemini',
          apiKey: geminiApiKey,
          enabled: true,
        });
      }

      return {
        n8nWebhookUrl: parsed.n8nWebhookUrl ?? '',
        geminiApiKey,
        engineMode: parsed.engineMode ?? 'auto',
        providers,
      };
    }
  } catch {}
  return {
    n8nWebhookUrl: '',
    geminiApiKey: '',
    engineMode: 'auto',
    providers: [],
  };
};

export const useOSStore = create<OSStore>((set, get) => ({
  profile: OS_PRESETS['geist-base'],
  isBooting: true,
  isSpotlightOpen: false,
  isCloudModalOpen: false,
  cloudConfig: getSavedCloudConfig(),
  activeWindowId: 'win-terminal',
  maxZIndex: 10,

  processes: INITIAL_PROCESSES,
  selinux: {
    mode: 'Enforcing',
    policy: 'zero-trust-strict',
    activeRules: 418,
    violationsIntercepted: 2,
  },

  filesystem: INITIAL_FILESYSTEM,
  currentPath: '/home/developer',
  auditLogs: [
    {
      id: 'log-1',
      timestamp: '11:15:02',
      command: 'sys.boot --verify-integrity',
      user: 'system',
      status: 'ALLOWED',
      severity: 'INFO',
      reason: 'Kernel modules initialized with hardware SHA-256 check',
    },
    {
      id: 'log-2',
      timestamp: '11:15:08',
      command: 'selinux.enforce --strict',
      user: 'root',
      status: 'ALLOWED',
      severity: 'INFO',
      reason: 'PCI-DSS Rule 10.2: Mandatory access control active',
    },
  ],
  isSudoModalOpen: false,
  sudoPendingAction: null,
  sudoPromptMessage: '',

  toasts: [],

  pendingCopilotPrompt: null,

  windows: [
    {
      id: 'win-terminal',
      appId: 'terminal',
      title: 'zsh — Terminal — 80x24',
      icon: 'terminal',
      isMinimized: false,
      isMaximized: false,
      zIndex: 10,
      position: { x: 80, y: 70 },
      size: { width: 680, height: 420 },
    },
    {
      id: 'win-settings',
      appId: 'settings',
      title: 'MorphOS System Synthesizer',
      icon: 'settings',
      isMinimized: false,
      isMaximized: false,
      zIndex: 9,
      position: { x: 500, y: 110 },
      size: { width: 640, height: 460 },
    },
  ],

  setProfile: (newProfile) => {
    // Also adjust SELinux policy based on profile
    const selinuxMode =
      newProfile.securityLevel === 'pci-dss-compliance' || newProfile.securityLevel === 'strict-sudo'
        ? 'Enforcing'
        : newProfile.securityLevel === 'zero-trust'
        ? 'Enforcing'
        : 'Permissive';

    set((state) => ({
      profile: newProfile,
      selinux: {
        ...state.selinux,
        mode: selinuxMode,
        activeRules: newProfile.securityLevel === 'pci-dss-compliance' ? 512 : 380,
      },
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          command: `morph.recompile --profile "${newProfile.name}"`,
          user: newProfile.userRole,
          status: 'ALLOWED',
          severity: 'INFO',
          reason: `System runtime policy morphing executed successfully`,
        },
        ...state.auditLogs,
      ],
    }));
  },

  setBooting: (booting) => set({ isBooting: booting }),

  toggleSpotlight: (open) =>
    set((state) => ({ isSpotlightOpen: open !== undefined ? open : !state.isSpotlightOpen })),

  toggleCloudModal: (open) =>
    set((state) => ({ isCloudModalOpen: open !== undefined ? open : !state.isCloudModalOpen })),

  setCloudConfig: (partial) => {
    set((state) => {
      const updated = { ...state.cloudConfig, ...partial };
      try {
        localStorage.setItem('morphos_cloud_config', JSON.stringify(updated));
      } catch {}
      return { cloudConfig: updated };
    });
  },

  openApp: (appId, customTitle) => {
    const { windows, maxZIndex, processes } = get();
    const existing = windows.find((w) => w.appId === appId);

    if (existing) {
      const nextZ = maxZIndex + 5;
      const others = windows.filter((w) => w.id !== existing.id);
      set({
        windows: [...others, { ...existing, isMinimized: false, zIndex: nextZ }],
        activeWindowId: existing.id,
        maxZIndex: nextZ,
      });
      return;
    }

    const titles: Record<AppId, string> = {
      terminal: 'zsh — Terminal',
      filemanager: 'File Explorer — /home/developer',
      settings: 'MorphOS Synthesizer',
      security: 'Security & Compliance Guard',
      copilot: 'Morph Copilot — Autonomous Agent',
      notes: 'Scratchpad Notes',
      hyperswitch: 'Juspay Hyperswitch™ — Payments Orchestrator',
      browser: 'MorphOS Browser',
    };

    const nextZ = maxZIndex + 5;

    // Desired per-app size (upper bound). Clamp to the visible desktop so a
    // large default never spawns a window partly off-screen or bigger than the
    // viewport on small displays / projectors. Floors match the Rnd minimums
    // in Window.tsx (minWidth 340 / minHeight 220).
    const desiredSize =
      appId === 'hyperswitch'
        ? { width: 760, height: 520 }
        : appId === 'terminal'
        ? { width: 680, height: 420 }
        : appId === 'security'
        ? { width: 680, height: 480 }
        : appId === 'browser'
        ? { width: 820, height: 560 }
        : { width: 640, height: 440 };

    const MIN_W = 340;
    const MIN_H = 220;
    const TOP_BAR = 34; // menu bar height (matches snapWindow topBarH)
    const DOCK = 80; // reserved dock strip (matches snapWindow dockH)
    const MARGIN = 16; // keep windows off the viewport edges

    const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800;

    const availW = Math.max(MIN_W, viewportW - MARGIN * 2);
    const availH = Math.max(MIN_H, viewportH - TOP_BAR - DOCK - MARGIN);

    const width = Math.max(MIN_W, Math.min(desiredSize.width, availW));
    const height = Math.max(MIN_H, Math.min(desiredSize.height, availH));

    // Cascade spawn offset, then clamp the origin so the whole window stays on
    // screen (never past the right/bottom edges, never above the menu bar).
    const cascade = windows.length * 25;
    const maxX = Math.max(MARGIN, viewportW - width - MARGIN);
    const maxY = Math.max(TOP_BAR, viewportH - DOCK - height);
    const x = Math.min(80 + cascade, maxX);
    const y = Math.min(60 + cascade, maxY);

    const newWindow: WindowState = {
      id: `win-${Date.now()}`,
      appId,
      title: customTitle || titles[appId] || 'Application',
      icon: appId,
      isMinimized: false,
      isMaximized: false,
      zIndex: nextZ,
      position: { x, y },
      size: { width, height },
    };

    // Spawn a process in the process table
    const nextPid = Math.max(...processes.map((p) => p.pid), 100) + 1;
    const newProc: ProcessInfo = {
      pid: nextPid,
      ppid: 42,
      name: appId,
      user: get().profile.userRole,
      status: 'RUNNING',
      cpu: Number((Math.random() * 1.5 + 0.2).toFixed(1)),
      memory: Math.floor(Math.random() * 20 + 15),
      isDaemon: false,
    };

    set({
      windows: [...windows, newWindow],
      activeWindowId: newWindow.id,
      maxZIndex: nextZ,
      processes: [...processes, newProc],
    });
  },

  closeWindow: (id) =>
    set((state) => {
      const targetWin = state.windows.find((w) => w.id === id);
      return {
        windows: state.windows.filter((w) => w.id !== id),
        activeWindowId: state.windows.length > 1 ? state.windows[0].id : null,
        processes: targetWin ? state.processes.filter((p) => p.name !== targetWin.appId || p.isDaemon) : state.processes,
      };
    }),

  minimizeWindow: (id) =>
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, isMinimized: true } : w)),
      activeWindowId: null,
    })),

  maximizeWindow: (id) =>
    set((state) => ({
      windows: state.windows.map((w) => {
        if (w.id !== id) return w;
        if (w.isMaximized) {
          return {
            ...w,
            isMaximized: false,
            position: w.preMaximizeState?.position || { x: 100, y: 100 },
            size: w.preMaximizeState?.size || { width: 640, height: 440 },
            snapZone: undefined,
          };
        } else {
          return {
            ...w,
            isMaximized: true,
            preMaximizeState: { position: w.position, size: w.size },
            position: { x: 0, y: 32 },
            size: { width: window.innerWidth, height: window.innerHeight - 90 },
            snapZone: 'maximize',
          };
        }
      }),
    })),

  focusWindow: (id) => {
    const { maxZIndex, windows } = get();
    const nextZ = maxZIndex + 5;
    const target = windows.find((w) => w.id === id);
    if (!target) return;
    const others = windows.filter((w) => w.id !== id);
    set({
      windows: [...others, { ...target, zIndex: nextZ, isMinimized: false }],
      activeWindowId: id,
      maxZIndex: nextZ,
    });
  },

  updateWindowBounds: (id, pos, size) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, position: pos, size, isMaximized: false, snapZone: undefined } : w
      ),
    })),

  snapWindow: (id, zone) => {
    if (!zone) return;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const topBarH = 34;
    const dockH = 80;
    const availH = screenH - topBarH - dockH;

    set((state) => ({
      windows: state.windows.map((w) => {
        if (w.id !== id) return w;
        if (zone === 'left-half') {
          return {
            ...w,
            isMaximized: false,
            snapZone: 'left-half',
            position: { x: 0, y: topBarH },
            size: { width: Math.floor(screenW / 2), height: availH },
          };
        }
        if (zone === 'right-half') {
          return {
            ...w,
            isMaximized: false,
            snapZone: 'right-half',
            position: { x: Math.floor(screenW / 2), y: topBarH },
            size: { width: Math.floor(screenW / 2), height: availH },
          };
        }
        if (zone === 'maximize') {
          return {
            ...w,
            isMaximized: true,
            snapZone: 'maximize',
            position: { x: 0, y: topBarH },
            size: { width: screenW, height: availH },
          };
        }
        return w;
      }),
    }));
  },

  killProcess: (pid) => {
    const { processes, profile } = get();
    const target = processes.find((p) => p.pid === pid);
    if (!target) return { success: false, message: `kill: (${pid}) - No such process` };

    if (target.pid === 1) {
      return { success: false, message: `kill: (1) Operation not permitted: Cannot kill init/systemd` };
    }

    if (target.isDaemon && profile.userRole !== 'root') {
      return { success: false, message: `kill: (${pid}) Operation not permitted: Root elevation required to kill daemon '${target.name}'` };
    }

    set({ processes: processes.filter((p) => p.pid !== pid) });
    return { success: true, message: `Process ${pid} [${target.name}] terminated (SIGKILL)` };
  },

  setSELinuxMode: (mode) =>
    set((state) => ({
      selinux: { ...state.selinux, mode },
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          command: `setenforce ${mode === 'Enforcing' ? 1 : 0}`,
          user: state.profile.userRole,
          status: 'ALLOWED',
          severity: 'INFO',
          reason: `SELinux operating state switched to ${mode}`,
        },
        ...state.auditLogs,
      ],
    })),

  writeFile: (path, content, classification = 'PUBLIC') => {
    const { filesystem, profile } = get();
    const name = path.split('/').pop() || 'unnamed';
    const existing = filesystem.findIndex((f) => f.path === path);

    if (existing >= 0) {
      const updated = [...filesystem];
      updated[existing] = {
        ...updated[existing],
        content,
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        size: `${content.length} B`,
      };
      set({ filesystem: updated });
    } else {
      const newFile: FileItem = {
        id: `file-${Date.now()}`,
        name,
        path,
        type: 'file',
        content,
        permissions: '-rw-r--r--',
        owner: profile.userRole,
        classification,
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        size: `${content.length} B`,
      };
      set({ filesystem: [...filesystem, newFile] });
    }
  },

  deleteFile: (path) => {
    const { filesystem } = get();
    const exists = filesystem.some((f) => f.path === path);
    if (!exists) return false;
    set({ filesystem: filesystem.filter((f) => !f.path.startsWith(path)) });
    return true;
  },

  chmodFile: (path, permissions) => {
    const { filesystem } = get();
    const file = filesystem.find((f) => f.path === path);
    if (!file) return false;

    // Convert octal (e.g. "755") to standard rwxr-xr-x format if provided
    let permStr = permissions;
    if (/^[0-7]{3}$/.test(permissions)) {
      const parseOctal = (digit: string) => {
        const num = parseInt(digit, 10);
        return `${num & 4 ? 'r' : '-'}${num & 2 ? 'w' : '-'}${num & 1 ? 'x' : '-'}`;
      };
      permStr = `${file.type === 'directory' ? 'd' : '-'}${parseOctal(permissions[0])}${parseOctal(permissions[1])}${parseOctal(permissions[2])}`;
    }

    set({
      filesystem: filesystem.map((f) => (f.path === path ? { ...f, permissions: permStr } : f)),
    });
    return true;
  },

  mkdir: (path) => {
    const { filesystem, profile } = get();
    const name = path.split('/').pop() || 'new_dir';
    const exists = filesystem.some((f) => f.path === path);
    if (exists) return false;

    const newDir: FileItem = {
      id: `dir-${Date.now()}`,
      name,
      path,
      type: 'directory',
      permissions: 'drwxr-xr-x',
      owner: profile.userRole,
      classification: 'PUBLIC',
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      size: '4.0 KB',
    };
    set({ filesystem: [...filesystem, newDir] });
    return true;
  },

  triggerSudoChallenge: (message, onAuthorized) => {
    set({
      isSudoModalOpen: true,
      sudoPromptMessage: message,
      sudoPendingAction: onAuthorized,
    });
  },

  resolveSudoChallenge: (success) => {
    const { sudoPendingAction } = get();
    if (success && sudoPendingAction) {
      sudoPendingAction();
    }
    set({
      isSudoModalOpen: false,
      sudoPendingAction: null,
      sudoPromptMessage: '',
    });
  },

  addAuditLog: (command, status, reason, severity = 'INFO') => {
    const { profile } = get();
    set((state) => ({
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          command,
          user: profile.userRole,
          status,
          severity,
          reason,
        },
        ...state.auditLogs,
      ],
    }));
  },

  addToast: (message, variant = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((state) => ({ toasts: [...state.toasts, { id, message, variant }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },

  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  setPendingCopilotPrompt: (prompt) => set({ pendingCopilotPrompt: prompt }),
}));
