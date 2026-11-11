import { FileItem, OSProfile, SELinuxState } from '../core/types';

export interface SecurityEvaluation {
  allowed: boolean;
  requiresSudo: boolean;
  message?: string;
  auditSeverity: 'INFO' | 'WARNING' | 'CRITICAL';
}

/**
 * Checks if a command exhibits destructive signatures that would cause irreversible data loss.
 */
export function checkDestructiveSignature(command: string): { isDestructive: boolean; reason?: string } {
  const normalized = command.toLowerCase().trim();

  // Root tree wiping
  if (
    normalized.includes('rm -rf /') ||
    normalized.includes('rm -r /') ||
    normalized.includes('rm -rf *') ||
    normalized.includes('rm -rf /etc') ||
    normalized.includes('rm -rf /var') ||
    normalized.includes('rm -rf /bin')
  ) {
    return {
      isDestructive: true,
      reason: 'Attempted catastrophic deletion of system root hierarchy (rm -rf). Blocked by MorphOS Accidental Data Loss Guard.',
    };
  }

  // Raw block device destruction
  if (normalized.includes('dd if=/dev/') || normalized.includes('mkfs')) {
    return {
      isDestructive: true,
      reason: 'Attempted raw filesystem format/overwrite on block device. Blocked by Microkernel Storage Guard.',
    };
  }

  // SQL data destruction
  if (normalized.includes('drop database') || normalized.includes('drop table') || normalized.includes('truncate table')) {
    return {
      isDestructive: true,
      reason: 'Unconstrained SQL drop/truncate without safety partition. Blocked by Zero-Trust DB Proxy.',
    };
  }

  return { isDestructive: false };
}

/**
 * Evaluates whether a subject (user role) can perform read/write/exec on a target file.
 */
export function evaluateFileSecurity(
  file: FileItem,
  mode: 'read' | 'write' | 'execute',
  profile: OSProfile,
  selinux: SELinuxState
): SecurityEvaluation {
  const isRoot = profile.userRole === 'root';
  const role = profile.userRole;

  // 1. Root always has access in Permissive or Disabled modes
  if (isRoot && selinux.mode !== 'Enforcing') {
    return { allowed: true, requiresSudo: false, auditSeverity: 'INFO' };
  }

  // 2. PCI-DSS Compliance Enforcement
  if (profile.securityLevel === 'pci-dss-compliance') {
    if (file.path.startsWith('/var/log/transactions') && mode === 'write') {
      return {
        allowed: false,
        requiresSudo: true,
        message: 'PCI-DSS Section 10.5: Transaction audit logs are append-only and cryptographically immutable.',
        auditSeverity: 'CRITICAL',
      };
    }

    if (file.classification === 'RESTRICTED' && role !== 'fintech_auditor' && !isRoot) {
      return {
        allowed: false,
        requiresSudo: true,
        message: 'PCI-DSS Compliance: Access to cardholder data / system credentials requires Auditor or Root clearance.',
        auditSeverity: 'WARNING',
      };
    }
  }

  // 3. Strict Sudo Mode
  if (profile.securityLevel === 'strict-sudo' || profile.securityLevel === 'zero-trust') {
    if (file.classification === 'RESTRICTED' && !isRoot) {
      return {
        allowed: false,
        requiresSudo: true,
        message: `Zero-Trust Policy: Classification '${file.classification}' requires administrative biometric escalation.`,
        auditSeverity: 'WARNING',
      };
    }
  }

  // 4. Intern Sandbox Protection
  if (role === 'intern') {
    if (mode === 'write' && (file.path.startsWith('/etc') || file.path.startsWith('/bin') || file.path.startsWith('/var'))) {
      return {
        allowed: false,
        requiresSudo: false,
        message: 'Intern Sandbox: Write operations to system infrastructure directories are prohibited.',
        auditSeverity: 'CRITICAL',
      };
    }
  }

  // 5. Standard POSIX DAC check
  // Check user ownership
  if (file.owner === role || isRoot) {
    return { allowed: true, requiresSudo: false, auditSeverity: 'INFO' };
  }

  // If file permissions do not allow other read/write
  if (file.permissions.endsWith('---') && !isRoot) {
    return {
      allowed: false,
      requiresSudo: true,
      message: `Permission denied (${file.permissions} ${file.owner}:${file.owner})`,
      auditSeverity: 'WARNING',
    };
  }

  return { allowed: true, requiresSudo: false, auditSeverity: 'INFO' };
}

