import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { FormField } from '../FormField';

const mockOnChange = vi.fn();
const mockOnBlur = vi.fn();

const renderFormField = (props = {}) => {
  const defaultProps = {
    label: 'Test Field',
    name: 'testField',
    value: '',
    onChange: mockOnChange,
    onBlur: mockOnBlur,
    ...props
  };

  return render(<FormField {...defaultProps} />);
};

describe('FormField', () => {
  beforeEach(() => {
    mockOnChange.mockClear();
    mockOnBlur.mockClear();
  });

  it('renders input field with label', () => {
    renderFormField();
    expect(screen.getByLabelText('Test Field')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('shows required indicator when required is true', () => {
    renderFormField({ required: true });
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('renders textarea when type is textarea', () => {
    renderFormField({ type: 'textarea' });
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    // Textarea should have the correct number of rows
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '3');
  });

  it('renders password input when type is password', () => {
    renderFormField({ type: 'password' });
    const input = screen.getByLabelText('Test Field');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('displays error message when error is provided', () => {
    renderFormField({ error: 'This field is required', hasError: true });
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('displays help text when provided and no error', () => {
    renderFormField({ helpText: 'This is help text' });
    expect(screen.getByText('This is help text')).toBeInTheDocument();
  });

  it('hides help text when error is present', () => {
    renderFormField({ 
      helpText: 'This is help text',
      error: 'This field is required',
      hasError: true
    });
    expect(screen.queryByText('This is help text')).not.toBeInTheDocument();
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('calls onChange when input value changes', () => {
    renderFormField();
    const input = screen.getByLabelText('Test Field');
    
    fireEvent.change(input, { target: { value: 'new value' } });
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('calls onBlur when input loses focus', () => {
    renderFormField();
    const input = screen.getByLabelText('Test Field');
    
    fireEvent.blur(input);
    expect(mockOnBlur).toHaveBeenCalled();
  });

  it('is disabled when disabled prop is true', () => {
    renderFormField({ disabled: true });
    const input = screen.getByLabelText('Test Field');
    expect(input).toBeDisabled();
  });

  it('has error styling when hasError is true', () => {
    renderFormField({ hasError: true });
    const input = screen.getByLabelText('Test Field');
    expect(input).toHaveClass('border-error-500');
  });

  it('has proper accessibility attributes', () => {
    renderFormField({ 
      error: 'Error message',
      hasError: true,
      helpText: 'Help text'
    });
    
    const input = screen.getByLabelText('Test Field');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby');
  });
});