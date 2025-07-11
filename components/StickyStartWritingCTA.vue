<template>
  <div class="sticky-cta" :class="{ visible: isScrolled }">
    <button
      @click="$emit('start-writing')"
      class="sticky-write-button"
      title="Start Writing"
      aria-label="Start Writing"
      tabindex="0"
      @keydown.enter="$emit('start-writing')"
      @keydown.space.prevent="$emit('start-writing')"
    >
      <svg class="write-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
        />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

defineEmits<{
  "start-writing": [];
}>();

const isScrolled = ref(false);

const handleScroll = () => {
  const scrollPosition = window.scrollY;
  isScrolled.value = scrollPosition > 200;
};

onMounted(() => {
  window.addEventListener("scroll", handleScroll);
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<style scoped>
.sticky-cta {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 50;
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
  transform: translateY(16px);
  pointer-events: none;
}

.sticky-cta.visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.sticky-write-button {
  background: linear-gradient(to right, #ff5310, #ff5310);
  color: white;
  font-family: "PP Neue Montreal", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-weight: 600;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  width: 56px;
  height: 56px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sticky-write-button:hover {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  transform: scale(1.02);
}

.sticky-write-button:active {
  transform: scale(0.98);
}

.write-icon {
  width: 24px;
  height: 24px;
}
</style> 