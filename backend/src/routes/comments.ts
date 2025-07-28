import { Router } from 'express';
import {
  createComment,
  getCommentsByIdea,
  getCommentById,
  updateComment,
  deleteComment,
  getUserComments,
  getRecentComments,
  getCommentCount
} from '../controllers/commentController';
import {
  createCommentValidation,
  updateCommentValidation,
  getCommentsValidation,
  commentIdValidation,
  getUserCommentsValidation
} from '../validators/comment';
import { authenticateToken, requireAuth } from '../middleware/auth';
import { createLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes
router.get('/idea/:ideaId', getCommentsValidation, getCommentsByIdea);
router.get('/idea/:ideaId/count', getCommentsValidation, getCommentCount);
router.get('/recent', getRecentComments);
router.get('/:id', commentIdValidation, getCommentById);

// Protected routes
router.post('/idea/:ideaId', createLimiter, createCommentValidation, authenticateToken, requireAuth, createComment);
router.put('/:id', updateCommentValidation, authenticateToken, requireAuth, updateComment);
router.delete('/:id', commentIdValidation, authenticateToken, requireAuth, deleteComment);
router.get('/user/me', getUserCommentsValidation, authenticateToken, requireAuth, getUserComments);

export default router;