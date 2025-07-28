import toast from 'react-hot-toast';

export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: any;
}

export class NetworkError extends Error implements ApiError {
  status?: number;
  code?: string;
  details?: any;

  constructor(message: string, status?: number, code?: string, details?: any) {
    super(message);
    this.name = 'NetworkError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends Error implements ApiError {
  details?: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export function createApiError(error: any): ApiError {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    const message = data?.message || data?.error || `HTTP ${status} Error`;
    const code = data?.code;
    const details = data?.details || data?.errors;
    
    return new NetworkError(message, status, code, details);
  } else if (error.request) {
    // Network error (no response received)
    return new NetworkError(
      'Network error. Please check your connection and try again.',
      0,
      'NETWORK_ERROR'
    );
  } else {
    // Other error
    return new NetworkError(error.message || 'An unexpected error occurred');
  }
}

export function handleApiError(error: any, showToast: boolean = true): ApiError {
  const apiError = createApiError(error);
  
  if (showToast) {
    // Don't show toast for validation errors (handled by forms)
    if (!(apiError instanceof ValidationError)) {
      toast.error(apiError.message);
    }
  }
  
  // Log error for debugging
  console.error('API Error:', apiError);
  
  return apiError;
}

export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  backoff: number = 2
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors (4xx) except for 408, 429
      if (error instanceof NetworkError && error.status) {
        const status = error.status;
        if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
          throw error;
        }
      }
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retrying with exponential backoff
      const waitTime = delay * Math.pow(backoff, attempt);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError!;
}

export function isNetworkError(error: any): boolean {
  return error instanceof NetworkError || 
         (error.code === 'NETWORK_ERROR') ||
         (error.message && error.message.includes('Network Error'));
}

export function isValidationError(error: any): boolean {
  return error instanceof ValidationError ||
         (error.status >= 400 && error.status < 500) ||
         (error.code && error.code.includes('VALIDATION'));
}

export function getErrorMessage(error: any): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}

export function getValidationErrors(error: ApiError): Record<string, string[]> {
  if (error.details && Array.isArray(error.details)) {
    // Express-validator format
    const errors: Record<string, string[]> = {};
    error.details.forEach((detail: any) => {
      const field = detail.path || detail.param || 'general';
      if (!errors[field]) {
        errors[field] = [];
      }
      errors[field].push(detail.msg || detail.message);
    });
    return errors;
  }
  
  if (error.details && typeof error.details === 'object') {
    // Custom validation format
    return error.details;
  }
  
  return {};
}