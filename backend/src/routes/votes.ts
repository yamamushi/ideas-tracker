import { Router } from 'express';
import {
  castVote,
  removeVote,
  getVoteStats,
  switchVote,
  getUserVotes,
  getTopVotedIdeas
} from '../controllers/voteController';
import {
  voteValidation,
  removeVoteValidation,
  getVoteStatsValidation
} from '../validators/vote';
import { authenticateToken, optionalAuth, requireAuth } from '../middleware/auth';
import { voteLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes (with optional auth for user-specific data)
router.get('/stats/:id', getVoteStatsValidation, optionalAuth, getVoteStats);
router.get('/top', getTopVotedIdeas);

// Protected routes
router.post('/:id', voteLimiter, voteValidation, authenticateToken, requireAuth, castVote);
router.delete('/:id', voteLimiter, removeVoteValidation, authenticateToken, requireAuth, removeVote);
router.patch('/:id/switch', voteLimiter, removeVoteValidation, authenticateToken, requireAuth, switchVote);
router.get('/user/me', authenticateToken, requireAuth, getUserVotes);

export default router;