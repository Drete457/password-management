import { ReactNode, Suspense } from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-[var(--border-primary)] border-t-[var(--accent-500)]`}></div>
    </div>
  );
}

interface SuspenseWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function SuspenseWrapper({ fallback, children }: SuspenseWrapperProps) {
  return (
    <Suspense fallback={fallback || <LoadingSpinner />}>
      {children}
    </Suspense>
  );
}
