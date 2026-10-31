export type ThemeMode = 'macos' | 'windows' | 'cyber' | 'enterprise' | 'gothic' | 'custom';
export type DockStyle = 'macos-magnify' | 'windows-center' | 'cyber-minimal';
export type WindowControlsStyle = 'traffic-lights' | 'windows-squares' | 'cyber-minimal';
export type SnapMode = 'free' | 'windows-snap' | 'tiling';
export type SecurityLevel = 'standard' | 'strict-sudo' | 'zero-trust' | 'pci-dss-compliance';

export interface CustomTokens {
  bgDesktop: string;        // Desktop background wallpaper CSS gradient
  bgOrb1: string;           // Ambient orb 1 gradient
  bgOrb2: string;           // Ambient orb 2 gradient
  accentColor: string;      // Accent highlight (e.g. #f43f5e)
  accentGlow: string;       // Box shadow glow
  accentText: string;       // Accent text color
  windowBg: string;         // Window background rgba
  windowBorder: string;     // Window border color
  windowRadius: string;     // Border radius ('0px', '8px', '16px', '24px')
  windowBlur: string;       // Backdrop blur ('10px', '32px', '48px')
  dockBg: string;           // Dock background rgba
  dockBorder: string;       // Dock border
  dockRadius: string;       // Dock radius
  iconStyle: 'glass-gradient' | 'neon-glow' | 'gothic-dark' | 'minimal-outline' | 'golden-luxury' | 'retro-pixel' | 'pastel-cute';
  iconShape?: 'rounded' | 'sharp' | 'square' | 'circle' | 'squircle';
  terminalBg?: string;
  terminalTextColor?: string;
  terminalPromptColor?: string;
}

export interface OSProfile {
  name: string;
  tagline: string;
  theme: ThemeMode;
  dockStyle: DockStyle;
  controlsStyle: WindowControlsStyle;
  snapMode: SnapMode;
  securityLevel: SecurityLevel;
  userRole: 'root' | 'developer' | 'intern' | 'fintech_auditor';
  aiSummary?: string;
  customTokens: CustomTokens;
}

export type AppId = 'terminal' | 'filemanager' | 'settings' | 'security' | 'copilot' | 'notes' | 'hyperswitch';

export interface CloudConfig {
  n8nWebhookUrl: string;
  geminiApiKey: string;
  engineMode: 'auto' | 'n8n' | 'gemini' | 'local';
}

export interface SnapZone {
  type: 'left-half' | 'right-half' | 'maximize' | null;
}

export interface WindowState {
  id: string;
  appId: AppId;
  title: string;
  icon: string;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  preMaximizeState?: { position: { x: number; y: number }; size: { width: number; height: number } };
  snapZone?: SnapZone['type'];
}

export interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  content?: string;
  permissions: string;
  owner: 'root' | 'developer' | 'intern' | 'system' | 'fintech_auditor';
  classification: 'PUBLIC' | 'CONFIDENTIAL' | 'RESTRICTED';
  updatedAt: string;
  size: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  command: string;
  user: string;
  status: 'ALLOWED' | 'CHALLENGE_REQUIRED' | 'BLOCKED';
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';
  reason?: string;
}

export interface ProcessInfo {
  pid: number;
  ppid: number;
  name: string;
  user: string;
  status: 'RUNNING' | 'SLEEPING' | 'ZOMBIE';
  cpu: number;
  memory: number;
  isDaemon: boolean;
}

export interface SELinuxState {
  mode: 'Enforcing' | 'Permissive' | 'Disabled';
  policy: 'targeted' | 'mls' | 'zero-trust-strict';
  activeRules: number;
  violationsIntercepted: number;
}
