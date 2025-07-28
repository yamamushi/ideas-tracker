import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @route GET /api/users/me
 * @desc Get current authenticated user
 * @access Private
 */
router.get('/me', authenticateToken, UserController.getCurrentUser);

/**
 * @route GET /api/users/:id
 * @desc Get user by ID
 * @access Public
 */
router.get('/:id', UserController.getUserById);

/**
 * @route PUT /api/users/:id
 * @desc Update user profile
 * @access Private (own profile or admin)
 */
router.put('/:id', authenticateToken, UserController.updateUser);

export default router;