import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../contexts/AuthContext';
import { VoteButtons } from '../../components/ideas/VoteButtons';
import { VoteService } from '../../services/voteService';
import { VoteStats } from '../../types/idea';

// Mock the vote service
vi.mock('../../services/voteService');
const mockVoteService = vi.mocked(VoteService);

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
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

describe('Voting System Integration Tests', () => {
  const mockIdeaId = 1;
  const initialStats: VoteStats = {
    upvotes: 5,
    downvotes: 2,
    total: 3,
    userVote: null
  };

  beforeEach(() => {
    mockVoteService.castVote.mockClear();
    mockVoteService.removeVote.mockClear();
    mockVoteService.switchVote.mockClear();
    mockVoteService.getVoteStats.mockClear();
  });

  it('should cast an upvote when upvote button is clicked', async () => {
    const updatedStats: VoteStats = {
      upvotes: 6,
      downvotes: 2,
      total: 4,
      userVote: 'upvote'
    };

    mockVoteService.castVote.mockResolvedValue({ stats: updatedStats });

    const mockOnVoteChange = vi.fn();

    renderWithProviders(
      <VoteButtons
        ideaId={mockIdeaId}
        initialStats={initialStats}
        onVoteChange={mockOnVoteChange}
      />
    );

    // Click the upvote button
    const upvoteButton = screen.getByTitle('Upvote');
    fireEvent.click(upvoteButton);

    // Wait for the vote service to be called
    await waitFor(() => {
      expect(mockVoteService.castVote).toHaveBeenCalledWith(mockIdeaId, 'upvote');
    });

    // Check that the vote change callback was called
    expect(mockOnVoteChange).toHaveBeenCalledWith(updatedStats);
  });

  it('should cast a downvote when downvote button is clicked', async () => {
    const updatedStats: VoteStats = {
      upvotes: 5,
      downvotes: 3,
      total: 2,
      userVote: 'downvote'
    };

    mockVoteService.castVote.mockResolvedValue({ stats: updatedStats });

    const mockOnVoteChange = vi.fn();

    renderWithProviders(
      <VoteButtons
        ideaId={mockIdeaId}
        initialStats={initialStats}
        onVoteChange={mockOnVoteChange}
      />
    );

    // Click the downvote button
    const downvoteButton = screen.getByTitle('Downvote');
    fireEvent.click(downvoteButton);

    // Wait for the vote service to be called
    await waitFor(() => {
      expect(mockVoteService.castVote).toHaveBeenCalledWith(mockIdeaId, 'downvote');
    });

    // Check that the vote change callback was called
    expect(mockOnVoteChange).toHaveBeenCalledWith(updatedStats);
  });

  it('should remove vote when clicking the same vote button twice', async () => {
    const initialStatsWithVote: VoteStats = {
      upvotes: 6,
      downvotes: 2,
      total: 4,
      userVote: 'upvote'
    };

    const updatedStats: VoteStats = {
      upvotes: 5,
      downvotes: 2,
      total: 3,
      userVote: null
    };

    mockVoteService.removeVote.mockResolvedValue({ stats: updatedStats });

    const mockOnVoteChange = vi.fn();

    renderWithProviders(
      <VoteButtons
        ideaId={mockIdeaId}
        initialStats={initialStatsWithVote}
        onVoteChange={mockOnVoteChange}
      />
    );

    // Click the upvote button (which is already active, so it should show "Remove upvote")
    const upvoteButton = screen.getByTitle('Remove upvote');
    fireEvent.click(upvoteButton);

    // Wait for the remove vote service to be called
    await waitFor(() => {
      expect(mockVoteService.removeVote).toHaveBeenCalledWith(mockIdeaId);
    });

    // Check that the vote change callback was called
    expect(mockOnVoteChange).toHaveBeenCalledWith(updatedStats);
  });

  it('should switch from upvote to downvote', async () => {
    const initialStatsWithUpvote: VoteStats = {
      upvotes: 6,
      downvotes: 2,
      total: 4,
      userVote: 'upvote'
    };

    const updatedStats: VoteStats = {
      upvotes: 5,
      downvotes: 3,
      total: 2,
      userVote: 'downvote'
    };

    mockVoteService.switchVote.mockResolvedValue({ stats: updatedStats });

    const mockOnVoteChange = vi.fn();

    renderWithProviders(
      <VoteButtons
        ideaId={mockIdeaId}
        initialStats={initialStatsWithUpvote}
        onVoteChange={mockOnVoteChange}
      />
    );

    // Click the downvote button (switching from upvote)
    const downvoteButton = screen.getByTitle('Downvote');
    fireEvent.click(downvoteButton);

    // Wait for the vote service to be called (should be switchVote, not castVote)
    await waitFor(() => {
      expect(mockVoteService.switchVote).toHaveBeenCalledWith(mockIdeaId);
    });

    // Check that the vote change callback was called
    expect(mockOnVoteChange).toHaveBeenCalledWith(updatedStats);
  });

  it('should handle voting errors gracefully', async () => {
    mockVoteService.castVote.mockRejectedValue(new Error('Network error'));

    const mockOnVoteChange = vi.fn();

    renderWithProviders(
      <VoteButtons
        ideaId={mockIdeaId}
        initialStats={initialStats}
        onVoteChange={mockOnVoteChange}
      />
    );

    // Click the upvote button
    const upvoteButton = screen.getByTitle('Upvote');
    fireEvent.click(upvoteButton);

    // Wait for the error to be handled
    await waitFor(() => {
      expect(mockVoteService.castVote).toHaveBeenCalledWith(mockIdeaId, 'upvote');
    });

    // Check that the vote change callback was not called due to error
    expect(mockOnVoteChange).not.toHaveBeenCalled();
  });

  it('should disable voting buttons while vote is in progress', async () => {
    // Create a promise that we can control
    let resolveVote: (value: VoteStats) => void;
    const votePromise = new Promise<VoteStats>((resolve) => {
      resolveVote = resolve;
    });

    mockVoteService.castVote.mockReturnValue(votePromise);

    const mockOnVoteChange = vi.fn();

    renderWithProviders(
      <VoteButtons
        ideaId={mockIdeaId}
        initialStats={initialStats}
        onVoteChange={mockOnVoteChange}
      />
    );

    // Click the upvote button
    const upvoteButton = screen.getByTitle('Upvote');
    const downvoteButton = screen.getByTitle('Downvote');
    
    fireEvent.click(upvoteButton);

    // Check that buttons are disabled during voting
    await waitFor(() => {
      expect(upvoteButton).toBeDisabled();
      expect(downvoteButton).toBeDisabled();
    });

    // Resolve the vote
    resolveVote!({
      upvotes: 6,
      downvotes: 2,
      total: 4,
      userVote: 'upvote'
    });

    // Wait for buttons to be re-enabled
    await waitFor(() => {
      expect(upvoteButton).not.toBeDisabled();
      expect(downvoteButton).not.toBeDisabled();
    });
  });

  it('should display correct vote counts', () => {
    const mockOnVoteChange = vi.fn();

    renderWithProviders(
      <VoteButtons
        ideaId={mockIdeaId}
        initialStats={initialStats}
        onVoteChange={mockOnVoteChange}
      />
    );

    // Check that the total vote count is displayed correctly
    expect(screen.getByText('3')).toBeInTheDocument(); // total (upvotes - downvotes = 5 - 2 = 3)
  });
});