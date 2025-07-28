import bcrypt from 'bcrypt';
import { db } from '../utils/databaseAdapter';

export interface User {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  isAdmin?: boolean;
}

export interface UserPublic {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
  createdAt: Date;
}

export class UserModel {
  private static readonly SALT_ROUNDS = 12;

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static toPublic(user: User): UserPublic {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt
    };
  }

  static async create(userData: CreateUserData): Promise<UserPublic> {
    const passwordHash = await this.hashPassword(userData.password);

    const query = `
      INSERT INTO users (username, email, password_hash, is_admin)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, is_admin, created_at, updated_at
    `;

    const values = [
      userData.username,
      userData.email,
      passwordHash,
      userData.isAdmin || false
    ];

    const result = await db.query(query, values);
    const user = result.rows[0];

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.is_admin,
      createdAt: user.created_at
    };
  }

  static async findById(id: number): Promise<User | null> {
    const query = `
      SELECT id, username, email, password_hash, is_admin, created_at, updated_at
      FROM users
      WHERE id = $1
    `;

    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      passwordHash: row.password_hash,
      isAdmin: Boolean(row.is_admin), // Convert SQLite integer to boolean
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  static async findByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT id, username, email, password_hash, is_admin, created_at, updated_at
      FROM users
      WHERE email = $1
    `;

    const result = await db.query(query, [email]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      passwordHash: row.password_hash,
      isAdmin: Boolean(row.is_admin), // Convert SQLite integer to boolean
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  static async findByUsername(username: string): Promise<User | null> {
    const query = `
      SELECT id, username, email, password_hash, is_admin, created_at, updated_at
      FROM users
      WHERE username = $1
    `;

    const result = await db.query(query, [username]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      passwordHash: row.password_hash,
      isAdmin: Boolean(row.is_admin), // Convert SQLite integer to boolean
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  static async findByEmailOrUsername(emailOrUsername: string): Promise<User | null> {
    const query = `
      SELECT id, username, email, password_hash, is_admin, created_at, updated_at
      FROM users
      WHERE email = $1 OR username = $2
    `;

    const result = await db.query(query, [emailOrUsername, emailOrUsername]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      passwordHash: row.password_hash,
      isAdmin: Boolean(row.is_admin), // Convert SQLite integer to boolean
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  static async checkEmailExists(email: string): Promise<boolean> {
    const query = 'SELECT 1 FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows.length > 0;
  }

  static async checkUsernameExists(username: string): Promise<boolean> {
    const query = 'SELECT 1 FROM users WHERE username = $1';
    const result = await db.query(query, [username]);
    return result.rows.length > 0;
  }

  static async updateLastLogin(id: number): Promise<void> {
    const query = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1';
    await db.query(query, [id]);
  }
}