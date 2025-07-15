<template>
  <div class="article-page-wrapper">
    <ClientOnly>
      <!-- Show ActionBar only for logged in users -->
      <ActionBar v-if="isAuthenticated" />
      <Header class="menu-bar" />
      
      <!-- Back to Opinions button -->
      <div class="back-navigation">
        <button @click="handleBackToOpinions" class="back-button">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Back to Opinions
        </button>
      </div>

      <!-- Article Content -->
      <div v-if="article" class="article-container">
        <ArticleView 
          :article="article"
          :categories="categoriesList"
          @back="handleBackToOpinions"
          @category-change="handleCategoryChange"
          @start-writing="handleStartWriting"
        />
      </div>

      <!-- Article Not Found -->
      <div v-else class="not-found-container">
        <div class="not-found-content">
          <h1 class="not-found-title">Article Not Found</h1>
          <p class="not-found-description">
            The article you're looking for doesn't exist or may have been removed.
          </p>
          <button @click="handleBackToOpinions" class="back-to-opinions-button">
            Back to Opinions
          </button>
        </div>
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
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useGithubAuth } from "~/composables/useGithubAuth";
import { useToast } from "~/composables/useToast";
import { useOpinionsStore } from "~/store/opinions";

// Authentication state
const { isAuthenticated } = useGithubAuth();
const { showToast } = useToast();

// Route and article data
const route = useRoute();
const articleId = computed(() => route.params.id as string);

// Debug logging
console.log('Article ID from route:', articleId.value);

// Opinions store
const opinionsStore = useOpinionsStore();

// Article interface
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

// Mock articles data - ensure this matches the main opinions page exactly
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
  { name: "Design System", count: 5, active: false },
  { name: "Design", count: 2, active: false },
  { name: "Community Insights", count: 1, active: false },
];

// Find the article by ID
const article = computed(() => {
  const foundArticle = articles.find(a => a.id === articleId.value);
  console.log('Found article:', foundArticle);
  return foundArticle || null;
});

// Modal state
const showStartWritingModal = ref(false);
const modalFormData = ref({
  title: "",
  tags: "",
  category: [] as string[],
  collaborators: [] as string[],
});
const newCollaboratorEmail = ref("");

// Event handlers
const handleBackToOpinions = () => {
  navigateTo('/opinions');
};

const handleCategoryChange = (categoryName: string) => {
  // Navigate to opinions page with category filter
  if (categoryName === "All") {
    navigateTo('/opinions');
  } else {
    navigateTo(`/opinions?category=${encodeURIComponent(categoryName)}`);
  }
};

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

const handleModalSubmit = () => {
  // Create a new draft or use existing one
  if (!opinionsStore.currentDraft) {
    // Create new draft with initial content containing the title as h1
    const title = modalFormData.value.title || 'Untitled Opinion';
    const initialContent = `<h1>${title}</h1><p></p>`;
    const newDraft = opinionsStore.createDraft(title, initialContent);
  }
  
  showStartWritingModal.value = false;
  // Navigate to opinions page to start writing
  navigateTo('/opinions');
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

// Initialize store when component mounts
onMounted(() => {
  opinionsStore.initStore();
  
  // Set page title based on article
  if (article.value) {
    useHead({
      title: `${article.value.title} - Opinions - Echo Design System`,
      meta: [
        {
          name: "description",
          content: article.value.excerpt,
        },
      ],
    });
  } else {
    useHead({
      title: "Article Not Found - Opinions - Echo Design System",
    });
  }
});
</script>

<style scoped>
.article-page-wrapper {
  min-height: 100vh;
  background-color: #f8fafc;
}

.menu-bar {
  position: sticky;
  top: 0;
  z-index: 40;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.back-navigation {
  padding: 1rem 2rem;
  border-bottom: 1px solid #e5e7eb;
  background: white;
}

.back-button {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;
}

.back-button:hover {
  background: #e5e7eb;
  color: #111827;
}

.back-button svg {
  width: 1rem;
  height: 1rem;
  margin-right: 0.5rem;
}

.article-container {
  max-width: 100%;
  margin: 0 auto;
}

/* Not Found Styles */
.not-found-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem;
}

.not-found-content {
  text-align: center;
  max-width: 24rem;
}

.not-found-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;
}

.not-found-description {
  font-size: 1.125rem;
  color: #6b7280;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.back-to-opinions-button {
  display: inline-flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background: #FF5310;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;
}

.back-to-opinions-button:hover {
  background: #e04a0d;
  transform: translateY(-1px);
}

/* Responsive Design */
@media (max-width: 768px) {
  .back-navigation {
    padding: 0.75rem 1rem;
  }
  
  .back-button {
    font-size: 0.8rem;
    padding: 0.4rem 0.8rem;
  }
  
  .not-found-title {
    font-size: 1.5rem;
  }
  
  .not-found-description {
    font-size: 1rem;
  }
}
</style> 