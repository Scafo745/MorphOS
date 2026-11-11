import { ProcessInfo } from '../core/types';

export const INITIAL_PROCESSES: ProcessInfo[] = [
  { pid: 1, ppid: 0, name: 'morph-init', user: 'root', status: 'RUNNING', cpu: 0.2, memory: 18.4, isDaemon: true },
  { pid: 2, ppid: 1, name: 'kthreadd', user: 'root', status: 'SLEEPING', cpu: 0.1, memory: 4.2, isDaemon: true },
  { pid: 3, ppid: 1, name: 'morph-policyd', user: 'root', status: 'RUNNING', cpu: 0.8, memory: 32.1, isDaemon: true },
  { pid: 4, ppid: 1, name: 'auditd [pci-dss]', user: 'root', status: 'RUNNING', cpu: 0.4, memory: 14.6, isDaemon: true },
  { pid: 42, ppid: 1, name: 'wm-compositor', user: 'developer', status: 'RUNNING', cpu: 2.1, memory: 64.0, isDaemon: true },
  { pid: 88, ppid: 1, name: 'vfs-broker', user: 'system', status: 'SLEEPING', cpu: 0.3, memory: 12.8, isDaemon: true },
  { pid: 120, ppid: 42, name: 'zsh', user: 'developer', status: 'RUNNING', cpu: 0.1, memory: 8.5, isDaemon: false },
  { pid: 142, ppid: 42, name: 'synthesizer-ui', user: 'developer', status: 'SLEEPING', cpu: 0.2, memory: 24.2, isDaemon: false },
];

