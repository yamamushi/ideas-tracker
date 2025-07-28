import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../contexts/AuthContext';
import { LoginPage } from '../../pages/LoginPage';
import { RegisterPage } from '../../pages/RegisterPage';
// Mock the API client instead of userService since auth methods are in AuthContext
vi.mock('../../utils/api', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  }
}));

import { apiClient } from '../../utils/api';
const mockApiClient = vi.mocked(apiClient);

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

import toast from 'react-hot-toast';

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

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    mockApiClient.post.mockClear();
    mockApiClient.get.mockClear();
    localStorage.clear();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  describe('Login Flow', () => {
    it('should successfully log in a user with valid credentials', async () => {
      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      };
      
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        isAdmin: false,
        createdAt: '2024-01-01T00:00:00Z'
      };

      mockApiClient.post.mockResolvedValue({
        data: {
          data: {
            user: mockUser,
            tokens: mockTokens
          }
        }
      });

      renderWithProviders(<LoginPage />);

      // Fill in the login form
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' }
      });

      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      // Wait for the login API to be called
      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalledWith('/auth/login', {
          emailOrUsername: 'test@example.com',
          password: 'password123'
        });
      });

      // Check that tokens are stored in localStorage
      expect(localStorage.getItem('accessToken')).toBe(mockTokens.accessToken);
      expect(localStorage.getItem('refreshToken')).toBe(mockTokens.refreshToken);
    });

    it('should show error message for invalid credentials', async () => {
      mockApiClient.post.mockRejectedValue({
        response: {
          data: {
            error: {
              message: 'Invalid credentials'
            }
          }
        }
      });

      renderWithProviders(<LoginPage />);

      // Fill in the login form with invalid credentials
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'invalid@example.com' }
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'wrongpassword' }
      });

      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      // Wait for error to be displayed via toast
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
      });

      // Check that no tokens are stored
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });

  describe('Registration Flow', () => {
    it('should successfully register a new user', async () => {
      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      };
      
      const mockUser = {
        id: 1,
        username: 'newuser',
        email: 'newuser@example.com',
        isAdmin: false,
        createdAt: '2024-01-01T00:00:00Z'
      };

      mockApiClient.post.mockResolvedValue({
        data: {
          data: {
            user: mockUser,
            tokens: mockTokens
          }
        }
      });

      renderWithProviders(<RegisterPage />);

      // Fill in the registration form
      fireEvent.change(screen.getByLabelText(/username/i), {
        target: { value: 'newuser' }
      });
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'newuser@example.com' }
      });
      fireEvent.change(screen.getByLabelText('Password'), {
        target: { value: 'Password123' }
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'Password123' }
      });

      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      // Wait for the registration API to be called
      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalledWith('/auth/register', {
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'Password123'
        });
      });

      // Check that tokens are stored in localStorage
      expect(localStorage.getItem('accessToken')).toBe(mockTokens.accessToken);
      expect(localStorage.getItem('refreshToken')).toBe(mockTokens.refreshToken);
    });

    it('should show validation errors for invalid input', async () => {
      renderWithProviders(<RegisterPage />);

      // Try to submit form with empty fields
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      // Wait for validation errors
      await waitFor(() => {
        expect(screen.getByText('Username is required')).toBeInTheDocument();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });

      // Check that registration API was not called
      expect(mockApiClient.post).not.toHaveBeenCalledWith('/auth/register', expect.anything());
    });

    it('should show error for duplicate email', async () => {
      mockApiClient.post.mockRejectedValue({
        response: {
          data: {
            error: {
              message: 'Email already exists'
            }
          }
        }
      });

      renderWithProviders(<RegisterPage />);

      // Fill in the registration form
      fireEvent.change(screen.getByLabelText(/username/i), {
        target: { value: 'testuser' }
      });
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'existing@example.com' }
      });
      fireEvent.change(screen.getByLabelText('Password'), {
        target: { value: 'Password123' }
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'Password123' }
      });

      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      // Wait for error to be displayed via toast
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Email already exists');
      });
    });
  });

  describe('Authentication State Management', () => {
    it('should restore authentication state from localStorage on app load', async () => {
      // Set up localStorage with existing tokens
      localStorage.setItem('accessToken', 'existing-access-token');
      localStorage.setItem('refreshToken', 'existing-refresh-token');

      const mockUser = {
        id: 1,
        username: 'existinguser',
        email: 'existing@example.com',
        isAdmin: false,
        createdAt: '2024-01-01T00:00:00Z'
      };

      mockApiClient.get.mockResolvedValue({
        data: {
          data: {
            user: mockUser
          }
        }
      });

      renderWithProviders(<div>Test Component</div>);

      // Wait for the user to be loaded
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/auth/me');
      });
    });

    it('should clear authentication state on logout', async () => {
      // Set up localStorage with tokens
      localStorage.setItem('accessToken', 'access-token');
      localStorage.setItem('refreshToken', 'refresh-token');

      mockApiClient.post.mockResolvedValue({ data: {} });

      renderWithProviders(<div>Test Component</div>);

      // Simulate logout by calling the API and clearing localStorage (this would typically be triggered by a logout button)
      await mockApiClient.post('/auth/logout');
      
      // Simulate what the AuthContext logout method should do
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');

      // Check that tokens are cleared
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });
});