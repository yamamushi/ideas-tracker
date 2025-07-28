import { Request, Response } from 'express';
import { UserModel } from '../models/User';
// import { logger } from '../utils/logger';

export class UserController {
  /**
   * Get user by ID
   */
  static async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id, 10);

      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid user ID',
            code: 'INVALID_USER_ID'
          }
        });
        return;
      }

      const user = await UserModel.findById(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          error: {
            message: 'User not found',
            code: 'USER_NOT_FOUND'
          }
        });
        return;
      }

      // Remove sensitive information
      const { passwordHash, ...safeUser } = user;

      res.json({
        success: true,
        data: {
          user: {
            id: safeUser.id,
            username: safeUser.username,
            email: safeUser.email,
            isAdmin: safeUser.isAdmin,
            createdAt: safeUser.createdAt,
            updatedAt: safeUser.updatedAt
          }
        }
      });
    } catch (error) {
      console.error('Error getting user by ID:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR'
        }
      });
    }
  }

  /**
   * Get current user (authenticated user)
   */
  static async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            message: 'Not authenticated',
            code: 'NOT_AUTHENTICATED'
          }
        });
        return;
      }

      const user = await UserModel.findById(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          error: {
            message: 'User not found',
            code: 'USER_NOT_FOUND'
          }
        });
        return;
      }

      // Remove sensitive information
      const { passwordHash, ...safeUser } = user;

      res.json({
        success: true,
        data: {
          user: {
            id: safeUser.id,
            username: safeUser.username,
            email: safeUser.email,
            isAdmin: safeUser.isAdmin,
            createdAt: safeUser.createdAt,
            updatedAt: safeUser.updatedAt
          }
        }
      });
    } catch (error) {
      console.error('Error getting current user:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR'
        }
      });
    }
  }

  /**
   * Update user profile
   */
  static async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id, 10);
      const currentUserId = req.user?.userId;

      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid user ID',
            code: 'INVALID_USER_ID'
          }
        });
        return;
      }

      // Users can only update their own profile (unless admin)
      if (userId !== currentUserId && !req.user?.isAdmin) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Forbidden: Cannot update another user\'s profile',
            code: 'FORBIDDEN'
          }
        });
        return;
      }

      const { username, email } = req.body;

      // Validate input
      if (!username && !email) {
        res.status(400).json({
          success: false,
          error: {
            message: 'At least one field (username or email) is required',
            code: 'MISSING_FIELDS'
          }
        });
        return;
      }

      // Check if user exists
      const existingUser = await UserModel.findById(userId);
      if (!existingUser) {
        res.status(404).json({
          success: false,
          error: {
            message: 'User not found',
            code: 'USER_NOT_FOUND'
          }
        });
        return;
      }

      // Check for username conflicts
      if (username && username !== existingUser.username) {
        const usernameExists = await UserModel.checkUsernameExists(username);
        if (usernameExists) {
          res.status(409).json({
            success: false,
            error: {
              message: 'Username already exists',
              code: 'USERNAME_EXISTS'
            }
          });
          return;
        }
      }

      // Check for email conflicts
      if (email && email !== existingUser.email) {
        const emailExists = await UserModel.checkEmailExists(email);
        if (emailExists) {
          res.status(409).json({
            success: false,
            error: {
              message: 'Email already exists',
              code: 'EMAIL_EXISTS'
            }
          });
          return;
        }
      }

      // Update user (this would need to be implemented in the User model)
      // For now, we'll return the existing user as this is a read-only implementation
      const { passwordHash, ...safeUser } = existingUser;

      res.json({
        success: true,
        data: {
          user: {
            id: safeUser.id,
            username: safeUser.username,
            email: safeUser.email,
            isAdmin: safeUser.isAdmin,
            createdAt: safeUser.createdAt,
            updatedAt: safeUser.updatedAt
          }
        }
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR'
        }
      });
    }
  }
}