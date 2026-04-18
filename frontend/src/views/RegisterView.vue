<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 mb-4"><span class="text-3xl">🌿</span></div>
        <h1 class="text-2xl font-bold text-gray-900">Créer un compte</h1>
      </div>
      <form @submit.prevent="handleRegister" class="space-y-4">
        <div><label class="label">Email</label><input v-model="email" type="email" class="input-field" required autocomplete="email" /></div>
        <div><label class="label">Mot de passe</label><input v-model="password" type="password" class="input-field" required minlength="6" autocomplete="new-password" /></div>
        <div><label class="label">Confirmer le mot de passe</label><input v-model="confirmPassword" type="password" class="input-field" required autocomplete="new-password" /></div>
        <div v-if="error" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{{ error }}</div>
        <button type="submit" class="btn-primary w-full py-3" :disabled="loading"><span v-if="loading">Inscription...</span><span v-else>S'inscrire</span></button>
      </form>
      <p class="text-center text-sm text-gray-500 mt-6">Déjà un compte ? <router-link to="/login" class="text-primary-600 font-medium hover:underline">Se connecter</router-link></p>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
const router = useRouter(); const authStore = useAuthStore()
const email = ref(''); const password = ref(''); const confirmPassword = ref(''); const loading = ref(false); const error = ref('')
async function handleRegister() {
  error.value = ''
  if (password.value !== confirmPassword.value) { error.value = 'Les mots de passe ne correspondent pas.'; return }
  loading.value = true
  try { await authStore.register(email.value, password.value); router.push('/onboarding') }
  catch (e: any) {
    const code = e.code || ''
    if (code === 'auth/email-already-in-use') error.value = 'Cet email est déjà utilisé.'
    else if (code === 'auth/weak-password') error.value = 'Le mot de passe est trop faible.'
    else error.value = "Erreur lors de l'inscription."
  } finally { loading.value = false }
}
</script>
