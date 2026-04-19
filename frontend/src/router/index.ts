import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: () => import('../views/LoginView.vue'), meta: { public: true } },
    { path: '/register', component: () => import('../views/RegisterView.vue'), meta: { public: true } },
    { path: '/onboarding', component: () => import('../views/OnboardingView.vue'), meta: { requiresAuth: true } },
    { path: '/', component: () => import('../views/DashboardView.vue'), meta: { requiresAuth: true } },
    { path: '/health-entry', component: () => import('../views/HealthEntryView.vue'), meta: { requiresAuth: true } },
    { path: '/meal-journal', component: () => import('../views/MealJournalView.vue'), meta: { requiresAuth: true } },
    { path: '/menu-generator', component: () => import('../views/MenuGeneratorView.vue'), meta: { requiresAuth: true } },
    { path: '/history', component: () => import('../views/HistoryView.vue'), meta: { requiresAuth: true } },
    { path: '/profile', component: () => import('../views/ProfileView.vue'), meta: { requiresAuth: true } },
  ]
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  if (authStore.loading) await authStore.init()
  if (to.meta.requiresAuth && !authStore.user) return '/login'
  if (to.meta.public && authStore.user) {
    if (!authStore.profile) return '/onboarding'
    return '/'
  }
  if (to.meta.requiresAuth && authStore.user && !authStore.profile && to.path !== '/onboarding') return '/onboarding'
})

export default router
