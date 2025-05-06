<script setup lang="ts">
    import { ref, onMounted } from 'vue'
    import api from '../../services/api'
    import { useToast } from 'vue-toastification'
    import { useRouter } from 'vue-router'
    import { useAuthStore } from '../../stores/auth'

    interface Credit {
      _id: string
      buyerName: string
      produce: {
        name: string
        type: string
      }
      tonnage: number
      amountDue: number
      dueDate: string
      createdAt: string
      status: string
      amountPaid: number
      branch: string
    }

    const toast = useToast()
    const router = useRouter()
    const authStore = useAuthStore()
    const isDirector = ref(authStore.user?.role === 'director')

    const credits = ref<Credit[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)
    const deletingId = ref('')

    const fetchCredits = async () => {
      loading.value = true
      error.value = null
      try {
        console.log('Fetching credits...')
        const response = await api.get('/credit')
        console.log('Raw API Response:', response)
        console.log('Credits API Response Data:', response.data)
        
        if (!response.data || !Array.isArray(response.data)) {
          console.error('Invalid response format:', response.data)
          error.value = 'Invalid data format received from server'
          return
        }

        credits.value = response.data.filter((credit: Credit) => {
          const isValid = credit.produce && credit.produce.name && credit.produce.type
          if (!isValid) {
            console.log('Filtered out invalid credit:', credit)
          }
          return isValid
        })
        
        console.log('Final filtered credits:', credits.value)
      } catch (error: any) {
        console.error('Error fetching credits:', error)
        console.error('Error details:', {
          message: error.message,
          response: error.response,
          status: error.response?.status
        })
        const errorMessage = error.response?.data?.message || 'Failed to fetch credit sales'
        toast.error(errorMessage)
        error.value = errorMessage
      } finally {
        loading.value = false
      }
    }

    // Delete credit sale
    const deleteCreditSale = async (id: string) => {
      if (!confirm('Are you sure you want to delete this credit sale? This will restore the stock and cannot be undone.')) {
        return
      }

      deletingId.value = id
      try {
        await api.delete(`/credit/${id}`)
        toast.success('Credit sale deleted successfully and stock restored')
        credits.value = credits.value.filter(c => c._id !== id)
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to delete credit sale')
      } finally {
        deletingId.value = ''
      }
    }

    onMounted(fetchCredits)

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
          <h1 class="text-2xl font-bold text-gray-900">Credit Sales List</h1>
          <button @click="router.push('/credit/add')" class="btn btn-primary flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 011 1h-3v3a1 1 0 01-1 1H9v-3a1 1 0 01-1-1h3V6a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
            Record New Credit Sale
          </button>
        </div>

        <div v-if="loading" class="flex justify-center items-center h-64">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>

        <div v-else-if="error" class="text-center py-12 bg-white rounded-lg shadow">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-error-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 class="mt-2 text-lg font-medium text-gray-900">Error Loading Credits</h3>
          <p class="mt-1 text-gray-500">{{ error }}</p>
          <button @click="fetchCredits" class="mt-4 btn btn-primary">Try Again</button>
        </div>

        <div v-else-if="credits.length === 0" class="text-center py-12 bg-white rounded-lg shadow">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          <h3 class="mt-2 text-lg font-medium text-gray-900">No credit sales recorded yet</h3>
          <p class="mt-1 text-gray-500">Start recording your credit sales to keep track of your business.</p>
          <button @click="router.push('/credit/add')" class="mt-4 btn btn-primary">Record First Credit Sale</button>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="table-auto w-full">
            <thead>
              <tr class="bg-gray-50">
                <th class="px-4 py-2 text-left">Buyer Name</th>
                <th class="px-4 py-2 text-left">Produce</th>
                <th class="px-4 py-2 text-left">Quantity (kg)</th>
                <th class="px-4 py-2 text-left">Amount Due</th>
                <th class="px-4 py-2 text-left">Due Date</th>
                <th class="px-4 py-2 text-left">Date</th>
                <th class="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="credit in credits" :key="credit._id" class="hover:bg-gray-100">
                <td class="border px-4 py-2">{{ credit.buyerName }}</td>
                <td class="border px-4 py-2">{{ credit.produce.name }} - {{ credit.produce.type }}</td>
                <td class="border px-4 py-2">{{ credit.tonnage }}kg</td>
                <td class="border px-4 py-2">{{ formatCurrency(credit.amountDue) }}</td>
                <td class="border px-4 py-2">{{ new Date(credit.dueDate).toLocaleDateString() }}</td>
                <td class="border px-4 py-2">{{ new Date(credit.createdAt).toLocaleDateString() }}</td>
                <td class="border px-4 py-2">
                  <button 
                    v-if="isDirector"
                    @click="deleteCreditSale(credit._id)" 
                    class="text-error-600 hover:text-error-900"
                    :disabled="deletingId === credit._id"
                  >
                    <span v-if="deletingId === credit._id">Deleting...</span>
                    <span v-else>Delete</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
