import React from 'react';
import { ChevronDown, TrendingUp, Calendar, ArrowUpDown } from 'lucide-react';
import { SortOptions } from '../../types/idea';
import clsx from 'clsx';

interface SortControlsProps {
  sortOptions: SortOptions;
  onSortChange: (options: SortOptions) => void;
  className?: string;
}

export function SortControls({ sortOptions, onSortChange, className }: SortControlsProps) {
  const sortItems = [
    {
      key: 'votes' as const,
      label: 'Most Voted',
      icon: TrendingUp,
      description: 'Sort by vote count'
    },
    {
      key: 'date' as const,
      label: 'Newest',
      icon: Calendar,
      description: 'Sort by creation date'
    },
    {
      key: 'alphabetical' as const,
      label: 'Alphabetical',
      icon: ArrowUpDown,
      description: 'Sort alphabetically'
    }
  ];

  const currentSort = sortItems.find(item => item.key === sortOptions.sortBy);
  const CurrentIcon = currentSort?.icon || TrendingUp;

  const handleSortChange = (sortBy: 'votes' | 'date' | 'alphabetical') => {
    let sortOrder: 'asc' | 'desc' = 'desc';
    
    // Default sort orders for different types
    if (sortBy === 'alphabetical') {
      sortOrder = 'asc';
    } else if (sortBy === 'date') {
      sortOrder = 'desc'; // Newest first
    } else if (sortBy === 'votes') {
      sortOrder = 'desc'; // Highest votes first
    }

    // If clicking the same sort type, toggle order
    if (sortBy === sortOptions.sortBy) {
      sortOrder = sortOptions.sortOrder === 'asc' ? 'desc' : 'asc';
    }

    onSortChange({ sortBy, sortOrder });
  };

  return (
    <div className={clsx('relative inline-block text-left', className)}>
      <div className="group">
        <button
          type="button"
          className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-300 bg-dark-surface border border-dark-border rounded-md hover:bg-dark-border focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg transition-colors"
        >
          <CurrentIcon className="h-4 w-4 mr-2" />
          {currentSort?.label}
          {sortOptions.sortOrder === 'asc' ? ' ↑' : ' ↓'}
          <ChevronDown className="h-4 w-4 ml-2" />
        </button>

        {/* Dropdown Menu */}
        <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right bg-dark-surface border border-dark-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
          <div className="py-1">
            {sortItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.key === sortOptions.sortBy;
              
              return (
                <button
                  key={item.key}
                  onClick={() => handleSortChange(item.key)}
                  className={clsx(
                    'flex items-center w-full px-4 py-2 text-sm transition-colors',
                    isActive
                      ? 'text-primary-400 bg-primary-400/10'
                      : 'text-gray-300 hover:text-white hover:bg-dark-bg'
                  )}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-gray-400">{item.description}</div>
                  </div>
                  {isActive && (
                    <span className="ml-auto text-xs">
                      {sortOptions.sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}