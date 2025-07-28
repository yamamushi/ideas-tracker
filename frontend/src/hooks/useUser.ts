import { useQuery } from '@tanstack/react-query';
import { UserService } from '../services/userService';

export function useUser(userId: number) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => UserService.getUserById(userId),
    enabled: !!userId && userId > 0,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}