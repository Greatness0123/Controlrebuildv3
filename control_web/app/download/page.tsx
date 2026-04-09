'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Command, Download, LayoutGrid, Monitor, Terminal } from 'lucide-react';
import { DESKTOP_DOWNLOAD_URLS } from '@/lib/download-urls';
import { PlatformLogos } from '@/components/landing/SoftwareLogos';

type PlatformKey = keyof typeof DESKTOP_DOWNLOAD_URLS;

const PLATFORMS: {
  key: PlatformKey;
  name: string;
  arch: string;
  icon: typeof Monitor;
}[] = [
  { key: 'mac', name: 'macOS', arch: 'Apple Silicon and Intel (.dmg)', icon: Monitor },
  { key: 'windows', name: 'Windows', arch: 'x64 installer', icon: LayoutGrid },
  { key: 'linux', name: 'Linux', arch: 'AppImage or package (TBD)', icon: Terminal },
];

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-[#f5f5f5] font-landing-body selection:bg-white selection:text-black">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-40">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(ellipse 70% 40% at 50% 0%, rgba(255,255,255,0.1), transparent)`,
          }}
        />
      </div>

      <header className="relative z-10 border-b border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={2} />
            Home
          </Link>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20">
              <Command className="w-3.5 h-3.5" strokeWidth={2} />
            </span>
            <span className="font-landing text-sm font-bold text-white">Control</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 pt-14 sm:pt-20 pb-24">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-500 mb-4">Desktop</p>
          <h1 className="font-landing text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight max-w-2xl">
            Install Control where your apps already live
          </h1>
          <p className="mt-5 text-neutral-400 max-w-xl text-sm sm:text-base leading-relaxed">
            Run AI automation directly on your machine. Control works locally with lower latency than remote sessions, 
            keeping your sensitive work on hardware you control.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }} className="mt-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-600 mb-4">Available for</p>
          <PlatformLogos />
        </motion.div>

        <div className="mt-10 grid sm:grid-cols-3 gap-5">
          {PLATFORMS.map((p, i) => {
            const url = DESKTOP_DOWNLOAD_URLS[p.key];
            const ready = Boolean(url);
            const Icon = p.icon;
            return (
              <motion.article
                key={p.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * i, duration: 0.45 }}
                className="rounded-2xl border border-white/[0.1] bg-white/[0.02] p-6 sm:p-7 flex flex-col min-h-[280px]"
              >
                <div className="w-11 h-11 rounded-xl border border-white/15 flex items-center justify-center text-neutral-300 mb-5">
                  <Icon className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <h2 className="font-landing text-lg font-semibold text-white">{p.name}</h2>
                <p className="mt-1 text-xs text-neutral-500 uppercase tracking-wider">{p.arch}</p>
                <p className="mt-4 text-sm text-neutral-500 leading-relaxed flex-1">
                  Full voice and vision automation on your hardware. Use "Hey Control" wake word or push-to-talk.
                </p>
                {ready ? (
                  <a
                    href={url}
                    className="mt-6 inline-flex items-center justify-center gap-2 w-full py-3 rounded-full bg-white text-black text-[11px] font-semibold uppercase tracking-[0.18em] hover:bg-neutral-200 transition-colors"
                  >
                    Download for {p.name}
                    <Download className="w-4 h-4" strokeWidth={2} />
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="mt-6 inline-flex items-center justify-center gap-2 w-full py-3 rounded-full border border-white/15 text-neutral-500 text-[11px] font-semibold uppercase tracking-[0.18em] cursor-not-allowed"
                  >
                    Coming soon
                  </button>
                )}
              </motion.article>
            );
          })}
        </div>

        <div className="mt-16 p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-1">
            <h3 className="font-landing text-lg font-semibold text-white mb-2">Electron-based desktop app</h3>
            <p className="text-sm text-neutral-400">Cross-platform desktop application with native performance. Includes voice control, local execution, and remote desktop viewing capabilities.</p>
          </div>
          <div className="flex gap-3">
            <span className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs text-neutral-400">Windows</span>
            <span className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs text-neutral-400">macOS</span>
            <span className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs text-neutral-400">Linux</span>
          </div>
        </div>

        <div className="mt-20 grid lg:grid-cols-2 gap-10 items-center border-t border-white/[0.08] pt-16">
          <div>
            <h3 className="font-landing text-xl font-bold text-white">Prefer the browser?</h3>
            <p className="mt-3 text-sm text-neutral-500 leading-relaxed">
              Control Web runs sessions against cloud machines or a paired desktop. Use the desktop app for local-only
              work; use the web workspace when you want everything in one signed-in dashboard.
            </p>
            <Link
              href="/auth/login?next=/workspace"
              className="mt-6 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white border-b border-white/30 hover:border-white pb-1 transition-colors"
            >
              Open web workspace
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </Link>
          </div>
          <div className="relative rounded-2xl border border-white/[0.08] overflow-hidden aspect-[16/10]">
            <Image
              src="https://images.pexels.com/photos/1181677/pexels-photo-1181677.jpeg?auto=compress&cs=tinysrgb&w=1200"
              alt=""
              fill
              className="object-cover grayscale opacity-40"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent" />
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/[0.06] py-10 text-center space-y-4">
        <p className="text-[11px] text-neutral-500">
          <Link href="/legal/terms" className="hover:text-white transition-colors">
            Terms of Service
          </Link>
          <span className="mx-2 text-neutral-700">·</span>
          <Link href="/legal/privacy" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <span className="mx-2 text-neutral-700">·</span>
          <Link href="/legal/cookies" className="hover:text-white transition-colors">
            Cookie Policy
          </Link>
        </p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-600">
          © {new Date().getFullYear()} Control AI
        </p>
      </footer>
    </div>
  );
}
