// import { Loader2, AlertTriangle, Info } from 'lucide-react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'avatar' | 'card' | 'table' | 'chart';
}

export function Skeleton({ className = '', variant = 'text' }: SkeletonProps) {
  const base = 'animate-pulse rounded-md bg-black/10';

  const variants = {
    text: 'h-4 w-full',
    avatar: 'h-10 w-10 rounded-full',
    card: 'h-32 w-full rounded-lg',
    table: 'h-6 w-full',
    chart: 'h-48 w-full',
  };

  return <div className={`${base} ${variants[variant]} ${className}`} />;
}
