import { apiClient } from '../utils/api';
import { User } from '../types/idea';

export class UserService {
  static async getUserById(id: number): Promise<User> {
    const response = await apiClient.get(`/users/${id}`);
    return response.data.data.user;
  }

  static async updateUser(id: number, data: Partial<User>): Promise<User> {
    const response = await apiClient.put(`/users/${id}`, data);
    return response.data.data.user;
  }

  static async getCurrentUser(): Promise<User> {
    const response = await apiClient.get('/users/me');
    return response.data.data.user;
  }
}