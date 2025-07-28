import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Edit, Trash2, User } from 'lucide-react';
import { Idea, VoteStats } from '../../types/idea';
import { useAuth } from '../../contexts/AuthContext';
import { VoteButtons } from './VoteButtons';
import { TagBadge } from './TagBadge';
import { DeleteButton } from '../admin/DeleteButton';
import { useCommentCount } from '../../hooks/useComments';
import { AdminService } from '../../services/adminService';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface IdeaCardProps {
  idea: Idea;
  tags: { [key: string]: { id: string; name: string; color?: string } };
  onEdit?: (idea: Idea) => void;
  onDelete?: (idea: Idea) => void;
  onTagClick?: (tagId: string) => void;
  className?: string;
}

export function IdeaCard({ idea, tags, onEdit, onDelete, onTagClick, className }: IdeaCardProps) {
  const { user } = useAuth();
  const { count: commentCount } = useCommentCount(idea.id);
  const [voteStats, setVoteStats] = useState<VoteStats>({
    upvotes: 0,
    downvotes: 0,
    total: idea.voteCount,
    userVote: null
  });

  const isAuthor = user?.id === idea.authorId;
  const canEdit = isAuthor;
  const canDelete = isAuthor || user?.isAdmin;

  const handleVoteChange = (newStats: VoteStats) => {
    setVoteStats(newStats);
  };

  const handleAdminDelete = async () => {
    try {
      await AdminService.deleteIdea(idea.id);
      toast.success('Idea deleted successfully');
      // Call the onDelete prop if provided for optimistic updates
      if (onDelete) {
        onDelete(idea);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete idea');
      throw error; // Re-throw to let DeleteButton handle the loading state
    }
  };

  return (
    <div className={clsx('card p-6 animate-fade-in', className)}>
      <div className="flex gap-4">
        {/* Vote Buttons */}
        <VoteButtons
          ideaId={idea.id}
          initialStats={voteStats}
          onVoteChange={handleVoteChange}
          className="flex-shrink-0"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2">
                <Link
                  to={`/ideas/${idea.id}`}
                  className="hover:text-primary-400 transition-colors"
                >
                  {idea.title}
                </Link>
              </h3>
              
              <div className="flex items-center text-sm text-gray-400 space-x-2">
                <Link
                  to={`/profile/${idea.authorId}`}
                  className="flex items-center hover:text-primary-400 transition-colors"
                >
                  <User className="h-4 w-4 mr-1" />
                  {idea.author?.username || 'Unknown'}
                </Link>
                <span>•</span>
                <time title={new Date(idea.createdAt).toLocaleString()}>
                  {formatDistanceToNow(new Date(idea.createdAt), { addSuffix: true })}
                </time>
              </div>
            </div>

            {/* Action Buttons */}
            {(canEdit || canDelete || user?.isAdmin) && (
              <div className="flex items-center space-x-2 ml-4">
                {canEdit && onEdit && (
                  <button
                    onClick={() => onEdit(idea)}
                    className="p-1.5 text-gray-400 hover:text-primary-400 hover:bg-primary-400/10 rounded transition-colors"
                    title="Edit idea"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                )}
                {canDelete && onDelete && (
                  <button
                    onClick={() => onDelete(idea)}
                    className="p-1.5 text-gray-400 hover:text-error-400 hover:bg-error-400/10 rounded transition-colors"
                    title="Delete idea"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                {/* Admin Delete Button */}
                <DeleteButton
                  onDelete={handleAdminDelete}
                  itemType="idea"
                  itemTitle={idea.title}
                  size="md"
                />
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-300 mb-4 line-clamp-3">
            {idea.description}
          </p>

          {/* Tags */}
          {idea.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {idea.tags.map(tagId => {
                const tag = tags[tagId];
                if (!tag) return null;
                
                return (
                  <TagBadge
                    key={tagId}
                    tag={tag}
                    onClick={onTagClick ? () => onTagClick(tagId) : undefined}
                  />
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-sm text-gray-400">
            <Link
              to={`/ideas/${idea.id}#comments`}
              className="flex items-center hover:text-primary-400 transition-colors"
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              <span>{commentCount} {commentCount === 1 ? 'comment' : 'comments'}</span>
            </Link>

            <div className="flex items-center space-x-4">
              <span className="text-xs">
                {voteStats.upvotes} upvotes • {voteStats.downvotes} downvotes
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}