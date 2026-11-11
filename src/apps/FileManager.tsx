import React, { useState } from 'react';
import { useOSStore } from '../core/store';
import { FileItem } from '../core/types';
import { Folder, FileText, Lock, ShieldCheck, ChevronRight, CornerDownLeft } from 'lucide-react';

export const FileManager: React.FC = () => {
  const { filesystem, profile, triggerSudoChallenge, addAuditLog } = useOSStore();
  const [activeFolder, setActiveFolder] = useState<string>('/home/developer');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  // Get items in current directory
  const currentItems = filesystem.filter((f) => {
    if (activeFolder === '/') {
      return f.path.split('/').length === 2 && f.path !== '/';
    }
    return f.path.startsWith(activeFolder + '/') && f.path.slice(activeFolder.length + 1).indexOf('/') === -1;
  });

  const handleOpenItem = (item: FileItem) => {
    if (item.type === 'directory') {
      setActiveFolder(item.path);
      setSelectedFile(null);
    } else {
      // Security Check: Is file restricted?
      const isRestricted = item.classification === 'RESTRICTED' || item.classification === 'CONFIDENTIAL';
      const isRoot = profile.userRole === 'root';

      if (isRestricted && !isRoot && (profile.securityLevel === 'strict-sudo' || profile.securityLevel === 'pci-dss-compliance')) {
        addAuditLog(`file_manager.open ${item.path}`, 'CHALLENGE_REQUIRED', 'Accessing restricted storage');
        triggerSudoChallenge(`Privilege elevation required to decrypt classified file: "${item.name}"`, () => {
          setSelectedFile(item);
          addAuditLog(`file_manager.open ${item.path}`, 'ALLOWED', 'Decryption authorized via biometric MFA');
        });
      } else {
        setSelectedFile(item);
        addAuditLog(`file_manager.open ${item.path}`, 'ALLOWED', 'File inspected');
      }
    }
  };

  const navigateUp = () => {
    if (activeFolder === '/') return;
    const parts = activeFolder.split('/').filter(Boolean);
    parts.pop();
    setActiveFolder('/' + parts.join('/') || '/');
    setSelectedFile(null);
  };

  return (
    <div
      className="h-full flex flex-col text-xs font-sans select-none overflow-hidden"
      style={{ background: 'var(--canvas, #fafafa)', color: 'var(--text-body, #4d4d4d)' }}
    >
      {/* Top Navigation Bar */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: 'var(--hairline, #ebebeb)', background: 'var(--canvas-elevated, #ffffff)' }}
      >
        <div className="flex items-center space-x-2">
          <button
            onClick={navigateUp}
            disabled={activeFolder === '/'}
            className="p-1 rounded-[6px] disabled:opacity-30 transition-colors hover:bg-geist-hairlineSoft"
            style={{ color: 'var(--ink, #171717)' }}
            title="Go up"
          >
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center space-x-1 font-mono text-[11px]">
            <span style={{ color: 'var(--text-mute, #8f8f8f)' }}>Path:</span>
            <span className="font-semibold" style={{ color: 'var(--link, #0070f3)' }}>{activeFolder}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 font-mono text-[10px]">
          <span
            className="px-2 py-0.5 rounded-[6px] border"
            style={{ borderColor: 'var(--hairline, #ebebeb)', color: 'var(--text-mute, #8f8f8f)' }}
          >
            {currentItems.length} items
          </span>
          <span
            className="px-2 py-0.5 rounded-[6px] border flex items-center space-x-1"
            style={{ borderColor: 'var(--hairline, #ebebeb)', color: '#15803d' }}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>ACL ACTIVE</span>
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div
          className="w-44 border-r p-2 space-y-1 overflow-y-auto"
          style={{ borderColor: 'var(--hairline, #ebebeb)', background: 'var(--canvas-elevated, #ffffff)' }}
        >
          <div
            className="text-[10px] uppercase tracking-wider font-semibold px-2 py-1 font-mono"
            style={{ color: 'var(--text-faint, #a1a1a1)' }}
          >
            Locations
          </div>
          {[
            { name: 'Developer Home', path: '/home/developer' },
            { name: 'Root (/)', path: '/' },
            { name: 'System (/etc)', path: '/etc' },
            { name: 'Audit Logs (/var/log)', path: '/var/log' },
          ].map((loc) => (
            <button
              key={loc.path}
              onClick={() => {
                setActiveFolder(loc.path);
                setSelectedFile(null);
              }}
              className="w-full flex items-center space-x-2 px-2 py-1.5 rounded-[6px] text-left transition-colors"
              style={
                activeFolder === loc.path
                  ? { background: 'var(--accent-dim, rgba(23,23,23,0.06))', color: 'var(--ink, #171717)', fontWeight: 500 }
                  : { color: 'var(--text-mute, #8f8f8f)' }
              }
            >
              <Folder className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--link, #0070f3)' }} />
              <span className="truncate">{loc.name}</span>
            </button>
          ))}
        </div>

        {/* Directory Listing */}
        <div className="flex-1 p-3 overflow-y-auto">
          <div className="grid grid-cols-1 gap-1">
            {currentItems.map((item) => (
              <div
                key={item.id}
                onDoubleClick={() => handleOpenItem(item)}
                onClick={() => setSelectedFile(item)}
                className="flex items-center justify-between px-3 py-2 rounded-[6px] cursor-pointer transition-colors border"
                style={
                  selectedFile?.id === item.id
                    ? { background: 'var(--accent-dim, rgba(23,23,23,0.06))', borderColor: 'var(--hairline, #ebebeb)', color: 'var(--ink, #171717)' }
                    : { borderColor: 'transparent', color: 'var(--text-body, #4d4d4d)' }
                }
              >
                <div className="flex items-center space-x-3">
                  {item.type === 'directory' ? (
                    <Folder className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--link, #0070f3)' }} />
                  ) : (
                    <FileText className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-mute, #8f8f8f)' }} />
                  )}
                  <div>
                    <span className="font-medium" style={{ color: 'var(--ink, #171717)' }}>{item.name}</span>
                    {item.type === 'directory' && <span style={{ color: 'var(--text-faint, #a1a1a1)' }}>/</span>}
                  </div>
                </div>

                <div className="flex items-center space-x-4 font-mono text-[11px]" style={{ color: 'var(--text-mute, #8f8f8f)' }}>
                  {item.classification !== 'PUBLIC' && (
                    <span
                      className="px-1.5 py-0.5 rounded-[6px] text-[9px] font-bold flex items-center space-x-1 border"
                      style={
                        item.classification === 'RESTRICTED'
                          ? { color: '#ee0000', borderColor: 'rgba(238,0,0,0.3)', background: 'rgba(238,0,0,0.08)' }
                          : { color: '#b4760a', borderColor: 'rgba(245,166,35,0.35)', background: 'rgba(245,166,35,0.1)' }
                      }
                    >
                      <Lock className="w-2.5 h-2.5" />
                      <span>{item.classification}</span>
                    </span>
                  )}
                  <span className="hidden sm:inline" style={{ color: 'var(--text-faint, #a1a1a1)' }}>{item.permissions}</span>
                  <span className="w-16 text-right">{item.size}</span>
                  <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--text-faint, #a1a1a1)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* File Preview Panel */}
        {selectedFile && selectedFile.type === 'file' && (
          <div
            className="w-64 border-l p-3 flex flex-col justify-between overflow-y-auto font-mono text-[11px]"
            style={{ borderColor: 'var(--hairline, #ebebeb)', background: 'var(--canvas-elevated, #ffffff)' }}
          >
            <div>
              <div className="font-bold mb-1 truncate" style={{ color: 'var(--ink, #171717)' }}>{selectedFile.name}</div>
              <div className="text-[10px] mb-3" style={{ color: 'var(--text-mute, #8f8f8f)' }}>
                {selectedFile.permissions} • {selectedFile.owner} • {selectedFile.size}
              </div>
              <div
                className="p-2.5 rounded-[6px] border whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto"
                style={{ background: 'var(--canvas, #fafafa)', borderColor: 'var(--hairline, #ebebeb)', color: 'var(--text-body, #4d4d4d)' }}
              >
                {selectedFile.content || '(binary / empty)'}
              </div>
            </div>
            <div className="mt-3 text-[10px]" style={{ color: 'var(--text-mute, #8f8f8f)' }}>
              ACL Classification: <span className="font-bold" style={{ color: '#b4760a' }}>{selectedFile.classification}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

