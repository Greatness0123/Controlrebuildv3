"use client";

import { useState } from 'react';
import { MessageSquare, Star, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function FeedbackPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setLoading(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1000));
    setSent(true);
    toast.success('Thank you for your feedback!');
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="p-6 md:p-8 lg:p-12 max-w-2xl mx-auto flex flex-col items-center justify-center text-center space-y-6 py-32">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
          <CheckCircle2 size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Feedback Received!</h2>
          <p className="text-xs text-text-muted max-w-sm">
            Thank you for helping us make Control better. We review all feedback personally.
          </p>
        </div>
        <button
          onClick={() => { setSent(false); setMessage(''); setRating(0); }}
          className="px-6 py-2 bg-secondary border border-border rounded-xl text-xs font-black uppercase tracking-widest hover:bg-card-hover transition-all"
        >
          Send More
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 lg:p-12 max-w-2xl mx-auto space-y-8">
      <h2 className="text-lg font-black text-foreground">Feedback</h2>
      <div className="space-y-6">
        <div className="bg-card border border-border p-6 rounded-2xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary">
              <MessageSquare size={20} />
            </div>
            <h3 className="text-sm font-black text-foreground uppercase tracking-tight">Send Feedback</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">How would you rate your experience?</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setRating(s)}
                    className={cn(
                      "w-10 h-10 rounded-xl border transition-all flex items-center justify-center",
                      rating >= s
                        ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500"
                        : "bg-secondary border-border text-text-muted hover:border-border"
                    )}
                  >
                    <Star size={16} fill={rating >= s ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">What can we improve?</label>
              <textarea
                placeholder="Tell us what you think..."
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl p-4 text-sm text-foreground outline-none focus:border-border transition-all resize-none"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !message.trim()}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-accent-primary text-accent-foreground rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Send Feedback
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}
