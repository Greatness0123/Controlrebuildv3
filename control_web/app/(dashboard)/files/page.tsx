"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { vmApi } from '@/lib/api';
import { useVMStore, useAuthStore } from '@/lib/store';
import { useModal } from '@/lib/useModal';
import { 
  Cpu, Loader2, FolderOpen, File, Download, ChevronRight, ChevronLeft, 
  Home, Trash2, Check, X, Archive
} from 'lucide-react';
import Link from 'next/link';

interface FileEntry {
  name: string;
  is_dir: boolean;
  size: number;
}

export default function FileManagerPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { vms, setVMs } = useVMStore();
  const { modal, alert } = useModal();
  
  const [selectedVmId, setSelectedVmId] = useState<string>('');
  const [currentPath, setCurrentPath] = useState('/home/controluser');
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [downloading, setDownloading] = useState(false);
  
  const runningVms = vms.filter(v => v.status === 'running');
  
  useEffect(() => {
    if (runningVms.length > 0 && !selectedVmId) {
      setSelectedVmId(runningVms[0].id);
    }
  }, [runningVms]);
  
  useEffect(() => {
    if (selectedVmId && currentPath) {
      loadFiles();
    }
  }, [selectedVmId, currentPath]);
  
  const loadFiles = async () => {
    if (!selectedVmId) return;
    setLoading(true);
    try {
      const res = await vmApi.listFiles(selectedVmId, currentPath);
      setFiles(res.entries || []);
      setSelectedFiles([]);
    } catch (err: any) {
      alert(err.message || 'Failed to load files', { title: 'Error', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  const navigateToPath = (path: string) => {
    setCurrentPath(path);
  };
  
  const goUp = () => {
    const parts = currentPath.split('/').filter(Boolean);
    if (parts.length > 1) {
      parts.pop();
      setCurrentPath('/' + parts.join('/'));
    } else {
      setCurrentPath('/home/controluser');
    }
  };
  
  const toggleFileSelection = (name: string) => {
    setSelectedFiles(prev => 
      prev.includes(name) 
        ? prev.filter(f => f !== name)
        : [...prev, name]
    );
  };
  
  const selectAll = () => {
    setSelectedFiles(files.map(f => f.name));
  };
  
  const deselectAll = () => {
    setSelectedFiles([]);
  };
  
  const handleDownload = async (name: string, isZip: boolean = false) => {
    if (!selectedVmId) return;
    setDownloading(true);
    try {
      const path = currentPath === '/home/controluser' 
        ? `${currentPath}/${name}` 
        : `${currentPath}/${name}`;
      
      const res = await vmApi.downloadFile(selectedVmId, path, isZip ? 'zip' : 'single');
      
      if (isZip && res.zip_data) {
        const link = document.createElement('a');
        link.href = `data:application/zip;base64,${res.zip_data}`;
        link.download = res.filename;
        link.click();
        alert(`Downloaded ${res.file_count} files`, { title: 'Success' });
      } else if (res.file_data) {
        const link = document.createElement('a');
        link.href = `data:application/octet-stream;base64,${res.file_data}`;
        link.download = res.filename;
        link.click();
        alert(`Downloaded ${res.filename}`, { title: 'Success' });
      }
    } catch (err: any) {
      alert(err.message || 'Download failed', { title: 'Error', variant: 'error' });
    } finally {
      setDownloading(false);
    }
  };
  
  const handleDownloadSelected = async () => {
    if (selectedFiles.length === 0) return;
    
    if (selectedFiles.length === 1) {
      const file = files.find(f => f.name === selectedFiles[0]);
      if (file && !file.is_dir) {
        await handleDownload(file.name);
        return;
      }
    }
    
    if (!selectedVmId) return;
    setDownloading(true);
    try {
      const paths = selectedFiles.map(name => {
        const isDir = files.find(f => f.name === name)?.is_dir;
        return currentPath === '/home/controluser'
          ? `${currentPath}/${name}`
          : `${currentPath}/${name}`;
      }).join(',');
      
      for (const name of selectedFiles) {
        const file = files.find(f => f.name === name);
        if (file && !file.is_dir) {
          const path = currentPath === '/home/controluser' 
            ? `${currentPath}/${name}` 
            : `${currentPath}/${name}`;
          const res = await vmApi.downloadFile(selectedVmId, path, 'single');
          
          if (res.file_data) {
            const link = document.createElement('a');
            link.href = `data:application/octet-stream;base64,${res.file_data}`;
            link.download = res.filename;
            link.click();
            await new Promise(r => setTimeout(r, 500));
          }
        }
      }
      alert(`Downloaded ${selectedFiles.length} files`, { title: 'Success' });
    } catch (err: any) {
      alert(err.message || 'Download failed', { title: 'Error', variant: 'error' });
    } finally {
      setDownloading(false);
    }
  };
  
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '—';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
      bytes /= 1024;
      i++;
    }
    return `${bytes.toFixed(1)} ${units[i]}`;
  };
  
  const pathParts = currentPath.split('/').filter(Boolean);
  
  return (
    <>
      {modal}
      <div className="flex-1 flex flex-col min-h-0 bg-background">
        <header className="h-16 flex items-center justify-between px-4 sm:px-8 border-b border-border shrink-0 bg-background/80 backdrop-blur-xl">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/workspace" className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20 shrink-0">
                <FolderOpen size={16} className="text-purple-400" />
              </div>
              <h1 className="text-sm font-black tracking-tight text-foreground">File Manager</h1>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadFiles}
              className="p-2.5 bg-card border border-border rounded-xl text-text-muted hover:text-foreground transition-all"
              title="Refresh"
            >
              <Loader2 size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </header>
        
        <div className="flex-1 overflow-hidden flex">
          {/* Sidebar - VM List */}
          <div className="w-64 border-r border-border bg-card/50 p-4 shrink-0 overflow-y-auto">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-3">Select Machine</h3>
            <div className="space-y-2">
              {runningVms.length === 0 ? (
                <p className="text-xs text-text-muted">No running VMs</p>
              ) : (
                runningVms.map(vm => (
                  <button
                    key={vm.id}
                    onClick={() => setSelectedVmId(vm.id)}
                    className={`w-full flex items-center gap-2 p-3 rounded-xl text-left transition-all ${
                      selectedVmId === vm.id 
                        ? 'bg-accent-primary text-accent-foreground' 
                        : 'hover:bg-card-hover text-text-secondary'
                    }`}
                  >
                    <Cpu size={14} />
                    <span className="text-xs font-bold truncate">{vm.name}</span>
                  </button>
                ))
              )}
            </div>
            
            <div className="mt-6 pt-6 border-t border-border">
              <Link href="/machines" className="text-xs text-accent-primary hover:underline">
                ← Go to Machines
              </Link>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Path Bar */}
            <div className="px-4 py-3 border-b border-border bg-secondary/30 flex items-center gap-2">
              <button
                onClick={goUp}
                disabled={currentPath === '/home/controluser'}
                className="p-1.5 text-text-muted hover:text-foreground disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="flex items-center gap-1 text-xs font-mono text-text-muted overflow-x-auto flex-1">
                <button
                  onClick={() => navigateToPath('/home/controluser')}
                  className="hover:text-foreground flex items-center gap-1 shrink-0"
                >
                  <Home size={12} />
                  /
                </button>
                {pathParts.map((part, i) => (
                  <button
                    key={i}
                    onClick={() => navigateToPath('/' + pathParts.slice(0, i + 1).join('/'))}
                    className="hover:text-foreground flex items-center gap-1 shrink-0"
                  >
                    <ChevronRight size={10} />
                    {part}
                  </button>
                ))}
              </div>
              
              {selectedFiles.length > 0 && (
                <button
                  onClick={handleDownloadSelected}
                  disabled={downloading}
                  className="flex items-center gap-2 px-3 py-1.5 bg-accent-primary text-accent-foreground text-[10px] font-black uppercase rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {downloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                  Download ({selectedFiles.length})
                </button>
              )}
            </div>
            
            {/* File List */}
            <div className="flex-1 overflow-y-auto p-2">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 size={24} className="animate-spin text-text-muted" />
                </div>
              ) : files.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-text-muted">
                  <File size={32} className="mb-2 opacity-30" />
                  <p className="text-xs">No files in this directory</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {/* Select All Row */}
                  <div className="flex items-center gap-2 p-2 border-b border-border mb-2">
                    <button
                      onClick={selectedFiles.length === files.length ? deselectAll : selectAll}
                      className="w-5 h-5 rounded border border-border flex items-center justify-center hover:bg-card-hover"
                    >
                      {selectedFiles.length === files.length && files.length > 0 && (
                        <Check size={12} />
                      )}
                    </button>
                    <span className="text-[10px] text-text-muted">
                      {selectedFiles.length === files.length 
                        ? 'Deselect All' 
                        : `Select All (${files.length} items)`}
                    </span>
                  </div>
                  
                  {files.map((file) => (
                    <div
                      key={file.name}
                      className={`flex items-center justify-between p-3 rounded-xl group transition-all ${
                        selectedFiles.includes(file.name) 
                          ? 'bg-accent-primary/10 border border-accent-primary/30' 
                          : 'hover:bg-secondary/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button
                          onClick={() => toggleFileSelection(file.name)}
                          className="w-5 h-5 rounded border border-border flex items-center justify-center hover:bg-card-hover shrink-0"
                        >
                          {selectedFiles.includes(file.name) && (
                            <Check size={12} className="text-accent-primary" />
                          )}
                        </button>
                        
                        <button
                          onClick={() => file.is_dir && navigateToPath(`${currentPath}/${file.name}`)}
                          className="flex items-center gap-2 flex-1 min-w-0"
                        >
                          {file.is_dir ? (
                            <FolderOpen size={16} className="text-yellow-500 shrink-0" />
                          ) : (
                            <File size={16} className="text-text-muted shrink-0" />
                          )}
                          <span className="text-sm text-foreground truncate">{file.name}</span>
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-text-muted font-mono">
                          {file.is_dir ? '—' : formatSize(file.size)}
                        </span>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!file.is_dir && (
                            <button
                              onClick={() => handleDownload(file.name)}
                              disabled={downloading}
                              className="p-2 text-text-muted hover:text-foreground"
                              title="Download"
                            >
                              <Download size={14} />
                            </button>
                          )}
                          {file.is_dir && (
                            <button
                              onClick={() => handleDownload(file.name, true)}
                              disabled={downloading}
                              className="p-2 text-text-muted hover:text-foreground"
                              title="Download as ZIP"
                            >
                              <Archive size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Status Bar */}
            <div className="px-4 py-2 border-t border-border bg-secondary/30 flex items-center justify-between text-[10px] text-text-muted">
              <span>{files.length} items</span>
              <span>{selectedFiles.length} selected</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
