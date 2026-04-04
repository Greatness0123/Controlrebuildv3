'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'control_cookie_consent_v1';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      setVisible(false);
    }
  }, []);

  if (!visible) return null;

  const save = (value: 'accepted' | 'essential') => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-[200] p-4 sm:p-5 flex justify-center pointer-events-none"
      role="dialog"
      aria-label="Cookie consent"
    >
      <div className="pointer-events-auto w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl shadow-2xl px-5 py-4 sm:px-6 sm:py-5 text-sm text-neutral-300">
        <p className="leading-relaxed text-[13px] sm:text-sm">
          We use cookies and local storage to keep you signed in, remember preferences (such as theme), and run the app.
          See our{' '}
          <Link href="/legal/cookies" className="text-white underline underline-offset-2 hover:no-underline">
            Cookie Policy
          </Link>{' '}
          and{' '}
          <Link href="/legal/privacy" className="text-white underline underline-offset-2 hover:no-underline">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
          <button
            type="button"
            onClick={() => save('essential')}
            className="px-4 py-2.5 rounded-xl border border-white/15 text-[11px] font-semibold uppercase tracking-wider text-neutral-300 hover:bg-white/5 transition-colors"
          >
            Essential only
          </button>
          <button
            type="button"
            onClick={() => save('accepted')}
            className="px-4 py-2.5 rounded-xl bg-white text-black text-[11px] font-semibold uppercase tracking-wider hover:bg-neutral-200 transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
