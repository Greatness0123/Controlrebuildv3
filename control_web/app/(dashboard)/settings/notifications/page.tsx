"use client";

import { Bell } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <div className="p-6 md:p-8 lg:p-12 max-w-2xl mx-auto space-y-8">
      <h2 className="text-lg font-black text-foreground">Notifications</h2>
      <div className="space-y-6">
        <div className="bg-card border border-border p-6 rounded-2xl flex items-center justify-center py-12">
          <div className="text-center">
            <Bell size={32} className="text-text-muted mx-auto mb-4 opacity-30" />
            <p className="text-xs font-black text-text-muted uppercase tracking-widest">Coming Soon</p>
            <p className="text-[11px] text-text-muted mt-2">Notification preferences will be available in a future update.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
