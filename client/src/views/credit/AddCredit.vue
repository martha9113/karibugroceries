<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import api from '../../services/api'
import { useToast } from 'vue-toastification'
import { useRouter } from 'vue-router'

const toast = useToast()
const router = useRouter()
const authStore = useAuthStore()

// Form data
const formData = ref({
  buyerName: '',
  nationalId: '',
  location: '',
  contact: '',
  amountDue: '',
  dueDate: '',
  produceId: '',
  tonnage: ''
})

const produceList = ref([])
const selectedProduce = ref<any>(null)
const loading = ref(false)
const fetchingProduce = ref(true)
const errors = ref<Record<string, string>>({})

// Minimum due date (tomorrow)
const tomorrow = new Date()
tomorrow.setDate(tomorrow.getDate() + 1)
const minDueDate = tomorrow.toISOString().split('T')[0]

// Fetch produce list
const fetchProduce = async () => {
  fetchingProduce.value = true
  try {
    const response = await api.get('/produce')
    produceList.value = response.data.filter((p: any) => p.currentStock > 0)
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Failed to fetch produce')
  } finally {
    fetchingProduce.value = false
  }
}

onMounted(fetchProduce)

// Handle produce selection
const handleProduceChange = (e: Event) => {
  const target = e.target as HTMLSelectElement
  const selected = produceList.value.find((p: any) => p._id === target.value)
  
  if (selected) {
    selectedProduce.value = selected
    formData.value.produceId = selected._id
    // Update amount based on selected produce and current tonnage
    if (formData.value.tonnage) {
      formData.value.amountDue = (selected.sellingPrice * Number(formData.value.tonnage)).toString()
    }
  } else {
    selectedProduce.value = null
  }
}

// Calculate amount when tonnage changes
const updateAmount = () => {
  if (selectedProduce.value && formData.value.tonnage) {
    formData.value.amountDue = (selectedProduce.value.sellingPrice * Number(formData.value.tonnage)).toString()
  }
}

// Validate form
const validateForm = () => {
  const newErrors: Record<string, string> = {}
  
  if (!formData.value.buyerName.trim()) {
    newErrors.buyerName = 'Buyer name is required'
  } else if (formData.value.buyerName.length < 2) {
    newErrors.buyerName = 'Buyer name must be at least 2 characters'
  }
  
  if (!formData.value.nationalId.trim()) {
    newErrors.nationalId = 'National ID is required'
  } else if (!/^CM[A-Z0-9]{12}$/.test(formData.value.nationalId)) {
    newErrors.nationalId = 'Please enter a valid National ID number (format: CMXXXXXXXXXX)'
  }
  
  if (!formData.value.location.trim()) {
    newErrors.location = 'Location is required'
  } else if (formData.value.location.length < 2) {
    newErrors.location = 'Location must be at least 2 characters'
  }
  
  if (!formData.value.contact.trim()) {
    newErrors.contact = 'Contact number is required'
  } else if (!/^(\+256|0)[0-9]{9}$/.test(formData.value.contact)) {
    newErrors.contact = 'Please enter a valid Ugandan phone number'
  }
  
  if (!formData.value.dueDate) {
    newErrors.dueDate = 'Due date is required'
  }
  
  if (!formData.value.produceId) {
    newErrors.produceId = 'Please select a produce'
  }
  
  if (!formData.value.tonnage) {
    newErrors.tonnage = 'Tonnage is required'
  } else if (Number(formData.value.tonnage) <= 0) {
    newErrors.tonnage = 'Tonnage must be greater than 0'
  } else if (!Number.isInteger(Number(formData.value.tonnage))) {
    newErrors.tonnage = 'Tonnage must be a whole number'
  } else if (selectedProduce.value && Number(formData.value.tonnage) > selectedProduce.value.currentStock) {
    newErrors.tonnage = `Insufficient stock. Available: ${selectedProduce.value.currentStock}kg`
  }
  
  if (!formData.value.amountDue) {
    newErrors.amountDue = 'Amount is required'
  } else if (Number(formData.value.amountDue) <= 0) {
    newErrors.amountDue = 'Amount must be greater than 0'
  } else if (!Number.isInteger(Number(formData.value.amountDue))) {
    newErrors.amountDue = 'Amount must be a whole number'
  }
  
  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

// Submit form
const submitForm = async () => {
  if (!validateForm()) {
    toast.error('Please correct the errors in the form')
    return
  }
  
  loading.value = true
  try {
    const response = await api.post('/credit', {
      ...formData.value,
      tonnage: Number(formData.value.tonnage),
      amountDue: Number(formData.value.amountDue)
    })
    
    toast.success('Credit sale recorded successfully')
    router.push('/credit')
  } catch (err: any) {
    const errMsg = err.response?.data?.message || 'Failed to record credit sale'
    toast.error(errMsg)
    
    // Set validation errors from API if available
    if (err.response?.data?.errors) {
      const apiErrors: Record<string, string> = {}
      Object.entries(err.response.data.errors).forEach(([key, value]: [string, any]) => {
        apiErrors[key] = value.message
      })
      errors.value = apiErrors
    }
  } finally {
    loading.value = false
  }
}

// Format currency for display
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
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900">New Credit Sale</h1>
      <button 
        @click="router.push('/credit')" 
        class="btn btn-outline flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
        </svg>
        Back to Credit Sales
      </button>
    </div>

    <div v-if="fetchingProduce" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
    </div>
    
    <div v-else-if="produceList.length === 0" class="text-center py-12 bg-white rounded-lg shadow">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
      <h3 class="mt-2 text-lg font-medium text-gray-900">No produce available</h3>
      <p class="mt-1 text-gray-500">There is no produce in stock to sell.</p>
    </div>
    
    <div v-else class="card p-6">
      <form @submit.prevent="submitForm">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Buyer Name -->
          <div>
            <label for="buyerName" class="label">Buyer Name</label>
            <input
              id="buyerName"
              v-model="formData.buyerName"
              type="text"
              class="input"
              :class="{'border-error-500 focus:ring-error-500 focus:border-error-500': errors.buyerName}"
            />
            <p v-if="errors.buyerName" class="mt-1 text-sm text-error-600">{{ errors.buyerName }}</p>
          </div>
          
          <!-- National ID -->
          <div>
            <label for="nationalId" class="label">National ID</label>
            <input
              id="nationalId"
              v-model="formData.nationalId"
              type="text"
              class="input"
              :class="{'border-error-500 focus:ring-error-500 focus:border-error-500': errors.nationalId}"
            />
            <p v-if="errors.nationalId" class="mt-1 text-sm text-error-600">{{ errors.nationalId }}</p>
            <p v-else class="mt-1 text-xs text-gray-500">Format: CMXXXXXXXXXX</p>
          </div>
          
          <!-- Location -->
          <div>
            <label for="location" class="label">Location</label>
            <input
              id="location"
              v-model="formData.location"
              type="text"
              class="input"
              :class="{'border-error-500 focus:ring-error-500 focus:border-error-500': errors.location}"
            />
            <p v-if="errors.location" class="mt-1 text-sm text-error-600">{{ errors.location }}</p>
          </div>
          
          <!-- Contact -->
          <div>
            <label for="contact" class="label">Contact Number</label>
            <input
              id="contact"
              v-model="formData.contact"
              type="text"
              class="input"
              :class="{'border-error-500 focus:ring-error-500 focus:border-error-500': errors.contact}"
            />
            <p v-if="errors.contact" class="mt-1 text-sm text-error-600">{{ errors.contact }}</p>
            <p v-else class="mt-1 text-xs text-gray-500">Format: +256XXXXXXXXX or 0XXXXXXXXX</p>
          </div>
          
          <!-- Due Date -->
          <div>
            <label for="dueDate" class="label">Due Date</label>
            <input
              id="dueDate"
              v-model="formData.dueDate"
              type="date"
              :min="minDueDate"
              class="input"
              :class="{'border-error-500 focus:ring-error-500 focus:border-error-500': errors.dueDate}"
            />
            <p v-if="errors.dueDate" class="mt-1 text-sm text-error-600">{{ errors.dueDate }}</p>
          </div>
          
          <!-- Produce Selection -->
          <div>
            <label for="produceId" class="label">Select Produce</label>
            <select
              id="produceId"
              v-model="formData.produceId"
              @change="handleProduceChange"
              class="select"
              :class="{'border-error-500 focus:ring-error-500 focus:border-error-500': errors.produceId}"
            >
              <option value="">Select a produce</option>
              <option 
                v-for="produce in produceList" 
                :key="produce._id" 
                :value="produce._id"
              >
                {{ produce.name }} - {{ produce.type }} ({{ produce.currentStock }}kg available)
              </option>
            </select>
            <p v-if="errors.produceId" class="mt-1 text-sm text-error-600">{{ errors.produceId }}</p>
          </div>
          
          <!-- Produce Details (if selected) -->
          <div v-if="selectedProduce" class="bg-gray-50 p-4 rounded-md">
            <h3 class="font-medium text-gray-900">Selected Produce Details</h3>
            <div class="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div class="text-gray-500">Name:</div>
              <div class="font-medium">{{ selectedProduce.name }}</div>
              
              <div class="text-gray-500">Type:</div>
              <div class="font-medium">{{ selectedProduce.type }}</div>
              
              <div class="text-gray-500">Stock Available:</div>
              <div class="font-medium">{{ selectedProduce.currentStock }}kg</div>
              
              <div class="text-gray-500">Selling Price:</div>
              <div class="font-medium">{{ formatCurrency(selectedProduce.sellingPrice) }} per kg</div>
            </div>
          </div>
          
          <!-- Tonnage -->
          <div>
            <label for="tonnage" class="label">Quantity (kg)</label>
            <input
              id="tonnage"
              v-model="formData.tonnage"
              type="number"
              min="1"
              step="1"
              @input="updateAmount"
              class="input"
              :class="{'border-error-500 focus:ring-error-500 focus:border-error-500': errors.tonnage}"
              :max="selectedProduce ? selectedProduce.currentStock : undefined"
            />
            <p v-if="errors.tonnage" class="mt-1 text-sm text-error-600">{{ errors.tonnage }}</p>
            <p v-else-if="selectedProduce" class="mt-1 text-xs text-gray-500">
              Maximum available: {{ selectedProduce.currentStock }}kg
            </p>
          </div>
          
          <!-- Amount Due -->
          <div>
            <label for="amountDue" class="label">Amount Due (UGX)</label>
            <input
              id="amountDue"
              v-model="formData.amountDue"
              type="number"
              min="10000"
              step="1"
              class="input"
              :class="{'border-error-500 focus:ring-error-500 focus:border-error-500': errors.amountDue}"
            />
            <p v-if="errors.amountDue" class="mt-1 text-sm text-error-600">{{ errors.amountDue }}</p>
          </div>
        </div>
        
        <div class="mt-8 flex justify-end">
          <button
            type="button"
            @click="router.push('/credit')"
            class="btn btn-outline mr-3"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="loading"
          >
            <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ loading ? 'Processing...' : 'Record Credit Sale' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>