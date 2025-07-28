import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { DeleteButton } from '../DeleteButton';
import { AuthProvider } from '../../../contexts/AuthContext';

// Mock the auth context first
const mockUseAuth = vi.fn();

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock data
const mockAdminUser = {
  id: 1,
  username: 'admin',
  email: 'admin@example.com',
  isAdmin: true
};

const mockRegularUser = {
  id: 2,
  username: 'user',
  email: 'user@example.com',
  isAdmin: false
};

const mockAuthContextAdmin = {
  user: mockAdminUser,
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  loading: false,
  error: null
};

const mockAuthContextUser = {
  user: mockRegularUser,
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  loading: false,
  error: null
};

// Mock window.confirm
const mockConfirm = vi.fn();
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true
});

const mockOnDelete = vi.fn();

const renderDeleteButton = (authContext = mockAuthContextAdmin, props = {}) => {
  mockUseAuth.mockReturnValue(authContext);
  
  return render(
    <AuthProvider>
      <DeleteButton
        onDelete={mockOnDelete}
        itemType="idea"
        itemTitle="Test Idea"
        {...props}
      />
    </AuthProvider>
  );
};

describe('DeleteButton', () => {
  beforeEach(() => {
    mockOnDelete.mockClear();
    mockConfirm.mockClear();
  });

  it('renders delete button for admin users', () => {
    renderDeleteButton();
    expect(screen.getByTitle('Delete idea')).toBeInTheDocument();
  });

  it('does not render for non-admin users', () => {
    renderDeleteButton(mockAuthContextUser);
    expect(screen.queryByTitle('Delete idea')).not.toBeInTheDocument();
  });

  it('shows confirmation dialog when clicked', () => {
    mockConfirm.mockReturnValue(false);
    renderDeleteButton();
    
    fireEvent.click(screen.getByTitle('Delete idea'));
    expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete this idea: "Test Idea"?');
  });

  it('calls onDelete when confirmed', async () => {
    mockConfirm.mockReturnValue(true);
    mockOnDelete.mockResolvedValue(undefined);
    
    renderDeleteButton();
    
    fireEvent.click(screen.getByTitle('Delete idea'));
    
    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalled();
    });
  });

  it('does not call onDelete when cancelled', () => {
    mockConfirm.mockReturnValue(false);
    renderDeleteButton();
    
    fireEvent.click(screen.getByTitle('Delete idea'));
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it('shows loading state during deletion', async () => {
    mockConfirm.mockReturnValue(true);
    mockOnDelete.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    renderDeleteButton();
    
    fireEvent.click(screen.getByTitle('Delete idea'));
    
    // Check for loading state (pulse animation on icon)
    const icon = screen.getByTitle('Delete idea').querySelector('svg');
    expect(icon).toHaveClass('animate-pulse');
  });

  it('renders as button variant when specified', () => {
    renderDeleteButton(mockAuthContextAdmin, { variant: 'button' });
    expect(screen.getByText('Delete idea')).toBeInTheDocument();
  });

  it('handles different item types', () => {
    renderDeleteButton(mockAuthContextAdmin, { itemType: 'comment' });
    expect(screen.getByTitle('Delete comment')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    renderDeleteButton(mockAuthContextAdmin, { disabled: true });
    const button = screen.getByTitle('Delete idea');
    expect(button).toBeDisabled();
  });
});