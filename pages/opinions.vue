<template>
  <div class="opinions-page-wrapper">
    <ClientOnly>
      <!-- Show ActionBar only for logged in users -->
      <ActionBar v-if="isAuthenticated" />
      <Header class="menu-bar" />
      
      <!-- Sticky Start Writing CTA -->
      <StickyStartWritingCTA @start-writing="handleStartWriting" />
      
      <!-- Writing Editor -->
      <div v-if="showWritingEditor" class="writing-editor-wrapper">
                <TiptapEditorOpinions 
           :content="currentDraftContent"
          :initial-title="modalFormData.title"
          :initial-tags="modalFormData.tags"
          :initial-category="modalFormData.category[0] || 'Design'"
          @exit="handleEditorExit"
          @save="handleEditorSave"
        />
      </div>

      <!-- Category Page -->
      <div v-else-if="showCategoryPage" class="flex min-h-screen bg-white">
        <CategoryPage
          :selected-category="selectedCategory"
          :articles="filteredArticles"
          :categories="categoriesList"
          :active-category="activeCategory"
          :drafts="displayDrafts"
          @back="handleBackToAll"
          @category-change="handleCategoryChange"
          @article-click="handleArticleClick"
          @draft-click="handleDraftClick"
          @start-writing="handleStartWriting"
        />
      </div>

      <!-- Main Page -->
      <div v-else class="flex min-h-screen bg-white">
        <MainOpinionsPage
          :articles="filteredArticles"
          :categories="categoriesList"
          :active-category="activeCategory"
          :drafts="displayDrafts"
          @category-change="handleCategoryChange"
          @article-click="handleArticleClick"
          @draft-click="handleDraftClick"
          @start-writing="handleStartWriting"
        />
      </div>

      <!-- Start Writing Modal -->
      <StartWritingModal
        v-if="showStartWritingModal"
        :is-open="showStartWritingModal"
        :form-data="modalFormData"
        :new-collaborator="newCollaboratorEmail"
        @cancel="handleModalCancel"
        @submit="handleModalSubmit"
        @update:form-data="(data) => modalFormData = data"
        @update:new-collaborator="(email) => newCollaboratorEmail = email"
        @add-collaborator="handleAddCollaborator"
        @remove-collaborator="handleRemoveCollaborator"
      />

      <!-- Article View Overlay -->
      <ArticleView
        v-if="showArticleView && selectedArticle"
        :article="selectedArticle"
        :categories="categoriesList"
        @back="handleBackFromArticle"
        @category-change="handleCategoryChangeFromArticle"
        @start-writing="handleStartWriting"
      />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useGithubAuth } from "~/composables/useGithubAuth";
import { useToast } from "~/composables/useToast";
import { useOpinionsStore, type OpinionDraft } from "~/store/opinions";
import TiptapEditorOpinions from "~/components/TiptapEditorOpinions.vue";
import ArticleView from "~/components/ArticleView.vue";

// Authentication state
const { isAuthenticated } = useGithubAuth();
const { showToast } = useToast();

// Opinions store
const opinionsStore = useOpinionsStore();

// Interfaces
interface Article {
  id: string;
  title: string;
  author: string;
  date: string;
  readTime: string;
  excerpt: string;
  category: string;
  image: string;
  featured?: boolean;
}

interface Category {
  name: string;
  count: number;
  active: boolean;
}

// Draft interface for display (matches what components expect)
interface Draft {
  id: string;
  title: string;
  excerpt: string;
  lastEdited: string;
  wordCount: number;
  category: string;
}

// Computed drafts for display (transformed from store to match component interface)
const displayDrafts = computed<Draft[]>(() => {
  return opinionsStore.sortedDrafts.map(draft => ({
    id: draft.id,
    title: draft.title,
    excerpt: draft.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...',
    lastEdited: formatTimeAgo(new Date(draft.updatedAt)),
    wordCount: draft.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length,
    category: draft.slug || 'General' // Using slug as category placeholder
  }));
});

// Format time ago helper
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
};

const articles: Article[] = [
  {
    id: "1",
    title: "The Future of Design Systems: Trends and Predictions for 2025",
    author: "Dominic Nguyen",
    date: "Jun 17, 2025",
    readTime: "8 min read",
    excerpt: "Exploring the emerging trends that will shape design systems in the coming year, from AI integration to collaborative workflows.",
    category: "Design System",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=240&fit=crop&crop=center",
    featured: true,
  },
  {
    id: "2",
    title: "Building a Design System for a Growing Startup",
    author: "Sarah Chen",
    date: "Jun 15, 2025",
    readTime: "12 min read",
    excerpt: "A comprehensive guide to establishing design consistency and scalability in fast-paced startup environments.",
    category: "Design System",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=240&fit=crop&crop=center",
  },
  {
    id: "3",
    title: "Accessibility in Design Systems: Best Practices",
    author: "Arun Kumar",
    date: "Jun 10, 2025",
    readTime: "10 min read",
    excerpt: "Essential guidelines for creating inclusive design systems that work for everyone, regardless of ability.",
    category: "Design",
    image: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=400&h=240&fit=crop&crop=center",
  },
  {
    id: "4",
    title: "The Role of Design Systems in Agile Development",
    author: "Shreyas Patel",
    date: "Jun 8, 2025",
    readTime: "6 min read",
    excerpt: "How design systems can accelerate development cycles and improve collaboration between design and engineering teams.",
    category: "Design",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=240&fit=crop&crop=center",
  },
  {
    id: "5",
    title: "Component Library Best Practices",
    author: "Maya Rodriguez",
    date: "Jun 5, 2025",
    readTime: "9 min read",
    excerpt: "Essential guidelines for building maintainable and scalable component libraries.",
    category: "Design System",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=240&fit=crop&crop=center",
  },
];

const categoriesList: Category[] = [
  { name: "All", count: 8, active: true },
  { name: "Design System", count: 2, active: false },
  { name: "Design", count: 2, active: false },
  { name: "Product", count: 2, active: false },
  { name: "Engineering", count: 2, active: false },
];

// Reactive state
const activeCategory = ref("All");
const filteredArticles = ref<Article[]>(articles);
const showCategoryPage = ref(false);
const selectedCategory = ref("");
const currentDraftContent = ref("");

// Modal state
const showStartWritingModal = ref(false);
const showWritingEditor = ref(false);
const modalFormData = ref({
  title: "",
  tags: "",
  category: [] as string[],
  collaborators: [] as string[],
});
const newCollaboratorEmail = ref("");

// Article view state
const showArticleView = ref(false);
const selectedArticle = ref<Article | null>(null);

// Event handlers
const handleStartWriting = (preSelectedCategory?: string) => {
  // Reset form data and show modal
  modalFormData.value = {
    title: "",
    tags: "",
    category: preSelectedCategory ? [preSelectedCategory] : [],
    collaborators: [],
  };
  newCollaboratorEmail.value = "";
  showStartWritingModal.value = true;
};

// Draft click handler
const handleDraftClick = (draft: Draft) => {
  // Find the full draft data from the store
  const fullDraft = opinionsStore.getDraftById(draft.id);
  if (fullDraft) {
    modalFormData.value = {
      title: fullDraft.title,
      tags: "", // Store doesn't have tags field yet, can be added if needed
      category: [fullDraft.slug || 'General'], // Using slug as category
      collaborators: [],
    };
    currentDraftContent.value = fullDraft.content;
    opinionsStore.setCurrentDraft(fullDraft);
    showWritingEditor.value = true;
  }
};

const handleCategoryChange = (categoryName: string) => {
  // Always update the active category first
  activeCategory.value = categoryName;
  
  if (categoryName === "All") {
    filteredArticles.value = articles;
    showCategoryPage.value = false;
    selectedCategory.value = "";
  } else {
    selectedCategory.value = categoryName;
    filteredArticles.value = articles.filter(article => article.category === categoryName);
    showCategoryPage.value = true;
  }
};

const handleBackToAll = () => {
  activeCategory.value = "All";
  filteredArticles.value = articles;
  showCategoryPage.value = false;
  selectedCategory.value = "";
};

const handleArticleClick = (article: Article) => {
  selectedArticle.value = article;
  showArticleView.value = true;
};

const handleBackFromArticle = () => {
  showArticleView.value = false;
  selectedArticle.value = null;
};

const handleCategoryChangeFromArticle = (categoryName: string) => {
  // First go back to main view
  showArticleView.value = false;
  selectedArticle.value = null;
  
  // Then filter by category
  if (categoryName === "All") {
    activeCategory.value = "All";
    filteredArticles.value = articles;
    showCategoryPage.value = false;
    selectedCategory.value = "";
  } else {
    activeCategory.value = categoryName;
    filteredArticles.value = articles.filter(article => article.category === categoryName);
    showCategoryPage.value = true;
    selectedCategory.value = categoryName;
  }
};

// Handle category filtering from URL parameters
const route = useRoute();

onMounted(() => {
  opinionsStore.initStore();
  
  // Check for category parameter in URL
  const categoryParam = route.query.category as string;
  if (categoryParam) {
    handleCategoryChange(categoryParam);
  }
});

// Modal event handlers
const handleModalSubmit = () => {
  // Create a new draft or use existing one
  if (!opinionsStore.currentDraft) {
    // Create new draft with initial content containing the title as h1
    const title = modalFormData.value.title || 'Untitled Opinion';
    const initialContent = `<h1>${title}</h1><p></p>`;
    const newDraft = opinionsStore.createDraft(title, initialContent);
    currentDraftContent.value = initialContent;
  } else {
    // Update existing draft
    currentDraftContent.value = opinionsStore.currentDraft.content;
  }
  
  showStartWritingModal.value = false;
  showWritingEditor.value = true;
  console.log("Opening editor with data:", modalFormData.value);
};

const handleModalCancel = () => {
  showStartWritingModal.value = false;
  modalFormData.value = {
    title: "",
    tags: "",
    category: [],
    collaborators: [],
  };
  newCollaboratorEmail.value = "";
};

const handleAddCollaborator = () => {
  if (newCollaboratorEmail.value.trim() && !modalFormData.value.collaborators.includes(newCollaboratorEmail.value.trim())) {
    modalFormData.value = {
      ...modalFormData.value,
      collaborators: [...modalFormData.value.collaborators, newCollaboratorEmail.value.trim()],
    };
    newCollaboratorEmail.value = "";
  }
};

const handleRemoveCollaborator = (email: string) => {
  modalFormData.value = {
    ...modalFormData.value,
    collaborators: modalFormData.value.collaborators.filter(c => c !== email),
  };
};

// Editor event handlers
const handleEditorExit = () => {
  showWritingEditor.value = false;
  currentDraftContent.value = "";
  opinionsStore.setCurrentDraft(null);
  // Reset form data when exiting editor
  modalFormData.value = {
    title: "",
    tags: "",
    category: [],
    collaborators: [],
  };
  newCollaboratorEmail.value = "";
};

const handleEditorSave = () => {
  console.log('Editor save triggered');
  
  showToast({
    title: "Success",
    message: "Article saved successfully!",
    type: "success",
  });
  // Don't close editor immediately, let user continue editing
};

// This onMounted is now handled above with route handling

// Page title for SEO
useHead({
  title: "Opinions - Echo Design System",
  meta: [
    {
      name: "description",
      content: "Opinions and insights on design, development, and technology from the Echo Design System team.",
    },
  ],
});
</script>

<style scoped>
/* Main page wrapper */
.opinions-page-wrapper {
  min-height: 100vh;
  background: white;
  font-family: "PP Neue Montreal", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.menu-bar {
  position: relative;
  z-index: 40;
}

/* Layout utilities */
.flex {
  display: flex;
}

.min-h-screen {
  min-height: 100vh;
}

.bg-white {
  background-color: white;
}

/* Writing editor wrapper */
.writing-editor-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: white;
  z-index: 50;
  overflow: hidden;
}

/* Article View Overlay */
.article-view {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: white;
  z-index: 100;
  overflow-y: auto;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}
</style> 