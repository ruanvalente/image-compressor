import { toast as sonnerToast } from "sonner";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastOptions {
  description?: string;
  duration?: number;
}

const defaultDuration = 4000;

export const toast = {
  success: (message: string, options?: ToastOptions) => {
    sonnerToast.success(message, {
      description: options?.description,
      duration: options?.duration ?? defaultDuration,
    });
  },

  error: (message: string, options?: ToastOptions) => {
    sonnerToast.error(message, {
      description: options?.description,
      duration: options?.duration ?? defaultDuration,
    });
  },

  info: (message: string, options?: ToastOptions) => {
    sonnerToast.info(message, {
      description: options?.description,
      duration: options?.duration ?? defaultDuration,
    });
  },

  warning: (message: string, options?: ToastOptions) => {
    sonnerToast.warning(message, {
      description: options?.description,
      duration: options?.duration ?? defaultDuration,
    });
  },

  promise: <T>(promise: Promise<T>, messages: {
    loading: string;
    success: string;
    error: string;
  }) => {
    return sonnerToast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
      duration: defaultDuration,
    });
  },
};