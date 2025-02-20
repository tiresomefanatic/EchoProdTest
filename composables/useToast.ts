// composables/useToast.ts
import { ref } from "vue";

// Define interface for toast configuration
export interface ToastConfig {
  id?: string;  // Optional ID for updating specific toasts
  title?: string;
  message: string;
  type: "success" | "error" | "warning" | "info" | "loading";
  duration?: number;
}

// Define the internal toast object structure
interface Toast extends ToastConfig {
  id: string;
  created: Date;
}

// Create a reactive reference to store toasts
const toasts = ref<Toast[]>([]);

export const useToast = () => {
  // Show a new toast
  const showToast = (config: ToastConfig) => {
    const toast: Toast = {
      id: config.id || `toast-${Date.now()}`,
      created: new Date(),
      duration: config.duration ?? 3000,
      ...config,
    };

    // Add toast to the list
    toasts.value.push(toast);

    // Remove toast after duration if not loading and duration > 0
    if (config.type !== 'loading' && config.duration !== 0) {
      setTimeout(() => {
        removeToast(toast.id);
      }, toast.duration);
    }

    return toast.id;
  };

  // Update an existing toast
  const updateToast = (id: string, config: Partial<ToastConfig>) => {
    const index = toasts.value.findIndex(t => t.id === id);
    if (index !== -1) {
      toasts.value[index] = {
        ...toasts.value[index],
        ...config,
      };

      // Handle auto-dismiss for non-loading toasts
      if (config.type && config.type !== 'loading' && config.duration !== 0) {
        setTimeout(() => {
          removeToast(id);
        }, config.duration || 3000);
      }
    }
  };

  // Remove a specific toast
  const removeToast = (id: string) => {
    const index = toasts.value.findIndex(t => t.id === id);
    if (index !== -1) {
      toasts.value.splice(index, 1);
    }
  };

  // Dismiss a toast (alias for removeToast)
  const dismissToast = (id: string) => {
    removeToast(id);
  };

  // Clear all toasts
  const clearToasts = () => {
    toasts.value = [];
  };

  return {
    toasts,
    showToast,
    updateToast,
    removeToast,
    dismissToast,
    clearToasts,
  };
};
