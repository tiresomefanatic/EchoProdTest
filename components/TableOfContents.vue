<template>
  <nav class="toc-nav">
    <div class="toc-content">
      <div v-for="heading in headings" :key="heading.id" class="toc-item">
        <a 
          :href="`#${heading.id}`"
          class="toc-link"
          :class="{
            'active': activeHeading === heading.id
          }"
          @click.prevent="handleClick(heading.id)"
        >
          {{ heading.text }}
        </a>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';

interface Heading {
  id: string;
  text: string;
  element: HTMLElement;
  level: number;
}

const route = useRoute();
const headings = ref<Heading[]>([]);
const activeHeading = ref<string>('');

const handleClick = (id: string) => {
  const element = document.getElementById(id);
  if (element) {
    const headerOffset = 100;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
};

const updateActiveHeading = () => {
  const scrollPosition = window.scrollY;
  let found = false;

  // Reverse loop through headings to find the last one that's above our scroll position
  for (let i = headings.value.length - 1; i >= 0; i--) {
    const heading = headings.value[i];
    const element = heading.element;
    // Add offset to account for header
    if (element.offsetTop <= scrollPosition + 120) {
      activeHeading.value = heading.id;
      found = true;
      
      // Scroll the TOC to show the active item
      const tocLink = document.querySelector(`.toc-link[href="#${heading.id}"]`);
      if (tocLink) {
        tocLink.scrollIntoView({ block: 'nearest' });
      }
      break;
    }
  }

  if (!found) {
    activeHeading.value = headings.value[0]?.id || '';
  }
};

const initializeHeadings = () => {
  // Wait for content to be available
  setTimeout(() => {
    const contentArea = document.querySelector('.markdown-content, .prose-content');
    if (!contentArea) return;

    const headingElements = contentArea.querySelectorAll('h1, h2');
    
    headings.value = Array.from(headingElements).map((element) => {
      if (!element.id) {
        element.id = element.textContent?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || '';
      }
      
      return {
        id: element.id,
        text: element.textContent || '',
        element: element as HTMLElement,
        level: parseInt(element.tagName[1])
      };
    });

    updateActiveHeading();
  }, 200); // Increased timeout to ensure content is loaded
};

// Watch for route changes
watch(
  () => route.path,
  () => {
    initializeHeadings();
  },
  { immediate: true }
);

// Watch for content changes
const setupContentObserver = () => {
  const observer = new MutationObserver(() => {
    initializeHeadings();
  });

  const observeContent = () => {
    const contentArea = document.querySelector('.markdown-content, .prose-content');
    if (contentArea) {
      observer.observe(contentArea, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }
  };

  // Initial observation
  observeContent();

  // Periodically check for content area in case it's not immediately available
  const checkInterval = setInterval(() => {
    const contentArea = document.querySelector('.markdown-content, .prose-content');
    if (contentArea && !headings.value.length) {
      observeContent();
      initializeHeadings();
    }
  }, 1000);

  return () => {
    observer.disconnect();
    clearInterval(checkInterval);
  };
};

onMounted(() => {
  window.addEventListener('scroll', updateActiveHeading);
  const cleanup = setupContentObserver();

  onUnmounted(() => {
    window.removeEventListener('scroll', updateActiveHeading);
    cleanup();
  });
});
</script>

<style scoped>
.toc-nav {
  position: sticky;
  top: 80px;
  width: 160px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  overflow-x: hidden;
  background: #FFFFFF;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
  margin-left: 24.5px;
  margin-right: 84px;
  box-sizing: border-box;
}

.toc-nav::-webkit-scrollbar {
  width: 2px;
  height: 2px;
}

.toc-nav::-webkit-scrollbar-track {
  background: transparent;
}

.toc-nav::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 1px;
}

.toc-content {
  padding: 0;
}

.toc-item {
  margin-bottom: 4px;
}

.toc-item:last-child {
  margin-bottom: 0;
}

.toc-link {
  display: block;
  padding: 2px 12px;
  color: rgba(0, 0, 0, 0.6);
  text-decoration: none;
  font-size: 13px;
  line-height: 140%;
  font-weight: 400;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  border-left: 1px solid transparent;
  transition: all 0.2s ease;
}

.toc-link:hover {
  color: #000000;
  opacity: 0.7;
}

.toc-link.active {
  color: #000000;
  font-weight: 500;
  border-left-color: #000000;
}

@media (max-width: 1380px) {
  .toc-nav {
    width: 160px;
    margin-left: 24.5px;
    margin-right: 0;
  }
}

@media (min-width: 768px) and (max-width: 1024px) {
  .toc-nav {
    display: block;
    width: 140px;
    margin-left: 0;
    margin-right: 0;
  }
}

@media (max-width: 767px) {
  .toc-nav {
    display: none;
  }
}
</style> 