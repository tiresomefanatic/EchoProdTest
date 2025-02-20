<template>
  <div>
    <!-- Initial loading state -->
    <div
      v-if="isLoading"
      class="min-h-screen flex items-center justify-center bg-gray-50"
    >
      <div
        class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"
      ></div>
    </div>

    <!-- Password protection layer -->
    <div v-else-if="!isPasswordVerified" class="password-protection">
      <div class="password-container">
        <h1 class="password-title">Admin Access</h1>
        <p class="password-description">Enter password to access the website</p>
        <div class="password-input-wrapper">
          <input
            v-model="password"
            type="password"
            class="password-input"
            placeholder="Enter password"
            @keyup.enter="verifyPasswordLocal"
          />
          <div v-if="passwordError" class="error-message">
            {{ passwordError }}
          </div>
        </div>
        <button @click="verifyPasswordLocal" class="verify-button">
          Continue
        </button>
      </div>
    </div>

    <!-- Website content - shown only after password verification -->
    <div v-else>
   
        <NuxtLoadingIndicator />
        <NuxtPage />
        <Toast />
    
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { usePasswordProtection } from "~/composables/usePasswordProtection";
import Header from "~/components/Header.vue";

const { isPasswordVerified, verifyPassword } = usePasswordProtection();
const password = ref("");
const passwordError = ref("");
const isLoading = ref(true);

// Check initial state with a small delay to prevent flash
onMounted(() => {
  if (process.client) {
    // Check localStorage directly
    const localStorageValue = window.localStorage.getItem("isPasswordVerified");
    if (localStorageValue === "true") {
      isPasswordVerified.value = true;
    }
    // Remove loading state after a short delay
    setTimeout(() => {
      isLoading.value = false;
    }, 100);
  }
});

const verifyPasswordLocal = () => {
  if (verifyPassword(password.value)) {
    passwordError.value = "";
  } else {
    passwordError.value = "Incorrect password";
    password.value = "";
  }
};
</script>

<style>
@import '~/assets/css/fonts.css';

body {
  @apply bg-white;
}

.page-enter-active,
.page-leave-active {
  transition: all 0.2s;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  filter: blur(1rem);
}

/* Password protection styles */
.password-protection {
  @apply min-h-screen flex items-center justify-center bg-gray-50;
}

.password-container {
  @apply max-w-md w-full mx-auto p-6 bg-white shadow-md rounded-lg;
}

.password-title {
  @apply text-center text-3xl font-bold text-gray-900 mb-4;
}

.password-description {
  @apply text-center text-sm text-gray-600 mb-8;
}

.password-input-wrapper {
  @apply space-y-2;
}

.password-input {
  @apply w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.error-message {
  @apply text-sm text-red-600;
}

.verify-button {
  @apply w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
}
</style>
