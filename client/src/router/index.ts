import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    guest?: boolean
    roles?: string[]
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/auth/Login.vue'),
      meta: { guest: true }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/auth/Register.vue'),
      meta: { guest: true }
    },
    // Dashboard routes based on role
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/dashboard/Dashboard.vue'),
      meta: { requiresAuth: true }
    },
    // Produce routes
    {
      path: '/produce',
      name: 'produce',
      component: () => import('../views/produce/ProduceList.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/produce/add',
      name: 'add-produce',
      component: () => import('../views/produce/AddProduce.vue'),
      meta: { requiresAuth: true, roles: ['manager', 'director'] }
    },
    {
      path: '/produce/:id',
      name: 'produce-details',
      component: () => import('../views/produce/ProduceDetails.vue'),
      meta: { requiresAuth: true }
    },
    // Sales routes
    {
      path: '/sales',
      name: 'sales',
      component: () => import('../views/sales/SalesList.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/sales/add',
      name: 'add-sale',
      component: () => import('../views/sales/AddSale.vue'),
      meta: { requiresAuth: true }
    },
    // Credit routes
    {
      path: '/credit',
      name: 'credit',
      component: () => import('../views/credit/CreditList.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/credit/add',
      name: 'add-credit',
      component: () => import('../views/credit/AddCredit.vue'),
      meta: { requiresAuth: true }
    },
    // Reports routes
    {
      path: '/reports',
      name: 'reports',
      component: () => import('../views/reports/Reports.vue'),
      meta: { requiresAuth: true }
    },
    // Profile routes
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/profile/Profile.vue'),
      meta: { requiresAuth: true }
    },
    // Not found
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFound.vue')
    }
  ]
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const isAuthenticated = authStore.isAuthenticated
  const userRole = authStore.user?.role
  
  // Check if route requires authentication
  if (to.meta.requiresAuth && !isAuthenticated) {
    // Only redirect to login if not already going there
    if (to.name !== 'login') {
      next({ name: 'login', query: { redirect: to.fullPath } })
    } else {
      next()
    }
  } 
  // Check if route is for guests only (like login page)
  else if (to.meta.guest && isAuthenticated) {
    // Only redirect to dashboard if not already going there
    if (to.name !== 'dashboard') {
      next({ name: 'dashboard' })
    } else {
      next()
    }
  }
  // Check for role-based access
  else if (to.meta.roles && userRole && !to.meta.roles.includes(userRole) && isAuthenticated) {
    next({ name: 'dashboard' })
  }
  else {
    next()
  }
})

export default router