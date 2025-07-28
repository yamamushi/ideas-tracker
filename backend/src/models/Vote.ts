import { db } from '../utils/databaseAdapter';

export interface Vote {
  id: number;
  userId: number;
  ideaId: number;
  voteType: 'upvote' | 'downvote';
  createdAt: Date;
}

export interface CreateVoteData {
  userId: number;
  ideaId: number;
  voteType: 'upvote' | 'downvote';
}

export interface VoteStats {
  upvotes: number;
  downvotes: number;
  total: number;
  userVote?: 'upvote' | 'downvote' | null;
}

export class VoteModel {
  static async create(voteData: CreateVoteData): Promise<Vote> {
    
    const query = `
      INSERT INTO votes (user_id, idea_id, vote_type)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, idea_id) 
      DO UPDATE SET vote_type = EXCLUDED.vote_type, created_at = CURRENT_TIMESTAMP
      RETURNING id, user_id, idea_id, vote_type, created_at
    `;

    const values = [voteData.userId, voteData.ideaId, voteData.voteType];
    const result = await db.query(query, values);
    const row = result.rows[0];

    return {
      id: row.id,
      userId: row.user_id,
      ideaId: row.idea_id,
      voteType: row.vote_type,
      createdAt: row.created_at
    };
  }

  static async findByUserAndIdea(userId: number, ideaId: number): Promise<Vote | null> {
    
    const query = `
      SELECT id, user_id, idea_id, vote_type, created_at
      FROM votes
      WHERE user_id = $1 AND idea_id = $2
    `;

    const result = await db.query(query, [userId, ideaId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      ideaId: row.idea_id,
      voteType: row.vote_type,
      createdAt: row.created_at
    };
  }

  static async delete(userId: number, ideaId: number): Promise<boolean> {
    
    const query = 'DELETE FROM votes WHERE user_id = $1 AND idea_id = $2';
    const result = await db.query(query, [userId, ideaId]);
    
    return result.rowCount !== null && result.rowCount > 0;
  }

  static async getVoteStats(ideaId: number, userId?: number): Promise<VoteStats> {
    
    // Get vote counts
    const statsQuery = `
      SELECT 
        COUNT(CASE WHEN vote_type = 'upvote' THEN 1 END) as upvotes,
        COUNT(CASE WHEN vote_type = 'downvote' THEN 1 END) as downvotes
      FROM votes
      WHERE idea_id = $1
    `;

    const statsResult = await db.query(statsQuery, [ideaId]);
    const stats = statsResult.rows[0];
    
    const upvotes = parseInt(stats.upvotes) || 0;
    const downvotes = parseInt(stats.downvotes) || 0;
    const total = upvotes - downvotes;

    const voteStats: VoteStats = {
      upvotes,
      downvotes,
      total
    };

    // Get user's vote if userId provided
    if (userId) {
      const userVote = await this.findByUserAndIdea(userId, ideaId);
      voteStats.userVote = userVote ? userVote.voteType : null;
    }

    return voteStats;
  }

  static async getVotesByUser(userId: number, limit: number = 50): Promise<Vote[]> {
    
    const query = `
      SELECT id, user_id, idea_id, vote_type, created_at
      FROM votes
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await db.query(query, [userId, limit]);
    
    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      ideaId: row.idea_id,
      voteType: row.vote_type,
      createdAt: row.created_at
    }));
  }

  static async getVotesByIdea(ideaId: number, limit: number = 100): Promise<Vote[]> {
    
    const query = `
      SELECT id, user_id, idea_id, vote_type, created_at
      FROM votes
      WHERE idea_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await db.query(query, [ideaId, limit]);
    
    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      ideaId: row.idea_id,
      voteType: row.vote_type,
      createdAt: row.created_at
    }));
  }

  static async hasUserVoted(userId: number, ideaId: number): Promise<boolean> {
    const vote = await this.findByUserAndIdea(userId, ideaId);
    return vote !== null;
  }

  static async getUserVoteType(userId: number, ideaId: number): Promise<'upvote' | 'downvote' | null> {
    const vote = await this.findByUserAndIdea(userId, ideaId);
    return vote ? vote.voteType : null;
  }

  static async switchVote(userId: number, ideaId: number): Promise<Vote | null> {
    const currentVote = await this.findByUserAndIdea(userId, ideaId);
    
    if (!currentVote) {
      return null;
    }

    const newVoteType = currentVote.voteType === 'upvote' ? 'downvote' : 'upvote';
    
    return this.create({
      userId,
      ideaId,
      voteType: newVoteType
    });
  }

  static async getTopVotedIdeas(limit: number = 10): Promise<{ ideaId: number; voteCount: number }[]> {
    
    const query = `
      SELECT 
        idea_id,
        COUNT(CASE WHEN vote_type = 'upvote' THEN 1 END) - 
        COUNT(CASE WHEN vote_type = 'downvote' THEN 1 END) as vote_count
      FROM votes
      GROUP BY idea_id
      ORDER BY vote_count DESC
      LIMIT $1
    `;

    const result = await db.query(query, [limit]);
    
    return result.rows.map(row => ({
      ideaId: row.idea_id,
      voteCount: parseInt(row.vote_count)
    }));
  }
}