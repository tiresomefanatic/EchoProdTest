<template>
  <div class="main-opinions-layout">
    <!-- Left Sidebar -->
    <div class="sidebar">
      <div class="sidebar-content">
        <!-- Filter Categories -->
        <div class="categories-section">
          <h3 class="section-title">Filter by Category</h3>
          <nav class="categories-nav">
            <ul class="categories-list">
              <li v-for="category in categories" :key="category.name">
                <button
                  @click="$emit('category-change', category.name)"
                  :class="[
                    'category-button',
                    { 'active': activeCategory === category.name }
                  ]"
                  :aria-pressed="activeCategory === category.name"
                >
                  <span class="category-name">{{ category.name }}</span>
                  <span class="category-count">{{ category.count }}</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>

        <!-- Drafts Section -->
        <div class="drafts-section">
          <h3 class="section-title">Your Drafts ({{ drafts.length }})</h3>
          <div class="drafts-list">
            <div
              v-for="draft in drafts.slice(0, 3)"
              :key="draft.id"
              @click="$emit('draft-click', draft)"
              class="draft-card"
            >
              <h4 class="draft-title">{{ draft.title }}</h4>
              <p class="draft-excerpt">{{ draft.excerpt }}</p>
              <div class="draft-meta">
                <span class="draft-time">{{ draft.lastEdited }}</span>
                <span class="draft-words">{{ draft.wordCount }} words</span>
              </div>
            </div>
            <button v-if="drafts.length > 3" class="view-all-drafts">
              View all drafts ({{ drafts.length }})
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Hero Section with Start Writing Button -->
      <div class="hero-section">
        <!-- Top-right Start Writing Button -->
        <div class="header-button-container">
          <HeaderStartWritingButton @start-writing="$emit('start-writing')" />
        </div>

        <!-- Background Pattern -->
        <div class="background-pattern">
          <svg
            class="pattern-svg"
            viewBox="0 0 800 400"
            fill="none"
            preserveAspectRatio="xMidYMid slice"
          >
            <g v-for="i in 12" :key="i">
              <path
                :d="getPatternPath(i)"
                stroke="#F97316"
                stroke-width="2"
                fill="none"
                opacity="0.6"
              />
            </g>
          </svg>
        </div>

        <div class="hero-content">
          <!-- Badge -->
          <div class="hero-badge">
            <span class="badge-dot"></span>
            Community Insights
          </div>

          <!-- Main Heading -->
          <h1 class="hero-title">
            Welcome to the<br/>
            <span class="hero-title-accent">Design System</span><br/>
            Community
          </h1>

          <!-- Description -->
          <p class="hero-description">
            Discover insights, best practices, and innovative approaches from design system experts. Join our
            community of practitioners shaping the future of digital design.
          </p>
        </div>
      </div>

      <!-- Articles Section -->
      <div class="articles-section">
        <div class="articles-container">
          <!-- Section Header -->
          <div class="section-header">
            <div class="header-content">
              <h2 class="articles-title">Explore</h2>
              <div class="articles-count">
                Showing {{ articles.length }} article{{ articles.length !== 1 ? 's' : '' }}
                <span v-if="activeCategory !== 'All'"> in {{ activeCategory }}</span>
              </div>
            </div>
            <p class="articles-subtitle">
              Dive into the latest insights and expert perspectives on design systems, product development, and
              engineering best practices.
            </p>
          </div>

          <!-- Articles Grid -->
          <div class="articles-grid">
            <article
              v-for="(article, index) in articles.slice(0, 6)"
              :key="article.id"
              @click="$emit('article-click', article)"
              :class="[
                'article-card',
                { 'featured': article.featured }
              ]"
            >
              <!-- Article Image -->
              <div class="article-image">
                <img
                  :src="article.image"
                  :alt="article.title"
                  @error="handleImageError"
                />
              </div>

              <!-- Article Content -->
              <div class="article-content">
                <!-- Category Badge -->
                <div class="article-category">
                  <span class="category-badge">{{ article.category }}</span>
                </div>

                <!-- Title -->
                <h3 class="article-title">{{ article.title }}</h3>

                <!-- Excerpt -->
                <p class="article-excerpt">{{ article.excerpt }}</p>

                <!-- Meta Information -->
                <div class="article-meta">
                  <div class="author-info">
                    <div class="author-avatar">
                      {{ getAuthorInitials(article.author) }}
                    </div>
                    <div class="author-details">
                      <p class="author-name">{{ article.author }}</p>
                      <p class="article-date">{{ article.date }}</p>
                    </div>
                  </div>
                </div>

                <!-- Read More Link -->
                <div class="read-more">
                  <button class="read-more-button">
                    Read Article
                    <svg class="chevron-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              </div>
            </article>
          </div>

          <!-- Load More Section -->
          <div v-if="articles.length > 6" class="load-more-section">
            <button class="load-more-button">
              Load More Articles
            </button>
          </div>

          <!-- Empty State -->
          <div v-if="articles.length === 0" class="empty-state">
            <div class="empty-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 class="empty-title">No articles found</h3>
            <p class="empty-description">
              Try selecting a different category or check back later for new content.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Props
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

interface Draft {
  id: string;
  title: string;
  excerpt: string;
  lastEdited: string;
  wordCount: number;
  category: string;
}

interface Category {
  name: string;
  count: number;
  active: boolean;
}

interface Props {
  articles: Article[];
  categories: Category[];
  activeCategory: string;
  drafts: Draft[];
}

defineProps<Props>();

// Emits
defineEmits<{
  'category-change': [categoryName: string];
  'article-click': [article: Article];
  'draft-click': [draft: Draft];
  'start-writing': [preSelectedCategory?: string];
}>();

// Methods
const getAuthorInitials = (author: string) => {
  return author.split(' ').map(n => n[0]).join('');
};

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement;
  target.src = '/placeholder.svg';
};

const getPatternPath = (index: number) => {
  const angle = index * 30 * (Math.PI / 180);
  const centerX = 400;
  const centerY = 200;
  const innerRadius = Math.min(centerX, centerY) * 0.25;
  const outerRadius = Math.min(centerX, centerY) * 0.875;
  const startX = centerX + Math.cos(angle) * innerRadius;
  const startY = centerY + Math.sin(angle) * innerRadius;
  const endX = centerX + Math.cos(angle) * outerRadius;
  const endY = centerY + Math.sin(angle) * outerRadius;

  return `M ${startX} ${startY} Q ${centerX} ${centerY} ${endX} ${endY}`;
};
</script>

<style scoped>
.main-opinions-layout {
  display: flex;
  min-height: 100vh;
  background: white;
  font-family: "PP Neue Montreal", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* Sidebar Styles */
.sidebar {
  width: 320px;
  border-right: 1px solid #e5e7eb;
  min-height: 100vh;
  background: white;
}

.sidebar-content {
  padding: 32px;
}

.section-title {
  font-size: 14px;
  color: #111827;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 24px;
  font-weight: 400;
}

.categories-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  transition: all 200ms ease-in-out;
  color: #374151;
  text-align: left;
  position: relative;
}

.category-button:hover {
  background: white;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border-color: #e5e7eb;
}

.category-button.active {
  background: #FF5310;
  color: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.category-name {
  font-size: 14px;
  font-weight: 500;
}

.category-button.active .category-name {
  font-weight: 700;
}

.category-count {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 9999px;
  background: #e5e7eb;
  color: #6b7280;
  font-weight: 400;
}

.category-button.active .category-count {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.drafts-section {
  margin-top: 32px;
}

.drafts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.draft-card {
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 200ms;
}

.draft-card:hover {
  border-color: rgba(255, 83, 16, 0.2);
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.draft-title {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  margin: 0 0 4px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 200ms;
}

.draft-card:hover .draft-title {
  color: #FF5310;
}

.draft-excerpt {
  font-size: 12px;
  color: #6b7280;
  margin: 0 0 8px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.draft-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #9ca3af;
}

.view-all-drafts {
  width: 100%;
  font-size: 12px;
  color: #FF5310;
  font-weight: 500;
  padding: 8px;
  background: none;
  border: none;
  cursor: pointer;
  transition: color 200ms;
}

.view-all-drafts:hover {
  color: #dc2626;
}

/* Main Content Styles */
.main-content {
  flex: 1;
}

.hero-section {
  position: relative;
  background: white;
  overflow: hidden;
}

.header-button-container {
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 10;
}

.background-pattern {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.pattern-svg {
  width: 100%;
  height: 100%;
  opacity: 0.1;
  padding: 0 16px;
}

.hero-content {
  padding: 48px 32px 0 32px;
  padding-right: 128px;
  max-width: 1536px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 9999px;
  background: rgba(255, 83, 16, 0.1);
  color: #FF5310;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 32px;
}

.badge-dot {
  width: 8px;
  height: 8px;
  background: #FF5310;
  border-radius: 50%;
  margin-right: 8px;
}

.hero-title {
  font-size: 96px;
  font-weight: 700;
  margin-bottom: 24px;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: #111827;
}

.hero-title-accent {
  color: #FF5310;
}

.hero-description {
  font-size: 20px;
  color: #6b7280;
  margin-bottom: 40px;
  max-width: 512px;
  line-height: 1.6;
}

/* Articles Section */
.articles-section {
  padding: 48px 32px;
}

.articles-container {
  max-width: 1536px;
  margin: 0 auto;
}

.section-header {
  margin-bottom: 48px;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.articles-title {
  font-size: 64px;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.02em;
  margin: 0;
}

.articles-count {
  font-size: 14px;
  color: #6b7280;
}

.articles-subtitle {
  font-size: 18px;
  color: #6b7280;
  max-width: 512px;
  line-height: 1.6;
  margin: 0;
}

/* Articles Grid */
.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
}

@media (min-width: 1280px) {
  .articles-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .articles-grid {
    grid-template-columns: 1fr;
  }
}

.article-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  cursor: pointer;
  transition: all 300ms;
  group: true;
}

.article-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.article-card.featured {
  border-color: rgba(255, 83, 16, 0.1);
  box-shadow: 0 0 0 2px rgba(255, 83, 16, 0.1);
}

.article-image {
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: #f3f4f6;
}

.article-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 300ms;
}

.article-card:hover .article-image img {
  transform: scale(1.05);
}

.article-content {
  padding: 20px;
}

.article-category {
  margin-bottom: 12px;
}

.category-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
  background: #f3f4f6;
  color: #374151;
}

.article-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 300ms;
}

.article-card:hover .article-title {
  color: #FF5310;
}

.article-excerpt {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 16px 0;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
  margin-bottom: 12px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-avatar {
  width: 28px;
  height: 28px;
  background: linear-gradient(to bottom right, #FF5310, #FF5310);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: 700;
}

.author-details p {
  margin: 0;
}

.author-name {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
}

.article-date {
  font-size: 12px;
  color: #6b7280;
}

.read-more {
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}

.read-more-button {
  color: #FF5310;
  font-size: 14px;
  font-weight: 600;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 200ms;
}

.read-more-button:hover {
  color: #dc2626;
}

.chevron-icon {
  width: 16px;
  height: 16px;
  transition: transform 200ms;
}

.read-more-button:hover .chevron-icon {
  transform: translateX(4px);
}

/* Load More & Empty State */
.load-more-section {
  text-align: center;
  margin-top: 64px;
}

.load-more-button {
  padding: 12px 32px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 12px;
  border: 1px solid #d1d5db;
  background: transparent;
  color: #374151;
  cursor: pointer;
  transition: all 200ms;
}

.load-more-button:hover {
  border-color: #FF5310;
  color: #FF5310;
}

.empty-state {
  text-align: center;
  padding: 64px 0;
}

.empty-icon {
  width: 64px;
  height: 64px;
  background: #f3f4f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px auto;
}

.empty-icon svg {
  width: 32px;
  height: 32px;
  color: #9ca3af;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.empty-description {
  color: #6b7280;
  margin: 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .main-opinions-layout {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
    min-height: auto;
  }
  
  .hero-content {
    padding-right: 32px;
  }
  
  .hero-title {
    font-size: 48px;
  }
  
  .articles-title {
    font-size: 32px;
  }
}
</style> 