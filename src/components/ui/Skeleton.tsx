'use client';

import { cn } from '@/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'shimmer' | 'none';
  count?: number;
}

/**
 * Skeleton loader — displays a placeholder while content loads.
 * Supports multiple variants and animations for different contexts.
 *
 * Usage:
 *   <Skeleton variant="text" width="200px" />
 *   <Skeleton variant="card" height={120} />
 *   <Skeleton variant="circular" width={48} height={48} />
 */
export default function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  animation = 'shimmer',
  count = 1,
}: SkeletonProps) {
  const baseClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    card: 'rounded-xl',
  };

  const animClasses = {
    pulse: 'animate-pulse bg-[#1E1E2A]',
    shimmer: 'shimmer rounded-lg',
    none: 'bg-[#1E1E2A]',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  const elements = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={cn(baseClasses[variant], animClasses[animation], className)}
      style={style}
      aria-hidden="true"
    />
  ));

  return <>{elements}</>;
}
