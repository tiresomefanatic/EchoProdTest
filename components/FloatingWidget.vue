<script setup lang="ts">
import { ref, computed } from 'vue';

const isWritingAssistantOpen = ref(false);
const isDesignAnalysisOpen = ref(false);

// to check if any widget is open
const isAnyWidgetOpen = computed(() => 
  isWritingAssistantOpen.value || isDesignAnalysisOpen.value
);

// Close all widgets
const closeAllWidgets = () => {
  isWritingAssistantOpen.value = false;
  isDesignAnalysisOpen.value = false;
};

// Open design analysis and ensure other widget is closed
const openDesignAnalysis = () => {
  isWritingAssistantOpen.value = false;
  isDesignAnalysisOpen.value = true;
};

// Open writing assistant and ensure other widget is closed
const openWritingAssistant = () => {
  isDesignAnalysisOpen.value = false;
  isWritingAssistantOpen.value = true;
};
</script>

<template>
  <div>
    <!-- Only show floating buttons when no widget is open -->
    <div v-if="!isAnyWidgetOpen" class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <div class="hover-shadow-lg transition-shadow bg-[#FAFAFA99] backdrop-blur-[27px] rounded-md border">
        <button
          class="w-full h-12 flex items-center gap-2 px-4 text-[#1D1B1B] hover:text-[#FF5310]"
          @click="openDesignAnalysis"
        >
          <!-- Sparkles icon -->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-5 w-5 text-[#FF5310]"
          >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" />
            <path d="M19 17v4" />
            <path d="M3 5h4" />
            <path d="M17 19h4" />
          </svg>
          <span>Design Analysis</span>
        </button>
      </div>
      <!-- <div class="hover-shadow-lg transition-shadow bg-[#FAFAFA99] backdrop-blur-[27px] rounded-md border">
        <button
          class="w-full h-12 flex items-center gap-2 px-4 text-[#1D1B1B] hover:text-[#FF5310]"
          @click="openWritingAssistant"
        > -->
          <!-- Bot icon -->
          <!-- <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-5 w-5 text-[#FF5310]"
          >
            <path d="M12 8V4H8" />
            <rect width="16" height="12" x="4" y="8" rx="2" />
            <path d="M2 14h2" />
            <path d="M20 14h2" />
            <path d="M15 13v2" />
            <path d="M9 13v2" />
          </svg>
          <span>AI Writing Assistant</span> -->
        <!-- </button> -->
      <!-- </div> -->
    </div>

    <!-- Widgets with updated close handlers -->
    <DesignAnalysisWidget 
      v-if="isDesignAnalysisOpen" 
      :onClose="closeAllWidgets" 
    />
    <AIWritingAssistant 
      v-if="isWritingAssistantOpen" 
      :onClose="closeAllWidgets" 
    />
  </div>
</template>

<style scoped>
.hover-shadow-lg:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}
</style>
