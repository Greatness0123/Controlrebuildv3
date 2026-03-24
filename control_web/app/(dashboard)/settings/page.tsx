"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsIndex() {
  const router = useRouter();
  useEffect(() => {
    // Only redirect to account if on desktop
    if (window.innerWidth >= 768) {
      router.replace('/settings/account');
    }
  }, [router]);

  // On mobile, this will show the layout's menu (handled in layout.tsx)
  return (
    <div className="md:hidden flex-1 flex flex-col items-center justify-center p-8 text-center text-text-muted space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-secondary border border-border flex items-center justify-center">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
      </div>
      <p className="text-sm font-bold uppercase tracking-widest">Select a setting to continue</p>
    </div>
  );
}
