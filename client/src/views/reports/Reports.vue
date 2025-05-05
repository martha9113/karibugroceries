<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import api from '../../services/api'
import { useToast } from 'vue-toastification'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js'
import { Bar, Pie } from 'vue-chartjs'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

const toast = useToast()
const loading = ref(false)

interface Sale {
  _id: string
  amountPaid: number
  produceId: {
    name: string
    type: string
  }
  createdAt: string
}

interface Credit {
  _id: string
  amountDue: number
  produceId: {
    name: string
    type: string
  }
  createdAt: string
}

interface Produce {
  _id: string
  name: string
  type: string
  currentStock: number
}

const sales = ref<Sale[]>([])
const credits = ref<Credit[]>([])
const produce = ref<Produce[]>([])

// Fetch all data
const fetchData = async () => {
  loading.value = true
  try {
    const [salesRes, creditsRes, produceRes] = await Promise.all([
      api.get('/sales'),
      api.get('/credit'),
      api.get('/produce')
    ])
    sales.value = salesRes.data
    credits.value = creditsRes.data
    produce.value = produceRes.data
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to fetch report data')
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)

// Computed properties for summary statistics
const totalSales = computed(() => {
  return sales.value.reduce((sum, sale) => sum + sale.amountPaid, 0)
})

const totalCredits = computed(() => {
  return credits.value.reduce((sum, credit) => sum + credit.amountDue, 0)
})

const totalStock = computed(() => {
  return produce.value.reduce((sum, item) => sum + item.currentStock, 0)
})

// Chart data for sales by produce
const salesByProduceData = computed(() => {
  const produceSales = new Map<string, number>()
  
  sales.value.forEach(sale => {
    const key = `${sale.produceId.name} - ${sale.produceId.type}`
    produceSales.set(key, (produceSales.get(key) || 0) + sale.amountPaid)
  })
  
  return {
    labels: Array.from(produceSales.keys()),
    datasets: [{
      label: 'Sales by Produce',
      data: Array.from(produceSales.values()),
      backgroundColor: [
        '#4F46E5',
        '#7C3AED',
        '#EC4899',
        '#F59E0B',
        '#10B981'
      ]
    }]
  }
})

// Chart data for stock levels
const stockLevelsData = computed(() => {
  return {
    labels: produce.value.map(p => `${p.name} - ${p.type}`),
    datasets: [{
      label: 'Current Stock (kg)',
      data: produce.value.map(p => p.currentStock),
      backgroundColor: '#4F46E5'
    }]
  }
})

// Chart options
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Business Reports</h1>
      <button @click="fetchData" class="btn btn-outline flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
        </svg>
        Refresh Data
      </button>
    </div>

    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
    </div>

    <div v-else class="space-y-6">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="card p-6">
          <h3 class="text-lg font-medium text-gray-900">Total Sales</h3>
          <p class="mt-2 text-3xl font-bold text-primary-600">
            {{ new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX' }).format(totalSales) }}
          </p>
          <p class="mt-1 text-sm text-gray-500">{{ sales.length }} transactions</p>
        </div>

        <div class="card p-6">
          <h3 class="text-lg font-medium text-gray-900">Outstanding Credits</h3>
          <p class="mt-2 text-3xl font-bold text-error-600">
            {{ new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX' }).format(totalCredits) }}
          </p>
          <p class="mt-1 text-sm text-gray-500">{{ credits.length }} credit sales</p>
        </div>

        <div class="card p-6">
          <h3 class="text-lg font-medium text-gray-900">Total Stock</h3>
          <p class="mt-2 text-3xl font-bold text-success-600">{{ totalStock }}kg</p>
          <p class="mt-1 text-sm text-gray-500">{{ produce.length }} produce types</p>
        </div>
      </div>

      <!-- Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Sales by Produce</h3>
          <div class="h-80">
            <Pie :data="salesByProduceData" :options="chartOptions" />
          </div>
        </div>

        <div class="card p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Current Stock Levels</h3>
          <div class="h-80">
            <Bar :data="stockLevelsData" :options="chartOptions" />
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="card p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div class="overflow-x-auto">
          <table class="table-auto w-full">
            <thead>
              <tr class="bg-gray-50">
                <th class="px-4 py-2 text-left">Date</th>
                <th class="px-4 py-2 text-left">Type</th>
                <th class="px-4 py-2 text-left">Produce</th>
                <th class="px-4 py-2 text-left">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sale in [...sales, ...credits].sort((a, b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              ).slice(0, 5)" :key="sale._id" class="hover:bg-gray-100">
                <td class="border px-4 py-2">{{ new Date(sale.createdAt).toLocaleDateString() }}</td>
                <td class="border px-4 py-2">
                  <span :class="'amountPaid' in sale ? 'text-success-600' : 'text-error-600'">
                    {{ 'amountPaid' in sale ? 'Sale' : 'Credit' }}
                  </span>
                </td>
                <td class="border px-4 py-2">{{ sale.produceId.name }} - {{ sale.produceId.type }}</td>
                <td class="border px-4 py-2">
                  {{ new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX' }).format(
                    'amountPaid' in sale ? sale.amountPaid : sale.amountDue
                  ) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
