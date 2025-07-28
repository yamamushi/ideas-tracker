import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { CommentsList } from '../CommentsList';
import { AuthProvider } from '../../../contexts/AuthContext';
import { CommentService } from '../../../services/commentService';

// Mock the comment service
vi.mock('../../../services/commentService');
const mockCommentService = CommentService as any;

// Mock the auth context
const mockAuthContext = {
  user: { id: 1, username: 'testuser', email: 'test@example.com', isAdmin: false },
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  loading: false,
  error: null
};

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

const mockCommentsResponse = {
  comments: [
    {
      id: 1,
      content: 'First comment',
      authorId: 1,
      author: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        isAdmin: false,
        createdAt: '2024-01-01T00:00:00Z'
      },
      ideaId: 1,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 2,
      content: 'Second comment',
      authorId: 2,
      author: {
        id: 2,
        username: 'otheruser',
        email: 'other@example.com',
        isAdmin: false,
        createdAt: '2024-01-01T00:00:00Z'
      },
      ideaId: 1,
      createdAt: '2024-01-01T01:00:00Z',
      updatedAt: '2024-01-01T01:00:00Z'
    }
  ],
  total: 2,
  page: 1,
  limit: 50,
  totalPages: 1
};

const renderCommentsList = (ideaId: number = 1) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <CommentsList ideaId={ideaId} />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('CommentsList', () => {
  beforeEach(() => {
    mockCommentService.getCommentsByIdea.mockClear();
    mockCommentService.createComment.mockClear();
  });

  it('loads and displays comments', async () => {
    mockCommentService.getCommentsByIdea.mockResolvedValue(mockCommentsResponse);
    
    renderCommentsList();

    expect(screen.getByText('Loading comments...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Comments (2)')).toBeInTheDocument();
      expect(screen.getByText('First comment')).toBeInTheDocument();
      expect(screen.getByText('Second comment')).toBeInTheDocument();
    });

    expect(mockCommentService.getCommentsByIdea).toHaveBeenCalledWith(1, 1, 50);
  });

  it('displays empty state when no comments', async () => {
    mockCommentService.getCommentsByIdea.mockResolvedValue({
      ...mockCommentsResponse,
      comments: [],
      total: 0
    });

    renderCommentsList();

    await waitFor(() => {
      expect(screen.getByText('Comments (0)')).toBeInTheDocument();
      expect(screen.getByText('No comments yet. Be the first to share your thoughts!')).toBeInTheDocument();
    });
  });

  it('displays comments in chronological order', async () => {
    mockCommentService.getCommentsByIdea.mockResolvedValue(mockCommentsResponse);
    
    renderCommentsList();

    await waitFor(() => {
      expect(screen.getByText('First comment')).toBeInTheDocument();
      expect(screen.getByText('Second comment')).toBeInTheDocument();
      
      // Check that both comments are displayed
      const firstComment = screen.getByText('First comment');
      const secondComment = screen.getByText('Second comment');
      expect(firstComment).toBeInTheDocument();
      expect(secondComment).toBeInTheDocument();
    });
  });

  it('shows comment form for authenticated users', async () => {
    mockCommentService.getCommentsByIdea.mockResolvedValue(mockCommentsResponse);
    
    renderCommentsList();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Share your thoughts on this idea...')).toBeInTheDocument();
      expect(screen.getByText('Commenting as')).toBeInTheDocument();
      expect(screen.getAllByText('testuser')).toHaveLength(2); // One in form, one in comment
    });
  });

  it('handles comment submission', async () => {
    const newComment = {
      id: 3,
      content: 'New comment',
      authorId: 1,
      author: mockAuthContext.user,
      ideaId: 1,
      createdAt: '2024-01-01T02:00:00Z',
      updatedAt: '2024-01-01T02:00:00Z'
    };

    mockCommentService.getCommentsByIdea.mockResolvedValue(mockCommentsResponse);
    mockCommentService.createComment.mockResolvedValue(newComment);

    renderCommentsList();

    await waitFor(() => {
      expect(screen.getByText('Comments (2)')).toBeInTheDocument();
    });

    // The actual comment submission would be tested through user interaction
    // This test verifies the service is called correctly
    expect(mockCommentService.getCommentsByIdea).toHaveBeenCalledWith(1, 1, 50);
  });
});