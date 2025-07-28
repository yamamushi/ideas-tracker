import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { Comment } from '../Comment';
import { AuthProvider } from '../../../contexts/AuthContext';
import { Comment as CommentType } from '../../../types/idea';

// Mock the auth context
const mockAuthContext = {
  user: { id: 1, username: 'testuser', email: 'test@example.com', isAdmin: false },
  login: vi.fn(),
  logout: vi.fn(),
  loading: false,
  error: null
};

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

const mockComment: CommentType = {
  id: 1,
  content: 'This is a test comment',
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
};

const renderComment = (comment: CommentType = mockComment, props = {}) => {
  const defaultProps = {
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    ...props
  };

  return render(
    <BrowserRouter>
      <AuthProvider>
        <Comment comment={comment} {...defaultProps} />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Comment', () => {
  it('renders comment content', () => {
    renderComment();
    expect(screen.getByText('This is a test comment')).toBeInTheDocument();
  });

  it('renders author username', () => {
    renderComment();
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('shows edit and delete buttons for comment author', () => {
    renderComment();
    expect(screen.getByTitle('Edit comment')).toBeInTheDocument();
    expect(screen.getByTitle('Delete comment')).toBeInTheDocument();
  });

  it('does not show edit/delete buttons for other users', () => {
    const otherUserComment = {
      ...mockComment,
      authorId: 2,
      author: {
        id: 2,
        username: 'otheruser',
        email: 'other@example.com',
        isAdmin: false,
        createdAt: '2024-01-01T00:00:00Z'
      }
    };
    
    renderComment(otherUserComment);
    expect(screen.queryByTitle('Edit comment')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Delete comment')).not.toBeInTheDocument();
  });
});