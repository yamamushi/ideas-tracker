import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { ErrorMessage } from '../ErrorMessage';

const renderErrorMessage = (props = {}) => {
  const defaultProps = {
    message: 'Test error message',
    ...props
  };

  return render(
    <BrowserRouter>
      <ErrorMessage {...defaultProps} />
    </BrowserRouter>
  );
};

describe('ErrorMessage', () => {
  it('renders error message with default title', () => {
    renderErrorMessage();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('renders custom title when provided', () => {
    renderErrorMessage({ title: 'Custom Error Title' });
    expect(screen.getByText('Custom Error Title')).toBeInTheDocument();
  });

  it('shows retry button when onRetry is provided', () => {
    const mockRetry = vi.fn();
    renderErrorMessage({ onRetry: mockRetry });
    
    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(mockRetry).toHaveBeenCalled();
  });

  it('shows home link when showHomeLink is true', () => {
    renderErrorMessage({ showHomeLink: true });
    expect(screen.getByText('Go Home')).toBeInTheDocument();
  });

  it('renders inline variant correctly', () => {
    renderErrorMessage({ variant: 'inline' });
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    // Should not show the default title in inline variant
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('renders compact variant correctly', () => {
    renderErrorMessage({ variant: 'compact', title: 'Compact Error' });
    expect(screen.getByText('Compact Error')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('shows retry link in inline variant when onRetry provided', () => {
    const mockRetry = vi.fn();
    renderErrorMessage({ variant: 'inline', onRetry: mockRetry });
    
    const retryLink = screen.getByText('Retry');
    expect(retryLink).toBeInTheDocument();
    
    fireEvent.click(retryLink);
    expect(mockRetry).toHaveBeenCalled();
  });
});