import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

interface ErrorMessageProps {
  message: string;
  title?: string;
  onRetry?: () => void;
  showHomeLink?: boolean;
  className?: string;
  variant?: 'default' | 'compact' | 'inline';
}

export function ErrorMessage({
  message,
  title = 'Something went wrong',
  onRetry,
  showHomeLink = false,
  className,
  variant = 'default'
}: ErrorMessageProps) {
  if (variant === 'inline') {
    return (
      <div className={clsx('flex items-center space-x-2 text-error-400 text-sm', className)}>
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        <span>{message}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-primary-400 hover:text-primary-300 underline"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={clsx('bg-error-900/20 border border-error-500/30 rounded-lg p-4', className)}>
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-error-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-error-400 font-medium">{title}</p>
            <p className="text-error-300 text-sm mt-1">{message}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-2 text-sm text-primary-400 hover:text-primary-300 underline"
              >
                Try again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('text-center py-12', className)}>
      <AlertCircle className="h-12 w-12 text-error-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
      <p className="text-gray-400 mb-6 max-w-md mx-auto">{message}</p>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </button>
        )}
        
        {showHomeLink && (
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Link>
        )}
      </div>
    </div>
  );
}