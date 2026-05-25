import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ScrollAreaProps {
  children: React.ReactNode;
  className?: string;
}

export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ children, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("overflow-y-auto overflow-x-hidden custom-scrollbar", className)}
      >
        {children}
      </div>
    );
  }
);

ScrollArea.displayName = 'ScrollArea';
