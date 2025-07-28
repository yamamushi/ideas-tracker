import React, { useState, useEffect } from 'react';
import { X, Filter, Search } from 'lucide-react';
import { Tag } from '../../types/idea';
import { TagBadge } from './TagBadge';
import { IdeaService } from '../../services/ideaService';
import clsx from 'clsx';

interface TagFilterProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  className?: string;
}

export function TagFilter({ selectedTags, onTagsChange, className }: TagFilterProps) {
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTags = async () => {
      try {
        const tags = await IdeaService.getTags();
        setAvailableTags(tags);
      } catch (error) {
        console.error('Failed to load tags:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTags();
  }, []);

  const filteredTags = availableTags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedTagObjects = availableTags.filter(tag => selectedTags.includes(tag.id));

  const handleTagToggle = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter(id => id !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  };

  const handleClearAll = () => {
    onTagsChange([]);
  };

  return (
    <div className={clsx('relative', className)}>
      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">Active Filters:</span>
            <button
              onClick={handleClearAll}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedTagObjects.map(tag => (
              <div key={tag.id} className="relative">
                <TagBadge tag={tag} isSelected />
                <button
                  onClick={() => handleTagToggle(tag.id)}
                  className="absolute -top-1 -right-1 h-4 w-4 bg-error-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-error-600 transition-colors"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Button */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-300 bg-dark-surface border border-dark-border rounded-md hover:bg-dark-border focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg transition-colors"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filter by Tags
          {selectedTags.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-primary-500 text-white rounded-full">
              {selectedTags.length}
            </span>
          )}
        </button>

        {/* Dropdown Panel */}
        {isOpen && (
          <div className="absolute right-0 z-20 mt-2 w-80 bg-dark-surface border border-dark-border rounded-md shadow-lg">
            <div className="p-4">
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-dark-bg border border-dark-border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Tags Grid */}
              {isLoading ? (
                <div className="text-center py-4 text-gray-400">Loading tags...</div>
              ) : filteredTags.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {filteredTags.map(tag => (
                    <TagBadge
                      key={tag.id}
                      tag={tag}
                      isSelected={selectedTags.includes(tag.id)}
                      onClick={() => handleTagToggle(tag.id)}
                      size="md"
                      className="justify-center"
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400">
                  {searchQuery ? 'No tags found' : 'No tags available'}
                </div>
              )}

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-dark-border flex justify-between items-center">
                <span className="text-xs text-gray-400">
                  {selectedTags.length} of {availableTags.length} selected
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}