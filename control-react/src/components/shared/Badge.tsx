import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'error' | 'warning' | 'neutral' | 'running';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', className }) => {
  const variants = {
    success: "bg-green-500/10 text-[var(--color-success)] border-green-500/20",
    error: "bg-red-500/10 text-[var(--color-error)] border-red-500/20",
    warning: "bg-yellow-500/10 text-[var(--color-warning)] border-yellow-500/20",
    neutral: "bg-white/5 text-[var(--text-secondary)] border-white/10",
    running: "bg-blue-500/10 text-[var(--color-info)] border-blue-500/20 animate-pulse",
  };

  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
};
