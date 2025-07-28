import jwt from 'jsonwebtoken';
import { getAppConfig } from '../config/app';

export interface JwtPayload {
  userId: number;
  username: string;
  email: string;
  isAdmin: boolean;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const config = getAppConfig();

export class JwtUtils {
  private static getAccessTokenSecret(): string {
    const secret = process.env['JWT_SECRET'];
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    return secret;
  }

  private static getRefreshTokenSecret(): string {
    const secret = process.env['JWT_REFRESH_SECRET'];
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET environment variable is required');
    }
    return secret;
  }

  static generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(
      payload,
      this.getAccessTokenSecret(),
      {
        expiresIn: config.jwt.accessTokenExpiry,
        issuer: 'ideas-tracker',
        audience: 'ideas-tracker-users'
      } as jwt.SignOptions
    );
  }

  static generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(
      payload,
      this.getRefreshTokenSecret(),
      {
        expiresIn: config.jwt.refreshTokenExpiry,
        issuer: 'ideas-tracker',
        audience: 'ideas-tracker-users'
      } as jwt.SignOptions
    );
  }

  static generateTokenPair(payload: JwtPayload): TokenPair {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload)
    };
  }

  static verifyAccessToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.getAccessTokenSecret(), {
        issuer: 'ideas-tracker',
        audience: 'ideas-tracker-users'
      }) as JwtPayload;
      
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Access token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid access token');
      } else {
        throw new Error('Token verification failed');
      }
    }
  }

  static verifyRefreshToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.getRefreshTokenSecret(), {
        issuer: 'ideas-tracker',
        audience: 'ideas-tracker-users'
      }) as JwtPayload;
      
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      } else {
        throw new Error('Token verification failed');
      }
    }
  }

  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1] || null;
  }

  static getTokenExpiry(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;
    } catch {
      return null;
    }
  }
}