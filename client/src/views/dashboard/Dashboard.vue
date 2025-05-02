<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../../stores/auth'
import api from '../../services/api'
import { useToast } from 'vue-toastification'

const toast = useToast()
const authStore = useAuthStore()
const user = computed(() => authStore.user)
const isDirector = computed(() => user.value?.role === 'director')
const isManager = computed(() => user.value?.role === 'manager')
const isSalesAgent = computed(() => user.value?.role === 'sales_agent')

// Data for dashboard
const loading = ref(true)
const error = ref('')
const dashboardData = ref<any>(null)

// Fetch data based on user role
onMounted(async () => {
  try {
    if (isDirector.value) {
      const response = await api.get('/reports/dashboard')
      dashboardData.value = response.data
    } else if (isManager.value) {
      const response = await api.get('/reports/branch')
      dashboardData.value = response.data
    } else {
      // For sales agents
      const [recentSales, produceResponse] = await Promise.all([
        api.get('/sales/recent'),
        api.get('/produce')
      ])
      
      dashboardData.value = {
        recentSales: recentSales.data,
        availableProduce: produceResponse.data
      }
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Error loading dashboard data'
    toast.error(error.value)
  } finally {
    loading.value = false
  }
})

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-UG', { 
    style: 'currency', 
    currency: 'UGX',
    minimumFractionDigits: 0
  }).format(amount)
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
    
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
    </div>
    
    <div v-else-if="error" class="bg-error-50 text-error-700 p-4 rounded-md">
      {{ error }}
    </div>
    
    <div v-else>
      <!-- Director Dashboard -->
      <div v-if="isDirector && dashboardData" class="space-y-6">
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Branch Summary Cards -->
          <div 
            v-for="(branch, index) in dashboardData.salesByBranch" 
            :key="index"
            class="card p-5 bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200"
          >
            <h3 class="text-lg font-semibold text-primary-800">{{ branch._id }} Branch</h3>
            <p class="text-2xl font-bold text-primary-900 mt-2">
              {{ formatCurrency(branch.totalSales) }}
            </p>
            <p class="text-sm text-primary-700 mt-1">
              Total Sales ({{ branch.count }} transactions)
            </p>
          </div>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Top Selling Products -->
          <div class="card p-5">
            <h3 class="text-lg font-semibold mb-4">Top Selling Products</h3>
            <div class="space-y-4">
              <div 
                v-for="(product, index) in dashboardData.salesByProduce" 
                :key="index"
                class="flex justify-between items-center p-3 bg-gray-50 rounded-md"
              >
                <div>
                  <h4 class="font-medium">{{ product._id }}</h4>
                  <p class="text-sm text-gray-500">{{ product.totalTonnage }}kg sold</p>
                </div>
                <span class="text-lg font-semibold">
                  {{ formatCurrency(product.totalSales) }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- Outstanding Credit -->
          <div class="card p-5">
            <h3 class="text-lg font-semibold mb-4">Outstanding Credit</h3>
            <div class="space-y-4">
              <div 
                v-for="(credit, index) in dashboardData.outstandingCredit" 
                :key="index"
                class="flex justify-between items-center p-3 bg-gray-50 rounded-md"
              >
                <div>
                  <h4 class="font-medium">{{ credit._id }} Branch</h4>
                  <p class="text-sm text-gray-500">{{ credit.count }} pending payments</p>
                </div>
                <span class="text-lg font-semibold text-warning-600">
                  {{ formatCurrency(credit.totalOutstanding) }}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Stock by Branch -->
        <div class="card p-5">
          <h3 class="text-lg font-semibold mb-4">Current Stock Levels</h3>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Stock (kg)
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unique Products
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="(branch, index) in dashboardData.stockByBranch" :key="index">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {{ branch._id }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ branch.totalStock.toLocaleString() }} kg
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ branch.produceCount }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <!-- Manager Dashboard -->
      <div v-else-if="isManager && dashboardData" class="space-y-6">
        <!-- Stock Levels -->
        <div class="card p-5">
          <h3 class="text-lg font-semibold mb-4">Stock Levels</h3>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produce
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Stock
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="(produce, index) in dashboardData.stockLevels" :key="index">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {{ produce.name }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ produce.type }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ produce.currentStock.toLocaleString() }} kg
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span 
                      :class="[
                        'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                        produce.currentStock < produce.tonnage * 0.2 
                          ? 'bg-error-100 text-error-800' 
                          : produce.currentStock < produce.tonnage * 0.5 
                            ? 'bg-warning-100 text-warning-800' 
                            : 'bg-success-100 text-success-800'
                      ]"
                    >
                      {{ 
                        produce.currentStock < produce.tonnage * 0.2 
                          ? 'Low Stock' 
                          : produce.currentStock < produce.tonnage * 0.5 
                            ? 'Medium' 
                            : 'Good' 
                      }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Top Products -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="card p-5">
            <h3 class="text-lg font-semibold mb-4">Top Selling Products</h3>
            <div class="space-y-4">
              <div 
                v-for="(product, index) in dashboardData.topProducts" 
                :key="index"
                class="flex justify-between items-center p-3 bg-gray-50 rounded-md"
              >
                <div>
                  <h4 class="font-medium">{{ product._id }}</h4>
                  <p class="text-sm text-gray-500">{{ product.totalTonnage }}kg sold</p>
                </div>
                <span class="text-lg font-semibold">
                  {{ formatCurrency(product.totalSales) }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- Agent Performance -->
          <div class="card p-5">
            <h3 class="text-lg font-semibold mb-4">Sales Agent Performance</h3>
            <div class="space-y-4">
              <div 
                v-for="(agent, index) in dashboardData.agentPerformance" 
                :key="index"
                class="flex justify-between items-center p-3 bg-gray-50 rounded-md"
              >
                <div>
                  <h4 class="font-medium">{{ agent.name }}</h4>
                  <p class="text-sm text-gray-500">{{ agent.saleCount }} sales</p>
                </div>
                <span class="text-lg font-semibold">
                  {{ formatCurrency(agent.totalSales) }}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Upcoming Due Dates -->
        <div class="card p-5">
          <h3 class="text-lg font-semibold mb-4">Upcoming Credit Due Dates</h3>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Buyer
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount Due
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount Paid
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="(credit, index) in dashboardData.upcomingDueDates" :key="index">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {{ credit.buyerName }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ formatCurrency(credit.amountDue) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ formatCurrency(credit.amountPaid) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ new Date(credit.dueDate).toLocaleDateString() }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <!-- Sales Agent Dashboard -->
      <div v-else-if="isSalesAgent && dashboardData" class="space-y-6">
        <!-- Available Products -->
        <div class="card p-5">
          <h3 class="text-lg font-semibold mb-4">Available Products</h3>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produce
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Available Stock
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="(produce, index) in dashboardData.availableProduce" :key="index">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {{ produce.name }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ produce.type }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ produce.currentStock.toLocaleString() }} kg
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ formatCurrency(produce.sellingPrice) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <router-link 
                      :to="`/sales/add?produceId=${produce._id}`" 
                      class="text-primary-600 hover:text-primary-800"
                    >
                      Sell
                    </router-link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Recent Sales -->
        <div class="card p-5">
          <h3 class="text-lg font-semibold mb-4">Your Recent Sales</h3>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Buyer
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="(sale, index) in dashboardData.recentSales" :key="index">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ new Date(sale.createdAt).toLocaleDateString() }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {{ sale.produce.name }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ sale.buyerName }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ sale.tonnage }}kg
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ formatCurrency(sale.amountPaid) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>