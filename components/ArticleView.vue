<template>
  <div class="article-view">
    <div class="article-content">
      <button @click="$emit('back')" class="back-button">← Back to Articles</button>
      <h1 class="article-title">{{ article.title }}</h1>
      <p class="article-excerpt">{{ article.excerpt }}</p>
      <p class="article-meta">By {{ article.author }} • {{ article.date }}</p>
      <p>Full article view - Coming Soon</p>
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

defineProps<Props>();

defineEmits<{
  'back': [];
  'category-change': [categoryName: string];
  'start-writing': [preSelectedCategory?: string];
}>();
</script>

<style scoped>
.article-view {
  min-height: 100vh;
  background: white;
  font-family: "PP Neue Montreal", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.article-content {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}

.back-button {
  background: none;
  border: none;
  color: #FF5310;
  cursor: pointer;
  font-size: 16px;
  margin-bottom: 24px;
}

.article-title {
  font-size: 32px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 16px 0;
}

.article-excerpt {
  font-size: 18px;
  color: #6b7280;
  margin: 0 0 16px 0;
  line-height: 1.6;
}

.article-meta {
  color: #9ca3af;
  margin: 0 0 24px 0;
}
</style> 