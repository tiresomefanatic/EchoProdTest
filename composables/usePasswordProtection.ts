// composables/usePasswordProtection.ts

// Create a global state outside the composable
let globalPasswordVerified: Ref<boolean> | null = null;

export const usePasswordProtection = () => {
  if (!globalPasswordVerified) {
    // Initialize the global state only once
    globalPasswordVerified = useState<boolean>("isPasswordVerified", () => {
      if (process.client) {
        // Force immediate localStorage check
        const storedValue = window.localStorage.getItem("isPasswordVerified");
        const isVerified = storedValue === "true";

        // Immediately sync localStorage if needed
        if (isVerified) {
          window.localStorage.setItem("isPasswordVerified", "true");
        }

        return isVerified;
      }
      return false;
    });
  }

  const verifyPassword = (password: string) => {
    const ADMIN_PASSWORD = "echo2024";
    const trimmedPassword = password.trim();

    if (trimmedPassword === ADMIN_PASSWORD) {
      if (process.client) {
        window.localStorage.setItem("isPasswordVerified", "true");
      }
      globalPasswordVerified!.value = true;
      return true;
    }
    return false;
  };

  const clearPasswordVerification = () => {
    if (process.client) {
      window.localStorage.removeItem("isPasswordVerified");
    }
    globalPasswordVerified!.value = false;
  };

  // Force immediate sync with localStorage on client side
  if (
    process.client &&
    window.localStorage.getItem("isPasswordVerified") === "true"
  ) {
    globalPasswordVerified!.value = true;
  }

  return {
    isPasswordVerified: globalPasswordVerified!,
    verifyPassword,
    clearPasswordVerification,
  };
};
