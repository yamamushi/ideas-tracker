import { useState, useEffect } from 'react';
import { CommentService } from '../services/commentService';

export function useCommentCount(ideaId: number) {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        setError(null);
        const commentCount = await CommentService.getCommentCount(ideaId);
        setCount(commentCount);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load comment count');
        setCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCount();
  }, [ideaId]);

  return { count, loading, error };
}