"use client";

import { useState } from 'react';
import { FileDown, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { chatApi } from '@/lib/api';
import { useModal } from '@/lib/useModal';
import { toast } from 'sonner';

export default function DataPage() {
  const [loading, setLoading] = useState(false);
  const { modal, confirm } = useModal();

  const handleExport = async () => {
    setLoading(true);
    try {
      const { sessions } = await chatApi.list();
      const dataStr = JSON.stringify(sessions, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', `control_export_${new Date().toISOString().split('T')[0]}.json`);
      linkElement.click();

      toast.success('Data export started');
    } catch (err: any) {
      toast.error(err.message || 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const ok = await confirm(
      'Are you sure you want to delete your account? This action is permanent and will delete all your sessions, VMs, and paired devices.',
      { title: 'Delete Account?', confirmLabel: 'Delete Permanently', cancelLabel: 'Cancel' }
    );
    if (ok) {
      toast.info('Account deletion requested. Please contact support to finalize.');
    }
  };

  return (
    <>
      {modal}
      <div className="p-6 md:p-8 lg:p-12 max-w-2xl mx-auto space-y-8">
        <h2 className="text-lg font-black text-foreground">Data & Export</h2>
        <div className="space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary">
                <FileDown size={20} />
              </div>
              <h3 className="text-sm font-black text-foreground uppercase tracking-tight">Export Your Data</h3>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Download a copy of your chat sessions, settings, and usage data in JSON format for your records or portability.
            </p>
            <button
              onClick={handleExport}
              disabled={loading}
              className="px-5 py-3 bg-accent-primary text-accent-foreground rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
              Export Data
            </button>
          </div>

          <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle size={16} />
              <h3 className="text-[10px] font-black uppercase tracking-widest">Danger Zone</h3>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Permanently delete your account and all associated data. This action is irreversible.
            </p>
            <button
              onClick={handleDeleteAccount}
              className="px-5 py-3 border border-red-500/20 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 transition-all"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
