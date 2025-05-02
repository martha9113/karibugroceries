<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import api from '../../services/api'
import { useToast } from 'vue-toastification'
import { useRouter } from 'vue-router'

const toast = useToast()
const router = useRouter()
const authStore = useAuthStore()
const isManager = ref(authStore.user?.role === 'manager' || authStore.user?.role === 'director')

const produces = ref([])
const loading = ref(true)
const error = ref('')

// Fetch all produce
const fetchProduce = async () => {
  loading.value = true
  try {
    const response = await api.get('/produce')
    produces.value = response.data
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to fetch produce'
    toast.error(error.value)
  } finally {
    loading.value = false
  }
}

onMounted(fetchProduce)

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-UG', { 
    style: 'currency', 
    currency: 'UGX',
    minimumFractionDigits: 0
  }).format(amount)
}

// Navigate to add produce
const goToAddProduce = () => {
  router.push('/produce/add')
}

// View produce details
const viewProduceDetails = (id: string) => {
  router.push(`/produce/${id}`)
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Produce Inventory</h1>
      <button 
        v-if="isManager"
        @click="goToAddProduce" 
        class="btn btn-primary flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add New Produce
      </button>
    </div>

    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
    </div>
    
    <div v-else-if="error" class="bg-error-50 text-error-700 p-4 rounded-md">
      {{ error }}
    </div>
    
    <div v-else-if="produces.length === 0" class="text-center py-12 bg-white rounded-lg shadow">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
      <h3 class="mt-2 text-lg font-medium text-gray-900">No produce found</h3>
      <p class="mt-1 text-gray-500">Get started by adding a new produce.</p>
      <div class="mt-6" v-if="isManager">
        <button 
          @click="goToAddProduce" 
          class="btn btn-primary"
        >
          Add New Produce
        </button>
      </div>
    </div>
    
    <div v-else class="card">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Stock
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Selling Price
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Branch
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="produce in produces" :key="produce._id" class="hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div>
                    <div class="text-sm font-medium text-gray-900">
                      {{ produce.name }}
                    </div>
                    <div class="text-xs text-gray-500">
                      ID: {{ produce._id }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ produce.type }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ produce.currentStock.toLocaleString() }}kg
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatCurrency(produce.sellingPrice) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ produce.branch }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span 
                  :class="[
                    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                    produce.currentStock < 200 
                      ? 'bg-error-100 text-error-800' 
                      : produce.currentStock < 500 
                        ? 'bg-warning-100 text-warning-800' 
                        : 'bg-success-100 text-success-800'
                  ]"
                >
                  {{ 
                    produce.currentStock < 200 
                      ? 'Low Stock' 
                      : produce.currentStock < 500 
                        ? 'Medium' 
                        : 'In Stock' 
                  }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button 
                  @click="viewProduceDetails(produce._id)" 
                  class="text-primary-600 hover:text-primary-900 mr-3"
                >
                  View
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>