import { Request, Response, NextFunction } from 'express';
import { JwtUtils, JwtPayload } from '../utils/jwt';
import { UserModel } from '../models/User';
import { createError } from './errorHandler';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticateToken(req: Request, _res: Response, next: NextFunction): void {
  (async () => {
    try {
      const token = JwtUtils.extractTokenFromHeader(req.headers.authorization);
      
      if (!token) {
        throw createError('Access token required', 401, 'MISSING_TOKEN');
      }

      const payload = JwtUtils.verifyAccessToken(token);
      
      // Verify user still exists
      const user = await UserModel.findById(payload.userId);
      if (!user) {
        throw createError('User not found', 401, 'USER_NOT_FOUND');
      }

      req.user = payload;
      next();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('expired')) {
          next(createError('Access token expired', 401, 'TOKEN_EXPIRED'));
        } else if (error.message.includes('invalid')) {
          next(createError('Invalid access token', 401, 'INVALID_TOKEN'));
        } else {
          next(error);
        }
      } else {
        next(createError('Authentication failed', 401, 'AUTH_FAILED'));
      }
    }
  })();
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = JwtUtils.extractTokenFromHeader(req.headers.authorization);
  
  if (!token) {
    return next();
  }

  try {
    const payload = JwtUtils.verifyAccessToken(token);
    req.user = payload;
  } catch (error) {
    // Ignore token errors for optional auth
    console.warn('Optional auth token verification failed:', error);
  }
  
  next();
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(createError('Authentication required', 401, 'AUTH_REQUIRED'));
  }

  if (!req.user.isAdmin) {
    return next(createError('Admin access required', 403, 'ADMIN_REQUIRED'));
  }

  next();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(createError('Authentication required', 401, 'AUTH_REQUIRED'));
  }
  next();
}

export function requireOwnershipOrAdmin(getUserId: (req: Request) => number) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(createError('Authentication required', 401, 'AUTH_REQUIRED'));
    }

    const resourceUserId = getUserId(req);
    
    if (req.user.isAdmin || req.user.userId === resourceUserId) {
      return next();
    }

    next(createError('Access denied', 403, 'ACCESS_DENIED'));
  };
}