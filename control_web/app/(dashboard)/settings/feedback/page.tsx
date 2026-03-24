"use client";

export default function FeedbackPage() {
  return (
    <div className="p-6 md:p-8 lg:p-12 max-w-2xl mx-auto space-y-8">
      <h2 className="text-lg font-black text-foreground">Feedback</h2>
      <div className="space-y-6">
        <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-black text-foreground">Send Feedback</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            Help us improve Control by sharing your thoughts, bug reports, or feature requests.
          </p>
          <textarea
            placeholder="Tell us what you think..."
            rows={5}
            className="w-full bg-secondary border border-border rounded-xl p-4 text-sm text-foreground outline-none focus:border-border transition-all resize-none"
          />
          <button className="px-5 py-3 bg-accent-primary text-accent-foreground rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all">
            Send Feedback
          </button>
        </div>
      </div>
    </div>
  );
}
