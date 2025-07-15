<template>
  <div class="article-view">
    <div v-if="article" class="article-content">
      <!-- Back Button -->
      <div class="back-navigation">
        <button @click="$emit('back')" class="back-button">
          <svg class="back-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          <span class="back-text">Back to All Articles</span>
        </button>
      </div>

      <!-- Article Header -->
      <div class="article-header">
        <!-- Category Badge -->
        <div class="category-badge">{{ article.category }}</div>
        
        <!-- Article Title -->
        <h1 class="article-title">{{ article.title }}</h1>
        
        <!-- Article Meta -->
        <div class="article-meta">
          <div class="author-info">
            <div class="author-avatar">
              {{ getAuthorInitials(article.author) }}
            </div>
            <div class="author-details">
              <p class="author-name">{{ article.author }}</p>
              <div class="meta-details">
                <span class="article-date">{{ article.date }}</span>
                <span class="meta-separator">•</span>
                <span class="read-time">{{ article.readTime }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Article Excerpt -->
        <p class="article-excerpt">{{ article.excerpt }}</p>
      </div>

      <!-- Article Image -->
      <div class="article-image">
        <img :src="article.image" :alt="article.title" loading="lazy" @error="handleImageError" />
      </div>

      <!-- Article Body -->
      <div class="article-body">
        <p>This is where the full article content would be displayed. In a real implementation, this would contain the complete article text with proper formatting, images, and other media elements.</p>
        
        <p>The article content management system would parse and render the full content here, supporting rich text formatting, embedded media, code blocks, and other interactive elements as needed.</p>
        
        <h2>Sample Section</h2>
        <p>This demonstrates how article sections would appear with proper typography and spacing. The design system would ensure consistent formatting across all articles.</p>
        
        <h3>Subsection Example</h3>
        <p>Additional content structure showing how the article layout adapts to different heading levels and content types.</p>
        
        <blockquote>
          <p>"{{ article.excerpt }}"</p>
          <cite>- {{ article.author }}</cite>
        </blockquote>
        
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>
      </div>

      <!-- Article Actions -->
      <div class="article-actions">
        <button @click="$emit('start-writing')" class="start-writing-button">
          Start Writing
        </button>
        <button @click="handleCategoryClick" class="category-button">
          More {{ article.category }} Articles
        </button>
      </div>
    </div>
    
    <!-- Error state if no article -->
    <div v-else class="article-error">
      <h2>Article not available</h2>
      <p>The requested article could not be loaded.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
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

interface Props {
  article: Article;
  categories: any[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'back': [];
  'category-change': [categoryName: string];
  'start-writing': [preSelectedCategory?: string];
}>();

// Helper methods
const getAuthorInitials = (author: string) => {
  return author.split(' ').map(n => n[0]).join('');
};

const handleCategoryClick = () => {
  emit('category-change', props.article.category);
};

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.src = 'https://via.placeholder.com/800x400?text=Article+Image+Not+Available';
  img.alt = 'Article image not available';
};
</script>

<style scoped>
.article-view {
  min-height: 100vh;
  background: white;
  font-family: "PP Neue Montreal", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.article-content {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

/* Back Button */
.back-navigation {
  margin-bottom: 2rem;
  text-align: left;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #FF5310;
  background: none;
  border: none;
  cursor: pointer;
  transition: color 200ms;
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  padding: 0;
}

.back-button:hover {
  color: #dc2626;
}

.back-icon {
  width: 16px;
  height: 16px;
}

.back-text {
  font-size: 14px;
  font-weight: 500;
}

/* Article Header */
.article-header {
  margin-bottom: 2rem;
}

.category-badge {
  display: inline-block;
  background: #FF5310;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 1rem;
}

.article-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 1.5rem 0;
  line-height: 1.2;
}

.article-meta {
  margin-bottom: 1.5rem;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.author-avatar {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: #FF5310;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.125rem;
}

.author-details {
  flex: 1;
}

.author-name {
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
}

.meta-details {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.meta-separator {
  color: #d1d5db;
}

.article-excerpt {
  font-size: 1.25rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
}

/* Article Image */
.article-image {
  margin-bottom: 2rem;
  border-radius: 0.5rem;
  overflow: hidden;
}

.article-image img {
  width: 100%;
  height: auto;
  display: block;
}

/* Article Body */
.article-body {
  margin-bottom: 3rem;
  line-height: 1.7;
}

.article-body p {
  margin: 0 0 1.5rem 0;
  color: #374151;
  font-size: 1.125rem;
}

.article-body h2 {
  font-size: 1.75rem;
  font-weight: 600;
  color: #111827;
  margin: 2.5rem 0 1rem 0;
}

.article-body h3 {
  font-size: 1.375rem;
  font-weight: 600;
  color: #111827;
  margin: 2rem 0 0.75rem 0;
}

/* Article Actions */
.article-actions {
  display: flex;
  gap: 1rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
  flex-wrap: wrap;
}

.start-writing-button {
  background: #FF5310;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-family: inherit;
}

.start-writing-button:hover {
  background: #e0440a;
}

.category-button {
  background: transparent;
  color: #FF5310;
  border: 1px solid #FF5310;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.category-button:hover {
  background: #FF5310;
  color: white;
}

/* Error State */
.article-error {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
  font-size: 1.25rem;
}

.article-error h2 {
  color: #FF5310;
  margin-bottom: 1rem;
}

.article-error p {
  margin-bottom: 2rem;
}

/* Blockquote Styling */
.article-body blockquote {
  border-left: 4px solid #FF5310;
  margin: 2rem 0;
  padding: 1.5rem 2rem;
  background-color: #f8f9fa;
  font-style: italic;
  position: relative;
}

.article-body blockquote p {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  color: #374151;
}

.article-body blockquote cite {
  display: block;
  font-size: 1rem;
  color: #6b7280;
  font-style: normal;
  margin-top: 0.5rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .article-content {
    padding: 1rem;
  }
  
  .article-title {
    font-size: 2rem;
  }
  
  .article-excerpt {
    font-size: 1.125rem;
  }
  
  .article-body p {
    font-size: 1rem;
  }
  
  .article-actions {
    flex-direction: column;
  }
  
  .start-writing-button,
  .category-button {
    width: 100%;
    justify-content: center;
  }
}
</style> 