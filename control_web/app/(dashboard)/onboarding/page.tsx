'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import { safeNextPath } from '@/lib/safe-next-path';
import {
  Command,
  ArrowRight,
  Loader2,
  Monitor,
  Cloud,
  Briefcase,
  Code2,
  Palette,
  GraduationCap,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { WORKSPACE_TOUR_SESSION_KEY, WORKSPACE_HINTS_SESSION_KEY } from '@/lib/onboarding';

const GOALS = [
  { id: 'work_ops', label: 'Work & operations', desc: 'Reports, admin tools, internal apps', icon: Briefcase },
  { id: 'dev_it', label: 'Development & IT', desc: 'IDEs, terminals, infrastructure', icon: Code2 },
  { id: 'creative', label: 'Creative & media', desc: 'Design, video, audio tools', icon: Palette },
  { id: 'personal', label: 'Personal productivity', desc: 'Browsers, files, daily tasks', icon: Sparkles },
  { id: 'learning', label: 'Learning & exploration', desc: 'Trying agents and workflows', icon: GraduationCap },
];

const SURFACES = [
  { id: 'desktop', label: 'Mostly desktop app', desc: 'Automation on my own machine' },
  { id: 'web_cloud', label: 'Web + cloud machines', desc: 'Sessions in the browser on VMs' },
  { id: 'both', label: 'Both', desc: 'Local and cloud' },
  { id: 'unsure', label: 'Not sure yet', desc: 'Show me the options' },
];

const EXPERIENCE = [
  { id: 'new', label: 'New to desktop agents', desc: 'First time with this style of tool' },
  { id: 'some', label: 'Some automation experience', desc: 'Scripts, RPA, or macros' },
  { id: 'power', label: 'Comfortable with technical tools', desc: 'CLI, APIs, complex UIs' },
];

function OnboardingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextRaw = searchParams.get('next');
  const nextPath = useMemo(() => safeNextPath(nextRaw, '/workspace'), [nextRaw]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);
  const [goals, setGoals] = useState<string[]>([]);
  const [surface, setSurface] = useState<string | null>(null);
  const [experience, setExperience] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace(`/auth/login?next=${encodeURIComponent('/onboarding')}`);
        return;
      }
      const meta = session.user.user_metadata as Record<string, unknown>;
      if (meta?.onboarding_completed !== false) {
        router.replace(nextPath);
        return;
      }
      setLoading(false);
    });
  }, [router, nextPath]);

  const toggleGoal = (id: string) => {
    setGoals((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]));
  };

  const finish = async () => {
    setSaving(true);
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.updateUser({
        data: {
          onboarding_completed: true,
          onboarding_goals: goals,
          onboarding_surface: surface,
          onboarding_experience: experience,
          onboarding_completed_at: new Date().toISOString(),
        },
      });
      try {
        sessionStorage.setItem(WORKSPACE_TOUR_SESSION_KEY, '1');
        sessionStorage.setItem(WORKSPACE_HINTS_SESSION_KEY, '1');
      } catch {
        /* ignore */
      }
      router.push(nextPath);
      router.refresh();
    } catch {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-text-muted" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-lg mx-auto px-4 py-10 sm:py-14">
        <div className="flex items-center gap-2 text-text-muted mb-8">
          <div className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center">
            <Command size={18} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Setup</span>
        </div>

        {step === 0 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Welcome to Control
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed">
              Control runs tasks on real desktop software: it can see the screen, click, type, and use the terminal. You
              can work locally with the desktop app or here in the browser with cloud machines and paired devices.
            </p>
            <p className="text-xs text-text-muted leading-relaxed">
              This short setup helps us tailor tips (stored on your account). You can change habits anytime; nothing
              here limits features.
            </p>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full py-3.5 rounded-xl bg-accent-primary text-accent-foreground text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90"
            >
              Continue
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <h2 className="text-xl font-black text-foreground tracking-tight">What will you use Control for?</h2>
            <p className="text-xs text-text-muted">Pick any that apply.</p>
            <div className="space-y-2">
              {GOALS.map(({ id, label, desc, icon: Icon }) => {
                const on = goals.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleGoal(id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex gap-3 ${
                      on
                        ? 'border-accent-primary bg-accent-primary/5'
                        : 'border-border bg-card hover:border-border/80'
                    }`}
                  >
                    <Icon size={20} className="shrink-0 mt-0.5 text-text-muted" />
                    <div>
                      <p className="text-sm font-bold text-foreground">{label}</p>
                      <p className="text-[11px] text-text-muted mt-0.5">{desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="flex-1 py-3 rounded-xl border border-border text-[10px] font-black uppercase tracking-widest text-text-muted"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-xl bg-accent-primary text-accent-foreground text-[10px] font-black uppercase tracking-widest"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <h2 className="text-xl font-black text-foreground tracking-tight">Where will you spend most time?</h2>
            <div className="space-y-2">
              {SURFACES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSurface(s.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    surface === s.id
                      ? 'border-accent-primary bg-accent-primary/5'
                      : 'border-border bg-card hover:border-border/80'
                  }`}
                >
                  <p className="text-sm font-bold text-foreground flex items-center gap-2">
                    {s.id === 'web_cloud' && <Cloud size={16} className="text-text-muted" />}
                    {s.id === 'desktop' && <Monitor size={16} className="text-text-muted" />}
                    {(s.id === 'both' || s.id === 'unsure') && <HelpCircle size={16} className="text-text-muted" />}
                    {s.label}
                  </p>
                  <p className="text-[11px] text-text-muted mt-1">{s.desc}</p>
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-xl border border-border text-[10px] font-black uppercase tracking-widest text-text-muted"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!surface}
                onClick={() => setStep(3)}
                className="flex-1 py-3 rounded-xl bg-accent-primary text-accent-foreground text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <h2 className="text-xl font-black text-foreground tracking-tight">How familiar are you with automation?</h2>
            <div className="space-y-2">
              {EXPERIENCE.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setExperience(e.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    experience === e.id
                      ? 'border-accent-primary bg-accent-primary/5'
                      : 'border-border bg-card hover:border-border/80'
                  }`}
                >
                  <p className="text-sm font-bold text-foreground">{e.label}</p>
                  <p className="text-[11px] text-text-muted mt-1">{e.desc}</p>
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-xl border border-border text-[10px] font-black uppercase tracking-widest text-text-muted"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!experience || saving}
                onClick={finish}
                className="flex-1 py-3 rounded-xl bg-accent-primary text-accent-foreground text-[10px] font-black uppercase tracking-widest disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                Go to workspace
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-[10px] text-text-muted mt-10">
          <button
            type="button"
            className="underline hover:text-foreground disabled:opacity-40"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                const supabase = getSupabaseClient();
                await supabase.auth.updateUser({
                  data: {
                    onboarding_completed: true,
                    onboarding_skipped: true,
                    onboarding_completed_at: new Date().toISOString(),
                  },
                });
                router.push(nextPath);
                router.refresh();
              } finally {
                setSaving(false);
              }
            }}
          >
            Skip for now
          </button>
        </p>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-text-muted" />
        </div>
      }
    >
      <OnboardingInner />
    </Suspense>
  );
}
