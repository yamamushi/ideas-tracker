import { Router } from 'express';
import { 
  getTags, 
  getTagsWithStats, 
  reloadTagConfig, 
  getAppConfiguration,
  validateTagConfiguration 
} from '../controllers/configController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/tags', getTags);
router.get('/app', getAppConfiguration);

// Admin routes
router.get('/tags/stats', authenticateToken, requireAdmin, getTagsWithStats);
router.post('/tags/reload', authenticateToken, requireAdmin, reloadTagConfig);
router.get('/tags/validate', authenticateToken, requireAdmin, validateTagConfiguration);

export default router;