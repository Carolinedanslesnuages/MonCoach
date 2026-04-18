import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../api'

export const useHealthStore = defineStore('health', () => {
  const logs = ref<any[]>([])
  const meals = ref<any[]>([])
  const hydration = ref(0)

  async function fetchLogs() { const res = await api.get('/health-logs'); logs.value = res.data }
  async function createLog(data: any) { const res = await api.post('/health-logs', data); logs.value.unshift(res.data); return res.data }
  async function fetchMeals() { const res = await api.get('/meals'); meals.value = res.data }
  async function createMeal(data: any) { const res = await api.post('/meals', data); meals.value.unshift(res.data); return res.data }
  function addHydration(amount: number) { hydration.value = Math.min(2.5, Math.max(0, hydration.value + amount)) }
  function resetHydration() { hydration.value = 0 }

  return { logs, meals, hydration, fetchLogs, createLog, fetchMeals, createMeal, addHydration, resetHydration }
})
