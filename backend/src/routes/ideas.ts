import { Router } from 'express';
import {
  createIdea,
  getIdeas,
  getIdeaById,
  updateIdea,
  deleteIdea,
  getIdeasByUser
} from '../controllers/ideaController';
import {
  createIdeaValidation,
  updateIdeaValidation,
  getIdeasValidation,
  ideaIdValidation,
  userIdValidation
} from '../validators/idea';
import { authenticateToken, optionalAuth, requireAuth } from '../middleware/auth';
import { createLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes (with optional auth for user-specific data)
router.get('/', getIdeasValidation, optionalAuth, getIdeas);
router.get('/user/:userId', userIdValidation, getIdeasValidation, getIdeasByUser);
router.get('/:id', ideaIdValidation, optionalAuth, getIdeaById);

// Protected routes
router.post('/', createLimiter, createIdeaValidation, authenticateToken, requireAuth, createIdea);
router.put('/:id', updateIdeaValidation, authenticateToken, requireAuth, updateIdea);
router.delete('/:id', ideaIdValidation, authenticateToken, requireAuth, deleteIdea);

export default router;