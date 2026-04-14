"use client";

import type { Metadata } from 'next';
import { useState, useEffect } from 'react';

export const metadata: Metadata = {
  title: 'Community - Control Feedback Forum',
  description: 'Join the Control community. Share feedback, discuss features, and connect with other AI computer use users.',
  keywords: [
    'Control community',
    'AI feedback forum',
    'computer use discussion',
    'user feedback',
    'community讨论',
    'AI agent feedback',
  ],
};
import { MessageSquare, Heart, Copy, Reply, Send, Loader2, CheckCircle2, MoreHorizontal, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore, useChatStore } from '@/lib/store';
import { getSupabaseClient } from '@/lib/supabase';
import Link from 'next/link';

interface Comment {
  id: string;
  content: string;
  author_name: string;
  author_avatar?: string;
  created_at: string;
  likes: number;
  user_id?: string;
  parent_id?: string;
  replies?: Comment[];
}

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function CommunityPage() {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [likedComments, setLikedComments] = useState<string[]>([]);
  const supabase = getSupabaseClient();

  useEffect(() => {
    loadComments();
  }, []);

  const loadComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('community_comments')
        .select('*')
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (data) {
        const commentsWithReplies = await Promise.all(
          data.map(async (c) => {
            const { data: replies } = await supabase
              .from('community_comments')
              .select('*')
              .eq('parent_id', c.id)
              .order('created_at', { ascending: true });
            return { ...c, replies: replies || [] };
          })
        );
        setComments(commentsWithReplies as any);
      }
    } catch (err) {
      console.error('Error loading comments:', err);
      setComments([]);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!newComment.trim() || !user) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('community_comments')
        .insert({
          content: newComment,
          author_name: user.user_metadata?.first_name || user.email?.split('@')[0] || 'Anonymous',
          user_id: user.id,
        })
        .select()
        .single();

      if (data) {
        setComments([{ ...data, replies: [] }, ...comments]);
        setNewComment('');
        toast.success('Comment posted!');
      }
    } catch (err) {
      console.error('Error posting comment:', err);
    }
    setSubmitting(false);
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim() || !user) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('community_comments')
        .insert({
          content: replyContent,
          author_name: user.user_metadata?.first_name || user.email?.split('@')[0] || 'Anonymous',
          user_id: user.id,
          parent_id: parentId,
        })
        .select()
        .single();

      if (data) {
        setComments(comments.map(c => {
          if (c.id === parentId) {
            return { ...c, replies: [...(c.replies || []), data] };
          }
          return c;
        }));
        setReplyContent('');
        setReplyingTo(null);
        toast.success('Reply posted!');
      }
    } catch (err) {
      console.error('Error posting reply:', err);
    }
    setSubmitting(false);
  };

  const handleLike = async (commentId: string) => {
    if (!user) {
      toast.error('Please sign in to like comments');
      return;
    }
    if (likedComments.includes(commentId)) return;
    
    setLikedComments([...likedComments, commentId]);
    setComments(comments.map(c => {
      if (c.id === commentId) {
        return { ...c, likes: c.likes + 1 };
      }
      return c;
    }));

    try {
      await supabase
        .from('community_comments')
        .update({ likes: comments.find(c => c.id === commentId)?.likes || 0 })
        .eq('id', commentId);
    } catch (err) {
      console.error('Error liking comment:', err);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard');
  };

  const handleDelete = async (commentId: string) => {
    if (!user) return;
    try {
      await supabase.from('community_comments').delete().eq('id', commentId);
      setComments(comments.filter(c => c.id !== commentId));
      toast.success('Comment deleted');
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-xl font-black text-foreground uppercase tracking-tight">Community</h1>
        <p className="text-xs text-text-muted">Share feedback, ideas, and connect with other Control users</p>
      </div>

      {user ? (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
          <textarea
            placeholder="Share your thoughts..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full bg-secondary border border-border rounded-xl p-3 text-sm text-foreground outline-none focus:border-border transition-all resize-none min-h-[80px]"
          />
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitting || !newComment.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-accent-foreground rounded-lg text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Post
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-6 text-center">
          <MessageSquare size={24} className="mx-auto text-text-muted mb-2" />
          <p className="text-sm text-text-muted">Sign in to join the conversation</p>
          <Link
            href="/auth/login"
            className="mt-3 inline-flex px-4 py-2 bg-accent-primary text-accent-foreground rounded-lg text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all"
          >
            Sign In
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 size={20} className="mx-auto animate-spin text-text-muted" />
          </div>
        ) : comments.length === 0 ? (
          <div className="py-12 text-center text-text-muted text-sm">No comments yet. Be the first to share!</div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              user={user}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              likedComments={likedComments}
              onLike={handleLike}
              onCopy={handleCopy}
              onDelete={handleDelete}
              onReply={handleReply}
              submitting={submitting}
              formatDate={formatDate}
            />
          ))
        )}
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  user,
  replyingTo,
  setReplyingTo,
  replyContent,
  setReplyContent,
  likedComments,
  onLike,
  onCopy,
  onDelete,
  onReply,
  submitting,
  formatDate,
}: {
  comment: Comment;
  user: any;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  replyContent: string;
  setReplyContent: (content: string) => void;
  likedComments: string[];
  onLike: (id: string) => void;
  onCopy: (content: string) => void;
  onDelete: (id: string) => void;
  onReply: (id: string) => void;
  submitting: boolean;
  formatDate: (date: string) => string;
}) {
  const [showReplies, setShowReplies] = useState(false);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary text-xs font-bold">
              {comment.author_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">{comment.author_name}</p>
              <p className="text-[10px] text-text-muted">{formatDate(comment.created_at)}</p>
            </div>
          </div>
          {user && user.id === comment.user_id && (
            <button
              onClick={() => onDelete(comment.id)}
              className="p-1.5 hover:bg-red-500/10 rounded-lg text-text-muted hover:text-red-400 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        <p className="text-sm text-foreground leading-relaxed">{comment.content}</p>

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={() => onLike(comment.id)}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-colors",
              likedComments.includes(comment.id) ? "text-red-500" : "text-text-muted hover:text-red-400"
            )}
          >
            <Heart size={14} fill={likedComments.includes(comment.id) ? "currentColor" : "none"} />
            {comment.likes}
          </button>
          
          {user && (
            <button
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="flex items-center gap-1.5 text-xs text-text-muted hover:text-foreground transition-colors"
            >
              <Reply size={14} />
              Reply
            </button>
          )}
          
          <button
            onClick={() => onCopy(comment.content)}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-foreground transition-colors"
          >
            <Copy size={14} />
            Copy
          </button>
        </div>

        {replyingTo === comment.id && (
          <div className="flex gap-2 pt-2">
            <textarea
              placeholder="Write a reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="flex-1 bg-secondary border border-border rounded-lg p-2 text-xs text-foreground outline-none focus:border-border transition-all resize-none min-h-[60px]"
            />
            <button
              onClick={() => onReply(comment.id)}
              disabled={submitting || !replyContent.trim()}
              className="px-3 py-2 bg-accent-primary text-accent-foreground rounded-lg text-xs font-bold uppercase hover:opacity-90 transition-all disabled:opacity-50"
            >
              <Send size={14} />
            </button>
          </div>
        )}
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="border-t border-border">
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="w-full px-4 py-2 flex items-center gap-2 text-xs text-text-muted hover:text-foreground transition-colors"
          >
            <Reply size={12} />
            {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
          </button>
          
          {showReplies && (
            <div className="px-4 pb-4 space-y-2">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="pl-4 border-l-2 border-border">
                  <div className="flex items-center gap-2 py-1.5">
                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-text-muted text-[10px] font-bold">
                      {reply.author_name.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-[10px] font-medium text-foreground">{reply.author_name}</p>
                    <p className="text-[10px] text-text-muted">{formatDate(reply.created_at)}</p>
                  </div>
                  <p className="text-xs text-foreground pl-8">{reply.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}