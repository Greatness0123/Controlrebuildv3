import React from 'react';
import { Icon, IconName } from './Icon';
import { Spinner } from './Spinner';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  iconLeft?: IconName;
  iconRight?: IconName;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  loading = false,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 gap-2";

  const variants = {
    primary: "bg-white text-black hover:bg-white/90",
    ghost: "bg-transparent text-white border border-transparent hover:border-white",
    danger: "bg-transparent text-white border border-transparent hover:bg-red-500 hover:text-white hover:border-red-500",
  };

  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  };

  const iconSizeMap = {
    sm: 'sm',
    md: 'md',
    lg: 'lg',
  } as const;

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Spinner size={iconSizeMap[size]} />
      ) : (
        <>
          {iconLeft && <Icon name={iconLeft} size={iconSizeMap[size]} />}
          {children}
          {iconRight && <Icon name={iconRight} size={iconSizeMap[size]} />}
        </>
      )}
    </button>
  );
};
