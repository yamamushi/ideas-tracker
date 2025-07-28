import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { IdeaModel, IdeaFilters, IdeaSortOptions, PaginationOptions } from '../models/Idea';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { getAppConfig } from '../config/app';

const config = getAppConfig();

export const createIdea = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
  }

  if (!req.user) {
    throw createError('Authentication required', 401, 'AUTH_REQUIRED');
  }

  const { title, description, tags } = req.body;

  const idea = await IdeaModel.create({
    title,
    description,
    authorId: req.user.userId,
    tags: tags || []
  });

  // Get the idea with author information
  const ideaWithAuthor = await IdeaModel.findById(idea.id, true);

  res.status(201).json({
    success: true,
    message: 'Idea created successfully',
    data: {
      idea: ideaWithAuthor
    }
  });
});

export const getIdeas = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
  }

  // Parse query parameters
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(
    parseInt(req.query.limit as string) || config.pagination.defaultLimit,
    config.pagination.maxLimit
  );

  const sortBy = (req.query.sortBy as string) || 'votes';
  const sortOrder = (req.query.sortOrder as string) || 'desc';

  // Parse filters
  const filters: IdeaFilters = {};

  if (req.query.tags) {
    if (typeof req.query.tags === 'string') {
      filters.tags = [req.query.tags];
    } else if (Array.isArray(req.query.tags)) {
      filters.tags = req.query.tags as string[];
    }
  }

  if (req.query.search) {
    filters.search = req.query.search as string;
  }

  if (req.query.authorId) {
    filters.authorId = parseInt(req.query.authorId as string);
  }

  const sortOptions: IdeaSortOptions = {
    sortBy: sortBy as 'votes' | 'date' | 'alphabetical',
    sortOrder: sortOrder as 'asc' | 'desc'
  };

  const paginationOptions: PaginationOptions = {
    page,
    limit
  };

  const result = await IdeaModel.findAll(filters, sortOptions, paginationOptions);

  res.json({
    success: true,
    data: result
  });
});

export const getIdeaById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
  }

  const ideaId = parseInt(req.params.id);
  const idea = await IdeaModel.findById(ideaId, true);

  if (!idea) {
    throw createError('Idea not found', 404, 'IDEA_NOT_FOUND');
  }

  res.json({
    success: true,
    data: {
      idea
    }
  });
});

export const updateIdea = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
  }

  if (!req.user) {
    throw createError('Authentication required', 401, 'AUTH_REQUIRED');
  }

  const ideaId = parseInt(req.params.id);
  
  // Check if idea exists and get author ID
  const authorId = await IdeaModel.getAuthorId(ideaId);
  if (authorId === null) {
    throw createError('Idea not found', 404, 'IDEA_NOT_FOUND');
  }

  // Check if user is the author or admin
  if (req.user.userId !== authorId && !req.user.isAdmin) {
    throw createError('Access denied', 403, 'ACCESS_DENIED');
  }

  const { title, description, tags } = req.body;
  const updates: any = {};

  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (tags !== undefined) updates.tags = tags;

  const updatedIdea = await IdeaModel.update(ideaId, updates);

  if (!updatedIdea) {
    throw createError('Failed to update idea', 500, 'UPDATE_FAILED');
  }

  // Get the updated idea with author information
  const ideaWithAuthor = await IdeaModel.findById(updatedIdea.id, true);

  res.json({
    success: true,
    message: 'Idea updated successfully',
    data: {
      idea: ideaWithAuthor
    }
  });
});

export const deleteIdea = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
  }

  if (!req.user) {
    throw createError('Authentication required', 401, 'AUTH_REQUIRED');
  }

  const ideaId = parseInt(req.params.id);
  
  // Check if idea exists and get author ID
  const authorId = await IdeaModel.getAuthorId(ideaId);
  if (authorId === null) {
    throw createError('Idea not found', 404, 'IDEA_NOT_FOUND');
  }

  // Check if user is the author or admin
  if (req.user.userId !== authorId && !req.user.isAdmin) {
    throw createError('Access denied', 403, 'ACCESS_DENIED');
  }

  // Get idea details for logging if admin is deleting
  let ideaDetails = null;
  if (req.user.isAdmin && req.user.userId !== authorId) {
    ideaDetails = await IdeaModel.findById(ideaId, true);
  }

  const deleted = await IdeaModel.delete(ideaId);

  if (!deleted) {
    throw createError('Failed to delete idea', 500, 'DELETE_FAILED');
  }

  // Log admin action if applicable
  if (req.user.isAdmin && req.user.userId !== authorId && ideaDetails) {
    console.log(`Admin ${req.user.username} (ID: ${req.user.userId}) deleted idea "${ideaDetails.title}" (ID: ${ideaId}) by ${ideaDetails.author?.username}`);
  }

  res.json({
    success: true,
    message: 'Idea deleted successfully'
  });
});

export const getIdeasByUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
  }

  const userId = parseInt(req.params.userId);
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(
    parseInt(req.query.limit as string) || config.pagination.defaultLimit,
    config.pagination.maxLimit
  );

  const sortBy = (req.query.sortBy as string) || 'date';
  const sortOrder = (req.query.sortOrder as string) || 'desc';

  const sortOptions: IdeaSortOptions = {
    sortBy: sortBy as 'votes' | 'date' | 'alphabetical',
    sortOrder: sortOrder as 'asc' | 'desc'
  };

  const paginationOptions: PaginationOptions = {
    page,
    limit
  };

  const result = await IdeaModel.findByAuthor(userId, sortOptions, paginationOptions);

  res.json({
    success: true,
    data: result
  });
});