<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 mb-4"><span class="text-3xl">🌿</span></div>
        <h1 class="text-2xl font-bold text-gray-900">MonCoach</h1>
        <p class="text-gray-500 text-sm mt-1">Votre coach santé personnalisé</p>
      </div>
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div><label class="label">Email</label><input v-model="email" type="email" class="input-field" placeholder="vous@exemple.com" required autocomplete="email" /></div>
        <div><label class="label">Mot de passe</label><input v-model="password" type="password" class="input-field" placeholder="••••••••" required autocomplete="current-password" /></div>
        <div v-if="error" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{{ error }}</div>
        <button type="submit" class="btn-primary w-full py-3" :disabled="loading">
          <span v-if="loading">Connexion...</span><span v-else>Se connecter</span>
        </button>
      </form>
      <p class="text-center text-sm text-gray-500 mt-6">Pas encore de compte ? <router-link to="/register" class="text-primary-600 font-medium hover:underline">S'inscrire</router-link></p>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
const router = useRouter()
const authStore = useAuthStore()
const email = ref(''); const password = ref(''); const loading = ref(false); const error = ref('')
async function handleLogin() {
  error.value = ''; loading.value = true
  try {
    await authStore.login(email.value, password.value)
    router.push(authStore.profile ? '/' : '/onboarding')
  } catch (e: any) {
    const code = e.code || ''
    if (['auth/user-not-found','auth/wrong-password','auth/invalid-credential'].includes(code)) error.value = 'Email ou mot de passe incorrect.'
    else if (code === 'auth/too-many-requests') error.value = 'Trop de tentatives. Réessayez plus tard.'
    else error.value = 'Erreur de connexion. Veuillez réessayer.'
  } finally { loading.value = false }
}
</script>
