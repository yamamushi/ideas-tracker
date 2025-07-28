import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IdeaService } from '../services/ideaService';
import { IdeaFilters, SortOptions, Idea, CreateIdeaData } from '../types/idea';
import toast from 'react-hot-toast';

export function useIdeas(
  filters: IdeaFilters = {},
  sortOptions: SortOptions = { sortBy: 'votes', sortOrder: 'desc' },
  limit: number = 20
) {
  return useInfiniteQuery({
    queryKey: ['ideas', filters, sortOptions, limit],
    queryFn: ({ pageParam = 1 }) =>
      IdeaService.getIdeas(filters, sortOptions, pageParam, limit),
    getNextPageParam: (lastPage) => {
      return lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useIdea(id: number) {
  return useQuery({
    queryKey: ['idea', id],
    queryFn: () => IdeaService.getIdeaById(id),
    enabled: !!id,
  });
}

export function useCreateIdea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateIdeaData) => IdeaService.createIdea(data),
    onSuccess: (newIdea) => {
      // Invalidate and refetch ideas list
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      toast.success('Idea created successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to create idea';
      toast.error(message);
    },
  });
}

export function useUpdateIdea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateIdeaData> }) =>
      IdeaService.updateIdea(id, data),
    onSuccess: (updatedIdea) => {
      // Update the specific idea in cache
      queryClient.setQueryData(['idea', updatedIdea.id], updatedIdea);
      
      // Invalidate ideas list to reflect changes
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      
      toast.success('Idea updated successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to update idea';
      toast.error(message);
    },
  });
}

export function useDeleteIdea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => IdeaService.deleteIdea(id),
    onSuccess: () => {
      // Invalidate ideas list to remove deleted idea
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      toast.success('Idea deleted successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to delete idea';
      toast.error(message);
    },
  });
}

export function useUserIdeas(
  userId: number,
  sortOptions: SortOptions = { sortBy: 'date', sortOrder: 'desc' },
  limit: number = 20
) {
  return useInfiniteQuery({
    queryKey: ['userIdeas', userId, sortOptions, limit],
    queryFn: ({ pageParam = 1 }) =>
      IdeaService.getIdeasByUser(userId, sortOptions, pageParam, limit),
    getNextPageParam: (lastPage) => {
      return lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}