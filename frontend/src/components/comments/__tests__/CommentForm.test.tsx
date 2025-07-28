import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { CommentForm } from '../CommentForm';
import { AuthProvider } from '../../../contexts/AuthContext';

// Mock the auth context first
const mockUseAuth = vi.fn();

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock data
const mockAuthContext = {
  user: { id: 1, username: 'testuser', email: 'test@example.com', isAdmin: false },
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  loading: false,
  error: null
};

const mockOnSubmit = vi.fn();

const renderCommentForm = () => {
  mockUseAuth.mockReturnValue(mockAuthContext);
  return render(
    <AuthProvider>
      <CommentForm onSubmit={mockOnSubmit} />
    </AuthProvider>
  );
};

describe('CommentForm', () => {
  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders comment form for authenticated users', () => {
    renderCommentForm();
    expect(screen.getByPlaceholderText('Share your thoughts...')).toBeInTheDocument();
    expect(screen.getByText('Post Comment')).toBeInTheDocument();
    expect(screen.getByText('Commenting as')).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('shows login prompt for unauthenticated users', () => {
    // Mock unauthenticated state
    mockUseAuth.mockReturnValue({
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      loading: false,
      error: null
    });

    render(
      <AuthProvider>
        <CommentForm onSubmit={mockOnSubmit} />
      </AuthProvider>
    );

    expect(screen.getByText(/Please/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'log in' })).toBeInTheDocument();
    expect(screen.getByText(/to leave a comment\./)).toBeInTheDocument();
  });

  it('submits comment when form is filled and submitted', async () => {
    mockOnSubmit.mockResolvedValue(undefined);
    renderCommentForm();

    const textarea = screen.getByPlaceholderText('Share your thoughts...');
    const submitButton = screen.getByText('Post Comment');

    fireEvent.change(textarea, { target: { value: 'Test comment content' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({ content: 'Test comment content' });
    });
  });

  it('prevents submission of empty comments', () => {
    renderCommentForm();

    const submitButton = screen.getByRole('button', { name: /post comment/i });
    expect(submitButton).toBeDisabled();

    const textarea = screen.getByPlaceholderText('Share your thoughts...');
    fireEvent.change(textarea, { target: { value: '   ' } }); // Only whitespace

    expect(submitButton).toBeDisabled();
  });

  it('clears form after successful submission', async () => {
    mockOnSubmit.mockResolvedValue(undefined);
    renderCommentForm();

    const textarea = screen.getByPlaceholderText('Share your thoughts...');
    fireEvent.change(textarea, { target: { value: 'Test comment' } });
    fireEvent.click(screen.getByText('Post Comment'));

    await waitFor(() => {
      expect(textarea).toHaveValue('');
    });
  });
});