export default defineNuxtRouteMiddleware((to, from) => {
  if (process.client) {
    // Force check localStorage directly first
    const localStorageValue = window.localStorage.getItem("isPasswordVerified");

    // If localStorage says we're verified, but state doesn't match, initialize the state
    if (localStorageValue === "true") {
      const { isPasswordVerified } = usePasswordProtection();
      isPasswordVerified.value = true;
      return;
    }

    // Otherwise proceed with normal check
    const { isPasswordVerified } = usePasswordProtection();

    console.log("Middleware: isPasswordVerified:", isPasswordVerified.value);
    console.log("LocalStorage isPasswordVerified:", localStorageValue);

    if (!isPasswordVerified.value && to.path !== "/") {
      console.log("Redirecting to home page");
      return navigateTo("/");
    }
  }
});
