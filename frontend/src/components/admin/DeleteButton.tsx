import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import clsx from 'clsx';

interface DeleteButtonProps {
  onDelete: () => Promise<void>;
  itemType: 'idea' | 'comment';
  itemTitle?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button';
  disabled?: boolean;
}

export function DeleteButton({
  onDelete,
  itemType,
  itemTitle,
  className,
  size = 'md',
  variant = 'icon',
  disabled = false
}: DeleteButtonProps) {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  // Only show delete button for admin users
  if (!user?.isAdmin) {
    return null;
  }

  const handleDelete = async () => {
    const confirmMessage = itemTitle 
      ? `Are you sure you want to delete this ${itemType}: "${itemTitle}"?`
      : `Are you sure you want to delete this ${itemType}?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete();
    } catch (error) {
      console.error(`Failed to delete ${itemType}:`, error);
      // Error handling is done by the parent component
    } finally {
      setIsDeleting(false);
    }
  };

  const sizeClasses = {
    sm: variant === 'icon' ? 'p-1' : 'px-2 py-1 text-xs',
    md: variant === 'icon' ? 'p-1.5' : 'px-3 py-1.5 text-sm',
    lg: variant === 'icon' ? 'p-2' : 'px-4 py-2 text-base'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleDelete}
        disabled={disabled || isDeleting}
        className={clsx(
          'text-gray-400 hover:text-error-400 hover:bg-error-400/10 rounded transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          sizeClasses[size],
          className
        )}
        title={`Delete ${itemType}`}
      >
        <Trash2 className={clsx(iconSizes[size], isDeleting && 'animate-pulse')} />
      </button>
    );
  }

  return (
    <button
      onClick={handleDelete}
      disabled={disabled || isDeleting}
      className={clsx(
        'flex items-center space-x-2 bg-error-600 text-white rounded-lg hover:bg-error-700',
        'disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
        sizeClasses[size],
        className
      )}
    >
      <Trash2 className={clsx(iconSizes[size], isDeleting && 'animate-pulse')} />
      <span>{isDeleting ? 'Deleting...' : `Delete ${itemType}`}</span>
    </button>
  );
}