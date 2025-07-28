import { apiClient } from '../utils/api';

export class AdminService {
  static async deleteIdea(ideaId: number): Promise<void> {
    await apiClient.delete(`/admin/ideas/${ideaId}`);
  }

  static async deleteComment(commentId: number): Promise<void> {
    await apiClient.delete(`/admin/comments/${commentId}`);
  }

  static async bulkDeleteIdeas(ideaIds: number[]): Promise<{
    deletedIdeas: Array<{ id: number; title: string; author: string }>;
    failedDeletes: number[];
    summary: { deleted: number; failed: number };
  }> {
    const response = await apiClient.post('/admin/ideas/bulk-delete', { ideaIds });
    return response.data.data;
  }

  static async bulkDeleteComments(commentIds: number[]): Promise<{
    deletedComments: Array<{ id: number; author: string; ideaId: number }>;
    failedDeletes: number[];
    summary: { deleted: number; failed: number };
  }> {
    const response = await apiClient.post('/admin/comments/bulk-delete', { commentIds });
    return response.data.data;
  }

  static async getContentStats(): Promise<{
    totalIdeas: number;
    totalComments: number;
    totalVotes: number;
    totalUsers: number;
    recentActivity: {
      latestIdea: any;
      latestComment: any;
      topVotedIdea: any;
    };
  }> {
    const response = await apiClient.get('/admin/stats');
    return response.data.data.stats;
  }

  static async getFlaggedContent(): Promise<{
    flaggedIdeas: any[];
    recentComments: any[];
  }> {
    const response = await apiClient.get('/admin/flagged-content');
    return response.data.data;
  }
}