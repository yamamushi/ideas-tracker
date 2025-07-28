import React from 'react';
import { AlertCircle } from 'lucide-react';
import clsx from 'clsx';

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'textarea';
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: () => void;
  error?: string;
  hasError?: boolean;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  className?: string;
  helpText?: string;
}

export function FormField({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  hasError = false,
  required = false,
  disabled = false,
  rows = 3,
  className,
  helpText
}: FormFieldProps) {
  const inputId = `field-${name}`;
  const errorId = `${inputId}-error`;
  const helpId = `${inputId}-help`;

  const baseInputClasses = clsx(
    'w-full px-3 py-2 bg-gray-900 border rounded-lg text-white placeholder-gray-400',
    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
    'disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
    {
      'border-gray-600': !hasError,
      'border-error-500 focus:ring-error-500': hasError,
    }
  );

  return (
    <div className={clsx('space-y-2', className)}>
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-300">
        {label}
        {required && <span className="text-error-400 ml-1">*</span>}
      </label>

      {type === 'textarea' ? (
        <textarea
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className={clsx(baseInputClasses, 'resize-none')}
          aria-describedby={clsx(
            error && errorId,
            helpText && helpId
          )}
          aria-invalid={hasError}
        />
      ) : (
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={baseInputClasses}
          aria-describedby={clsx(
            error && errorId,
            helpText && helpId
          )}
          aria-invalid={hasError}
        />
      )}

      {error && (
        <div id={errorId} className="flex items-center space-x-2 text-error-400 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {helpText && !error && (
        <p id={helpId} className="text-gray-500 text-sm">
          {helpText}
        </p>
      )}
    </div>
  );
}