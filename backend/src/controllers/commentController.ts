import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { CommentModel, PaginationOptions } from '../models/Comment';
import { IdeaModel } from '../models/Idea';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { getAppConfig } from '../config/app';

const config = getAppConfig();

export const createComment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
  }

  if (!req.user) {
    throw createError('Authentication required', 401, 'AUTH_REQUIRED');
  }

  const ideaId = parseInt(req.params.ideaId);
  const { content } = req.body;

  // Check if idea exists
  const ideaExists = await IdeaModel.exists(ideaId);
  if (!ideaExists) {
    throw createError('Idea not found', 404, 'IDEA_NOT_FOUND');
  }

  // Create comment
  const comment = await CommentModel.create({
    content,
    authorId: req.user.userId,
    ideaId
  });

  // Get the comment with author information
  const commentWithAuthor = await CommentModel.findById(comment.id, true);

  res.status(201).json({
    success: true,
    message: 'Comment created successfully',
    data: {
      comment: commentWithAuthor
    }
  });
});

export const getCommentsByIdea = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
  }

  const ideaId = parseInt(req.params.ideaId);

  // Check if idea exists
  const ideaExists = await IdeaModel.exists(ideaId);
  if (!ideaExists) {
    throw createError('Idea not found', 404, 'IDEA_NOT_FOUND');
  }

  // Parse pagination parameters
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(
    parseInt(req.query.limit as string) || 50,
    100 // Max limit for comments
  );

  const paginationOptions: PaginationOptions = {
    page,
    limit
  };

  const result = await CommentModel.findByIdea(ideaId, paginationOptions);

  res.json({
    success: true,
    data: result
  });
});

export const getCommentById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
  }

  const commentId = parseInt(req.params.id);
  const comment = await CommentModel.findById(commentId, true);

  if (!comment) {
    throw createError('Comment not found', 404, 'COMMENT_NOT_FOUND');
  }

  res.json({
    success: true,
    data: {
      comment
    }
  });
});

export const updateComment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
  }

  if (!req.user) {
    throw createError('Authentication required', 401, 'AUTH_REQUIRED');
  }

  const commentId = parseInt(req.params.id);
  const { content } = req.body;

  // Check if comment exists and get author ID
  const authorId = await CommentModel.getAuthorId(commentId);
  if (authorId === null) {
    throw createError('Comment not found', 404, 'COMMENT_NOT_FOUND');
  }

  // Check if user is the author or admin
  if (req.user.userId !== authorId && !req.user.isAdmin) {
    throw createError('Access denied', 403, 'ACCESS_DENIED');
  }

  const updatedComment = await CommentModel.update(commentId, content);

  if (!updatedComment) {
    throw createError('Failed to update comment', 500, 'UPDATE_FAILED');
  }

  // Get the updated comment with author information
  const commentWithAuthor = await CommentModel.findById(updatedComment.id, true);

  res.json({
    success: true,
    message: 'Comment updated successfully',
    data: {
      comment: commentWithAuthor
    }
  });
});

export const deleteComment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
  }

  if (!req.user) {
    throw createError('Authentication required', 401, 'AUTH_REQUIRED');
  }

  const commentId = parseInt(req.params.id);

  // Check if comment exists and get author ID
  const authorId = await CommentModel.getAuthorId(commentId);
  if (authorId === null) {
    throw createError('Comment not found', 404, 'COMMENT_NOT_FOUND');
  }

  // Check if user is the author or admin
  if (req.user.userId !== authorId && !req.user.isAdmin) {
    throw createError('Access denied', 403, 'ACCESS_DENIED');
  }

  // Get comment details for logging if admin is deleting
  let commentDetails = null;
  if (req.user.isAdmin && req.user.userId !== authorId) {
    commentDetails = await CommentModel.findById(commentId, true);
  }

  const deleted = await CommentModel.delete(commentId);

  if (!deleted) {
    throw createError('Failed to delete comment', 500, 'DELETE_FAILED');
  }

  // Log admin action if applicable
  if (req.user.isAdmin && req.user.userId !== authorId && commentDetails) {
    console.log(`Admin ${req.user.username} (ID: ${req.user.userId}) deleted comment (ID: ${commentId}) by ${commentDetails.author?.username} on idea ${commentDetails.ideaId}`);
  }

  res.json({
    success: true,
    message: 'Comment deleted successfully'
  });
});

export const getUserComments = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
  }

  if (!req.user) {
    throw createError('Authentication required', 401, 'AUTH_REQUIRED');
  }

  // Parse pagination parameters
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(
    parseInt(req.query.limit as string) || 50,
    100
  );

  const paginationOptions: PaginationOptions = {
    page,
    limit
  };

  const result = await CommentModel.findByAuthor(req.user.userId, paginationOptions);

  res.json({
    success: true,
    data: result
  });
});

export const getRecentComments = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
  const comments = await CommentModel.getRecentComments(limit);

  res.json({
    success: true,
    data: {
      comments
    }
  });
});

export const getCommentCount = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
  }

  const ideaId = parseInt(req.params.ideaId);

  // Check if idea exists
  const ideaExists = await IdeaModel.exists(ideaId);
  if (!ideaExists) {
    throw createError('Idea not found', 404, 'IDEA_NOT_FOUND');
  }

  const count = await CommentModel.getCommentCount(ideaId);

  res.json({
    success: true,
    data: {
      count
    }
  });
});