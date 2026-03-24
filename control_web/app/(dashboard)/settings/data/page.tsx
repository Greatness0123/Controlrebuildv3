"use client";

export default function DataPage() {
  return (
    <div className="p-6 md:p-8 lg:p-12 max-w-2xl mx-auto space-y-8">
      <h2 className="text-lg font-black text-foreground">Data & Export</h2>
      <div className="space-y-6">
        <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-black text-foreground">Export Your Data</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            Download a copy of your chat sessions, settings, and usage data.
          </p>
          <button className="px-5 py-3 bg-accent-primary text-accent-foreground rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all">
            Export Data
          </button>
        </div>
      </div>
    </div>
  );
}
