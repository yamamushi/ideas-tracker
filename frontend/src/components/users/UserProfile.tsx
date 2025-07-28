import React, { useState, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { User, Calendar, Lightbulb, TrendingUp, Clock, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useUserIdeas } from '../../hooks/useIdeas';
import { IdeasList } from '../ideas/IdeasList';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { SortOptions, User as UserType } from '../../types/idea';
import clsx from 'clsx';

interface UserProfileProps {
  user: UserType;
  className?: string;
}

export function UserProfile({ user, className }: UserProfileProps) {
  const { user: currentUser } = useAuth();
  const [sortOptions, setSortOptions] = useState<SortOptions>({ 
    sortBy: 'date', 
    sortOrder: 'desc' 
  });

  const {
    data: userIdeasData,
    isLoading: isLoadingIdeas,
    isError: isIdeasError,
    error: ideasError
  } = useUserIdeas(user.id, sortOptions);

  const isOwnProfile = currentUser?.id === user.id;

  // Calculate user stats
  const userStats = useMemo(() => {
    if (!userIdeasData?.pages) return null;
    
    const allIdeas = userIdeasData.pages.flatMap(page => page.ideas);
    const totalIdeas = userIdeasData.pages[0]?.total || 0;
    const totalVotes = allIdeas.reduce((sum, idea) => sum + idea.voteCount, 0);
    const averageVotes = totalIdeas > 0 ? Math.round(totalVotes / totalIdeas) : 0;
    
    // Find most popular idea
    const mostPopularIdea = allIdeas.reduce((max, idea) => 
      idea.voteCount > (max?.voteCount || 0) ? idea : max, null
    );

    return {
      totalIdeas,
      totalVotes,
      averageVotes,
      mostPopularIdea
    };
  }, [userIdeasData]);

  const memberSince = formatDistanceToNow(new Date(user.createdAt), { addSuffix: true });

  return (
    <div className={clsx('space-y-8', className)}>
      {/* Profile Header */}
      <div className="bg-dark-surface rounded-lg p-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          {/* User Info */}
          <div className="flex items-start space-x-4">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center">
                <User className="h-10 w-10 text-white" />
              </div>
            </div>

            {/* User Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-white truncate">
                  {user.username}
                </h1>
                {user.isAdmin && (
                  <span className="px-3 py-1 text-sm bg-primary-500 text-white rounded-full">
                    Admin
                  </span>
                )}
              </div>
              
              <div className="flex items-center text-gray-400 text-sm space-x-4">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Member {memberSince}</span>
                </div>
                <div className="flex items-center">
                  <Lightbulb className="h-4 w-4 mr-1" />
                  <span>{userStats?.totalIdeas || 0} ideas</span>
                </div>
              </div>

              {user.email && isOwnProfile && (
                <div className="mt-2 text-gray-400 text-sm">
                  {user.email}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {isOwnProfile && (
            <div className="flex-shrink-0">
              <button className="inline-flex items-center px-4 py-2 bg-dark-bg hover:bg-dark-border text-gray-300 hover:text-white border border-dark-border rounded-lg transition-colors">
                <Settings className="h-4 w-4 mr-2" />
                Edit Profile
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        {userStats && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {userStats.totalIdeas}
              </div>
              <div className="text-sm text-gray-400">Ideas Shared</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {userStats.totalVotes}
              </div>
              <div className="text-sm text-gray-400">Total Votes</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {userStats.averageVotes}
              </div>
              <div className="text-sm text-gray-400">Avg Votes/Idea</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-400">
                {userStats.mostPopularIdea?.voteCount || 0}
              </div>
              <div className="text-sm text-gray-400">Top Idea Votes</div>
            </div>
          </div>
        )}

        {/* Most Popular Idea */}
        {userStats?.mostPopularIdea && (
          <div className="mt-6 p-4 bg-dark-bg rounded-lg border border-dark-border">
            <div className="flex items-center text-primary-400 text-sm font-medium mb-2">
              <TrendingUp className="h-4 w-4 mr-1" />
              Most Popular Idea
            </div>
            <h3 className="text-white font-semibold mb-1">
              {userStats.mostPopularIdea.title}
            </h3>
            <p className="text-gray-400 text-sm line-clamp-2">
              {userStats.mostPopularIdea.description}
            </p>
            <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {formatDistanceToNow(new Date(userStats.mostPopularIdea.createdAt), { addSuffix: true })}
              </div>
              <div className="flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                {userStats.mostPopularIdea.voteCount} votes
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ideas Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {isOwnProfile ? 'Your Ideas' : `${user.username}'s Ideas`}
          </h2>
          {userStats && userStats.totalIdeas > 0 && (
            <span className="text-gray-400 text-sm">
              {userStats.totalIdeas} idea{userStats.totalIdeas !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Ideas List */}
        {isLoadingIdeas ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : isIdeasError ? (
          <div className="text-center py-12">
            <div className="text-red-400 mb-4">Failed to load ideas</div>
            <p className="text-gray-400">
              {ideasError instanceof Error ? ideasError.message : 'Something went wrong'}
            </p>
          </div>
        ) : (
          <IdeasList
            initialFilters={{ authorId: user.id }}
            initialSort={sortOptions}
            showControls={true}
            className="bg-transparent"
          />
        )}
      </div>
    </div>
  );
}