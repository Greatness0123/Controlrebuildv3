'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn, getSupabaseClient } from '@/lib/supabase';
import { Command, ArrowRight, AlertCircle } from 'lucide-react';
import { safeNextPath } from '@/lib/safe-next-path';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get('next'));

  useEffect(() => {
    async function checkExistingSession() {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push(nextPath);
        router.refresh();
        return;
      }
      setInitialized(true);
    }
    checkExistingSession();
  }, [router, nextPath]);

  if (!initialized) {
    return (
      <div className="relative w-full max-w-md flex flex-col items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        <p className="mt-4 text-sm text-zinc-500">Checking session...</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      router.push(nextPath);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-xl mb-4">
          <Command className="text-black w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight font-landing">Welcome back</h1>
        <p className="text-zinc-500 text-sm mt-1">Sign in to Control Web</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div>
          <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest block mb-1.5 px-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-white/20 transition-all placeholder:text-zinc-700"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest block mb-1.5 px-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-white/20 transition-all placeholder:text-zinc-700"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200 transition-all disabled:opacity-30 flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
          ) : (
            <>
              Sign In
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <p className="text-center text-zinc-600 text-sm mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/auth/signup" className="text-white hover:underline font-medium">
          Sign up
        </Link>
      </p>

      <p className="text-center text-zinc-700 text-[11px] mt-8">
        <Link href="/legal/terms" className="hover:text-zinc-400 transition-colors">
          Terms of Service
        </Link>
        <span className="mx-2 text-zinc-800">·</span>
        <Link href="/legal/privacy" className="hover:text-zinc-400 transition-colors">
          Privacy Policy
        </Link>
        <span className="mx-2 text-zinc-800">·</span>
        <Link href="/legal/cookies" className="hover:text-zinc-400 transition-colors">
          Cookies
        </Link>
      </p>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="relative w-full max-w-md flex flex-col items-center justify-center py-16">
      <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      <p className="mt-4 text-sm text-zinc-500">Loading sign-in…</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="absolute inset-0 dot-grid opacity-20" />
      <Suspense fallback={<LoginFallback />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
