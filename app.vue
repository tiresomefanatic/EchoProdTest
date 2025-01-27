<template>
  <div>
    <!-- Password protection layer -->
    <div v-if="!isPasswordVerified" class="password-protection">
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
      <NuxtLayout>
        <Header />
        <main class="mt-24">
          <NuxtLoadingIndicator />
          <NuxtPage />
          <Toast />
        </main>
      </NuxtLayout>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { usePasswordProtection } from "~/composables/usePasswordProtection";
import Header from "~/components/Header.vue";

const { isPasswordVerified, verifyPassword } = usePasswordProtection();
const password = ref("");
const passwordError = ref("");

const verifyPasswordLocal = () => {
  console.log("Password entered:", password.value); // Debug log
  if (verifyPassword(password.value)) {
    console.log("Password verified successfully"); // Debug log
    passwordError.value = "";
  } else {
    console.log("Incorrect password"); // Debug log
    passwordError.value = "Incorrect password";
    password.value = "";
  }
};
</script>

<style>
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
