import React, { useState, useMemo, useEffect } from 'react';
import { useIdeas } from '../../hooks/useIdeas';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { useScrollPosition } from '../../hooks/useScrollPosition';
import { IdeaCard } from './IdeaCard';
import { SortControls } from './SortControls';
import { TagFilter } from './TagFilter';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { IdeaFilters, SortOptions, Tag } from '../../types/idea';
import { Search, AlertCircle, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

interface IdeasListProps {
  initialFilters?: IdeaFilters;
  initialSort?: SortOptions;
  showControls?: boolean;
  className?: string;
}

export function IdeasList({
  initialFilters = {},
  initialSort = { sortBy: 'votes', sortOrder: 'desc' },
  showControls = true,
  className
}: IdeasListProps) {
  const [filters, setFilters] = useState<IdeaFilters>(initialFilters);
  const [sortOptions, setSortOptions] = useState<SortOptions>(initialSort);
  const [searchQuery, setSearchQuery] = useState(filters.search || '');

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
    isFetching
  } = useIdeas(filters, sortOptions);

  // Scroll position management
  const { saveScrollPosition } = useScrollPosition({
    key: 'ideas-list',
    enabled: true
  });

  const { loadingRef } = useInfiniteScroll({
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    threshold: 0.8 // Trigger when 80% scrolled
  });

  // Flatten all pages of ideas
  const ideas = useMemo(() => {
    return data?.pages.flatMap(page => page.ideas) || [];
  }, [data]);

  // Handle optimistic delete for admin actions
  const handleIdeaDelete = (deletedIdea: any) => {
    // Trigger a refetch to update the list
    refetch();
  };

  // Handle tags change
  const handleTagsChange = (tags: string[]) => {
    setFilters(prev => ({ ...prev, tags: tags.length > 0 ? tags : undefined }));
  };

  // Create tags lookup for efficient access
  const tagsLookup = useMemo(() => {
    const lookup: { [key: string]: Tag } = {};
    // This would be populated from the tags API
    // For now, we'll create a basic lookup
    return lookup;
  }, []);

  // Memoize the ideas list rendering for performance
  const ideasListContent = useMemo(() => {
    return ideas.map((idea, index) => (
      <IdeaCard
        key={`${idea.id}-${index}`}
        idea={idea}
        tags={tagsLookup}
        onTagClick={(tagId) => {
          const currentTags = filters.tags || [];
          if (!currentTags.includes(tagId)) {
            handleTagsChange([...currentTags, tagId]);
          }
        }}
        onDelete={handleIdeaDelete}
      />
    ));
  }, [ideas, tagsLookup, filters.tags, refetch, handleTagsChange]);

  // Save scroll position when filters or sort changes
  useEffect(() => {
    saveScrollPosition();
  }, [filters, sortOptions, saveScrollPosition]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    setFilters(prev => ({ ...prev, search: trimmedQuery || undefined }));
  };

  const handleSortChange = (newSort: SortOptions) => {
    setSortOptions(newSort);
  };

  const handleRefresh = () => {
    refetch();
  };

  const totalIdeas = data?.pages[0]?.total || 0;

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-12">
        <LoadingSpinner size="lg" />
        <p className="text-gray-400 mt-4">Loading ideas...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Failed to load ideas</h3>
        <p className="text-gray-400 mb-6">
          {error instanceof Error ? error.message : 'Something went wrong while loading ideas'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg"
          >
            {isFetching ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Retrying...
              </>
            ) : (
              'Try Again'
            )}
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-dark-surface hover:bg-dark-border text-gray-300 hover:text-white border border-dark-border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('space-y-6 relative', className)}>
      {/* Loading overlay for refresh */}
      {isFetching && !isLoading && !isFetchingNextPage && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-dark-bg/80 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center justify-center space-x-2 text-gray-400">
            <LoadingSpinner size="sm" />
            <span className="text-sm">Refreshing ideas...</span>
          </div>
        </div>
      )}

      {/* Controls */}
      {showControls && (
        <div className="space-y-4">
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <label htmlFor="search-ideas" className="sr-only">
              Search ideas
            </label>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="search-ideas"
              type="text"
              placeholder="Search ideas by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-dark-surface border border-dark-border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              aria-describedby="search-help"
            />
            <div id="search-help" className="sr-only">
              Press Enter to search, or clear the field to show all ideas
            </div>
          </form>

          {/* Filters and Sort */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <TagFilter
                selectedTags={filters.tags || []}
                onTagsChange={handleTagsChange}
              />
            </div>
            
            <div className="flex items-center gap-4">
              <SortControls
                sortOptions={sortOptions}
                onSortChange={handleSortChange}
              />
              <button
                onClick={handleRefresh}
                disabled={isFetching}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-300 bg-dark-surface border border-dark-border rounded-md hover:bg-dark-border focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh ideas"
              >
                <RefreshCw className={clsx('h-4 w-4', isFetching && 'animate-spin')} />
              </button>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>
              {totalIdeas > 0 ? (
                <>
                  Showing {ideas.length} of {totalIdeas} ideas
                  {(filters.tags?.length || filters.search) && ' (filtered)'}
                </>
              ) : (
                'No ideas found'
              )}
            </span>
            
            {(filters.tags?.length || filters.search) && (
              <button
                onClick={() => {
                  setFilters({});
                  setSearchQuery('');
                }}
                className="text-primary-400 hover:text-primary-300 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Ideas List */}
      {ideas.length > 0 ? (
        <div className="space-y-4" role="feed" aria-label="Ideas feed">
          {ideasListContent}

          {/* Loading indicator for infinite scroll */}
          <div ref={loadingRef} className="flex justify-center py-8">
            {isFetchingNextPage ? (
              <div className="flex flex-col items-center space-y-2 text-gray-400">
                <LoadingSpinner size="md" />
                <span className="text-sm">Loading more ideas...</span>
              </div>
            ) : hasNextPage ? (
              <button
                onClick={() => fetchNextPage()}
                className="px-6 py-3 bg-dark-surface hover:bg-dark-border text-gray-300 hover:text-white border border-dark-border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg"
              >
                Load More Ideas
              </button>
            ) : ideas.length > 0 ? (
              <div className="text-center">
                <p className="text-gray-400 mb-2">You've reached the end! 🎉</p>
                <p className="text-sm text-gray-500">
                  {ideas.length} idea{ideas.length !== 1 ? 's' : ''} loaded
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-6xl mb-6">💡</div>
          <h3 className="text-xl font-medium text-white mb-3">
            {filters.tags?.length || filters.search ? 'No matching ideas found' : 'No ideas yet'}
          </h3>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            {filters.tags?.length || filters.search
              ? 'Try adjusting your filters or search terms to find what you\'re looking for.'
              : 'Be the first to share an innovative idea with the community!'}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {(filters.tags?.length || filters.search) ? (
              <button
                onClick={() => {
                  setFilters({});
                  setSearchQuery('');
                }}
                className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg"
              >
                Clear Filters
              </button>
            ) : (
              <button className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg">
                Submit Your First Idea
              </button>
            )}
            
            <button
              onClick={handleRefresh}
              disabled={isFetching}
              className="px-6 py-3 bg-dark-surface hover:bg-dark-border text-gray-300 hover:text-white border border-dark-border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg"
            >
              {isFetching ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Refreshing...
                </>
              ) : (
                'Refresh'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}