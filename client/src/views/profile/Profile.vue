<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../../stores/auth';
import axios from 'axios';

const authStore = useAuthStore();
const loading = ref(false);
const error = ref('');
const success = ref('');

const userData = ref({
  name: authStore.user?.name || '',
  email: authStore.user?.email || '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const updateProfile = async () => {
  loading.value = true;
  error.value = '';
  success.value = '';

  try {
    const { data } = await axios.put('/api/users/profile', {
      name: userData.value.name,
      email: userData.value.email
    });

    authStore.user = {
      ...authStore.user!,
      name: data.name,
      email: data.email
    };

    success.value = 'Profile updated successfully';
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to update profile';
  } finally {
    loading.value = false;
  }
};

const updatePassword = async () => {
  if (userData.value.newPassword !== userData.value.confirmPassword) {
    error.value = 'Passwords do not match';
    return;
  }

  loading.value = true;
  error.value = '';
  success.value = '';

  try {
    await axios.put('/api/users/password', {
      currentPassword: userData.value.currentPassword,
      newPassword: userData.value.newPassword
    });

    success.value = 'Password updated successfully';
    userData.value.currentPassword = '';
    userData.value.newPassword = '';
    userData.value.confirmPassword = '';
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to update password';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="p-6">
    <div class="max-w-2xl mx-auto">
      <h1 class="text-2xl font-bold mb-6">Profile Settings</h1>

      <div class="bg-white rounded-lg shadow divide-y divide-gray-200">
        <!-- Profile Information -->
        <div class="p-6">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Profile Information</h2>
          <form @submit.prevent="updateProfile" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Name</label>
              <input
                
                type="text"
                v-model="userData.name"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                v-model="userData.email"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div class="flex justify-end">
              <button
                type="submit"
                :disabled="loading"
                class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                {{ loading ? 'Updating...' : 'Update Profile' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Change Password -->
        <div class="p-6">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Change Password</h2>
          <form @submit.prevent="updatePassword" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Current Password</label>
              <input
                type="password"
                v-model="userData.currentPassword"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">New Password</label>
              <input
                type="password"
                v-model="userData.newPassword"
                required
                minlength="6"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Confirm New Password</label>
              <input
                type="password"
                v-model="userData.confirmPassword"
                required
                minlength="6"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div class="flex justify-end">
              <button
                type="submit"
                :disabled="loading"
                class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                {{ loading ? 'Updating...' : 'Change Password' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Status Messages -->
        <div v-if="error || success" class="p-6">
          <p v-if="error" class="text-red-600">{{ error }}</p>
          <p v-if="success" class="text-green-600">{{ success }}</p>
        </div>
      </div>
    </div>
  </div>
</template>