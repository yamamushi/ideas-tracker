import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { VoteService } from '../../services/voteService';
import { VoteStats } from '../../types/idea';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface VoteButtonsProps {
  ideaId: number;
  initialStats: VoteStats;
  onVoteChange?: (stats: VoteStats) => void;
  className?: string;
}

export function VoteButtons({ ideaId, initialStats, onVoteChange, className }: VoteButtonsProps) {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState<VoteStats>(initialStats);
  const [isLoading, setIsLoading] = useState(false);

  const updateStats = (newStats: VoteStats) => {
    setStats(newStats);
    onVoteChange?.(newStats);
  };

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (!isAuthenticated) {
      toast.error('Please sign in to vote');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    try {
      let result;
      
      if (stats?.userVote === voteType) {
        // Remove vote if clicking the same vote type
        result = await VoteService.removeVote(ideaId);
      } else if (stats?.userVote && stats.userVote !== voteType) {
        // Switch vote if user has already voted differently
        result = await VoteService.switchVote(ideaId);
      } else {
        // Cast new vote
        result = await VoteService.castVote(ideaId, voteType);
      }

      updateStats(result.stats);
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Failed to vote';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const isUpvoted = stats?.userVote === 'upvote';
  const isDownvoted = stats?.userVote === 'downvote';

  return (
    <div className={clsx('flex flex-col items-center space-y-1', className)}>
      <button
        onClick={() => handleVote('upvote')}
        disabled={isLoading || !isAuthenticated}
        className={clsx(
          'p-1 rounded transition-colors',
          isUpvoted
            ? 'text-success-500 bg-success-500/10 hover:bg-success-500/20'
            : 'text-gray-400 hover:text-success-500 hover:bg-success-500/10',
          !isAuthenticated && 'cursor-not-allowed opacity-50',
          isLoading && 'opacity-50'
        )}
        title={isAuthenticated ? (isUpvoted ? 'Remove upvote' : 'Upvote') : 'Sign in to vote'}
      >
        <ChevronUp className="h-5 w-5" />
      </button>

      <span
        className={clsx(
          'text-sm font-medium min-w-[2rem] text-center',
          (stats?.total || 0) > 0 ? 'text-success-400' : (stats?.total || 0) < 0 ? 'text-error-400' : 'text-gray-400'
        )}
      >
        {stats?.total || 0}
      </span>

      <button
        onClick={() => handleVote('downvote')}
        disabled={isLoading || !isAuthenticated}
        className={clsx(
          'p-1 rounded transition-colors',
          isDownvoted
            ? 'text-error-500 bg-error-500/10 hover:bg-error-500/20'
            : 'text-gray-400 hover:text-error-500 hover:bg-error-500/10',
          !isAuthenticated && 'cursor-not-allowed opacity-50',
          isLoading && 'opacity-50'
        )}
        title={isAuthenticated ? (isDownvoted ? 'Remove downvote' : 'Downvote') : 'Sign in to vote'}
      >
        <ChevronDown className="h-5 w-5" />
      </button>
    </div>
  );
}