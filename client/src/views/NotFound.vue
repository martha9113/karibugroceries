<template>
    <div class="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 class="text-4xl font-bold text-gray-800 mb-4">404 - Not Found</h1>
      <p class="text-gray-600 mb-8">The page you are looking for does not exist.</p>
      <router-link to="/" class="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
        Go back to Home
      </router-link>
    </div>
  </template>

  <script setup lang="ts">
  import { RouterLink } from 'vue-router';
  </script>