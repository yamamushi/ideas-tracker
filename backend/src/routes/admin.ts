import { Router } from 'express';
import {
  deleteIdea,
  deleteComment,
  getContentStats,
  getFlaggedContent,
  bulkDeleteIdeas,
  bulkDeleteComments
} from '../controllers/adminController';
import {
  deleteIdeaValidation,
  deleteCommentValidation,
  bulkDeleteIdeasValidation,
  bulkDeleteCommentsValidation
} from '../validators/admin';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// All admin routes require authentication and admin privileges
router.use(authenticateToken);
router.use(requireAdmin);

// Content management
router.delete('/ideas/:id', deleteIdeaValidation, deleteIdea);
router.delete('/comments/:id', deleteCommentValidation, deleteComment);

// Bulk operations
router.post('/ideas/bulk-delete', bulkDeleteIdeasValidation, bulkDeleteIdeas);
router.post('/comments/bulk-delete', bulkDeleteCommentsValidation, bulkDeleteComments);

// Admin dashboard data
router.get('/stats', getContentStats);
router.get('/flagged-content', getFlaggedContent);

export default router;