import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Edit, Trash2, User } from 'lucide-react';
import { Comment as CommentType } from '../../types/idea';
import { useAuth } from '../../contexts/AuthContext';
import { DeleteButton } from '../admin/DeleteButton';
import { AdminService } from '../../services/adminService';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface CommentProps {
  comment: CommentType;
  onEdit?: (comment: CommentType) => void;
  onDelete?: (comment: CommentType) => void;
  className?: string;
}

export function Comment({ comment, onEdit, onDelete, className }: CommentProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const isAuthor = user?.id === comment.authorId;
  const canEdit = isAuthor;
  const canDelete = isAuthor || user?.isAdmin;

  const handleEdit = () => {
    if (onEdit) {
      onEdit({ ...comment, content: editContent });
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  const handleAdminDelete = async () => {
    try {
      await AdminService.deleteComment(comment.id);
      toast.success('Comment deleted successfully');
      // Call the onDelete prop if provided for optimistic updates
      if (onDelete) {
        onDelete(comment);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete comment');
      throw error; // Re-throw to let DeleteButton handle the loading state
    }
  };

  return (
    <div className={clsx('bg-gray-800 rounded-lg p-4 border border-gray-700', className)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center text-sm text-gray-400 space-x-2">
          <Link
            to={`/profile/${comment.authorId}`}
            className="flex items-center hover:text-primary-400 transition-colors"
          >
            <User className="h-4 w-4 mr-1" />
            {comment.author?.username || 'Unknown'}
          </Link>
          <span>•</span>
          <time title={new Date(comment.createdAt).toLocaleString()}>
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </time>
        </div>

        {/* Action Buttons */}
        {(canEdit || canDelete || user?.isAdmin) && !isEditing && (
          <div className="flex items-center space-x-2">
            {canEdit && onEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 text-gray-400 hover:text-primary-400 hover:bg-primary-400/10 rounded transition-colors"
                title="Edit comment"
              >
                <Edit className="h-4 w-4" />
              </button>
            )}
            {canDelete && onDelete && (
              <button
                onClick={() => onDelete(comment)}
                className="p-1.5 text-gray-400 hover:text-error-400 hover:bg-error-400/10 rounded transition-colors"
                title="Delete comment"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            {/* Admin Delete Button */}
            <DeleteButton
              onDelete={handleAdminDelete}
              itemType="comment"
              itemTitle={`Comment by ${comment.author?.username || 'Unknown'}`}
              size="sm"
            />
          </div>
        )}
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            rows={3}
            placeholder="Edit your comment..."
          />
          <div className="flex items-center space-x-2">
            <button
              onClick={handleEdit}
              disabled={!editContent.trim()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="text-gray-300 whitespace-pre-wrap">
          {comment.content}
        </div>
      )}
    </div>
  );
}