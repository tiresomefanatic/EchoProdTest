// composables/usePasswordProtection.ts
export const usePasswordProtection = () => {
  const isPasswordVerified = useState("isPasswordVerified", () => false);

  const verifyPassword = (password: string) => {
    const ADMIN_PASSWORD = "echo2024"; // Change this to your desired password
    const trimmedPassword = password.trim().toLowerCase(); // Trim and convert to lowercase
    const adminPasswordLower = ADMIN_PASSWORD.toLowerCase(); // Convert to lowercase

    console.log("Entered password (trimmed and lowercase):", trimmedPassword); // Debug log
    console.log("Expected password (lowercase):", adminPasswordLower); // Debug log

    if (trimmedPassword === adminPasswordLower) {
      console.log("Password is correct"); // Debug log
      isPasswordVerified.value = true;
      return true;
    } else {
      console.log("Password is incorrect"); // Debug log
      return false;
    }
  };

  return {
    isPasswordVerified,
    verifyPassword,
  };
};
