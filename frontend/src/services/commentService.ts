import { apiClient } from '../utils/api';
import { Comment, CreateCommentData, CommentsResponse } from '../types/idea';

export class CommentService {
  static async getCommentsByIdea(
    ideaId: number,
    page: number = 1,
    limit: number = 50
  ): Promise<CommentsResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await apiClient.get(`/comments/idea/${ideaId}?${params.toString()}`);
    return response.data.data;
  }

  static async createComment(ideaId: number, data: CreateCommentData): Promise<Comment> {
    const response = await apiClient.post(`/comments/idea/${ideaId}`, data);
    return response.data.data.comment;
  }

  static async updateComment(commentId: number, data: CreateCommentData): Promise<Comment> {
    const response = await apiClient.put(`/comments/${commentId}`, data);
    return response.data.data.comment;
  }

  static async deleteComment(commentId: number): Promise<void> {
    await apiClient.delete(`/comments/${commentId}`);
  }

  static async getCommentCount(ideaId: number): Promise<number> {
    const response = await apiClient.get(`/comments/idea/${ideaId}/count`);
    return response.data.data.count;
  }
}