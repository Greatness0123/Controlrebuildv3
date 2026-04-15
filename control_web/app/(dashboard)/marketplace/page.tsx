"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { marketplaceApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import {
  Search, Star, ShoppingCart, MessageSquare, DollarSign, Upload, 
  Loader2, Grid, List, Filter, TrendingUp, Clock, User,
  MoreHorizontal, Check, X, ChevronDown, Tag, Eye
} from 'lucide-react';
import { useModal } from '@/lib/useModal';
import { toast } from 'sonner';



function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

const CATEGORIES = [
  { id: 'all', name: 'All Workflows', icon: Grid },
  { id: 'productivity', name: 'Productivity', icon: TrendingUp },
  { id: 'developer', name: 'Developer Tools', icon: Code },
  { id: 'automation', name: 'Automation', icon: Filter },
  { id: 'ai', name: 'AI & ML', icon: Brain },
  { id: 'data', name: 'Data Processing', icon: Database },
];

function Code({ size }: { size?: number }) {
  const s = size || 24;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function Brain({ size }: { size?: number }) {
  const s = size || 24;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5a2.5 2.5 0 0 1 2.5 2.5A2.5 2.5 0 0 1 12 9a2.5 2.5 0 0 1-2.5 2.5A2.5 2.5 0 0 1 7 9a2.5 2.5 0 0 1 2.5-2.5" />
      <path d="M9.5 2A2.5 2.5 0 0 0 7 4.5a2.5 2.5 0 0 0 2.5 2.5A2.5 2.5 0 0 0 12 9a2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 12 4.5a2.5 2.5 0 0 0-2.5-2.5" />
      <path d="M17 5a2.5 2.5 0 0 1 2.5 2.5A2.5 2.5 0 0 1 17 10a2.5 2.5 0 0 1-2.5 2.5A2.5 2.5 0 0 1 12 10a2.5 2.5 0 0 1 2.5-2.5" />
      <path d="M12 12a2 2 0 0 1 2 2 2 2 0 0 1-2 2 2 2 0 0 1-2-2 2 2 0 0 1 2-2" />
      <path d="M12 12v4" />
      <path d="M12 16v2" />
    </svg>
  );
}

function Database({ size }: { size?: number }) {
  const s = size || 24;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

export default function MarketplacePage() {
  const { user } = useAuthStore();
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'price_asc' | 'price_desc'>('popular');
  const { modal, confirm } = useModal();

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const res = await marketplaceApi.list(category === 'all' ? undefined : category);
      setWorkflows(res.workflows);
    } catch (err: any) {
      console.error('Failed to fetch marketplace:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, [category]);

  const filteredWorkflows = workflows
    .filter(w => search.toLowerCase() === '' || w.name?.toLowerCase().includes(search.toLowerCase()) || w.description?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular': return (b.stars || 0) - (a.stars || 0);
        case 'recent': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'price_asc': return (a.price || 0) - (b.price || 0);
        case 'price_desc': return (b.price || 0) - (a.price || 0);
        default: return 0;
      }
    });

  const handlePurchase = async (wf: any) => {
    try {
      let confirmed = true;
      if (wf.price > 0) {
        confirmed = await confirm(`Purchase "${wf.name}" for $${wf.price}?`, {
          title: 'Confirm Purchase',
        });
      }
      if (!confirmed) return;
      await marketplaceApi.purchase(wf.id);
      toast.success('Workflow purchased successfully!');
      fetchWorkflows();
    } catch (err: any) {
      toast.error(err.message || 'Purchase failed');
    }
  };

  const handleStar = async (wf: any) => {
    try {
      if (wf.user_starred) {
        await marketplaceApi.unstar(wf.id);
      } else {
        await marketplaceApi.star(wf.id);
      }
      setWorkflows(prev => prev.map(w => 
        w.id === wf.id 
          ? { 
              ...w, 
              stars: wf.user_starred ? (w.stars || 1) - 1 : (w.stars || 0) + 1,
              user_starred: !wf.user_starred 
            } 
          : w
      ));
    } catch (err: any) {
      toast.error(err.message || 'Failed to update star');
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col h-full bg-background">
      {modal}
      <div className="flex flex-col h-full">
        <div className="h-16 border-b border-border flex items-center px-4 lg:px-8 gap-4 shrink-0">
          <div className="w-80 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search workflows..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 bg-secondary border border-border rounded-xl text-xs text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent-primary/50"
            />
          </div>
          
          <div className="flex-1" />
          
          <div className="hidden md:flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-9 px-3 bg-secondary border border-border rounded-xl text-xs text-foreground focus:outline-none"
            >
              <option value="popular">Most Popular</option>
              <option value="recent">Most Recent</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
          
          <div className="flex items-center gap-1 border border-border rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={cn("p-1.5 rounded-md transition-all", viewMode === 'grid' ? "bg-card text-foreground" : "text-text-muted hover:text-foreground")}
            >
              <Grid size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn("p-1.5 rounded-md transition-all", viewMode === 'list' ? "bg-card text-foreground" : "text-text-muted hover:text-foreground")}
            >
              <List size={14} />
            </button>
          </div>
        </div>
        
        <div className="flex-1 flex overflow-hidden">
          <div className="w-48 border-r border-border overflow-y-auto shrink-0 hidden md:block p-3">
            <div className="space-y-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                    category === cat.id 
                      ? "bg-accent-primary text-accent-foreground" 
                      : "text-text-secondary hover:bg-card-hover hover:text-foreground"
                  )}
                >
                  <cat.icon size={14} />
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-text-muted" />
              </div>
            ) : filteredWorkflows.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart size={32} className="text-text-muted opacity-20" />
                </div>
                <h3 className="text-lg font-black mb-2 uppercase">No Workflows Found</h3>
                <p className="text-sm text-text-muted mb-6">Be the first to publish a workflow!</p>
                <Link
                  href="/workflows"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-accent-primary text-accent-foreground rounded-xl text-xs font-black uppercase tracking-widest"
                >
                  <Upload size={14} />
                  Publish Workflow
                </Link>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredWorkflows.map(wf => (
                  <MarketplaceCard
                    key={wf.id}
                    workflow={wf}
                    onPurchase={() => handlePurchase(wf)}
                    onStar={() => handleStar(wf)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredWorkflows.map(wf => (
                  <MarketplaceListItem
                    key={wf.id}
                    workflow={wf}
                    onPurchase={() => handlePurchase(wf)}
                    onStar={() => handleStar(wf)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MarketplaceCard({ workflow, onPurchase, onStar }: { workflow: any; onPurchase: () => void; onStar: () => void }) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div 
      className="bg-card border border-border rounded-2xl p-5 hover:border-accent-primary/30 transition-all group flex flex-col"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
          <Tag size={18} className="text-text-muted" />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.preventDefault(); onStar(); }}
            className={cn(
              "p-1.5 rounded-lg transition-all",
              workflow.user_starred ? "text-yellow-500" : "text-text-muted hover:text-yellow-500"
            )}
          >
            <Star size={14} fill={workflow.user_starred ? "currentColor" : "none"} />
          </button>
          <div className="text-[10px] font-bold text-text-muted">{workflow.stars || 0}</div>
        </div>
      </div>
      
      <div className="flex-1 mb-3">
        <h3 className="text-sm font-black truncate mb-1 uppercase">{workflow.name}</h3>
        <p className="text-[11px] text-text-muted line-clamp-2">{workflow.description}</p>
      </div>
      
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-2 text-text-muted">
          <User size={11} />
          <span className="text-[10px] font-medium truncate max-w-20">{workflow.author_name || 'Anonymous'}</span>
        </div>
        
        {workflow.price > 0 ? (
          <div className="flex items-center gap-1 text-accent-primary">
            <DollarSign size={12} />
            <span className="text-sm font-black">{workflow.price}</span>
          </div>
        ) : (
          <span className="text-[10px] font-bold text-emerald-500 uppercase">Free</span>
        )}
      </div>
      
      {showActions && (
        <div className="absolute bottom-5 left-5 right-5 flex gap-2 animate-in slide-in-from-bottom-2">
          <button
            onClick={onPurchase}
            className="flex-1 py-2 bg-accent-primary text-accent-foreground rounded-lg text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all"
          >
            {workflow.price > 0 ? 'Purchase' : 'Get Free'}
          </button>
        </div>
      )}
    </div>
  );
}

function MarketplaceListItem({ workflow, onPurchase, onStar }: { workflow: any; onPurchase: () => void; onStar: () => void }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-accent-primary/30 transition-all">
      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
        <Tag size={18} className="text-text-muted" />
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-black truncate uppercase">{workflow.name}</h3>
        <p className="text-[11px] text-text-muted truncate">{workflow.description}</p>
      </div>
      
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-1 text-text-muted">
          <Star size={12} />
          <span className="text-[10px] font-bold">{workflow.stars || 0}</span>
        </div>
        
        <div className="flex items-center gap-1 text-text-muted">
          <MessageSquare size={12} />
          <span className="text-[10px] font-bold">{workflow.comments_count || 0}</span>
        </div>
        
        <div className="flex items-center gap-1 text-text-muted">
          <Eye size={12} />
          <span className="text-[10px] font-bold">{workflow.downloads || 0}</span>
        </div>
        
        {workflow.price > 0 ? (
          <div className="flex items-center gap-1 text-accent-primary">
            <DollarSign size={14} />
            <span className="text-sm font-black">{workflow.price}</span>
          </div>
        ) : (
          <span className="text-[10px] font-bold text-emerald-500 uppercase">Free</span>
        )}
        
        <button
          onClick={onStar}
          className={cn(
            "p-2 rounded-lg transition-all",
            workflow.user_starred ? "text-yellow-500" : "text-text-muted hover:text-yellow-500"
          )}
        >
          <Star size={16} fill={workflow.user_starred ? "currentColor" : "none"} />
        </button>
        
        <button
          onClick={onPurchase}
          className="py-2 px-4 bg-accent-primary text-accent-foreground rounded-lg text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all"
        >
          {workflow.price > 0 ? 'Buy' : 'Get'}
        </button>
      </div>
    </div>
  );
}