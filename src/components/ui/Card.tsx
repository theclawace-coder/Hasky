import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'flat' | 'bordered';
  hover?: boolean;
  glow?: boolean;
}

export function Card({ className, variant = 'default', hover = false, glow = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl',
        // Glass base for all variants
        'backdrop-blur-md bg-white/72',
        variant === 'default' && 'border border-white/60 p-5 shadow-lg shadow-black/5',
        variant === 'flat'    && 'border border-white/40 p-5 shadow-sm shadow-black/4',
        variant === 'bordered' && 'border-2 border-white/50 p-5 shadow-lg shadow-black/5',
        hover && 'transition-all duration-250 cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-black/8 hover:border-white/80',
        glow && 'animate-glow-pulse',
        className,
      )}
      {...props}
    />
  );
}
