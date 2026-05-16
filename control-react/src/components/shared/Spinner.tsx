import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
}

const sizeMap = {
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
};

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
  const iconSize = typeof size === 'number' ? size : sizeMap[size];

  return (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`animate-spin ${className}`}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
};
