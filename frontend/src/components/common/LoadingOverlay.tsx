import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import clsx from 'clsx';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  className?: string;
  children: React.ReactNode;
}

export function LoadingOverlay({
  isLoading,
  message = 'Loading...',
  className,
  children
}: LoadingOverlayProps) {
  return (
    <div className={clsx('relative', className)}>
      {children}
      
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
          <div className="flex flex-col items-center space-y-3 text-white">
            <LoadingSpinner size="lg" />
            <p className="text-sm font-medium">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
}