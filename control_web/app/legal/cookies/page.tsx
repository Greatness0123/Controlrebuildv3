import Link from 'next/link';
import type { Metadata } from 'next';
import { readFile } from 'fs/promises';
import path from 'path';
import { LegalMarkdown } from '@/components/LegalMarkdown';

export const metadata: Metadata = {
  title: 'Cookie Policy — Control',
  description: 'How Control uses cookies and similar technologies.',
};

export default async function CookiesPage() {
  const mdPath = path.join(process.cwd(), 'legal', 'copy', 'cookies.md');
  const content = await readFile(mdPath, 'utf8');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5] font-landing-body">
      <header className="border-b border-white/10 px-6 py-6 max-w-3xl mx-auto">
        <Link
          href="/"
          className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500 hover:text-white transition-colors"
        >
          Back to home
        </Link>
        <h1 className="mt-6 font-landing text-3xl font-bold text-white tracking-tight">Cookie Policy</h1>
        <p className="mt-2 text-sm text-neutral-500">How we use cookies and local storage on the Sites.</p>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12">
        <LegalMarkdown content={content} />
      </main>
    </div>
  );
}
