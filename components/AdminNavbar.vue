<template>
    <div class="fixed top-6 left-8 right-8 z-50">
      <header class="rounded-2xl bg-white shadow-lg">
        <div class="mx-8 h-16 flex items-center justify-between">
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
  
          <div class="flex-grow flex items-center justify-end gap-10 mr-8">
            <Button variant="ghost" class="flex items-center gap-2 text-black">
              <UsersIcon class="h-4 w-4 text-black" />
              <span>Users</span>
            </Button>
            <Button variant="ghost" class="flex items-center gap-2 text-black">
              <FileTextIcon class="h-4 w-4 text-black" />
              <span>Content</span>
            </Button>
            <Button variant="ghost" class="flex items-center gap-2 text-black">
              <BarChartIcon class="h-4 w-4 text-black" />
              <span>Analytics</span>
            </Button>
            <Button variant="ghost" class="flex items-center gap-2 text-black">
              <SettingsIcon class="h-4 w-4 text-black" />
              <span>Settings</span>
            </Button>
  
           
          </div>
          <div class="relative flex items-center bg-gray-200 pl-3 rounded-lg">
              <SearchIcon class="h-4 w-4 text-black" />
              <input
                type="search"
                placeholder="Search"
                class="w-[200px] pl-2 pr-8 py-2 h-8 bg-transparent text-sm focus:outline-none placeholder:text-gray-600"
                aria-label="Search"
                tabindex="0"
                @keydown.enter="handleSearch"
              />
            </div>
        </div>
      </header>
    </div>
  </template>
  
  <script setup>
  import { 
    Search as SearchIcon, 
    Settings as SettingsIcon, 
    Users as UsersIcon, 
    FileText as FileTextIcon, 
    BarChart as BarChartIcon 
  } from 'lucide-vue-next';

  const handleSearch = () => {
    // Implement search functionality here
  };
  </script>