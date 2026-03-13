import React from 'react';
import { Monitor, Shield, Globe, Layout, Smartphone, Command } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <header className="mb-16">
        <div className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold tracking-wider uppercase bg-gray-100 dark:bg-gray-800 rounded-full">
          Cloud & Local Integration
        </div>
        <h1 className="text-7xl font-extrabold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-black to-gray-500 dark:from-white dark:to-gray-400">
          CONTROL WEB
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          The ultimate command center for your computing resources. Access local systems and virtual machines with AI-powered assistance.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full mb-16">
        <FeatureCard
          icon={<Monitor className="w-8 h-8" />}
          title="Remote Dashboard"
          description="View and control your connected systems in real-time through high-performance WebRTC."
        />
        <FeatureCard
          icon={<Shield className="w-8 h-8" />}
          title="Secure Pairing"
          description="End-to-end encrypted connection between your local desktop app and the web."
        />
        <FeatureCard
          icon={<Globe className="w-8 h-8" />}
          title="VM Management"
          description="Spin up virtual computers on demand for isolated testing and automation."
        />
      </div>

      <div className="flex gap-4">
        <button className="btn-primary flex items-center gap-2 px-8 py-4 text-lg">
          Get Started
        </button>
        <button className="border border-black dark:border-white px-8 py-4 text-lg rounded font-medium">
          Documentation
        </button>
      </div>

      <footer className="mt-24 text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} Control AI. Professional Computer Use.
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="card text-left flex flex-col items-start gap-4">
      <div className="p-3 bg-gray-100 dark:bg-gray-900 rounded-full">
        {icon}
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}
