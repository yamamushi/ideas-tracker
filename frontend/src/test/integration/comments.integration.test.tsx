import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../contexts/AuthContext';
import { CommentsList } from '../../components/comments/CommentsList';
import { CommentService } from '../../services/commentService';
import { Comment, CommentsResponse } from '../../types/idea';

// Mock the comment service
vi.mock('../../services/commentService');
const mockCommentService = CommentService as any;

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock auth context
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      isAdmin: false,
      createdAt: '2024-01-01T00:00:00Z'
    },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    loading: false,
    error: null
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock auth return value is now inline in the mock above

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {component}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Comments System Integration Tests', () => {
  const mockIdeaId = 1;
  
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    isAdmin: false,
    createdAt: '2024-01-01T00:00:00Z'
  };
  
  const mockComments: Comment[] = [
    {
      id: 1,
      content: 'First comment',
      authorId: 1,
      author: mockUser,
      ideaId: mockIdeaId,
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z'
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
      ideaId: mockIdeaId,
      createdAt: '2024-01-01T11:00:00Z',
      updatedAt: '2024-01-01T11:00:00Z'
    }
  ];

  const mockCommentsResponse: CommentsResponse = {
    comments: mockComments,
    total: 2,
    page: 1,
    limit: 50,
    totalPages: 1
  };

  beforeEach(() => {
    mockCommentService.getCommentsByIdea.mockClear();
    mockCommentService.createComment.mockClear();
    mockCommentService.updateComment.mockClear();
    mockCommentService.deleteComment.mockClear();
  });

  it('should load and display comments in chronological order', async () => {
    mockCommentService.getCommentsByIdea.mockResolvedValue(mockCommentsResponse);

    renderWithProviders(<CommentsList ideaId={mockIdeaId} />);

    // Wait for comments to load
    await waitFor(() => {
      expect(screen.getByText('Comments (2)')).toBeInTheDocument();
    });

    // Check that comments are displayed
    expect(screen.getByText('First comment')).toBeInTheDocument();
    expect(screen.getByText('Second comment')).toBeInTheDocument();

    // Check that service was called correctly
    expect(mockCommentService.getCommentsByIdea).toHaveBeenCalledWith(mockIdeaId, 1, 50);
  });

  it('should submit a new comment successfully', async () => {
    const newComment: Comment = {
      id: 3,
      content: 'New test comment',
      authorId: mockUser.id,
      author: mockUser,
      ideaId: mockIdeaId,
      createdAt: '2024-01-01T12:00:00Z',
      updatedAt: '2024-01-01T12:00:00Z'
    };

    mockCommentService.getCommentsByIdea.mockResolvedValue(mockCommentsResponse);
    mockCommentService.createComment.mockResolvedValue(newComment);

    renderWithProviders(<CommentsList ideaId={mockIdeaId} />);

    // Wait for initial comments to load
    await waitFor(() => {
      expect(screen.getByText('Comments (2)')).toBeInTheDocument();
    });

    // Find and fill the comment form
    const commentTextarea = screen.getByPlaceholderText('Share your thoughts on this idea...');
    fireEvent.change(commentTextarea, { target: { value: 'New test comment' } });

    // Submit the comment
    const submitButton = screen.getByRole('button', { name: /post comment/i });
    fireEvent.click(submitButton);

    // Wait for the comment to be submitted
    await waitFor(() => {
      expect(mockCommentService.createComment).toHaveBeenCalledWith(mockIdeaId, {
        content: 'New test comment'
      });
    });

    // Check that the new comment appears in the list
    expect(screen.getByText('New test comment')).toBeInTheDocument();
  });

  it('should edit a comment successfully', async () => {
    mockCommentService.getCommentsByIdea.mockResolvedValue(mockCommentsResponse);
    
    const updatedComment: Comment = {
      ...mockComments[0],
      content: 'Updated first comment',
      updatedAt: '2024-01-01T13:00:00Z'
    };
    
    mockCommentService.updateComment.mockResolvedValue(updatedComment);

    renderWithProviders(<CommentsList ideaId={mockIdeaId} />);

    // Wait for comments to load
    await waitFor(() => {
      expect(screen.getByText('First comment')).toBeInTheDocument();
    });

    // Click edit button on the first comment (user's own comment)
    const editButton = screen.getByTitle('Edit comment');
    fireEvent.click(editButton);

    // Find the edit textarea and update content
    const editTextarea = screen.getByDisplayValue('First comment');
    fireEvent.change(editTextarea, { target: { value: 'Updated first comment' } });

    // Save the edit
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    // Wait for the update to be processed
    await waitFor(() => {
      expect(mockCommentService.updateComment).toHaveBeenCalledWith(1, {
        content: 'Updated first comment'
      });
    });

    // Check that the updated comment is displayed
    expect(screen.getByText('Updated first comment')).toBeInTheDocument();
  });

  it('should delete a comment successfully', async () => {
    mockCommentService.getCommentsByIdea.mockResolvedValue(mockCommentsResponse);
    mockCommentService.deleteComment.mockResolvedValue(undefined);

    // Mock window.confirm to return true
    const mockConfirm = vi.fn(() => true);
    Object.defineProperty(window, 'confirm', { value: mockConfirm });

    renderWithProviders(<CommentsList ideaId={mockIdeaId} />);

    // Wait for comments to load
    await waitFor(() => {
      expect(screen.getByText('First comment')).toBeInTheDocument();
    });

    // Click delete button on the first comment (user's own comment)
    const deleteButton = screen.getByTitle('Delete comment');
    fireEvent.click(deleteButton);

    // Wait for the delete confirmation and service call
    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled();
      expect(mockCommentService.deleteComment).toHaveBeenCalledWith(1);
    });

    // Check that the comment is removed from the list
    expect(screen.queryByText('First comment')).not.toBeInTheDocument();
  });

  it('should show empty state when no comments exist', async () => {
    const emptyResponse: CommentsResponse = {
      comments: [],
      total: 0,
      page: 1,
      limit: 50,
      totalPages: 0
    };

    mockCommentService.getCommentsByIdea.mockResolvedValue(emptyResponse);

    renderWithProviders(<CommentsList ideaId={mockIdeaId} />);

    // Wait for the empty state to be displayed
    await waitFor(() => {
      expect(screen.getByText('Comments (0)')).toBeInTheDocument();
      expect(screen.getByText('No comments yet. Be the first to share your thoughts!')).toBeInTheDocument();
    });
  });

  it('should handle comment loading errors', async () => {
    mockCommentService.getCommentsByIdea.mockRejectedValue(new Error('Failed to load comments'));

    renderWithProviders(<CommentsList ideaId={mockIdeaId} />);

    // Wait for the error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to load comments')).toBeInTheDocument();
    });
  });

  it('should validate comment form input', async () => {
    mockCommentService.getCommentsByIdea.mockResolvedValue(mockCommentsResponse);

    renderWithProviders(<CommentsList ideaId={mockIdeaId} />);

    // Wait for comments to load
    await waitFor(() => {
      expect(screen.getByText('Comments (2)')).toBeInTheDocument();
    });

    // Try to submit empty comment
    const submitButton = screen.getByRole('button', { name: /post comment/i });
    expect(submitButton).toBeDisabled();

    // Add whitespace only
    const commentTextarea = screen.getByPlaceholderText('Share your thoughts on this idea...');
    fireEvent.change(commentTextarea, { target: { value: '   ' } });
    
    // Button should still be disabled
    expect(submitButton).toBeDisabled();

    // Add actual content
    fireEvent.change(commentTextarea, { target: { value: 'Valid comment' } });
    
    // Button should now be enabled
    expect(submitButton).not.toBeDisabled();
  });


});