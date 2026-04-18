import { defineStore } from 'pinia'
import { ref } from 'vue'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '../firebase'
import api from '../api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const profile = ref<any>(null)
  const loading = ref(true)

  function init() {
    return new Promise<void>((resolve) => {
      onAuthStateChanged(auth, async (firebaseUser) => {
        user.value = firebaseUser
        if (firebaseUser) {
          try { const res = await api.get('/users/me'); profile.value = res.data } catch { profile.value = null }
        } else { profile.value = null }
        loading.value = false
        resolve()
      })
    })
  }

  async function login(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    user.value = cred.user
    const res = await api.get('/users/me')
    profile.value = res.data
  }

  async function register(email: string, password: string) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    user.value = cred.user
    await api.post('/users/profile', { email })
    profile.value = null
  }

  async function logout() {
    await signOut(auth)
    user.value = null
    profile.value = null
  }

  async function refreshProfile() {
    if (user.value) {
      const res = await api.get('/users/profile')
      profile.value = res.data
    }
  }

  return { user, profile, loading, init, login, register, logout, refreshProfile }
})
