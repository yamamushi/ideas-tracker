export interface User {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface Idea {
  id: number;
  title: string;
  description: string;
  authorId: number;
  author?: User;
  tags: string[];
  voteCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
}

export interface CreateIdeaData {
  title: string;
  description: string;
  tags: string[];
}

export interface IdeaFilters {
  tags?: string[];
  search?: string;
  authorId?: number;
}

export interface SortOptions {
  sortBy: 'votes' | 'date' | 'alphabetical';
  sortOrder: 'asc' | 'desc';
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IdeasResponse {
  ideas: Idea[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface VoteStats {
  upvotes: number;
  downvotes: number;
  total: number;
  userVote?: 'upvote' | 'downvote' | null;
}

export interface Comment {
  id: number;
  content: string;
  authorId: number;
  author?: User;
  ideaId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentData {
  content: string;
}

export interface CommentsResponse {
  comments: Comment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}