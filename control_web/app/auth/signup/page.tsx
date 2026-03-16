"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/supabase';
import { Command, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signUp(email, password, firstName, lastName);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-xl mb-4">
            <CheckCircle2 className="text-green-400 w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Check your email</h1>
          <p className="text-zinc-400 text-sm mb-6">We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</p>
          <Link href="/auth/login" className="text-white hover:underline font-medium text-sm">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="absolute inset-0 dot-grid opacity-20" />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-xl mb-4">
            <Command className="text-black w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create account</h1>
          <p className="text-zinc-500 text-sm mt-1">Get started with Control Web</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest block mb-1.5 px-1">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-white/20 transition-all placeholder:text-zinc-700"
                placeholder="John"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest block mb-1.5 px-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-white/20 transition-all placeholder:text-zinc-700"
                placeholder="Doe"
              />
            </div>
          </div>

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
            <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest block mb-1.5 px-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-white/20 transition-all placeholder:text-zinc-700"
              placeholder="Minimum 6 characters"
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
                Create Account
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-zinc-600 text-sm mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-white hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
