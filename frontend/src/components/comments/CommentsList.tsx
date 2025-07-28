import React, { useState, useEffect } from 'react';
import { MessageCircle, AlertCircle } from 'lucide-react';
import { Comment } from './Comment';
import { CommentForm } from './CommentForm';
import { Comment as CommentType, CreateCommentData } from '../../types/idea';
import { CommentService } from '../../services/commentService';
import { useAuth } from '../../contexts/AuthContext';
import clsx from 'clsx';

interface CommentsListProps {
  ideaId: number;
  className?: string;
}

export function CommentsList({ ideaId, className }: CommentsListProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalComments, setTotalComments] = useState(0);

  const loadComments = async (pageNum: number = 1, append: boolean = false) => {
    try {
      setError(null);
      if (!append) setLoading(true);

      const response = await CommentService.getCommentsByIdea(ideaId, pageNum, 50);
      
      if (append) {
        setComments(prev => [...prev, ...response.comments]);
      } else {
        setComments(response.comments);
      }
      
      setTotalComments(response.total);
      setHasMore(pageNum < response.totalPages);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [ideaId]);

  const handleSubmitComment = async (data: CreateCommentData) => {
    setSubmitting(true);
    try {
      const newComment = await CommentService.createComment(ideaId, data);
      // Add the new comment to the end of the list (chronological order)
      setComments(prev => [...prev, newComment]);
      setTotalComments(prev => prev + 1);
    } catch (err) {
      throw err; // Let CommentForm handle the error display
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (updatedComment: CommentType) => {
    try {
      const editedComment = await CommentService.updateComment(updatedComment.id, {
        content: updatedComment.content
      });
      
      setComments(prev => 
        prev.map(comment => 
          comment.id === editedComment.id ? editedComment : comment
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update comment');
    }
  };

  const handleDeleteComment = async (comment: CommentType) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await CommentService.deleteComment(comment.id);
      setComments(prev => prev.filter(c => c.id !== comment.id));
      setTotalComments(prev => prev - 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment');
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadComments(page + 1, true);
    }
  };

  if (loading && comments.length === 0) {
    return (
      <div className={clsx('space-y-4', className)}>
        <div className="flex items-center space-x-2 text-gray-400">
          <MessageCircle className="h-5 w-5" />
          <span>Loading comments...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('space-y-4', className)} id="comments">
      {/* Header */}
      <div className="flex items-center space-x-2 text-gray-300">
        <MessageCircle className="h-5 w-5" />
        <h3 className="text-lg font-semibold">
          Comments ({totalComments})
        </h3>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-error-900/20 border border-error-500/30 rounded-lg text-error-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Comment Form */}
      <CommentForm
        onSubmit={handleSubmitComment}
        isSubmitting={submitting}
        placeholder="Share your thoughts on this idea..."
      />

      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map(comment => (
            <Comment
              key={comment.id}
              comment={comment}
              onEdit={user ? handleEditComment : undefined}
              onDelete={user ? handleDeleteComment : undefined}
            />
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Loading...' : 'Load More Comments'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No comments yet. Be the first to share your thoughts!</p>
        </div>
      )}
    </div>
  );
}