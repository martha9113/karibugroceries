<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../../stores/auth'
import api from '../../services/api'
import { useToast } from 'vue-toastification'
import { useRouter } from 'vue-router'

const toast = useToast()
const router = useRouter()
const authStore = useAuthStore()
const userBranch = ref(authStore.user?.branch || '')

// Form data
const formData = ref({
  name: '',
  type: '',
  tonnage: '',
  cost: '',
  sellingPrice: '',
  dealer: '',
  dealerContact: '',
  branch: userBranch.value,
  source: 'Individual'
})

const sources = ['Individual', 'Company', 'Own Farm']
const loading = ref(false)
const errors = ref<Record<string, string>>({})

// Validate form
const validateForm = () => {
  const newErrors: Record<string, string> = {}
  
  if (!formData.value.name.trim()) {
    newErrors.name = 'Produce name is required'
  } else if (formData.value.name.length < 2) {
    newErrors.name = 'Name must be at least 2 characters'
  }
  
  if (!formData.value.type.trim()) {
    newErrors.type = 'Produce type is required'
  } else if (formData.value.type.length < 2) {
    newErrors.type = 'Type must be at least 2 characters'
  } else if (!/^[a-zA-Z\s]+$/.test(formData.value.type)) {
    newErrors.type = 'Type must contain only alphabets'
  }
  
  if (!formData.value.tonnage) {
    newErrors.tonnage = 'Tonnage is required'
  } else if (Number(formData.value.tonnage) < 3) {
    newErrors.tonnage = 'Tonnage must be at least 3kg'
  } else if (!Number.isInteger(Number(formData.value.tonnage))) {
    newErrors.tonnage = 'Tonnage must be a whole number'
  }
  
  if (!formData.value.cost) {
    newErrors.cost = 'Cost is required'
  } else if (Number(formData.value.cost) < 10000) {
    newErrors.cost = 'Cost must be at least 10,000 UGX'
  } else if (!Number.isInteger(Number(formData.value.cost))) {
    newErrors.cost = 'Cost must be a whole number'
  }
  
  if (!formData.value.sellingPrice) {
    newErrors.sellingPrice = 'Selling price is required'
  } else if (Number(formData.value.sellingPrice) < 10000) {
    newErrors.sellingPrice = 'Selling price must be at least 10,000 UGX'
  } else if (!Number.isInteger(Number(formData.value.sellingPrice))) {
    newErrors.sellingPrice = 'Selling price must be a whole number'
  }
  
  if (!formData.value.dealer.trim()) {
    newErrors.dealer = 'Dealer name is required'
  } else if (formData.value.dealer.length < 2) {
    newErrors.dealer = 'Dealer name must be at least 2 characters'
  }
  
  if (!formData.value.dealerContact.trim()) {
    newErrors.dealerContact = 'Dealer contact is required'
  } else if (!/^(\+256|0)[0-9]{9}$/.test(formData.value.dealerContact)) {
    newErrors.dealerContact = 'Please enter a valid Ugandan phone number'
  }
  
  if (!formData.value.branch) {
    newErrors.branch = 'Branch is required'
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
    const response = await api.post('/produce', {
      ...formData.value,
      tonnage: Number(formData.value.tonnage),
      cost: Number(formData.value.cost),
      sellingPrice: Number(formData.value.sellingPrice)
    })
    
    toast.success('Produce added successfully')
    router.push('/produce')
  } catch (err: any) {
    const errMsg = err.response?.data?.message || 'Failed to add produce'
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
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Add New Produce</h1>
      <button 
        @click="router.push('/produce')" 
        class="btn btn-outline flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
        </svg>
        Back to List
      </button>
    </div>

    <div class="card p-6">
      <form @submit.prevent="submitForm">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Name -->
          <div>
            <label for="name" class="label">Produce Name</label>
            <input
              id="name"
              v-model="formData.name"
              type="text"
              class="input"
              :class="{'border-error-500 focus:ring-error-500 focus:border-error-500': errors.name}"
            />
            <p v-if="errors.name" class="mt-1 text-sm text-error-600">{{ errors.name }}</p>
          </div>
          
          <!-- Type -->
          <div>
            <label for="type" class="label">Produce Type</label>
            <input
              id="type"
              v-model="formData.type"
              type="text"
              class="input"
              :class="{'border-error-500 focus:ring-error-500 focus:border-error-500': errors.type}"
            />
            <p v-if="errors.type" class="mt-1 text-sm text-error-600">{{ errors.type }}</p>
            <p v-else class="mt-1 text-xs text-gray-500">Type must contain only alphabetic characters</p>
          </div>
          
          <!-- Tonnage -->
          <div>
            <label for="tonnage" class="label">Tonnage (kg)</label>
            <input
              id="tonnage"
              v-model="formData.tonnage"
              type="number"
              min="3"
              step="1"
              class="input"
              :class="{'border-error-500 focus:ring-error-500 focus:border-error-500': errors.tonnage}"
            />
            <p v-if="errors.tonnage" class="mt-1 text-sm text-error-600">{{ errors.tonnage }}</p>
            <p v-else class="mt-1 text-xs text-gray-500">Minimum 3kg, whole numbers only</p>
          </div>
          
          <!-- Cost -->
          <div>
            <label for="cost" class="label">Cost (UGX)</label>
            <input
              id="cost"
              v-model="formData.cost"
              type="number"
              min="10000"
              step="1"
              class="input"
              :class="{'border-error-500 focus:ring-error-500 focus:border-error-500': errors.cost}"
            />
            <p v-if="errors.cost" class="mt-1 text-sm text-error-600">{{ errors.cost }}</p>
            <p v-else class="mt-1 text-xs text-gray-500">Minimum 10,000 UGX, whole numbers only</p>
          </div>
          
          <!-- Selling Price -->
          <div>
            <label for="sellingPrice" class="label">Selling Price (UGX)</label>
            <input
              id="sellingPrice"
              v-model="formData.sellingPrice"
              type="number"
              min="10000"
              step="1"
              class="input"
              :class="{'border-error-500 focus:ring-error-500 focus:border-error-500': errors.sellingPrice}"
            />
            <p v-if="errors.sellingPrice" class="mt-1 text-sm text-error-600">{{ errors.sellingPrice }}</p>
            <p v-else class="mt-1 text-xs text-gray-500">Minimum 10,000 UGX, whole numbers only</p>
          </div>
          
          <!-- Dealer -->
          <div>
            <label for="dealer" class="label">Dealer Name</label>
            <input
              id="dealer"
              v-model="formData.dealer"
              type="text"
              class="input"
              :class="{'border-error-500 focus:ring-error-500 focus:border-error-500': errors.dealer}"
            />
            <p v-if="errors.dealer" class="mt-1 text-sm text-error-600">{{ errors.dealer }}</p>
          </div>
          
          <!-- Dealer Contact -->
          <div>
            <label for="dealerContact" class="label">Dealer Contact</label>
            <input
              id="dealerContact"
              v-model="formData.dealerContact"
              type="text"
              class="input"
              :class="{'border-error-500 focus:ring-error-500 focus:border-error-500': errors.dealerContact}"
            />
            <p v-if="errors.dealerContact" class="mt-1 text-sm text-error-600">{{ errors.dealerContact }}</p>
            <p v-else class="mt-1 text-xs text-gray-500">Format: +256XXXXXXXXX or 0XXXXXXXXX</p>
          </div>
          
          <!-- Branch -->
          <div>
            <label for="branch" class="label">Branch</label>
            <select
              id="branch"
              v-model="formData.branch"
              class="select"
              :class="{'border-error-500 focus:ring-error-500 focus:border-error-500': errors.branch}"
              :disabled="authStore.user?.role !== 'director'"
            >
              <option value="Maganjo">Maganjo</option>
              <option value="Matugga">Matugga</option>
            </select>
            <p v-if="errors.branch" class="mt-1 text-sm text-error-600">{{ errors.branch }}</p>
          </div>
          
          <!-- Source -->
          <div>
            <label for="source" class="label">Source</label>
            <select
              id="source"
              v-model="formData.source"
              class="select"
            >
              <option v-for="source in sources" :key="source" :value="source">{{ source }}</option>
            </select>
          </div>
        </div>
        
        <div class="mt-8 flex justify-end">
          <button
            type="button"
            @click="router.push('/produce')"
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
            {{ loading ? 'Saving...' : 'Save Produce' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>