import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { UserModel } from '../models/User';
import { JwtUtils } from '../utils/jwt';
import { createError, asyncHandler } from '../middleware/errorHandler';

export const register = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
  }

  const { username, email, password } = req.body;

  // Check if email already exists
  const emailExists = await UserModel.checkEmailExists(email);
  if (emailExists) {
    throw createError('Email already registered', 400, 'EMAIL_EXISTS');
  }

  // Check if username already exists
  const usernameExists = await UserModel.checkUsernameExists(username);
  if (usernameExists) {
    throw createError('Username already taken', 400, 'USERNAME_EXISTS');
  }

  // Create user
  const user = await UserModel.create({
    username,
    email,
    password
  });

  // Generate tokens
  const tokenPayload = {
    userId: user.id,
    username: user.username,
    email: user.email,
    isAdmin: user.isAdmin
  };

  const tokens = JwtUtils.generateTokenPair(tokenPayload);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user,
      tokens
    }
  });
});

export const login = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
  }

  const { emailOrUsername, password } = req.body;

  // Find user by email or username
  const user = await UserModel.findByEmailOrUsername(emailOrUsername);
  if (!user) {
    throw createError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  // Verify password
  const isPasswordValid = await UserModel.comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    throw createError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  // Update last login
  await UserModel.updateLastLogin(user.id);

  // Generate tokens
  const tokenPayload = {
    userId: user.id,
    username: user.username,
    email: user.email,
    isAdmin: user.isAdmin
  };

  const tokens = JwtUtils.generateTokenPair(tokenPayload);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: UserModel.toPublic(user),
      tokens
    }
  });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
  }

  const { refreshToken } = req.body;

  try {
    // Verify refresh token
    const payload = JwtUtils.verifyRefreshToken(refreshToken);

    // Verify user still exists
    const user = await UserModel.findById(payload.userId);
    if (!user) {
      throw createError('User not found', 401, 'USER_NOT_FOUND');
    }

    // Generate new tokens
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin
    };

    const tokens = JwtUtils.generateTokenPair(tokenPayload);

    res.json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: {
        tokens
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        throw createError('Refresh token expired', 401, 'REFRESH_TOKEN_EXPIRED');
      } else if (error.message.includes('invalid')) {
        throw createError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
      }
    }
    throw createError('Token refresh failed', 401, 'REFRESH_FAILED');
  }
});

export const getMe = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  if (!req.user) {
    throw createError('Authentication required', 401, 'AUTH_REQUIRED');
  }

  // Get fresh user data
  const user = await UserModel.findById(req.user.userId);
  if (!user) {
    throw createError('User not found', 404, 'USER_NOT_FOUND');
  }

  res.json({
    success: true,
    data: {
      user: UserModel.toPublic(user)
    }
  });
});

export const logout = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
  // In a more sophisticated implementation, we might maintain a blacklist of tokens
  // For now, we'll just return success and let the client handle token removal
  
  res.json({
    success: true,
    message: 'Logout successful'
  });
});