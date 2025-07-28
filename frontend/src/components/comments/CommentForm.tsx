import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { CreateCommentData } from '../../types/idea';
import { useAuth } from '../../contexts/AuthContext';
import clsx from 'clsx';

interface CommentFormProps {
  onSubmit: (data: CreateCommentData) => Promise<void>;
  isSubmitting?: boolean;
  placeholder?: string;
  className?: string;
}

export function CommentForm({ 
  onSubmit, 
  isSubmitting = false, 
  placeholder = "Share your thoughts...",
  className 
}: CommentFormProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className={clsx('bg-gray-800 rounded-lg p-4 border border-gray-700 text-center', className)}>
        <p className="text-gray-400">
          Please <a href="/login" className="text-primary-400 hover:text-primary-300">log in</a> to leave a comment.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    try {
      setError(null);
      await onSubmit({ content: content.trim() });
      setContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={clsx('bg-gray-800 rounded-lg p-4 border border-gray-700', className)}>
      <div className="space-y-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          rows={3}
          disabled={isSubmitting}
        />
        
        {error && (
          <p className="text-error-400 text-sm">{error}</p>
        )}

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Commenting as <span className="text-primary-400">{user.username}</span>
          </div>
          
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4" />
            <span>{isSubmitting ? 'Posting...' : 'Post Comment'}</span>
          </button>
        </div>
      </div>
    </form>
  );
}