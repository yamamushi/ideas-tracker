import { apiClient } from '../utils/api';
import { VoteStats } from '../types/idea';

export class VoteService {
  static async castVote(ideaId: number, voteType: 'upvote' | 'downvote'): Promise<{ stats: VoteStats }> {
    const response = await apiClient.post(`/votes/${ideaId}`, { voteType });
    return response.data.data;
  }

  static async removeVote(ideaId: number): Promise<{ stats: VoteStats }> {
    const response = await apiClient.delete(`/votes/${ideaId}`);
    return response.data.data;
  }

  static async switchVote(ideaId: number): Promise<{ stats: VoteStats }> {
    const response = await apiClient.patch(`/votes/${ideaId}/switch`);
    return response.data.data;
  }

  static async getVoteStats(ideaId: number): Promise<VoteStats> {
    const response = await apiClient.get(`/votes/stats/${ideaId}`);
    return response.data.data.stats;
  }

  static async getUserVotes(): Promise<any[]> {
    const response = await apiClient.get('/votes/user/me');
    return response.data.data.votes;
  }

  static async getTopVotedIdeas(limit: number = 10): Promise<any[]> {
    const response = await apiClient.get(`/votes/top?limit=${limit}`);
    return response.data.data.topIdeas;
  }
}