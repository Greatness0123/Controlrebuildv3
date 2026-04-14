import type { Metadata } from 'next';
import LandingMarketing from '@/components/landing/LandingMarketing';

export const metadata: Metadata = {
  title: 'Control — AI Computer Use That Drives Your Desktop',
  description: 'Control is AI-powered computer use software that drives your desktop apps using voice commands and automation. Local execution or cloud machines available.',
  keywords: [
    'AI computer use',
    'computer use',
    'desktop automation',
    'AI assistant',
    'voice control',
    'AI agent',
    'software automation',
    'AI desktop assistant',
    'automate desktop',
  ],
};

export default function HomePage() {
  return <LandingMarketing />;
}
