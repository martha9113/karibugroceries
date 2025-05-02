<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useAuthStore } from '../../stores/auth';
import BarChart from '../../components/dashboard/BarChart.vue';
import PieChart from '../../components/dashboard/PieChart.vue';

interface ReportData {
  salesByMonth: {
    labels: string[];
    data: number[];
  };
  produceDistribution: {
    labels: string[];
    data: number[];
  };
  totalRevenue: number;
  totalSales: number;
  totalCredit: number;
  pendingPayments: number;
}

const authStore = useAuthStore();
const loading = ref(true);
const error = ref('');
const reportData = ref<ReportData | null>(null);
const selectedYear = ref(new Date().getFullYear());
const selectedMonth = ref(new Date().getMonth() + 1);

const fetchReportData = async () => {
  loading.value = true;
  error.value = '';

  try {
    const { data } = await axios.get(`/api/reports?year=${selectedYear.value}&month=${selectedMonth.value}`);
    reportData.value = data;
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to fetch report data';
  } finally {
    loading.value = false;
  }
};

onMounted(fetchReportData);
</script>

<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Reports</h1>
      <div class="flex space-x-4">
        <select
          v-model="selectedMonth"
          @change="fetchReportData"
          class="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="1">January</option>
          <option value="2">February</option>
          <option value="3">March</option>
          <option value="4">April</option>
          <option value="5">May</option>
          <option value="6">June</option>
          <option value="7">July</option>
          <option value="8">August</option>
          <option value="9">September</option>
          <option value="10">October</option>
          <option value="11">November</option>
          <option value="12">December</option>
        </select>
        <select
          v-model="selectedYear"
          @change="fetchReportData"
          class="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option :value="year" v-for="year in [2023, 2024, 2025]" :key="year">{{ year }}</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="text-center py-8">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
    </div>

    <div v-else-if="error" class="text-red-600 text-center py-8">
      {{ error }}
    </div>

    <div v-else-if="reportData" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-medium text-gray-900">Total Revenue</h3>
          <p class="text-2xl font-semibold">UGX {{ reportData.totalRevenue.toLocaleString() }}</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-medium text-gray-900">Total Sales</h3>
          <p class="text-2xl font-semibold">{{ reportData.totalSales }}</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-medium text-gray-900">Credit Sales</h3>
          <p class="text-2xl font-semibold">{{ reportData.totalCredit }}</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-medium text-gray-900">Pending Payments</h3>
          <p class="text-2xl font-semibold">UGX {{ reportData.pendingPayments.toLocaleString() }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white p-6 rounded-lg shadow">
          <h2 class="text-xl font-semibold mb-4">Monthly Sales Trend</h2>
          <BarChart />
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow">
          <h2 class="text-xl font-semibold mb-4">Produce Distribution</h2>
          <PieChart />
        </div>
      </div>
    </div>
  </div>
</template>