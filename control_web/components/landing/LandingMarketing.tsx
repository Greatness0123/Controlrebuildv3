'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform, type Transition, type Variants } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Command,
  Cpu,
  Eye,
  Globe,
  Layers,
  Lock,
  Menu,
  Mic,
  Monitor,
  MousePointer2,
  Shield,
  Sparkles,
  Terminal,
  X,
  Twitter,
  Github,
  Linkedin,
  MessagesSquare,
  Zap,
  Bot,
  Send,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { getSocialLinks } from '@/lib/social-links';
import { SoftwareLogos, SoftwareLogosMarquee } from './SoftwareLogos';

const fadeEase = [0.22, 1, 0.36, 1] as const;
const fadeTransition: Transition = { duration: 0.55, ease: fadeEase };

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: fadeTransition,
};

export default function LandingMarketing() {
  const shell = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: shell, offset: ['start start', 'end end'] });
  const heroY = useTransform(scrollYProgress, [0, 0.12], [0, -32]);

  return (
    <div
      ref={shell}
      className="min-h-screen bg-[#050505] text-[#f5f5f5] font-landing-body selection:bg-white selection:text-black overflow-x-hidden"
    >
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255,255,255,0.14), transparent),
              radial-gradient(ellipse 60% 40% at 100% 50%, rgba(255,255,255,0.06), transparent),
              radial-gradient(ellipse 50% 30% at 0% 80%, rgba(255,255,255,0.05), transparent)`,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.12] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <LandingNav />

      <main className="relative z-10">
        {/* Hero */}
        <section className="relative px-5 sm:px-8 pt-28 pb-20 sm:pt-32 sm:pb-28 max-w-6xl mx-auto">
          <motion.div style={{ y: heroY }} className="max-w-3xl">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.28em] text-neutral-500 mb-6"
            >
              AI for Professional Software
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="font-landing text-[2.35rem] sm:text-5xl md:text-6xl lg:text-[3.5rem] font-bold leading-[1.05] tracking-tight text-white"
            >
              Use expert software
              <br />
              <span className="text-neutral-500">without becoming an expert.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.12 }}
              className="mt-6 text-base sm:text-lg text-neutral-400 max-w-xl leading-relaxed"
            >
              Control uses AI to operate Blender, AutoCAD, Adobe Premiere, Photoshop, Maya, and more — exactly as if you knew every shortcut. No plugins. No APIs. Just describe what you want.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.18 }}
              className="mt-8"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-600 mb-4">Works with</p>
              <SoftwareLogosMarquee />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.24 }}
              className="mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4"
            >
              <Link
                href="/auth/login?next=/workspace"
                className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white text-black text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:bg-neutral-200 transition-colors"
              >
                Try Control Web
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
              </Link>
              <Link
                href="/download"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-white/20 text-white text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:border-white/40 hover:bg-white/[0.04] transition-colors"
              >
                Download the app
                <ArrowUpRight className="w-4 h-4" strokeWidth={2} />
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mt-16 sm:mt-20 relative rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden aspect-[16/10] sm:aspect-[2/1] max-w-5xl"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent z-10 pointer-events-none" />
            <Image
              src="https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1600"
              alt=""
              fill
              className="object-cover grayscale contrast-[1.05] opacity-50 sm:opacity-60"
              sizes="(max-width: 768px) 100vw, 1024px"
              priority
            />
            <div className="absolute inset-0 z-20 flex items-end p-6 sm:p-10">
              <div className="flex flex-wrap gap-4 text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
                <span className="flex items-center gap-2 text-neutral-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Live desktop
                </span>
                <span>Vision-guided actions</span>
                <span className="hidden sm:inline">Voice or text</span>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Problem */}
        <section className="px-5 sm:px-8 py-16 sm:py-24 border-t border-white/[0.06]">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div {...fadeUp}>
              <h2 className="font-landing text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
                Professional software shouldn't require professional certification.
              </h2>
              <p className="mt-6 text-neutral-400 leading-relaxed">
                Blender, AutoCAD, Maya, Premiere — these tools are incredibly powerful, but the learning curve is brutal. 
                Control removes that barrier. Our AI understands professional interfaces the same way an expert does, 
                so beginners can produce expert-level work immediately.
              </p>
            </motion.div>
            <motion.div
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.08 }}
              className="space-y-4"
            >
              {[
                { t: 'Intent in, expert work out', d: 'Describe the outcome you want; the AI figures out the clicks, shortcuts, and workflows.' },
                { t: 'Works with real professional tools', d: 'Blender, Photoshop, AutoCAD, Maya, Premiere, After Effects, Unity, Unreal, Figma — if it has a UI, Control can drive it.' },
                { t: 'No plugins or APIs needed', d: 'Control works with the software as-is. No developer integrations, no configuration — just install and use.' },
              ].map((item) => (
                <div
                  key={item.t}
                  className="p-5 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:border-white/[0.12] transition-colors"
                >
                  <p className="font-landing text-sm font-semibold text-white">{item.t}</p>
                  <p className="mt-2 text-sm text-neutral-500 leading-relaxed">{item.d}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Why we built it */}
        <section className="px-5 sm:px-8 py-16 sm:py-24 bg-white/[0.02] border-y border-white/[0.06]">
          <div className="max-w-6xl mx-auto">
            <motion.div {...fadeUp} className="max-w-2xl mb-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-500 mb-3">Why we built it</p>
              <h2 className="font-landing text-2xl sm:text-3xl font-bold text-white tracking-tight">We wanted to make a 3D logo. It took 6 hours.</h2>
            </motion.div>
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
              <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }}>
                <p className="text-neutral-400 leading-relaxed text-base">
                  I (the founder) had used Blender casually for years. But when I needed to create a proper 3D logo for a project, 
                  I realized I didn't actually know how to do anything beyond the basics. Every task — beveling edges, applying materials, 
                  setting up proper UVs — required hunting through menus I'd never opened.
                </p>
                <p className="mt-4 text-neutral-400 leading-relaxed text-base">
                  I thought: "There has to be a better way." I spent weeks researching automation tools, but everything required 
                  either writing Python scripts, buying expensive plugins, or learning the API. That's when the idea hit: 
                  what if an AI could just... use Blender the way I would, if I knew what I was doing?
                </p>
                <p className="mt-4 text-neutral-400 leading-relaxed text-base">
                  Control is the answer. I built it so that anyone can use professional software — from Blender to AutoCAD to 
                  Premiere — without years of practice. No APIs, no plugins, no code. Just tell the AI what you want.
                </p>
              </motion.div>
              <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="relative">
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Bot className="w-5 h-5 text-neutral-400" strokeWidth={1.5} />
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Example</span>
                  </div>
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                      <p className="text-sm text-neutral-300">"Create a beveled cube with a metallic blue material and render it with studio lighting"</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-neutral-600" strokeWidth={2} />
                      <span className="text-xs text-neutral-500">Control creates scene, applies material, sets up lights, renders</span>
                    </div>
                    <div className="p-3 rounded-lg bg-green-900/20 border border-green-500/20">
                      <p className="text-sm text-green-400">✓ Render completed in 47 seconds</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* How */}
        <section id="how" className="px-5 sm:px-8 py-16 sm:py-24">
          <div className="max-w-6xl mx-auto">
            <motion.div {...fadeUp} className="max-w-2xl mb-14 sm:mb-16">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-500 mb-3">How it works</p>
              <h2 className="font-landing text-2xl sm:text-3xl font-bold text-white tracking-tight">From sentence to sequence</h2>
              <p className="mt-4 text-neutral-400 leading-relaxed">
                Each turn combines visual context with reasoning, then executes through the same input devices you use.
              </p>
            </motion.div>
            <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
              {[
                { step: '01', title: 'Capture context', body: 'The current screen (and optional voice or text instruction) grounds the model in what is on display.', icon: Eye },
                { step: '02', title: 'Plan the next move', body: 'A multimodal model proposes concrete steps: where to click, what to type, or which command to run.', icon: Sparkles },
                { step: '03', title: 'Execute and verify', body: 'Mouse, keyboard, terminal, and browser automation run locally or on your cloud machine; the loop repeats until the task is done.', icon: MousePointer2 },
              ].map(({ step, title, body, icon: Icon }, i) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="relative pl-0 sm:pl-8 border-l-0 sm:border-l border-white/[0.08] sm:pb-0"
                >
                  <div className="hidden sm:block absolute left-0 top-0 -translate-x-[9px] w-[17px] h-[17px] rounded-full border-2 border-white bg-[#050505]" />
                  <span className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest">{step}</span>
                  <div className="mt-3 flex items-center gap-2">
                    <Icon className="w-4 h-4 text-neutral-500" strokeWidth={1.75} />
                    <h3 className="font-landing text-lg font-semibold text-white">{title}</h3>
                  </div>
                  <p className="mt-3 text-sm text-neutral-500 leading-relaxed">{body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Product split */}
        <section id="product" className="px-5 sm:px-8 py-16 sm:py-24">
          <div className="max-w-6xl mx-auto">
            <motion.div {...fadeUp} className="mb-10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-500 mb-3">Two ways to use Control</p>
              <h2 className="font-landing text-2xl sm:text-3xl font-bold text-white tracking-tight">Hybrid product: desktop + cloud</h2>
            </motion.div>
            <div className="grid md:grid-cols-2 gap-6">
              <motion.article
                {...fadeUp}
                className="group relative rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-transparent p-8 sm:p-10 overflow-hidden"
              >
                <div className="flex items-center justify-between mb-6">
                  <Monitor className="w-8 h-8 text-neutral-400" strokeWidth={1.25} />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-600 px-2 py-1 rounded border border-white/[0.08]">Local</span>
                </div>
                <h3 className="font-landing text-xl font-bold text-white">Desktop Application</h3>
                <p className="mt-4 text-neutral-400 text-sm leading-relaxed">
                  Direct local control on your machine. Run automation directly on your Windows, macOS, or Linux computer 
                  with optional voice-first experience using "Hey Control" wake word. Your screen drives decisions; 
                  actions happen on your hardware with guardrails for terminal and destructive work.
                </p>
                <ul className="mt-6 space-y-2 text-sm text-neutral-500">
                  <li className="flex gap-2"><Check className="w-4 h-4 shrink-0 text-neutral-400 mt-0.5" strokeWidth={2} />Direct control on your machine</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 shrink-0 text-neutral-400 mt-0.5" strokeWidth={2} />Voice-first with "Hey Control" wake word</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 shrink-0 text-neutral-400 mt-0.5" strokeWidth={2} />Push-to-talk for hands-busy scenarios</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 shrink-0 text-neutral-400 mt-0.5" strokeWidth={2} />Remote desktop connection for viewing</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 shrink-0 text-neutral-400 mt-0.5" strokeWidth={2} />Safety guardrails for sensitive operations</li>
                </ul>
              </motion.article>
              <motion.article
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: 0.06 }}
                className="group relative rounded-2xl border border-white/[0.08] p-8 sm:p-10 overflow-hidden"
              >
                <div className="flex items-center justify-between mb-6">
                  <Globe className="w-8 h-8 text-neutral-400" strokeWidth={1.25} />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-600 px-2 py-1 rounded border border-white/[0.08]">Cloud</span>
                </div>
                <h3 className="font-landing text-xl font-bold text-white">Control Web</h3>
                <p className="mt-4 text-neutral-400 text-sm leading-relaxed">
                  Spin up cloud VMs from anywhere in the world, let the AI control software, and monitor its work live. 
                  Built-in streaming shows the desktop while automation runs — perfect for demos, support, and 
                  offloading heavy jobs away from your laptop.
                </p>
                <ul className="mt-6 space-y-2 text-sm text-neutral-500">
                  <li className="flex gap-2"><Check className="w-4 h-4 shrink-0 text-neutral-400 mt-0.5" strokeWidth={2} />Cloud VM management from dashboard</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 shrink-0 text-neutral-400 mt-0.5" strokeWidth={2} />Live desktop streaming while AI works</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 shrink-0 text-neutral-400 mt-0.5" strokeWidth={2} />Session-based AI with action trace</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 shrink-0 text-neutral-400 mt-0.5" strokeWidth={2} />Pair with desktop for remote viewing</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 shrink-0 text-neutral-400 mt-0.5" strokeWidth={2} />Low-latency relay option</li>
                </ul>
              </motion.article>
            </div>
            
            <motion.div {...fadeUp} className="mt-10 p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] flex flex-col sm:flex-row items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-yellow-400" strokeWidth={1.5} />
                  <span className="text-sm font-semibold text-white">80% UI Accuracy</span>
                </div>
                <p className="text-sm text-neutral-400">Control achieves reliable 80% UI accuracy across professional software. The AI understands complex interfaces and completes multi-step tasks consistently.</p>
              </div>
              <div className="w-full sm:w-32 h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full" style={{ width: '80%' }} />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Bento capabilities */}
        <section id="capabilities" className="px-5 sm:px-8 py-16 sm:py-24 border-t border-white/[0.06]">
          <div className="max-w-6xl mx-auto">
            <motion.div {...fadeUp} className="mb-12 sm:mb-14">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-500 mb-3">Capabilities</p>
              <h2 className="font-landing text-2xl sm:text-3xl font-bold text-white tracking-tight">Built for real interfaces</h2>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-5">
              <Bento className="lg:col-span-7 min-h-[220px]" icon={Eye} title="Screen-grounded reasoning" desc="Understands layout and controls without a per-app integration list. Suited to creative suites, CAD, IDEs, and legacy enterprise UIs alike." />
              <Bento className="lg:col-span-5 min-h-[220px]" icon={Mic} title="Voice and text" desc="Hands-busy scenarios: speak a command or type while the agent keeps context across steps." />
              <Bento className="lg:col-span-4 min-h-[200px]" icon={Terminal} title="Shell when it is faster" desc="Uses the terminal for checks and batch work when that is more reliable than clicking through wizards." />
              <Bento className="lg:col-span-4 min-h-[200px]" icon={Layers} title="Workflows" desc="Save and trigger repeatable sequences on a schedule or when a keyword is spoken." />
              <Bento className="lg:col-span-4 min-h-[200px]" icon={Cpu} title="Cloud machines" desc="Isolate experiments or long jobs on provisioned desktops you control from the browser." />
              <Bento className="lg:col-span-12 min-h-[160px]" icon={Lock} title="Safety-minded design" desc="Sensitive steps can require explicit approval. You choose when the agent acts versus when it only advises. API traffic uses standard encrypted transport; pair desktop streaming only with accounts you trust." />
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section className="px-5 sm:px-8 py-16 sm:py-24 bg-white/[0.02] border-y border-white/[0.06]">
          <div className="max-w-6xl mx-auto">
            <motion.h2 {...fadeUp} className="font-landing text-2xl sm:text-3xl font-bold text-white tracking-tight mb-6 sm:mb-8">
              Where teams feel it first
            </motion.h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                {
                  title: 'Creative production',
                  copy: 'Export presets, batch renames, and multi-step toolchains in Blender, Premiere, Photoshop without memorizing every panel.',
                  img: 'https://images.pexels.com/photos/6476589/pexels-photo-6476589.jpeg?auto=compress&cs=tinysrgb&w=800',
                  logos: ['Blender', 'Premiere Pro', 'Photoshop', 'After Effects'],
                },
                {
                  title: 'Engineering and BIM',
                  copy: 'Navigate dense CAD and model-review UIs in AutoCAD, Maya, and Revit for repetitive documentation, checks, and exports.',
                  img: 'https://images.pexels.com/photos/3862130/pexels-photo-3862130.jpeg?auto=compress&cs=tinysrgb&w=800',
                  logos: ['AutoCAD', 'Maya', 'Unity', 'Unreal Engine'],
                },
                {
                  title: 'Operations and knowledge work',
                  copy: 'Cross applications for reporting, internal portals, and file hygiene in Figma, Excel, and browser-based tools.',
                  img: 'https://images.pexels.com/photos/1181677/pexels-photo-1181677.jpeg?auto=compress&cs=tinysrgb&w=800',
                  logos: ['Figma', 'DaVinci Resolve'],
                },
              ].map((u, i) => (
                <motion.div key={u.title} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.05 }} className="rounded-xl border border-white/[0.08] overflow-hidden bg-white/[0.02]">
                  <div className="relative aspect-[4/3]">
                    <Image src={u.img} alt="" fill className="object-cover grayscale opacity-40" sizes="(max-width:640px) 100vw, 33vw" />
                    <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
                      {u.logos.map((logo) => (
                        <span key={logo} className="px-2 py-0.5 rounded bg-black/50 backdrop-blur-sm text-[9px] font-medium text-neutral-300">
                          {logo}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-landing text-base font-semibold text-white">{u.title}</h3>
                    <p className="mt-2 text-sm text-neutral-500 leading-relaxed">{u.copy}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Competitors - careful */}
        <section id="compare" className="px-5 sm:px-8 py-16 sm:py-24">
          <div className="max-w-6xl mx-auto">
            <motion.div {...fadeUp} className="max-w-2xl mb-10 sm:mb-14">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-500 mb-3">Landscape</p>
              <h2 className="font-landing text-2xl sm:text-3xl font-bold text-white tracking-tight">How Control differs</h2>
              <p className="mt-4 text-neutral-400 text-sm sm:text-base leading-relaxed">
                The market mixes OS assistants, cloud research agents, classic RPA, and DIY stacks. Positioning below is
                directional—evaluate against your own security and procurement requirements.
              </p>
            </motion.div>
            <motion.div {...fadeUp} className="overflow-x-auto rounded-xl border border-white/[0.08]">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08] text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                    <th className="px-4 py-4 font-semibold w-[28%]">Topic</th>
                    <th className="px-4 py-4 font-semibold text-white w-[24%]">Control</th>
                    <th className="px-4 py-4 font-semibold w-[24%]">OS-level assistants</th>
                    <th className="px-4 py-4 font-semibold w-[24%]">Cloud / hosted agents</th>
                    <th className="px-4 py-4 font-semibold">RPA suites</th>
                  </tr>
                </thead>
                <tbody className="text-neutral-400">
                  <CompareRow
                    topic="Primary surface"
                    control="User-chosen desktop apps and browsers, local or streamed."
                    os="Tight coupling to vendor OS and first-party experiences."
                    cloud="Often remote browser or VM; workload may leave the device."
                    rpa="Designer-built flows; strong in structured enterprise processes."
                  />
                  <CompareRow
                    topic="Setup for one-off tasks"
                    control="Natural language goal; minimal per-app configuration."
                    os="Varies; may prioritize vendor app ecosystems."
                    cloud="Depends on product; may need environment provisioning."
                    rpa="Typically analyst or developer configuration."
                  />
                  <CompareRow
                    topic="Latency-sensitive UI work"
                    control="Local execution path for pointer and keyboard actions."
                    os="Generally low latency within OS-supported scenarios."
                    cloud="Network and hosting hops can add delay."
                    rpa="Usually runs on managed robots; not always interactive desktop."
                  />
                  <CompareRow
                    topic="Open-source / self-hosted stacks"
                    control="Productized app plus web dashboard; less DIY assembly."
                    os="N/A"
                    cloud="Some users assemble agents manually for full control."
                    rpa="Less common in pure OSS for enterprise RPA."
                  />
                </tbody>
              </table>
            </motion.div>
            <p className="mt-6 text-xs text-neutral-600 max-w-3xl leading-relaxed">
              Trademarks belong to their owners. Compare features in your own pilot; assistant capabilities change frequently
              across vendors.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="px-5 sm:px-8 pb-24 sm:pb-32">
          <motion.div
            {...fadeUp}
            className="max-w-6xl mx-auto rounded-2xl border border-white/[0.12] bg-gradient-to-br from-white/[0.08] to-white/[0.02] px-8 py-14 sm:px-16 sm:py-20 text-center"
          >
            <h2 className="font-landing text-2xl sm:text-4xl font-bold text-white tracking-tight max-w-2xl mx-auto">
              Stop translating your goal into two hundred clicks.
            </h2>
            <p className="mt-5 text-neutral-400 max-w-lg mx-auto text-sm sm:text-base">
              Try the web workspace with your account, or install the desktop agent for local automation.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/auth/login?next=/workspace"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-black text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:bg-neutral-200 transition-colors"
              >
                Try Control Web
              </Link>
              <Link
                href="/download"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-white/30 text-white text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:bg-white/5 transition-colors"
              >
                Download the app
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}

const bentoVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const bentoTransition: Transition = { duration: 0.45 };

function Bento({
  className,
  icon: Icon,
  title,
  desc,
}: {
  className?: string;
  icon: LucideIcon;
  title: string;
  desc: string;
}) {
  return (
    <motion.div
      variants={bentoVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      transition={bentoTransition}
      className={`rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-7 hover:border-white/[0.14] transition-colors ${className || ''}`}
    >
      <Icon className="w-5 h-5 text-neutral-400 mb-4" strokeWidth={1.5} />
      <h3 className="font-landing text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-neutral-500 leading-relaxed">{desc}</p>
    </motion.div>
  );
}

function CompareRow({
  topic,
  control,
  os,
  cloud,
  rpa,
}: {
  topic: string;
  control: string;
  os: string;
  cloud: string;
  rpa: string;
}) {
  return (
    <tr className="border-b border-white/[0.06] last:border-0 align-top">
      <td className="px-4 py-4 font-medium text-neutral-300">{topic}</td>
      <td className="px-4 py-4 text-neutral-200">{control}</td>
      <td className="px-4 py-4">{os}</td>
      <td className="px-4 py-4">{cloud}</td>
      <td className="px-4 py-4">{rpa}</td>
    </tr>
  );
}

function LandingNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.06] bg-[#050505]/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 sm:h-[4.25rem] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 text-white">
            <Command className="w-4 h-4" strokeWidth={2} />
          </span>
          <span className="font-landing text-sm font-bold tracking-tight text-white">Control</span>
        </Link>
        <nav className="hidden md:flex items-center gap-10 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
          <a href="#how" className="hover:text-white transition-colors">
            How it works
          </a>
          <a href="#product" className="hover:text-white transition-colors">
            Product
          </a>
          <a href="#capabilities" className="hover:text-white transition-colors">
            Capabilities
          </a>
          <a href="#compare" className="hover:text-white transition-colors">
            Compare
          </a>
          <Link href="/pricing" className="hover:text-white transition-colors">
            Pricing
          </Link>
        </nav>
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/download"
            className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400 hover:text-white transition-colors px-2"
          >
            Download
          </Link>
          <Link
            href="/auth/login?next=/workspace"
            className="text-[11px] font-semibold uppercase tracking-[0.18em] px-5 py-2.5 rounded-full bg-white text-black hover:bg-neutral-200 transition-colors"
          >
            Try web
          </Link>
        </div>
        <button
          type="button"
          className="md:hidden p-2 text-white border border-white/15 rounded-lg"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-white/[0.06] bg-[#050505] px-5 py-6 flex flex-col gap-4">
          {[
            ['How it works', '#how'],
            ['Product', '#product'],
            ['Capabilities', '#capabilities'],
            ['Compare', '#compare'],
          ].map(([l, h]) => (
            <a key={h} href={h} className="text-sm font-medium text-neutral-300 py-2 border-b border-white/[0.06]" onClick={() => setOpen(false)}>
              {l}
            </a>
          ))}
          <Link href="/pricing" className="text-sm font-medium text-neutral-300 py-2 border-b border-white/[0.06]" onClick={() => setOpen(false)}>
            Pricing
          </Link>
          <Link href="/download" className="text-sm font-medium text-white py-2" onClick={() => setOpen(false)}>
            Download
          </Link>
          <Link
            href="/auth/login?next=/workspace"
            className="mt-2 text-center py-3 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-widest"
            onClick={() => setOpen(false)}
          >
            Try Control Web
          </Link>
        </div>
      )}
    </header>
  );
}

function SocialFooterIcons() {
  const links = getSocialLinks();
  const items: {
    id: keyof ReturnType<typeof getSocialLinks>;
    url: string;
    label: string;
    Icon: LucideIcon;
  }[] = [
    { id: 'twitter', url: links.twitter, label: 'X (Twitter)', Icon: Twitter },
    { id: 'github', url: "https://github.com/Control0123", label: 'GitHub', Icon: Github },
    { id: 'linkedin', url: "https://linkedin.com/company/control123", label: 'LinkedIn', Icon: Linkedin },
    { id: 'discord', url: "https://t.me/control0123", label: 'Discord', Icon: Send },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map(({ id, url, label, Icon }) =>
        url ? (
          <a
            key={id}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.12] text-neutral-400 hover:text-white hover:border-white/25 transition-colors"
          >
            <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
          </a>
        ) : (
          <span
            key={id}
            title={`Set NEXT_PUBLIC_SOCIAL_${String(id).toUpperCase()} in .env.local`}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-dashed border-white/[0.08] text-neutral-600 cursor-default"
            aria-label={`${label} (link not configured)`}
          >
            <Icon className="w-[18px] h-[18px] opacity-45" strokeWidth={1.75} />
          </span>
        )
      )}
    </div>
  );
}

function LandingFooter() {
  return (
    <footer className="relative z-10 border-t border-white/[0.08] bg-[#030303]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md border border-white/20">
                <Command className="w-3.5 h-3.5" strokeWidth={2} />
              </span>
              <span className="font-landing font-bold text-white">Control</span>
            </div>
            <p className="mt-4 text-sm text-neutral-500 leading-relaxed max-w-xs">
              An action layer for the desktop: vision, reasoning, and input automation in one product.
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-600 mb-4">Product</p>
            <ul className="space-y-3 text-sm text-neutral-400">
              <li>
                <Link href="/auth/login?next=/workspace" className="hover:text-white transition-colors inline-flex items-center gap-1">
                  Web workspace <ChevronRight className="w-3 h-3 opacity-50" />
                </Link>
              </li>
              <li>
                <Link href="/download" className="hover:text-white transition-colors">
                  Desktop downloads
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-600 mb-4">Legal</p>
            <ul className="space-y-3 text-sm text-neutral-400">
              <li>
                <Link href="/legal/terms" className="hover:text-white transition-colors">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="hover:text-white transition-colors">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/legal/cookies" className="hover:text-white transition-colors">
                  Cookies
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-600 mb-4">Company</p>
            <p className="text-sm text-neutral-500 leading-relaxed mb-5">
              Control AI builds the desktop action layer. 
              {/* <code className="text-xs text-neutral-400 font-mono">.env.local</code>). */}
            </p>
            <SocialFooterIcons />
          </div>
        </div>
        <div className="mt-14 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row justify-between gap-4 items-center text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-600">
          <span>© {new Date().getFullYear()} Control AI</span>
          {/* <span className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" strokeWidth={2} />
            Encrypted transport · Review security posture before production
          </span> */}
        </div>
      </div>
    </footer>
  );
}
