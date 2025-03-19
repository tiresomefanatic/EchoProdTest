<template>
  <div class="admin-container">
    <AdminNavbar v-model="activeTab" @update:activeTab="activeTab = $event" />
    <div class="admin-content">
      <div class="admin-header">
        <h1 class="admin-title">Admin Dashboard</h1>
        <p class="admin-description">
          Manage the AI assistant, view chat logs, and configure system settings. This dashboard provides
          administrative controls for the Echo AI system.
        </p>
      </div>

      <div class="tabs-container">
        <!-- Tab Content -->
        <div class="tab-content">
          <AdminChatLogs v-if="activeTab === 'chat-logs'" />
          <AdminFileUpload v-if="activeTab === 'context-files'" />
          <AdminControls v-if="activeTab === 'bot-controls'" />
        </div>
      </div>
    </div>
    <FloatingWidget />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import AdminNavbar from '~/components/AdminNavbar.vue';
import AdminChatLogs from '~/components/AdminChatLogs.vue';
import AdminFileUpload from '~/components/AdminFileUpload.vue';
import AdminControls from '~/components/AdminControls.vue';
import FloatingWidget from '~/components/FloatingWidget.vue';

const activeTab = ref('chat-logs');
</script>

<style scoped>
.admin-container {
  position: relative;
  min-height: 100vh;
}

.admin-content {
  padding-top: 8rem; 
  padding-left: 2rem; 
  padding-right: 2rem; 
  padding-bottom: 2rem;
}

.admin-header {
  max-width: 64rem; 
  margin-bottom: 2rem;
}

.admin-title {
  font-size: 2.25rem;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.025em;
  color: #111827;
  margin-bottom: 1rem;
}

.admin-description {
  font-size: 1rem;
  line-height: 1.75;
  color: #4b5563;
  max-width: 48rem;
}

.tabs-container {
  max-width: 64rem;
  width: 100%;
}

.tabs-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  padding: 0.25rem;
  background-color: #f9fafb;
  margin-bottom: 1.5rem;
}

.tab-button {
  padding: 0.75rem 0;
  background: none;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab-button:hover:not(.active) {
  color: #111827;
}

.tab-button.active {
  background-color: white;
  color: #111827;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tab-content {
  margin-top: 1.5rem;
}
</style>
