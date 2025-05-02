<script setup lang="ts">
import { useAuthStore } from '../../stores/auth'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

// Props
const props = defineProps<{
  isOpen: boolean
}>()

// Emits
const emit = defineEmits(['toggle'])

const authStore = useAuthStore()
const route = useRoute()

const user = computed(() => authStore.user)
const isManager = computed(() => user.value?.role === 'manager')
const isSalesAgent = computed(() => user.value?.role === 'sales_agent')
const isDirector = computed(() => user.value?.role === 'director')

const isActive = (path: string) => {
  return route.path === path || route.path.startsWith(`${path}/`)
}

const handleLinkClick = () => {
  if (window.innerWidth < 768) {
    emit('toggle')
  }
}
</script>

<template>
  <div
    :class="[
      'fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out',
      { 'translate-x-0': isOpen, '-translate-x-full': !isOpen },
      'md:translate-x-0 md:static md:inset-auto md:z-auto'
    ]"
  >
    <div class="flex flex-col h-full">
      <!-- Sidebar header -->
      <div class="flex items-center justify-center h-16 px-4 border-b border-gray-200">
        <span class="text-primary-600 font-bold text-xl">Karibu Groceries</span>
      </div>

      <!-- Sidebar content -->
      <nav class="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <!-- Dashboard -->
        <router-link
          to="/dashboard"
          @click="handleLinkClick"
          :class="[
            'flex items-center px-4 py-2 text-sm font-medium rounded-md',
            isActive('/dashboard')
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-700 hover:bg-gray-50'
          ]"
        >
          <svg
            class="mr-3 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          Dashboard
        </router-link>

        <!-- Produce -->
        <router-link
          to="/produce"
          @click="handleLinkClick"
          :class="[
            'flex items-center px-4 py-2 text-sm font-medium rounded-md',
            isActive('/produce')
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-700 hover:bg-gray-50'
          ]"
        >
          <svg
            class="mr-3 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          Produce
        </router-link>

        <!-- Sales -->
        <router-link
          to="/sales"
          @click="handleLinkClick"
          :class="[
            'flex items-center px-4 py-2 text-sm font-medium rounded-md',
            isActive('/sales')
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-700 hover:bg-gray-50'
          ]"
        >
          <svg
            class="mr-3 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          Sales
        </router-link>

        <!-- Credit -->
        <router-link
          to="/credit"
          @click="handleLinkClick"
          :class="[
            'flex items-center px-4 py-2 text-sm font-medium rounded-md',
            isActive('/credit')
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-700 hover:bg-gray-50'
          ]"
        >
          <svg
            class="mr-3 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Credit
        </router-link>

        <!-- Reports -->
        <router-link
          to="/reports"
          @click="handleLinkClick"
          :class="[
            'flex items-center px-4 py-2 text-sm font-medium rounded-md',
            isActive('/reports')
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-700 hover:bg-gray-50'
          ]"
        >
          <svg
            class="mr-3 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 17v-2m3 2v-4m3 4v-4m-9 4v-4m3 4v-4m3 4v-4m3 4v-4m-9 4v-4m3 4v-4m3 4v-4m3 4v-4"
            />
          </svg>
          Reports
        </router-link>
      </nav>

      <!-- Sidebar footer -->
      <div class="p-4 border-t border-gray-200">
        <div class="flex items-center">
          <div class="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
            <span class="text-primary-600 font-medium">
              {{ user?.name?.charAt(0)?.toUpperCase() || 'U' }}
            </span>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-700">{{ user?.name }}</p>
            <p class="text-xs text-gray-500">{{ user?.role }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>