<template>
  <div class="admin-card">
    <div class="card-header">
      <h3 class="card-title">Chat Logs</h3>
      <p class="card-description">View and manage user conversations with the AI assistant</p>
    </div>
    <div class="card-content">
      <div class="search-filter-container">
        <div class="search-container">
          <SearchIcon class="search-icon" />
          <input
            type="text"
            placeholder="Search by user or chat ID"
            class="search-input"
            v-model="searchQuery"
          />
        </div>
        <div class="filter-container">
          <FilterIcon class="filter-icon" />
          <select v-model="statusFilter" class="filter-select">
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="flagged">Flagged</option>
          </select>
        </div>
      </div>

      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Chat ID</th>
              <th>User</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td colspan="5" class="loading-cell">
                <Loader2Icon class="loading-icon" />
              </td>
            </tr>
            <template v-else-if="filteredLogs.length > 0">
              <tr
                v-for="log in filteredLogs"
                :key="log.id"
                class="log-row"
                @click="handleViewChat(log)"
              >
                <td class="chat-id-cell">{{ log.id }}</td>
                <td>{{ log.user }}</td>
                <td>{{ log.date }}</td>
                <td>
                  <div :class="['status-badge', `status-${log.status}`]">
                    {{ log.status.charAt(0).toUpperCase() + log.status.slice(1) }}
                  </div>
                </td>
                <td>
                  <div class="actions-container">
                    <button 
                      class="action-button" 
                      @click.stop="handleViewChat(log)" 
                      aria-label="View chat details" 
                      tabindex="0"
                    >
                      <EyeIcon />
                    </button>
                    <button 
                      class="action-button" 
                      @click.stop="handleDeleteChat(log.id)" 
                      aria-label="Delete chat" 
                      tabindex="0"
                    >
                      <Trash2Icon />
                    </button>
                    <button 
                      class="action-button" 
                      @click.stop="handleDownloadChat(log.id)" 
                      aria-label="Download chat logs" 
                      tabindex="0"
                    >
                      <DownloadIcon />
                    </button>
                  </div>
                </td>
              </tr>
            </template>
            <tr v-else>
              <td colspan="5" class="empty-message">
                No chat logs found
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="card-footer">
      <button class="btn-outline">Export All Logs</button>
      <div class="pagination">
        <button class="btn-outline" disabled>Previous</button>
        <button class="btn-outline" disabled>Next</button>
      </div>
    </div>

    <div v-if="isDialogOpen" class="dialog-overlay" @click="isDialogOpen = false">
      <div class="dialog-content" @click.stop>
        <div class="dialog-header">
          <h4 class="dialog-title">Conversation with {{ selectedChat?.user }}</h4>
          <p class="dialog-description">
            Chat ID: {{ selectedChat?.id }} | Date: {{ selectedChat?.date }} | Status: {{ selectedChat?.status }}
          </p>
          <button class="dialog-close-button" @click="isDialogOpen = false" aria-label="Close">
            <XIcon class="close-icon" />
          </button>
        </div>
        <div class="conversation-container">
          <div class="messages-container">
            <div
              v-for="(message, index) in selectedChat?.messages"
              :key="index"
              :class="[
                'message', 
                message.role === 'assistant' ? 'assistant-message' : 'user-message'
              ]"
            >
              <div class="message-avatar">
                <BotIcon v-if="message.role === 'assistant'" class="message-icon" />
                <UserIcon v-if="message.role === 'user'" class="message-icon" />
              </div>
              <div class="message-content">
                <div class="message-timestamp">{{ message.timestamp }}</div>
                <div class="message-text">{{ message.content }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { 
  Loader2 as Loader2Icon, 
  Bot as BotIcon, 
  User as UserIcon, 
  Search as SearchIcon, 
  Filter as FilterIcon, 
  Eye as EyeIcon, 
  Trash2 as Trash2Icon, 
  Download as DownloadIcon,
  X as XIcon
} from 'lucide-vue-next';

// Mock data 
const mockChatLogs = [
  {
    id: "chat-001",
    user: "sarah.johnson@example.com",
    date: "2023-12-22",
    messages: [
      {
        role: "user",
        content: "How do I implement the Echo color palette in my design?",
        timestamp: "10:23 AM",
      },
      {
        role: "assistant",
        content:
          "The Echo color palette consists of primary colors (#FF5310, #1D1B1B) and a range of supporting colors. You can implement it by using the provided Tailwind CSS classes or by directly using the hex values in your CSS.",
        timestamp: "10:23 AM",
      },
      {
        role: "user",
        content: "Are there any guidelines for using these colors in dark mode?",
        timestamp: "10:24 AM",
      },
      {
        role: "assistant",
        content:
          "Yes, for dark mode we recommend using lighter variants of our primary colors. The #FF5310 orange should be used sparingly as an accent, while background colors should shift to darker tones (#121212 for backgrounds, #2D2D2D for surfaces). We have a complete dark mode palette documented in the Color section of the design system.",
        timestamp: "10:24 AM",
      },
      {
        role: "user",
        content: "Thanks! What about accessibility considerations with these colors?",
        timestamp: "10:26 AM",
      },
      {
        role: "assistant",
        content:
          "Great question! For accessibility, we ensure all color combinations in the Echo system meet WCAG 2.1 AA standards for contrast. The primary orange (#FF5310) should only be used on dark backgrounds for text, as it doesn't provide sufficient contrast on white. For text on light backgrounds, use the primary text color (#1D1B1B). We also provide alternative accessible color combinations in the design system documentation.",
        timestamp: "10:27 AM",
      },
    ],
    status: "unknown",
  },
  {
    id: "chat-002",
    user: "alex.chen@example.com",
    date: "2023-12-21",
    messages: [
      {
        role: "user",
        content: "What font weights are available in PP Neue Montreal?",
        timestamp: "3:45 PM",
      },
      {
        role: "assistant",
        content:
          "PP Neue Montreal is available in several weights: Thin, Light, Book, Regular, Medium, Semibold, and Bold. Each weight has a specific use case in our design system, with Bold typically used for headings, Medium for subheadings, and Book for body text.",
        timestamp: "3:45 PM",
      },
    ],
    status: "completed",
  },
  {
    id: "chat-003",
    user: "miguel.rodriguez@example.com",
    date: "2023-12-20",
    messages: [],
    status: "flagged",
  },
  {
    id: "chat-004",
    user: "emma.wilson@example.com",
    date: "2023-12-19",
    messages: [],
    status: "completed",
  },
  {
    id: "chat-005",
    user: "david.kim@example.com",
    date: "2023-12-18",
    messages: [],
    status: "active",
  },
];

// State
const chatLogs = ref([]);
const isLoading = ref(true);
const searchQuery = ref("");
const statusFilter = ref("all");
const selectedChat = ref(null);
const isDialogOpen = ref(false);

// Computed
const filteredLogs = computed(() => {
  return chatLogs.value.filter((log) => {
    const matchesSearch = 
      log.user.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      log.id.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesStatus = statusFilter.value === "all" || log.status === statusFilter.value;
    return matchesSearch && matchesStatus;
  });
});

// Methods
const handleViewChat = (chat) => {
  selectedChat.value = chat;
  isDialogOpen.value = true;
};

const handleDeleteChat = (id) => {
  chatLogs.value = chatLogs.value.filter((log) => log.id !== id);
};

const handleDownloadChat = (id) => {
  // Implement download functionality
  console.log(`Downloading chat ${id}`);
};

// Lifecycle
onMounted(() => {
  // Simulate API call
  setTimeout(() => {
    chatLogs.value = mockChatLogs;
    isLoading.value = false;
  }, 1000);
});
</script>

<style scoped>
.admin-card {
  background-color: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #111827;
}

.card-description {
  color: #6b7280;
  font-size: 0.875rem;
}

.card-content {
  padding: 1.5rem;
}

.search-filter-container {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.search-container {
  position: relative;
  flex: 1;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #6b7280;
}

.search-input {
  padding: 0.5rem 0.75rem 0.5rem 2.5rem;
  width: 100%;
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
  background-color: #f9fafb;
  color: #111827;
  font-size: 0.875rem;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
}

.filter-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-icon {
  width: 16px;
  height: 16px;
  color: #6b7280;
}

.filter-select {
  width: 180px;
  padding: 9.5px 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
  background-color: #f9fafb;
  color: #111827;
  font-size: 0.875rem;
}

.filter-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
}

.table-container {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  text-align: left;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.875rem;
  color: #111827;
}

.table tr:last-child td {
  border-bottom: none;
}

.loading-cell {
  text-align: center;
  padding: 16px;
}

.loading-icon {
  width: 32px;
  height: 32px;
  animation: spin 1s linear infinite;
  color: #FF5310;
  margin: 0 auto;
}

.log-row {
  cursor: pointer;
}

.log-row:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.chat-id-cell {
  font-weight: 500;
}

.status-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
  color: white;
}

.status-active {
  background-color: #3b82f6;
}

.status-completed {
  background-color: #10b981;
}

.status-flagged {
  background-color: #f59e0b;
}

.status-unknown {
  background-color: #1f2937;
}

.actions-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.action-button {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: #4b5563;
}

.action-button:hover {
  color: #111827;
}

.action-button svg {
  width: 20px;
  height: 20px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-outline {
  background-color: white;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-outline:hover:not([disabled]) {
  background-color: #f9fafb;
}

.btn-outline[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-message {
  text-align: center;
  padding: 16px;
  color: #6b7280;
}

/* Dialog styles */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.dialog-content {
  background-color: white;
  border-radius: 8px;
  max-width: 48rem;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
}

.dialog-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #111827;
}

.dialog-description {
  color: #6b7280;
  font-size: 0.875rem;
}

.conversation-container {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.messages-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
}

.assistant-message {
  background-color: #f5f5f5;
  color: #000000;

}

.user-message {
  background-color: rgba(255, 83, 16, 0.4);
  margin-left: auto;
  max-width: 80%;
}

.message-icon {
  width: 24px;
  height: 24px;
  color: #FF5310;
  margin-top: 4px;
  flex-shrink: 0;
}

.message-content {
  flex: 1;
}

.message-timestamp {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.message-text {
  white-space: pre-wrap;
}

.dialog-close-button {
  background: none;
  border: none;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  cursor: pointer;
  border-radius: 9999px;
  transition: background-color 0.2s;
}

.dialog-close-button:hover {
  background-color: #f3f4f6;
}

.close-icon {
  width: 18px;
  height: 18px;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>