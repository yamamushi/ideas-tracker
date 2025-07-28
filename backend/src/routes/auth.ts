import { Router } from 'express';
import { register, login, refreshToken, getMe, logout } from '../controllers/authController';
import { registerValidation, loginValidation, refreshTokenValidation } from '../validators/auth';
import { authenticateToken } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply auth rate limiter to all auth routes
router.use(authLimiter);

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/refresh', refreshTokenValidation, refreshToken);

// Protected routes
router.get('/me', authenticateToken, getMe);
router.post('/logout', authenticateToken, logout);

export default router;