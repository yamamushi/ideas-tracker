import { apiClient } from '../utils/api';
import { IdeasResponse, Idea, CreateIdeaData, IdeaFilters, SortOptions, Tag } from '../types/idea';

export class IdeaService {
  static async getIdeas(
    filters: IdeaFilters = {},
    sort: SortOptions = { sortBy: 'votes', sortOrder: 'desc' },
    page: number = 1,
    limit: number = 20
  ): Promise<IdeasResponse> {
    const params = new URLSearchParams();
    
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    params.append('sortBy', sort.sortBy);
    params.append('sortOrder', sort.sortOrder);

    if (filters.tags && filters.tags.length > 0) {
      filters.tags.forEach(tag => params.append('tags', tag));
    }

    if (filters.search) {
      params.append('search', filters.search);
    }

    if (filters.authorId) {
      params.append('authorId', filters.authorId.toString());
    }

    const response = await apiClient.get(`/ideas?${params.toString()}`);
    return response.data.data;
  }

  static async getIdeaById(id: number): Promise<Idea> {
    const response = await apiClient.get(`/ideas/${id}`);
    return response.data.data.idea;
  }

  static async createIdea(data: CreateIdeaData): Promise<Idea> {
    const response = await apiClient.post('/ideas', data);
    return response.data.data.idea;
  }

  static async updateIdea(id: number, data: Partial<CreateIdeaData>): Promise<Idea> {
    const response = await apiClient.put(`/ideas/${id}`, data);
    return response.data.data.idea;
  }

  static async deleteIdea(id: number): Promise<void> {
    await apiClient.delete(`/ideas/${id}`);
  }

  static async getIdeasByUser(
    userId: number,
    sort: SortOptions = { sortBy: 'date', sortOrder: 'desc' },
    page: number = 1,
    limit: number = 20
  ): Promise<IdeasResponse> {
    const params = new URLSearchParams();
    
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    params.append('sortBy', sort.sortBy);
    params.append('sortOrder', sort.sortOrder);

    const response = await apiClient.get(`/ideas/user/${userId}?${params.toString()}`);
    return response.data.data;
  }

  static async getTags(): Promise<Tag[]> {
    const response = await apiClient.get('/config/tags');
    return response.data.data.tags;
  }
}