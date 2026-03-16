"use client";

import { useParams } from 'next/navigation';
import RemoteDesktopViewer from '@/components/RemoteDesktopViewer';
import { useAuthStore } from '@/lib/store';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StandaloneRemotePage() {
  const { deviceId } = useParams() as { deviceId: string };
  const { user, loading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <div className="h-screen w-screen bg-black overflow-hidden flex flex-col">
      <RemoteDesktopViewer 
        deviceId={deviceId} 
        className="flex-1"
      />
    </div>
  );
}
