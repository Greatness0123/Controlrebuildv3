import React from 'react';
import * as LucideIcons from 'lucide-react';

export type IconName = keyof typeof LucideIcons;

interface IconProps extends LucideIcons.LucideProps {
  name: IconName;
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
}

const sizeMap = {
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
};

export const Icon: React.FC<IconProps> = ({ name, size = 'md', className, ...props }) => {
  const LucideIcon = LucideIcons[name] as React.FC<LucideIcons.LucideProps>;

  if (!LucideIcon) {
    console.warn(`Icon "${name}" not found in lucide-react`);
    return null;
  }

  const iconSize = typeof size === 'number' ? size : sizeMap[size];

  return (
    <LucideIcon
      size={iconSize}
      className={className}
      {...props}
    />
  );
};
