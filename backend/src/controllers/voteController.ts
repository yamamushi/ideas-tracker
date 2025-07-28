import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { VoteModel } from '../models/Vote';
import { IdeaModel } from '../models/Idea';
import { createError, asyncHandler } from '../middleware/errorHandler';

export const castVote = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
  }

  if (!req.user) {
    throw createError('Authentication required', 401, 'AUTH_REQUIRED');
  }

  const ideaId = parseInt(req.params.id);
  const { voteType } = req.body;

  // Check if idea exists
  const ideaExists = await IdeaModel.exists(ideaId);
  if (!ideaExists) {
    throw createError('Idea not found', 404, 'IDEA_NOT_FOUND');
  }

  // Check if user is trying to vote on their own idea
  const authorId = await IdeaModel.getAuthorId(ideaId);
  if (authorId === req.user.userId) {
    throw createError('Cannot vote on your own idea', 400, 'CANNOT_VOTE_OWN_IDEA');
  }

  // Cast or update vote
  const vote = await VoteModel.create({
    userId: req.user.userId,
    ideaId,
    voteType
  });

  // Get updated vote stats
  const voteStats = await VoteModel.getVoteStats(ideaId, req.user.userId);

  res.json({
    success: true,
    message: 'Vote cast successfully',
    data: {
      vote,
      stats: voteStats
    }
  });
});

export const removeVote = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
  }

  if (!req.user) {
    throw createError('Authentication required', 401, 'AUTH_REQUIRED');
  }

  const ideaId = parseInt(req.params.id);

  // Check if idea exists
  const ideaExists = await IdeaModel.exists(ideaId);
  if (!ideaExists) {
    throw createError('Idea not found', 404, 'IDEA_NOT_FOUND');
  }

  // Check if user has voted
  const hasVoted = await VoteModel.hasUserVoted(req.user.userId, ideaId);
  if (!hasVoted) {
    throw createError('No vote found to remove', 404, 'NO_VOTE_FOUND');
  }

  // Remove vote
  const removed = await VoteModel.delete(req.user.userId, ideaId);
  
  if (!removed) {
    throw createError('Failed to remove vote', 500, 'VOTE_REMOVAL_FAILED');
  }

  // Get updated vote stats
  const voteStats = await VoteModel.getVoteStats(ideaId, req.user.userId);

  res.json({
    success: true,
    message: 'Vote removed successfully',
    data: {
      stats: voteStats
    }
  });
});

export const getVoteStats = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
  }

  const ideaId = parseInt(req.params.id);

  // Check if idea exists
  const ideaExists = await IdeaModel.exists(ideaId);
  if (!ideaExists) {
    throw createError('Idea not found', 404, 'IDEA_NOT_FOUND');
  }

  // Get vote stats (include user vote if authenticated)
  const userId = req.user?.userId;
  const voteStats = await VoteModel.getVoteStats(ideaId, userId);

  res.json({
    success: true,
    data: {
      stats: voteStats
    }
  });
});

export const switchVote = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
  }

  if (!req.user) {
    throw createError('Authentication required', 401, 'AUTH_REQUIRED');
  }

  const ideaId = parseInt(req.params.id);

  // Check if idea exists
  const ideaExists = await IdeaModel.exists(ideaId);
  if (!ideaExists) {
    throw createError('Idea not found', 404, 'IDEA_NOT_FOUND');
  }

  // Check if user is trying to vote on their own idea
  const authorId = await IdeaModel.getAuthorId(ideaId);
  if (authorId === req.user.userId) {
    throw createError('Cannot vote on your own idea', 400, 'CANNOT_VOTE_OWN_IDEA');
  }

  // Check if user has voted
  const currentVote = await VoteModel.findByUserAndIdea(req.user.userId, ideaId);
  if (!currentVote) {
    throw createError('No existing vote to switch', 404, 'NO_VOTE_TO_SWITCH');
  }

  // Switch vote
  const newVote = await VoteModel.switchVote(req.user.userId, ideaId);
  
  if (!newVote) {
    throw createError('Failed to switch vote', 500, 'VOTE_SWITCH_FAILED');
  }

  // Get updated vote stats
  const voteStats = await VoteModel.getVoteStats(ideaId, req.user.userId);

  res.json({
    success: true,
    message: 'Vote switched successfully',
    data: {
      vote: newVote,
      stats: voteStats
    }
  });
});

export const getUserVotes = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    throw createError('Authentication required', 401, 'AUTH_REQUIRED');
  }

  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const votes = await VoteModel.getVotesByUser(req.user.userId, limit);

  res.json({
    success: true,
    data: {
      votes
    }
  });
});

export const getTopVotedIdeas = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
  const topIdeas = await VoteModel.getTopVotedIdeas(limit);

  res.json({
    success: true,
    data: {
      topIdeas
    }
  });
});