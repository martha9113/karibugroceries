<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import api from '../../services/api'
import { useToast } from 'vue-toastification'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()
const isManager = ref(authStore.user?.role === 'manager' || authStore.user?.role === 'director')

const produce = ref<any>(null)
const loading = ref(true)
const error = ref('')

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-UG', { 
    style: 'currency', 
    currency: 'UGX',
    minimumFractionDigits: 0
  }).format(amount)
}

// Fetch produce details
const fetchProduceDetails = async () => {
  loading.value = true
  try {
    const response = await api.get(`/produce/${route.params.id}`)
    produce.value = response.data
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to fetch produce details'
    toast.error(error.value)
  } finally {
    loading.value = false
  }
}

onMounted(fetchProduceDetails)

// Calculate profit margin
const calculateProfitMargin = () => {
  if (!produce.value) return 0
  const profit = produce.value.sellingPrice - produce.value.cost
  return ((profit / produce.value.cost) * 100).toFixed(2)
}

// Format date
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-UG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Produce Details</h1>
      <button 
        @click="router.push('/produce')" 
        class="btn btn-outline flex items-center"
      >
        Back to List
      </button>
    </div>

    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
    </div>

    <div v-else-if="error" class="bg-error-50 text-error-700 p-4 rounded-md">
      {{ error }}
    </div>

    <div v-else-if="produce" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Basic Information -->
      <div class="card p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
        <dl class="grid grid-cols-1 gap-4">
          <div class="flex justify-between py-2 border-b border-gray-100">
            <dt class="text-gray-500">Name:</dt>
            <dd class="text-gray-900 font-medium">{{ produce.name }}</dd>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-100">
            <dt class="text-gray-500">Type:</dt>
            <dd class="text-gray-900 font-medium">{{ produce.type }}</dd>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-100">
            <dt class="text-gray-500">Branch:</dt>
            <dd class="text-gray-900 font-medium">{{ produce.branch }}</dd>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-100">
            <dt class="text-gray-500">Source:</dt>
            <dd class="text-gray-900 font-medium">{{ produce.source }}</dd>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-100">
            <dt class="text-gray-500">Added On:</dt>
            <dd class="text-gray-900 font-medium">{{ formatDate(produce.createdAt) }}</dd>
          </div>
        </dl>
      </div>

      <!-- Stock & Pricing -->
      <div class="card p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Stock & Pricing</h2>
        <dl class="grid grid-cols-1 gap-4">
          <div class="flex justify-between py-2 border-b border-gray-100">
            <dt class="text-gray-500">Current Stock:</dt>
            <dd class="text-gray-900 font-medium">{{ produce.currentStock.toLocaleString() }}kg</dd>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-100">
            <dt class="text-gray-500">Initial Tonnage:</dt>
            <dd class="text-gray-900 font-medium">{{ produce.tonnage.toLocaleString() }}kg</dd>
          </div>
          <div v-if="isManager" class="flex justify-between py-2 border-b border-gray-100">
            <dt class="text-gray-500">Cost Price:</dt>
            <dd class="text-gray-900 font-medium">{{ formatCurrency(produce.cost) }}</dd>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-100">
            <dt class="text-gray-500">Selling Price:</dt>
            <dd class="text-gray-900 font-medium">{{ formatCurrency(produce.sellingPrice) }}</dd>
          </div>
          <div v-if="isManager" class="flex justify-between py-2 border-b border-gray-100">
            <dt class="text-gray-500">Profit Margin:</dt>
            <dd class="text-gray-900 font-medium">{{ calculateProfitMargin() }}%</dd>
          </div>
        </dl>
      </div>

      <!-- Dealer Information -->
      <div class="card p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Dealer Information</h2>
        <dl class="grid grid-cols-1 gap-4">
          <div class="flex justify-between py-2 border-b border-gray-100">
            <dt class="text-gray-500">Dealer Name:</dt>
            <dd class="text-gray-900 font-medium">{{ produce.dealer }}</dd>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-100">
            <dt class="text-gray-500">Contact:</dt>
            <dd class="text-gray-900 font-medium">{{ produce.dealerContact }}</dd>
          </div>
        </dl>
      </div>

      <!-- Stock Status -->
      <div class="card p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Stock Status</h2>
        <div class="flex items-center justify-center p-4">
          <div class="text-center">
            <div 
              class="text-2xl font-bold mb-2"
              :class="{
                'text-error-600': produce.currentStock < 200,
                'text-warning-600': produce.currentStock >= 200 && produce.currentStock < 500,
                'text-success-600': produce.currentStock >= 500
              }"
            >
              {{ 
                produce.currentStock < 200 
                  ? 'Low Stock' 
                  : produce.currentStock < 500 
                    ? 'Medium Stock' 
                    : 'Good Stock' 
              }}
            </div>
            <div class="text-gray-500">
              {{ produce.currentStock.toLocaleString() }}kg remaining
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>