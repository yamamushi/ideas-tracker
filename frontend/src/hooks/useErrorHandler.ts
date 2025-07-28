import { useCallback } from 'react';
import { ApiError, handleApiError, isNetworkError, isValidationError } from '../utils/errorHandler';
import Toast from '../utils/toast';

export interface UseErrorHandlerOptions {
  showToast?: boolean;
  onError?: (error: ApiError) => void;
  onNetworkError?: (error: ApiError) => void;
  onValidationError?: (error: ApiError) => void;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const {
    showToast = true,
    onError,
    onNetworkError,
    onValidationError
  } = options;

  const handleError = useCallback((error: any): ApiError => {
    const apiError = handleApiError(error, false); // Don't show toast here, we'll handle it

    // Call specific error handlers
    if (isNetworkError(apiError) && onNetworkError) {
      onNetworkError(apiError);
    } else if (isValidationError(apiError) && onValidationError) {
      onValidationError(apiError);
    } else if (onError) {
      onError(apiError);
    }

    // Show toast notification if enabled
    if (showToast && !isValidationError(apiError)) {
      Toast.error(apiError);
    }

    return apiError;
  }, [showToast, onError, onNetworkError, onValidationError]);

  const handleAsyncError = useCallback(async <T>(
    asyncOperation: () => Promise<T>,
    options?: {
      loadingMessage?: string;
      successMessage?: string;
      errorMessage?: string;
    }
  ): Promise<T | null> => {
    try {
      let loadingToast: string | undefined;
      
      if (options?.loadingMessage) {
        loadingToast = Toast.loading(options.loadingMessage);
      }

      const result = await asyncOperation();

      if (loadingToast) {
        Toast.dismiss(loadingToast);
      }

      if (options?.successMessage) {
        Toast.success(options.successMessage);
      }

      return result;
    } catch (error) {
      const apiError = handleError(error);
      
      if (options?.errorMessage) {
        Toast.error(options.errorMessage);
      }
      
      return null;
    }
  }, [handleError]);

  return {
    handleError,
    handleAsyncError
  };
}