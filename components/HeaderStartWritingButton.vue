<template>
  <button
    @click="$emit('start-writing')"
    class="header-write-button"
    aria-label="Start Writing"
    tabindex="0"
    @keydown.enter="$emit('start-writing')"
    @keydown.space.prevent="$emit('start-writing')"
  >
    <svg class="edit-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
      />
    </svg>
    <span class="button-text-full">Start Writing</span>
    <span class="button-text-short">Write</span>
  </button>
</template>

<script setup lang="ts">
// Emits
defineEmits<{
  'start-writing': [];
}>();
</script>

<style scoped>
.header-write-button {
  background: linear-gradient(to right, #FF5310, #FF5310);
  color: white;
  font-family: "PP Neue Montreal", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-weight: 600;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 10px 24px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-write-button:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  transform: scale(1.02);
}

.header-write-button:active {
  transform: scale(0.98);
}

.edit-icon {
  width: 16px;
  height: 16px;
}

.button-text-full {
  display: inline;
}

.button-text-short {
  display: none;
}

@media (max-width: 640px) {
  .button-text-full {
    display: none;
  }
  
  .button-text-short {
    display: inline;
  }
}
</style> 