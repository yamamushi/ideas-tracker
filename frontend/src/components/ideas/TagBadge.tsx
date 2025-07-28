import React from 'react';
import { Tag } from '../../types/idea';
import clsx from 'clsx';

interface TagBadgeProps {
  tag: Tag;
  onClick?: () => void;
  isSelected?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function TagBadge({ tag, onClick, isSelected, size = 'sm', className }: TagBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  const baseClasses = 'inline-flex items-center rounded-full font-medium transition-colors';
  
  const colorClasses = isSelected
    ? 'bg-primary-500 text-white'
    : 'bg-dark-surface text-gray-300 hover:bg-dark-border';

  const interactiveClasses = onClick
    ? 'cursor-pointer hover:scale-105 transition-transform'
    : '';

  const style = tag.color && !isSelected
    ? { 
        backgroundColor: `${tag.color}20`, 
        color: tag.color,
        borderColor: `${tag.color}40`,
        border: '1px solid'
      }
    : {};

  return (
    <span
      className={clsx(
        baseClasses,
        sizeClasses[size],
        colorClasses,
        interactiveClasses,
        className
      )}
      style={style}
      onClick={onClick}
      title={tag.name}
    >
      {tag.name}
    </span>
  );
}