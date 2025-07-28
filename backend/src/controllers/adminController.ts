import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { IdeaModel } from '../models/Idea';
import { CommentModel } from '../models/Comment';
import { VoteModel } from '../models/Vote';
import { UserModel } from '../models/User';
import { createError, asyncHandler } from '../middleware/errorHandler';

export const deleteIdea = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.isAdmin) {
    throw createError('Admin access required', 403, 'ADMIN_REQUIRED');
  }

  const ideaId = parseInt(req.params.id);

  // Check if idea exists
  const ideaExists = await IdeaModel.exists(ideaId);
  if (!ideaExists) {
    throw createError('Idea not found', 404, 'IDEA_NOT_FOUND');
  }

  // Get idea details for logging
  const idea = await IdeaModel.findById(ideaId, true);

  // Delete the idea (cascade will handle comments and votes)
  const deleted = await IdeaModel.delete(ideaId);

  if (!deleted) {
    throw createError('Failed to delete idea', 500, 'DELETE_FAILED');
  }

  // Log admin action
  console.log(`Admin ${req.user.username} (ID: ${req.user.userId}) deleted idea "${idea?.title}" (ID: ${ideaId})`);

  res.json({
    success: true,
    message: 'Idea deleted successfully',
    data: {
      deletedIdea: {
        id: ideaId,
        title: idea?.title,
        author: idea?.author?.username
      }
    }
  });
});

export const deleteComment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.isAdmin) {
    throw createError('Admin access required', 403, 'ADMIN_REQUIRED');
  }

  const commentId = parseInt(req.params.id);

  // Check if comment exists and get details
  const comment = await CommentModel.findById(commentId, true);
  if (!comment) {
    throw createError('Comment not found', 404, 'COMMENT_NOT_FOUND');
  }

  // Delete the comment
  const deleted = await CommentModel.delete(commentId);

  if (!deleted) {
    throw createError('Failed to delete comment', 500, 'DELETE_FAILED');
  }

  // Log admin action
  console.log(`Admin ${req.user.username} (ID: ${req.user.userId}) deleted comment (ID: ${commentId}) by ${comment.author?.username}`);

  res.json({
    success: true,
    message: 'Comment deleted successfully',
    data: {
      deletedComment: {
        id: commentId,
        author: comment.author?.username,
        ideaId: comment.ideaId
      }
    }
  });
});

export const getContentStats = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.isAdmin) {
    throw createError('Admin access required', 403, 'ADMIN_REQUIRED');
  }

  // Get various statistics
  const [ideasResult, commentsResult, votesResult, usersResult] = await Promise.all([
    IdeaModel.findAll({}, { sortBy: 'date', sortOrder: 'desc' }, { page: 1, limit: 1 }),
    CommentModel.getRecentComments(1),
    VoteModel.getTopVotedIdeas(1),
    // We'll need to add a method to get user count
    Promise.resolve({ count: 0 }) // Placeholder
  ]);

  const stats = {
    totalIdeas: ideasResult.total,
    totalComments: await getTotalCommentCount(),
    totalVotes: await getTotalVoteCount(),
    totalUsers: await getTotalUserCount(),
    recentActivity: {
      latestIdea: ideasResult.ideas[0] || null,
      latestComment: commentsResult[0] || null,
      topVotedIdea: votesResult[0] || null
    }
  };

  res.json({
    success: true,
    data: {
      stats
    }
  });
});

export const getFlaggedContent = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.isAdmin) {
    throw createError('Admin access required', 403, 'ADMIN_REQUIRED');
  }

  // For now, we'll return content that might need moderation
  // In a real app, you'd have a flagging system
  
  // Get ideas with negative vote counts (potentially controversial)
  const controversialIdeas = await IdeaModel.findAll(
    {},
    { sortBy: 'votes', sortOrder: 'asc' },
    { page: 1, limit: 10 }
  );

  // Filter for negative vote counts
  const flaggedIdeas = controversialIdeas.ideas.filter(idea => idea.voteCount < -2);

  // Get recent comments (for manual review)
  const recentComments = await CommentModel.getRecentComments(20);

  res.json({
    success: true,
    data: {
      flaggedIdeas,
      recentComments
    }
  });
});

export const bulkDeleteIdeas = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.isAdmin) {
    throw createError('Admin access required', 403, 'ADMIN_REQUIRED');
  }

  const { ideaIds } = req.body;

  if (!Array.isArray(ideaIds) || ideaIds.length === 0) {
    throw createError('Idea IDs array is required', 400, 'INVALID_INPUT');
  }

  if (ideaIds.length > 50) {
    throw createError('Cannot delete more than 50 ideas at once', 400, 'BULK_LIMIT_EXCEEDED');
  }

  const deletedIdeas = [];
  const failedDeletes = [];

  for (const ideaId of ideaIds) {
    try {
      const idea = await IdeaModel.findById(parseInt(ideaId), true);
      if (idea) {
        const deleted = await IdeaModel.delete(parseInt(ideaId));
        if (deleted) {
          deletedIdeas.push({
            id: ideaId,
            title: idea.title,
            author: idea.author?.username
          });
        } else {
          failedDeletes.push(ideaId);
        }
      } else {
        failedDeletes.push(ideaId);
      }
    } catch (error) {
      failedDeletes.push(ideaId);
    }
  }

  // Log admin action
  console.log(`Admin ${req.user.username} (ID: ${req.user.userId}) bulk deleted ${deletedIdeas.length} ideas`);

  res.json({
    success: true,
    message: `Bulk delete completed. ${deletedIdeas.length} ideas deleted, ${failedDeletes.length} failed.`,
    data: {
      deletedIdeas,
      failedDeletes,
      summary: {
        deleted: deletedIdeas.length,
        failed: failedDeletes.length
      }
    }
  });
});

export const bulkDeleteComments = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.isAdmin) {
    throw createError('Admin access required', 403, 'ADMIN_REQUIRED');
  }

  const { commentIds } = req.body;

  if (!Array.isArray(commentIds) || commentIds.length === 0) {
    throw createError('Comment IDs array is required', 400, 'INVALID_INPUT');
  }

  if (commentIds.length > 100) {
    throw createError('Cannot delete more than 100 comments at once', 400, 'BULK_LIMIT_EXCEEDED');
  }

  const deletedComments = [];
  const failedDeletes = [];

  for (const commentId of commentIds) {
    try {
      const comment = await CommentModel.findById(parseInt(commentId), true);
      if (comment) {
        const deleted = await CommentModel.delete(parseInt(commentId));
        if (deleted) {
          deletedComments.push({
            id: commentId,
            author: comment.author?.username,
            ideaId: comment.ideaId
          });
        } else {
          failedDeletes.push(commentId);
        }
      } else {
        failedDeletes.push(commentId);
      }
    } catch (error) {
      failedDeletes.push(commentId);
    }
  }

  // Log admin action
  console.log(`Admin ${req.user.username} (ID: ${req.user.userId}) bulk deleted ${deletedComments.length} comments`);

  res.json({
    success: true,
    message: `Bulk delete completed. ${deletedComments.length} comments deleted, ${failedDeletes.length} failed.`,
    data: {
      deletedComments,
      failedDeletes,
      summary: {
        deleted: deletedComments.length,
        failed: failedDeletes.length
      }
    }
  });
});

// Helper functions
async function getTotalCommentCount(): Promise<number> {
  // This would need to be implemented in CommentModel
  // For now, return a placeholder
  return 0;
}

async function getTotalVoteCount(): Promise<number> {
  // This would need to be implemented in VoteModel
  // For now, return a placeholder
  return 0;
}

async function getTotalUserCount(): Promise<number> {
  // This would need to be implemented in UserModel
  // For now, return a placeholder
  return 0;
}