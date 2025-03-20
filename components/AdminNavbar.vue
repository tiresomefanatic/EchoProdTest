<template>
    <div class="fixed top-6 left-4 right-4 sm:left-8 sm:right-8 z-50">
      <header class="rounded-2xl bg-white shadow-lg">
        <div class="mx-4 sm:mx-8 h-16 flex items-center justify-between">
          <NuxtLink to="/admin" class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="23" height="22" viewBox="0 0 23 22" fill="none">
              <ellipse cx="6" cy="11" rx="6" ry="11" fill="#FF5310" />
              <ellipse cx="11.8429" cy="11" rx="3.84292" ry="11" fill="#FF5310" />
              <ellipse cx="17.0003" cy="11" rx="2.48659" ry="11" fill="#FF5310" />
              <ellipse
                cx="1.40674"
                cy="11"
                rx="1.40674"
                ry="11"
                transform="matrix(-1 0 0 1 22.6914 0)"
                fill="#FF5310"
              />
            </svg>
            <span class="text-xl font-bold text-black">ECHO ADMIN</span>
          </NuxtLink>
  
          <!-- Mobile menu button - only shows on small screens -->
          <button 
            class="md:hidden flex items-center p-2 rounded-md text-black" 
            aria-label="Toggle menu"
            tabindex="0"
            @click="toggleMobileMenu"
            @keydown.enter="toggleMobileMenu"
          >
            <MenuIcon class="h-6 w-6" />
          </button>
  
          <!-- Navigation links - hidden on mobile/tablet -->
          <div class="hidden md:flex flex-grow items-center justify-end gap-4 lg:gap-10 mr-4 lg:mr-8">
            <Button 
              variant="ghost" 
              class="flex items-center gap-2 text-black"
              :class="{ '': activeTab === 'chat-logs' }"
              @click="handleTabChange('chat-logs')"
            >
              <MessageSquareIcon class="h-4 w-4 text-black" />
              <span>Chat Logs</span>
            </Button>
            <Button 
              variant="ghost" 
              class="flex items-center gap-2 text-black"
              :class="{ '': activeTab === 'context-files' }"
              @click="handleTabChange('context-files')"
            >
              <FileTextIcon class="h-4 w-4 text-black" />
              <span>Context Files</span>
            </Button>
            <Button 
              variant="ghost" 
              class="flex items-center gap-2 text-black"
              :class="{ '': activeTab === 'bot-controls' }"
              @click="handleTabChange('bot-controls')"
            >
              <SettingsIcon class="h-4 w-4 text-black" />
              <span>Bot Controls</span>
            </Button>
          </div>
          <div class="hidden md:flex relative items-center bg-gray-200 pl-3 rounded-lg">
              <SearchIcon class="h-4 w-4 text-black" />
              <input
                type="search"
                placeholder="Search"
                class="w-[180px] lg:w-[200px] pl-2 pr-8 py-2 h-8 bg-transparent text-sm focus:outline-none placeholder:text-gray-600"
                aria-label="Search"
                tabindex="0"
                @keydown.enter="handleSearch"
              />
            </div>
        </div>
      </header>
    </div>

    <!-- Mobile Menu Drawer -->
    <div 
      v-if="isMobileMenuOpen" 
      class="fixed inset-0 bg-black bg-opacity-50 z-40"
      @click="closeMobileMenu"
    ></div>
    
    <div 
      class="fixed top-0 left-0 w-64 h-full bg-white transform transition-transform duration-300 ease-in-out z-50 shadow-lg"
      :class="isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="p-4 border-b">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="19" viewBox="0 0 23 22" fill="none">
              <ellipse cx="6" cy="11" rx="6" ry="11" fill="#FF5310" />
              <ellipse cx="11.8429" cy="11" rx="3.84292" ry="11" fill="#FF5310" />
              <ellipse cx="17.0003" cy="11" rx="2.48659" ry="11" fill="#FF5310" />
              <ellipse
                cx="1.40674"
                cy="11"
                rx="1.40674"
                ry="11"
                transform="matrix(-1 0 0 1 22.6914 0)"
                fill="#FF5310"
              />
            </svg>
            <span class="text-lg font-bold text-black">ECHO ADMIN</span>
          </div>
          <button 
            class="p-2 rounded-md text-black hover:bg-gray-100" 
            @click="closeMobileMenu"
          >
            <XIcon class="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <nav class="p-4">
        <ul class="space-y-2">
          <li>
            <button 
              class="w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors"
              :class="activeTab === 'chat-logs' ? 'bg-gray-100' : 'hover:bg-gray-50'"
              @click="handleMobileNavigation('chat-logs')"
            >
              <MessageSquareIcon class="h-5 w-5 text-black" />
              <span class="text-black">Chat Logs</span>
            </button>
          </li>
          <li>
            <button 
              class="w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors"
              :class="activeTab === 'context-files' ? 'bg-gray-100' : 'hover:bg-gray-50'"
              @click="handleMobileNavigation('context-files')"
            >
              <FileTextIcon class="h-5 w-5 text-black" />
              <span class="text-black">Context Files</span>
            </button>
          </li>
          <li>
            <button 
              class="w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors"
              :class="activeTab === 'bot-controls' ? 'bg-gray-100' : 'hover:bg-gray-50'"
              @click="handleMobileNavigation('bot-controls')"
            >
              <SettingsIcon class="h-5 w-5 text-black" />
              <span class="text-black">Bot Controls</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  </template>
  
  <script setup>
  import { ref, watch } from 'vue';
  import { 
    Search as SearchIcon, 
    Settings as SettingsIcon, 
    FileText as FileTextIcon, 
    Menu as MenuIcon,
    X as XIcon,
    MessageSquare as MessageSquareIcon
  } from 'lucide-vue-next';

  // State
  const isMobileMenuOpen = ref(false);
  const activeTab = ref('chat-logs');

  // Emits to communicate with parent component
  const emit = defineEmits(['update:activeTab']);

  // Props to receive active tab from parent
  const props = defineProps({
    modelValue: {
      type: String,
      default: 'chat-logs'
    }
  });

  // Watch for changes from parent
  watch(() => props.modelValue, (newValue) => {
    activeTab.value = newValue;
  });

  // Methods
  const handleSearch = () => {
    // Implement search functionality here
  };

  const toggleMobileMenu = () => {
    isMobileMenuOpen.value = !isMobileMenuOpen.value;
  };

  const closeMobileMenu = () => {
    isMobileMenuOpen.value = false;
  };

  const handleTabChange = (tab) => {
    activeTab.value = tab;
    emit('update:activeTab', tab);
  };

  const handleMobileNavigation = (tab) => {
    activeTab.value = tab;
    emit('update:activeTab', tab);
    closeMobileMenu();
  };
  </script>

  <style scoped>
  @media (max-width: 767px) {
    .fixed.top-6 {
      top: 0;
      left: 0;
      right: 0;
    }
    
    header.rounded-2xl {
      border-radius: 0;
    }
  }
  </style>