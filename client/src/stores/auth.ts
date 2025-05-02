import { defineStore } from 'pinia'
import axios from 'axios'
import { ref, computed } from 'vue'
import { useToast } from 'vue-toastification'
import api from '../services/api'

const toast = useToast()

export interface User {
  _id: string
  name: string
  email: string
  role: 'manager' | 'sales_agent' | 'director'
  branch: string
  contact: string
  token: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Check if user is in localStorage on store initialization
  const storedUser = localStorage.getItem('user')
  if (storedUser) {
    try {
      const parsedUser = JSON.parse(storedUser) as User
      user.value = parsedUser
      // Set authorization header with token
      if (parsedUser.token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${parsedUser.token}`
      }
    } catch (e) {
      console.error('Error parsing stored user', e)
      localStorage.removeItem('user')
    }
  }
  
  // Computed property for authentication status
  const isAuthenticated = computed(() => !!user.value)
  
  // Login
  const login = async (email: string, password: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.post('/auth/login', { email, password })
      const userData = response.data as User
      user.value = userData
      
      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(userData))
      
      // Set authorization header
      if (userData.token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`
      }
      
      toast.success('Login successful')
      return true
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        error.value = err.response.data.message || 'Error during login'
      } else {
        error.value = 'Error connecting to the server'
      }
      toast.error(error.value)
      return false
    } finally {
      loading.value = false
    }
  }
  
  // Register
  const register = async (userData: {
    name: string
    email: string
    password: string
    role: string
    branch: string
    contact: string
  }) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.post('/auth/register', userData)
      const newUser = response.data as User
      user.value = newUser
      
      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(newUser))
      
      // Set authorization header
      if (newUser.token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${newUser.token}`
      }
      
      toast.success('Registration successful')
      return true
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        error.value = err.response.data.message || 'Error during registration'
      } else {
        error.value = 'Error connecting to the server'
      }
      toast.error(error.value)
      return false
    } finally {
      loading.value = false
    }
  }
  
  // Logout
  const logout = () => {
    user.value = null
    localStorage.removeItem('user')
    delete api.defaults.headers.common['Authorization']
    toast.info('Logged out successfully')
  }
  
  return {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout
  }
})