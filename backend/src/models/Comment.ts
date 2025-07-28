import { db } from '../utils/databaseAdapter';
import { UserPublic } from './User';

export interface Comment {
  id: number;
  content: string;
  authorId: number;
  author?: UserPublic;
  ideaId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCommentData {
  content: string;
  authorId: number;
  ideaId: number;
}

export interface CommentListResult {
  comments: Comment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export class CommentModel {
  static async create(commentData: CreateCommentData): Promise<Comment> {
    
    const query = `
      INSERT INTO comments (content, author_id, idea_id)
      VALUES ($1, $2, $3)
      RETURNING id, content, author_id, idea_id, created_at, updated_at
    `;

    const values = [
      commentData.content,
      commentData.authorId,
      commentData.ideaId
    ];

    const result = await db.query(query, values);
    const row = result.rows[0];

    return {
      id: row.id,
      content: row.content,
      authorId: row.author_id,
      ideaId: row.idea_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  static async findById(id: number, includeAuthor: boolean = true): Promise<Comment | null> {
    
    let query: string;
    if (includeAuthor) {
      query = `
        SELECT 
          c.id, c.content, c.author_id, c.idea_id, c.created_at, c.updated_at,
          u.username, u.email, u.is_admin, u.created_at as user_created_at
        FROM comments c
        LEFT JOIN users u ON c.author_id = u.id
        WHERE c.id = $1
      `;
    } else {
      query = `
        SELECT id, content, author_id, idea_id, created_at, updated_at
        FROM comments
        WHERE id = $1
      `;
    }

    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    const comment: Comment = {
      id: row.id,
      content: row.content,
      authorId: row.author_id,
      ideaId: row.idea_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    if (includeAuthor && row.username) {
      comment.author = {
        id: row.author_id,
        username: row.username,
        email: row.email,
        isAdmin: row.is_admin,
        createdAt: row.user_created_at
      };
    }

    return comment;
  }

  static async findByIdea(
    ideaId: number,
    pagination: PaginationOptions = { page: 1, limit: 50 }
  ): Promise<CommentListResult> {
    
    // Calculate offset
    const offset = (pagination.page - 1) * pagination.limit;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM comments
      WHERE idea_id = $1
    `;
    
    const countResult = await db.query(countQuery, [ideaId]);
    const total = parseInt(countResult.rows[0].total);

    // Get comments with pagination (chronological order - oldest first)
    const commentsQuery = `
      SELECT 
        c.id, c.content, c.author_id, c.idea_id, c.created_at, c.updated_at,
        u.username, u.email, u.is_admin, u.created_at as user_created_at
      FROM comments c
      LEFT JOIN users u ON c.author_id = u.id
      WHERE c.idea_id = $1
      ORDER BY c.created_at ASC
      LIMIT $2 OFFSET $3
    `;

    const commentsResult = await db.query(commentsQuery, [ideaId, pagination.limit, offset]);

    const comments: Comment[] = commentsResult.rows.map(row => ({
      id: row.id,
      content: row.content,
      authorId: row.author_id,
      ideaId: row.idea_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      author: row.username ? {
        id: row.author_id,
        username: row.username,
        email: row.email,
        isAdmin: row.is_admin,
        createdAt: row.user_created_at
      } : undefined
    }));

    return {
      comments,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit)
    };
  }

  static async findByAuthor(
    authorId: number,
    pagination: PaginationOptions = { page: 1, limit: 50 }
  ): Promise<CommentListResult> {
    
    // Calculate offset
    const offset = (pagination.page - 1) * pagination.limit;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM comments
      WHERE author_id = $1
    `;
    
    const countResult = await db.query(countQuery, [authorId]);
    const total = parseInt(countResult.rows[0].total);

    // Get comments with pagination (newest first for user's comments)
    const commentsQuery = `
      SELECT 
        c.id, c.content, c.author_id, c.idea_id, c.created_at, c.updated_at,
        u.username, u.email, u.is_admin, u.created_at as user_created_at
      FROM comments c
      LEFT JOIN users u ON c.author_id = u.id
      WHERE c.author_id = $1
      ORDER BY c.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const commentsResult = await db.query(commentsQuery, [authorId, pagination.limit, offset]);

    const comments: Comment[] = commentsResult.rows.map(row => ({
      id: row.id,
      content: row.content,
      authorId: row.author_id,
      ideaId: row.idea_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      author: row.username ? {
        id: row.author_id,
        username: row.username,
        email: row.email,
        isAdmin: row.is_admin,
        createdAt: row.user_created_at
      } : undefined
    }));

    return {
      comments,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit)
    };
  }

  static async update(id: number, content: string): Promise<Comment | null> {
    
    const query = `
      UPDATE comments 
      SET content = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, content, author_id, idea_id, created_at, updated_at
    `;

      const result = await db.query(query, [content, id]);
    
    if (result.rowCount === 0) {
      return null;
    }
    
    // If we have affected rows but no returned rows, fetch the updated comment
    if (result.rows.length === 0 && result.rowCount > 0) {
      const fetchQuery = 'SELECT id, content, author_id, idea_id, created_at, updated_at FROM comments WHERE id = $1';
      const fetchResult = await db.query(fetchQuery, [id]);
      if (fetchResult.rows.length > 0) {
        const row = fetchResult.rows[0];
        return {
          id: row.id,
          content: row.content,
          authorId: row.author_id,
          ideaId: row.idea_id,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      }
    }

    const row = result.rows[0];
    return {
      id: row.id,
      content: row.content,
      authorId: row.author_id,
      ideaId: row.idea_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  static async delete(id: number): Promise<boolean> {
    
    const query = 'DELETE FROM comments WHERE id = $1';
    const result = await db.query(query, [id]);
    
    return result.rowCount !== null && result.rowCount > 0;
  }

  static async exists(id: number): Promise<boolean> {
    
    const query = 'SELECT 1 FROM comments WHERE id = $1';
    const result = await db.query(query, [id]);
    
    return result.rows.length > 0;
  }

  static async getAuthorId(id: number): Promise<number | null> {
    
    const query = 'SELECT author_id FROM comments WHERE id = $1';
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0].author_id;
  }

  static async getCommentCount(ideaId: number): Promise<number> {
    
    const query = 'SELECT COUNT(*) as count FROM comments WHERE idea_id = $1';
    const result = await db.query(query, [ideaId]);
    
    return parseInt(result.rows[0].count) || 0;
  }

  static async getRecentComments(limit: number = 10): Promise<Comment[]> {
    
    const query = `
      SELECT 
        c.id, c.content, c.author_id, c.idea_id, c.created_at, c.updated_at,
        u.username, u.email, u.is_admin, u.created_at as user_created_at
      FROM comments c
      LEFT JOIN users u ON c.author_id = u.id
      ORDER BY c.created_at DESC
      LIMIT $1
    `;

    const result = await db.query(query, [limit]);

    return result.rows.map(row => ({
      id: row.id,
      content: row.content,
      authorId: row.author_id,
      ideaId: row.idea_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      author: row.username ? {
        id: row.author_id,
        username: row.username,
        email: row.email,
        isAdmin: row.is_admin,
        createdAt: row.user_created_at
      } : undefined
    }));
  }

  static async deleteByIdea(ideaId: number): Promise<number> {
    
    const query = 'DELETE FROM comments WHERE idea_id = $1';
    const result = await db.query(query, [ideaId]);
    
    return result.rowCount || 0;
  }
}