<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import api from '../../services/api'
import { useToast } from 'vue-toastification'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js'
import { Bar, Pie } from 'vue-chartjs'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

const toast = useToast()
const loading = ref(false)
const error = ref<string | null>(null)

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

type Transaction = (Sale & { type: 'sale' }) | (Credit & { type: 'credit' })

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
  error.value = null
  
  try {
    console.log('Fetching report data...')
    const [salesRes, creditsRes, produceRes] = await Promise.all([
      api.get('/sales'),
      api.get('/credit'),
      api.get('/produce')
    ])
    
    console.log('Sales data:', salesRes.data)
    console.log('Credits data:', creditsRes.data)
    console.log('Produce data:', produceRes.data)
    
    sales.value = salesRes.data || []
    credits.value = creditsRes.data || []
    produce.value = produceRes.data || []
    
    if (sales.value.length === 0 && credits.value.length === 0 && produce.value.length === 0) {
      error.value = 'No data available to display'
    }
  } catch (error: any) {
    console.error('Error fetching report data:', error)
    const errorMessage = error.response?.data?.message || 'Failed to fetch report data'
    toast.error(errorMessage)
    error.value = errorMessage
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)

// Computed properties for summary statistics
const totalSales = computed(() => {
  return sales.value.reduce((sum, sale) => sum + (sale.amountPaid || 0), 0)
})

const totalCredits = computed(() => {
  return credits.value.reduce((sum, credit) => sum + (credit.amountDue || 0), 0)
})

const totalStock = computed(() => {
  return produce.value.reduce((sum, item) => sum + (item.currentStock || 0), 0)
})

// Chart data for sales by produce
const salesByProduceData = computed(() => {
  const produceSales = new Map<string, number>()
  
  sales.value.forEach(sale => {
    if (sale.produceId) {
      const key = `${sale.produceId.name} - ${sale.produceId.type}`
      produceSales.set(key, (produceSales.get(key) || 0) + (sale.amountPaid || 0))
    }
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
      data: produce.value.map(p => p.currentStock || 0),
      backgroundColor: '#4F46E5'
    }]
  }
})

// Chart options
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const
    }
  }
}

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0
  }).format(amount)
}

// Get recent transactions
const recentTransactions = computed(() => {
  const allTransactions: Transaction[] = [
    ...sales.value.map(s => ({ ...s, type: 'sale' as const })),
    ...credits.value.map(c => ({ ...c, type: 'credit' as const }))
  ].filter(t => t.produceId && t.produceId.name && t.produceId.type) // Filter out invalid transactions
  
  return allTransactions
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
})
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Business Reports</h1>
      <button @click="fetchData" class="btn btn-outline flex items-center" :disabled="loading">
        <svg v-if="loading" class="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
        </svg>
        {{ loading ? 'Refreshing...' : 'Refresh Data' }}
      </button>
    </div>

    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
    </div>

    <div v-else-if="error" class="text-center py-12 bg-white rounded-lg shadow">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-error-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <h3 class="mt-2 text-lg font-medium text-gray-900">Error Loading Data</h3>
      <p class="mt-1 text-gray-500">{{ error }}</p>
      <button @click="fetchData" class="mt-4 btn btn-primary">Try Again</button>
    </div>

    <div v-else-if="sales.length === 0 && credits.length === 0 && produce.length === 0" class="text-center py-12 bg-white rounded-lg shadow">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h3 class="mt-2 text-lg font-medium text-gray-900">No Data Available</h3>
      <p class="mt-1 text-gray-500">Start recording sales and credits to see your business reports.</p>
    </div>

    <div v-else class="space-y-6">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="card p-6">
          <h3 class="text-lg font-medium text-gray-900">Total Sales</h3>
          <p class="mt-2 text-3xl font-bold text-primary-600">
            {{ formatCurrency(totalSales) }}
          </p>
          <p class="mt-1 text-sm text-gray-500">{{ sales.length }} transactions</p>
        </div>

        <div class="card p-6">
          <h3 class="text-lg font-medium text-gray-900">Outstanding Credits</h3>
          <p class="mt-2 text-3xl font-bold text-error-600">
            {{ formatCurrency(totalCredits) }}
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
            <Pie v-if="sales.length > 0" :data="salesByProduceData" :options="chartOptions" />
            <div v-else class="h-full flex items-center justify-center text-gray-500">
              No sales data available
            </div>
          </div>
        </div>

        <div class="card p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Current Stock Levels</h3>
          <div class="h-80">
            <Bar v-if="produce.length > 0" :data="stockLevelsData" :options="chartOptions" />
            <div v-else class="h-full flex items-center justify-center text-gray-500">
              No stock data available
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="card p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div v-if="recentTransactions.length > 0" class="overflow-x-auto">
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
              <tr v-for="transaction in recentTransactions" :key="transaction._id" class="hover:bg-gray-100">
                <td class="border px-4 py-2">{{ new Date(transaction.createdAt).toLocaleDateString() }}</td>
                <td class="border px-4 py-2">
                  <span :class="transaction.type === 'sale' ? 'text-success-600' : 'text-error-600'">
                    {{ transaction.type === 'sale' ? 'Sale' : 'Credit' }}
                  </span>
                </td>
                <td class="border px-4 py-2">
                  {{ transaction.produceId?.name || 'N/A' }} - {{ transaction.produceId?.type || 'N/A' }}
                </td>
                <td class="border px-4 py-2">
                  {{ formatCurrency(transaction.type === 'sale' ? (transaction as Sale).amountPaid : (transaction as Credit).amountDue) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="text-center py-8 text-gray-500">
          No recent transactions
        </div>
      </div>
    </div>
  </div>
</template>
