import { db } from '../utils/databaseAdapter';
import { UserPublic } from './User';

// Helper function to parse tags from database
function parseTags(tags: any): string[] {
  if (typeof tags === 'string') {
    try {
      return JSON.parse(tags);
    } catch {
      return [];
    }
  }
  return Array.isArray(tags) ? tags : [];
}

export interface Idea {
  id: number;
  title: string;
  description: string;
  authorId: number;
  author?: UserPublic;
  tags: string[];
  voteCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateIdeaData {
  title: string;
  description: string;
  authorId: number;
  tags: string[];
}

export interface IdeaFilters {
  tags?: string[];
  authorId?: number;
  search?: string;
}

export interface IdeaSortOptions {
  sortBy: 'votes' | 'date' | 'alphabetical';
  sortOrder: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface IdeaListResult {
  ideas: Idea[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class IdeaModel {
  static async create(ideaData: CreateIdeaData): Promise<Idea> {
    
    const query = `
      INSERT INTO ideas (title, description, author_id, tags)
      VALUES (?, ?, ?, ?)
    `;

    const values = [
      ideaData.title,
      ideaData.description,
      ideaData.authorId,
      JSON.stringify(ideaData.tags)
    ];

    const result = await db.query(query, values);
    
    if (result.rows.length > 0) {
      // Database adapter already returned the inserted row
      const row = result.rows[0];
      return {
        id: row.id,
        title: row.title,
        description: row.description,
        authorId: row.author_id,
        tags: parseTags(row.tags),
        voteCount: row.vote_count,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };
    } else {
      throw new Error('Failed to create idea');
    }
  }

  static async findById(id: number, includeAuthor: boolean = true): Promise<Idea | null> {
    
    let query: string;
    if (includeAuthor) {
      query = `
        SELECT 
          i.id, i.title, i.description, i.author_id, i.tags, i.vote_count, 
          i.created_at, i.updated_at,
          u.username, u.email, u.is_admin, u.created_at as user_created_at
        FROM ideas i
        LEFT JOIN users u ON i.author_id = u.id
        WHERE i.id = ?
      `;
    } else {
      query = `
        SELECT id, title, description, author_id, tags, vote_count, created_at, updated_at
        FROM ideas
        WHERE id = ?
      `;
    }

    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    const idea: Idea = {
      id: row.id,
      title: row.title,
      description: row.description,
      authorId: row.author_id,
      tags: parseTags(row.tags),
      voteCount: row.vote_count,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };

    if (includeAuthor && row.username) {
      idea.author = {
        id: row.author_id,
        username: row.username,
        email: row.email,
        isAdmin: row.is_admin,
        createdAt: row.user_created_at
      };
    }

    return idea;
  }

  static async findAll(
    filters: IdeaFilters = {},
    sort: IdeaSortOptions = { sortBy: 'votes', sortOrder: 'desc' },
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<IdeaListResult> {
    
    // Build WHERE clause
    const whereConditions: string[] = [];
    const queryParams: any[] = [];

    if (filters.tags && filters.tags.length > 0) {
      // For SQLite, we need to check if any of the tags exist in the JSON array
      const tagConditions = filters.tags.map((tag) => {
        queryParams.push(`%"${tag}"%`);
        return `json_extract(i.tags, '$') LIKE ?`;
      });
      whereConditions.push(`(${tagConditions.join(' OR ')})`);
    }

    if (filters.authorId) {
      whereConditions.push(`i.author_id = ?`);
      queryParams.push(filters.authorId);
    }

    if (filters.search) {
      whereConditions.push(`(i.title LIKE ? OR i.description LIKE ?)`);
      queryParams.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Build ORDER BY clause
    let orderBy: string;
    switch (sort.sortBy) {
      case 'votes':
        orderBy = `ORDER BY i.vote_count ${sort.sortOrder.toUpperCase()}`;
        break;
      case 'date':
        orderBy = `ORDER BY i.created_at ${sort.sortOrder.toUpperCase()}`;
        break;
      case 'alphabetical':
        orderBy = `ORDER BY i.title ${sort.sortOrder.toUpperCase()}`;
        break;
      default:
        orderBy = 'ORDER BY i.vote_count DESC';
    }

    // Calculate offset
    const offset = (pagination.page - 1) * pagination.limit;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ideas i
      ${whereClause}
    `;
    
    const countResult = await db.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get ideas with pagination
    const ideasQuery = `
      SELECT 
        i.id, i.title, i.description, i.author_id, i.tags, i.vote_count, 
        i.created_at, i.updated_at,
        u.username, u.email, u.is_admin, u.created_at as user_created_at
      FROM ideas i
      LEFT JOIN users u ON i.author_id = u.id
      ${whereClause}
      ${orderBy}
      LIMIT ? OFFSET ?
    `;

    queryParams.push(pagination.limit, offset);
    const ideasResult = await db.query(ideasQuery, queryParams);

    const ideas: Idea[] = ideasResult.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      authorId: row.author_id,
      tags: parseTags(row.tags),
      voteCount: row.vote_count,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      author: row.username ? {
        id: row.author_id,
        username: row.username,
        email: row.email,
        isAdmin: row.is_admin,
        createdAt: row.user_created_at
      } : undefined
    }));

    return {
      ideas,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit)
    };
  }

  static async findByAuthor(
    authorId: number,
    sort: IdeaSortOptions = { sortBy: 'date', sortOrder: 'desc' },
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<IdeaListResult> {
    return this.findAll(
      { authorId },
      sort,
      pagination
    );
  }

  static async update(id: number, updates: Partial<CreateIdeaData>): Promise<Idea | null> {
    
    const updateFields: string[] = [];
    const queryParams: any[] = [];

    if (updates.title !== undefined) {
      updateFields.push(`title = ?`);
      queryParams.push(updates.title);
    }

    if (updates.description !== undefined) {
      updateFields.push(`description = ?`);
      queryParams.push(updates.description);
    }

    if (updates.tags !== undefined) {
      updateFields.push(`tags = ?`);
      queryParams.push(JSON.stringify(updates.tags));
    }

    if (updateFields.length === 0) {
      return this.findById(id);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    queryParams.push(id);

    const query = `
      UPDATE ideas 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    const result = await db.query(query, queryParams);
    
    if (result.rowCount === 0) {
      return null;
    }

    // Fetch the updated record
    return this.findById(id, false);
  }

  static async delete(id: number): Promise<boolean> {
    
    const query = 'DELETE FROM ideas WHERE id = ?';
    const result = await db.query(query, [id]);
    
    return result.rowCount !== null && result.rowCount > 0;
  }

  static async exists(id: number): Promise<boolean> {
    
    const query = 'SELECT 1 FROM ideas WHERE id = ?';
    const result = await db.query(query, [id]);
    
    return result.rows.length > 0;
  }

  static async getAuthorId(id: number): Promise<number | null> {
    
    const query = 'SELECT author_id FROM ideas WHERE id = ?';
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0].author_id;
  }
}