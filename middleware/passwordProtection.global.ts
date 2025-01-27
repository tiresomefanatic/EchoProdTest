import { usePasswordProtection } from "~/composables/usePasswordProtection";

export default defineNuxtRouteMiddleware((to, from) => {
  const { isPasswordVerified } = usePasswordProtection();

  console.log("Middleware: isPasswordVerified:", isPasswordVerified.value); // Debug log

  // Redirect to the home page if the password is not verified
  if (!isPasswordVerified.value && to.path !== "/") {
    console.log("Redirecting to home page"); // Debug log
    return navigateTo("/");
  }
});
