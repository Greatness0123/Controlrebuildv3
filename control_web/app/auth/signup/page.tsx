"use client";

import type { Metadata } from 'next';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/supabase';
import { Command, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sign Up - Control',
  description: 'Create a Control account to start using AI computer use automation. Get started with voice-controlled desktop AI.',
  keywords: ['Control sign up', 'create account', 'register', 'AI automation account'],
};

export default function SignupPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!acceptedTerms) {
      setError('You must agree to the Terms of Service to create an account.');
      return;
    }
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

          <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
            <input
              id="signup-accept-terms"
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-white/[0.05] text-black focus:ring-2 focus:ring-white/30 focus:ring-offset-0 cursor-pointer accent-white"
            />
            <label htmlFor="signup-accept-terms" className="text-left text-[13px] leading-snug text-zinc-400 cursor-pointer select-none">
              I agree to the{' '}
              <Link href="/legal/terms" className="text-white underline underline-offset-2 hover:text-zinc-200">
                Terms of Service
              </Link>
              ,{' '}
              <Link href="/legal/privacy" className="text-white underline underline-offset-2 hover:text-zinc-200">
                Privacy Policy
              </Link>
              , and{' '}
              <Link href="/legal/cookies" className="text-white underline underline-offset-2 hover:text-zinc-200">
                Cookie Policy
              </Link>
              .
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !acceptedTerms}
            className="w-full py-3.5 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
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
    </div>
  );
}
