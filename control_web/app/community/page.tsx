'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { MessageSquare, Heart, Copy, Reply, Send, Loader2, CheckCircle2, MoreHorizontal, Trash2, ArrowLeft, Command, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore, useChatStore } from '@/lib/store';
import { getSupabaseClient } from '@/lib/supabase';

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
            return { ...c, replies: [...(c.replies || []), { ...data, replies: [] }] };
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
    const isLiked = likedComments.includes(commentId);
    setLikedComments(isLiked ? likedComments.filter(id => id !== commentId) : [...likedComments, commentId]);

    setComments(comments.map(c => {
      if (c.id === commentId) {
        return { ...c, likes: isLiked ? c.likes - 1 : c.likes + 1 };
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
    <div className="min-h-screen bg-[#050505] text-[#f5f5f5] font-landing-body">
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255,255,255,0.14), transparent),
              radial-gradient(ellipse 60% 40% at 100% 50%, rgba(255,255,255,0.06), transparent),
              radial-gradient(ellipse 50% 30% at 0% 80%, rgba(255,255,255,0.05), transparent)`,
          }}
        />
      </div>

      <header className="relative z-10 border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={2} />
            Home
          </Link>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20">
              <Command className="w-3.5 h-3.5" strokeWidth={2} />
            </span>
            <span className="font-landing text-sm font-bold text-white">Control</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="mb-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-500 mb-3">Community</p>
          <h1 className="font-landing text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
            Join the conversation
          </h1>
          <p className="mt-4 text-neutral-400 text-sm sm:text-base max-w-xl">
            Share feedback, ideas, and connect with other Control users
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }} className="space-y-4">
            {loading ? (
              <div className="py-12 text-center">
                <Loader2 size={20} className="mx-auto animate-spin text-neutral-500" />
              </div>
            ) : comments.length === 0 ? (
              <div className="py-12 text-center text-neutral-500 text-sm">No comments yet. Be the first to share!</div>
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
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.2 }} className="hidden lg:sticky lg:top-24 lg:block h-fit">
            {user ? (
              <div className="bg-white/[0.03] border border-white/[0.1] rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2">
                  <Users size={16} className="text-neutral-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Share your thoughts</span>
                </div>
                <textarea
                  placeholder="What&apos;s on your mind?"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/[0.1] rounded-xl p-4 text-sm text-white placeholder-neutral-500 outline-none focus:border-white/20 transition-all resize-none min-h-[120px]"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !newComment.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-full text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition-all disabled:opacity-50"
                  >
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    Post
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white/[0.03] border border-white/[0.1] rounded-2xl p-6 text-center">
                <MessageSquare size={24} className="mx-auto text-neutral-500 mb-3" />
                <p className="text-sm text-neutral-400 mb-4">Sign in to join the conversation</p>
                <Link
                  href="/auth/login"
                  className="inline-flex px-5 py-2.5 bg-white text-black rounded-full text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition-all"
                >
                  Sign In
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </main>

      {user && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#050505]/90 backdrop-blur-lg border-t border-white/[0.08] lg:hidden z-40">
          <div className="bg-white/[0.03] border border-white/[0.1] rounded-xl p-4 space-y-3">
            <textarea
              placeholder="What&apos;s on your mind?"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/[0.1] rounded-lg p-3 text-sm text-white placeholder-neutral-500 outline-none focus:border-white/20 transition-all resize-none min-h-[80px]"
            />
            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={submitting || !newComment.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition-all disabled:opacity-50"
              >
                {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                Post
              </button>
            </div>
          </div>
        </div>
      )}
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
    <div className="bg-white/[0.03] border border-white/[0.1] rounded-2xl overflow-hidden">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white text-xs font-bold">
              {comment.author_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{comment.author_name}</p>
              <p className="text-[10px] text-neutral-500">{formatDate(comment.created_at)}</p>
            </div>
          </div>
          {user && user.id === comment.user_id && (
            <button
              onClick={() => onDelete(comment.id)}
              className="p-1.5 hover:bg-red-500/10 rounded-lg text-neutral-500 hover:text-red-400 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        <p className="text-sm text-neutral-300 leading-relaxed">{comment.content}</p>

        <div className="flex items-center gap-4 pt-1">
          <button
            onClick={() => onLike(comment.id)}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-colors",
              likedComments.includes(comment.id) ? "text-red-400" : "text-neutral-500 hover:text-red-400"
            )}
          >
            <Heart size={14} fill={likedComments.includes(comment.id) ? "currentColor" : "none"} />
            {comment.likes}
          </button>
          
          {user && (
            <button
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-white transition-colors"
            >
              <Reply size={14} />
              Reply
            </button>
          )}
          
          <button
            onClick={() => onCopy(comment.content)}
            className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-white transition-colors"
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
              className="flex-1 bg-white/[0.02] border border-white/[0.1] rounded-lg p-3 text-xs text-white placeholder-neutral-500 outline-none focus:border-white/20 transition-all resize-none min-h-[60px]"
            />
            <button
              onClick={() => onReply(comment.id)}
              disabled={submitting || !replyContent.trim()}
              className="px-3 py-2 bg-white text-black rounded-lg text-xs font-semibold hover:bg-neutral-200 transition-all disabled:opacity-50"
            >
              <Send size={14} />
            </button>
          </div>
        )}
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="border-t border-white/[0.1]">
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="w-full px-4 py-2 flex items-center gap-2 text-xs text-neutral-500 hover:text-white transition-colors"
          >
            <Reply size={12} />
            {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
          </button>
          
          {showReplies && (
            <div className="px-4 pb-4 space-y-2">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="pl-4 border-l-2 border-white/[0.1]">
                  <div className="flex items-center gap-2 py-1.5">
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-neutral-400 text-[10px] font-bold">
                      {reply.author_name.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-[10px] font-medium text-white">{reply.author_name}</p>
                    <p className="text-[10px] text-neutral-500">{formatDate(reply.created_at)}</p>
                  </div>
                  <p className="text-xs text-neutral-300 pl-8">{reply.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}