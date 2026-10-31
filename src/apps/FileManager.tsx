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
    <div className="h-full flex flex-col bg-slate-900/90 text-slate-200 text-xs font-sans select-none overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-black/30">
        <div className="flex items-center space-x-2">
          <button
            onClick={navigateUp}
            disabled={activeFolder === '/'}
            className="p-1 rounded hover:bg-white/10 disabled:opacity-30 transition-colors"
            title="Go up"
          >
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center space-x-1 font-mono text-[11px] text-slate-300">
            <span className="text-slate-500">Path:</span>
            <span className="font-semibold text-sky-400">{activeFolder}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 font-mono text-[10px]">
          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
            {currentItems.length} items
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center space-x-1">
            <ShieldCheck className="w-3 h-3" />
            <span>ACL ACTIVE</span>
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-44 border-r border-white/10 p-2 space-y-1 bg-black/20 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 px-2 py-1">
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
              className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg text-left transition-colors ${
                activeFolder === loc.path ? 'bg-indigo-600/40 text-white font-medium' : 'hover:bg-white/5 text-slate-400'
              }`}
            >
              <Folder className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
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
                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors border ${
                  selectedFile?.id === item.id
                    ? 'bg-indigo-600/30 border-indigo-500/50 text-white'
                    : 'hover:bg-white/5 border-transparent text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {item.type === 'directory' ? (
                    <Folder className="w-4 h-4 text-sky-400 flex-shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  )}
                  <div>
                    <span className="font-medium">{item.name}</span>
                    {item.type === 'directory' && <span className="text-slate-500">/</span>}
                  </div>
                </div>

                <div className="flex items-center space-x-4 font-mono text-[11px] text-slate-400">
                  {item.classification !== 'PUBLIC' && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center space-x-1 ${
                        item.classification === 'RESTRICTED'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      <Lock className="w-2.5 h-2.5" />
                      <span>{item.classification}</span>
                    </span>
                  )}
                  <span className="hidden sm:inline text-slate-500">{item.permissions}</span>
                  <span className="w-16 text-right">{item.size}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* File Preview Panel */}
        {selectedFile && selectedFile.type === 'file' && (
          <div className="w-64 border-l border-white/10 p-3 bg-black/40 flex flex-col justify-between overflow-y-auto font-mono text-[11px]">
            <div>
              <div className="font-bold text-white mb-1 truncate">{selectedFile.name}</div>
              <div className="text-slate-400 text-[10px] mb-3">
                {selectedFile.permissions} • {selectedFile.owner} • {selectedFile.size}
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-white/10 text-slate-300 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                {selectedFile.content || '(binary / empty)'}
              </div>
            </div>
            <div className="mt-3 text-[10px] text-slate-500">
              ACL Classification: <span className="text-amber-400 font-bold">{selectedFile.classification}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

