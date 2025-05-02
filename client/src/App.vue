<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useAuthStore } from './stores/auth'
import AppHeader from './components/layout/AppHeader.vue'
import AppSidebar from './components/layout/AppSidebar.vue'
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const authStore = useAuthStore()
const route = useRoute()

const sidebarOpen = ref(false)
const isAuthenticated = computed(() => authStore.isAuthenticated)
const isAuthPage = computed(() => route.path === '/login' || route.path === '/register')

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

onMounted(() => {
  // Close sidebar on medium and smaller screens by default
  const handleResize = () => {
    if (window.innerWidth < 768) {
      sidebarOpen.value = false
    } else {
      sidebarOpen.value = true
    }
  }
  
  // Set initial state
  handleResize()
  
  // Add event listener
  window.addEventListener('resize', handleResize)
  
  // Cleanup
  return () => {
    window.removeEventListener('resize', handleResize)
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Auth Pages Layout -->
    <div v-if="isAuthPage" class="min-h-screen">
      <RouterView />
    </div>
    
    <!-- Main Layout -->
    <div v-else class="flex h-screen overflow-hidden">
      <!-- Sidebar -->
      <AppSidebar :is-open="sidebarOpen" @toggle="toggleSidebar" />
      
      <!-- Main Content -->
      <div class="flex flex-col flex-1 overflow-hidden">
        <!-- Header -->
        <AppHeader @toggle-sidebar="toggleSidebar" />
        
        <!-- Main Content Area -->
        <main class="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          <div class="max-w-7xl mx-auto">
            <RouterView />
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<style>
/* Base styles */
html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  padding: 0;
  font-family: 'Inter', system-ui, sans-serif;
  line-height: 1.5;
  color: #1a1a1a;
}

/* Smooth transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive text sizes */
@media (max-width: 640px) {
  html {
    font-size: 14px;
  }
}
</style>