import toast from 'react-hot-toast';
import { ApiError, getErrorMessage } from './errorHandler';

export interface ToastOptions {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

export class Toast {
  static success(message: string, options?: ToastOptions) {
    return toast.success(message, {
      duration: options?.duration || 4000,
      position: options?.position || 'top-right',
      style: {
        background: '#065f46',
        color: '#ffffff',
        border: '1px solid #10b981',
      },
      iconTheme: {
        primary: '#10b981',
        secondary: '#ffffff',
      },
    });
  }

  static error(message: string | Error | ApiError, options?: ToastOptions) {
    const errorMessage = getErrorMessage(message);
    
    return toast.error(errorMessage, {
      duration: options?.duration || 6000,
      position: options?.position || 'top-right',
      style: {
        background: '#7f1d1d',
        color: '#ffffff',
        border: '1px solid #ef4444',
      },
      iconTheme: {
        primary: '#ef4444',
        secondary: '#ffffff',
      },
    });
  }

  static warning(message: string, options?: ToastOptions) {
    return toast(message, {
      duration: options?.duration || 5000,
      position: options?.position || 'top-right',
      icon: '⚠️',
      style: {
        background: '#92400e',
        color: '#ffffff',
        border: '1px solid #f59e0b',
      },
    });
  }

  static info(message: string, options?: ToastOptions) {
    return toast(message, {
      duration: options?.duration || 4000,
      position: options?.position || 'top-right',
      icon: 'ℹ️',
      style: {
        background: '#1e40af',
        color: '#ffffff',
        border: '1px solid #3b82f6',
      },
    });
  }

  static loading(message: string = 'Loading...', options?: ToastOptions) {
    return toast.loading(message, {
      position: options?.position || 'top-right',
      style: {
        background: '#374151',
        color: '#ffffff',
        border: '1px solid #6b7280',
      },
    });
  }

  static promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options?: ToastOptions
  ) {
    return toast.promise(promise, messages, {
      position: options?.position || 'top-right',
      style: {
        background: '#2d2d2d',
        color: '#ffffff',
        border: '1px solid #404040',
      },
      success: {
        style: {
          background: '#065f46',
          border: '1px solid #10b981',
        },
        iconTheme: {
          primary: '#10b981',
          secondary: '#ffffff',
        },
      },
      error: {
        style: {
          background: '#7f1d1d',
          border: '1px solid #ef4444',
        },
        iconTheme: {
          primary: '#ef4444',
          secondary: '#ffffff',
        },
      },
    });
  }

  static dismiss(toastId?: string) {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  }

  static remove(toastId: string) {
    toast.remove(toastId);
  }
}

export default Toast;