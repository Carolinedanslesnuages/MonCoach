<template>
  <div class="min-h-screen bg-gray-50">
    <div class="bg-white border-b border-gray-200 px-4 py-4">
      <div class="max-w-lg mx-auto">
        <div class="flex items-center justify-between mb-3">
          <h1 class="text-lg font-bold text-gray-900">Configuration du profil</h1>
          <span class="text-sm text-gray-500">{{ currentStep }}/{{ totalSteps }}</span>
        </div>
        <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div class="h-full bg-primary-500 rounded-full transition-all duration-500" :style="{ width: `${(currentStep / totalSteps) * 100}%` }" />
        </div>
      </div>
    </div>
    <div class="max-w-lg mx-auto p-4">
      <div v-if="currentStep === 1" class="card space-y-3">
        <h2 class="text-lg font-bold">Objectifs de santé 🎯</h2>
        <div class="space-y-3">
          <label v-for="focus in healthFocusOptions" :key="focus.value" class="flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer" :class="form.healthFocus.includes(focus.value) ? 'border-primary-500 bg-primary-50' : 'border-gray-200'">
            <input type="checkbox" :value="focus.value" v-model="form.healthFocus" class="sr-only" />
            <span class="text-2xl">{{ focus.emoji }}</span>
            <div><p class="font-medium text-sm">{{ focus.label }}</p><p class="text-xs text-gray-500">{{ focus.desc }}</p></div>
          </label>
        </div>
      </div>
      <div v-if="currentStep === 2" class="card space-y-3">
        <h2 class="text-lg font-bold">Mesures corporelles 📏</h2>
        <div><label class="label">Taille (cm)</label><input v-model.number="form.heightCm" type="number" class="input-field" placeholder="165" /></div>
        <div><label class="label">Poids (kg)</label><input v-model.number="form.weightKg" type="number" class="input-field" placeholder="65" step="0.1" /></div>
        <div v-if="bmi" class="p-3 bg-gray-50 rounded-xl"><p class="text-sm">IMC: <strong :class="bmiClass">{{ bmi }} - {{ bmiLabel }}</strong></p></div>
      </div>
      <div v-if="currentStep === 3" class="card space-y-3">
        <h2 class="text-lg font-bold">Suivi du cycle 🌙</h2>
        <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div><p class="font-medium">Activer le suivi du cycle</p></div>
          <button @click="form.cycleTracking = !form.cycleTracking" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors" :class="form.cycleTracking ? 'bg-primary-500' : 'bg-gray-200'">
            <span class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform" :class="form.cycleTracking ? 'translate-x-6' : 'translate-x-1'" />
          </button>
        </div>
        <div v-if="form.cycleTracking"><label class="label">Dernières règles (J1)</label><input v-model="form.lastPeriodDate" type="date" class="input-field" :max="today" /></div>
      </div>
      <div v-if="currentStep === 4" class="card space-y-3">
        <h2 class="text-lg font-bold">Médicaments 💊</h2>
        <div v-for="(med, idx) in form.medications" :key="idx" class="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
          <div class="flex-1"><p class="text-sm font-medium">{{ med.name }}</p><p class="text-xs text-gray-500">{{ med.dosage }}</p></div>
          <button @click="form.medications.splice(idx, 1)" class="text-red-400 p-1">×</button>
        </div>
        <input v-model="newMedName" type="text" class="input-field" placeholder="Nom du médicament" />
        <input v-model="newMedDosage" type="text" class="input-field" placeholder="Dosage" />
        <button @click="addMedication" class="btn-secondary w-full" :disabled="!newMedName">+ Ajouter</button>
      </div>
      <div v-if="currentStep === 5" class="card space-y-4">
        <h2 class="text-lg font-bold">Préférences alimentaires 🍽️</h2>
        <div>
          <label class="label">Aliments aimés 😋</label>
          <div class="flex gap-2 mb-2"><input v-model="newLovedFood" type="text" class="input-field flex-1" @keyup.enter="addLovedFood" /><button @click="addLovedFood" class="btn-primary px-3">+</button></div>
          <div class="flex flex-wrap gap-2"><span v-for="(f, i) in form.lovedFoods" :key="i" class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">{{ f }} <button @click="form.lovedFoods.splice(i,1)">×</button></span></div>
        </div>
        <div>
          <label class="label">Allergies / non aimés 🚫</label>
          <div class="flex gap-2 mb-2"><input v-model="newHatedFood" type="text" class="input-field flex-1" @keyup.enter="addHatedFood" /><button @click="addHatedFood" class="btn-primary px-3">+</button></div>
          <div class="flex flex-wrap gap-2"><span v-for="(f, i) in form.hatedFoods" :key="i" class="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">{{ f }} <button @click="form.hatedFoods.splice(i,1)">×</button></span></div>
        </div>
      </div>
      <div v-if="currentStep === 6" class="card">
        <h2 class="text-lg font-bold mb-3">Contexte médical 🏥</h2>
        <textarea v-model="form.medicalContext" class="input-field" rows="6" placeholder="Antécédents médicaux..." />
      </div>
      <div v-if="error" class="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{{ error }}</div>
      <div class="flex gap-3 mt-6">
        <button v-if="currentStep > 1" @click="currentStep--" class="btn-secondary flex-1">← Précédent</button>
        <button v-if="currentStep < totalSteps" @click="nextStep" class="btn-primary flex-1">Suivant →</button>
        <button v-if="currentStep === totalSteps" @click="submitOnboarding" class="btn-primary flex-1" :disabled="submitting">
          <span v-if="submitting">Enregistrement...</span><span v-else>Terminer ✓</span>
        </button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import api from '../api'
const router = useRouter(); const authStore = useAuthStore()
const currentStep = ref(1); const totalSteps = 6; const submitting = ref(false); const error = ref('')
const today = new Date().toISOString().split('T')[0]
const form = ref({ healthFocus: [] as string[], heightCm: null as number|null, weightKg: null as number|null, cycleTracking: false, lastPeriodDate: '', medications: [] as {name:string;dosage:string}[], lovedFoods: [] as string[], hatedFoods: [] as string[], medicalContext: '' })
const newMedName = ref(''); const newMedDosage = ref(''); const newLovedFood = ref(''); const newHatedFood = ref('')
const healthFocusOptions = [
  { value: 'neuro_nutrition', label: 'Neuro-nutrition', emoji: '🧠', desc: 'Santé cognitive' },
  { value: 'grossesse', label: 'Désir de grossesse', emoji: '👶', desc: 'Fertilité' },
  { value: 'hormonal', label: 'Équilibre Hormonal', emoji: '⚖️', desc: 'Régulation hormonale' },
  { value: 'metabolique', label: 'Santé Métabolique', emoji: '🔥', desc: 'Glycémie, poids' },
  { value: 'sport', label: 'Sport & Performance', emoji: '🏃', desc: 'Nutrition sportive' },
]
const bmi = computed(() => {
  if (!form.value.heightCm || !form.value.weightKg) return null
  const h = form.value.heightCm / 100
  return (form.value.weightKg / (h * h)).toFixed(1)
})
const bmiLabel = computed(() => { if (!bmi.value) return ''; const b = parseFloat(bmi.value); if (b < 18.5) return 'Insuffisance pondérale'; if (b < 25) return 'Normal'; if (b < 30) return 'Surpoids'; return 'Obésité' })
const bmiClass = computed(() => { if (!bmi.value) return ''; const b = parseFloat(bmi.value); if (b < 18.5 || b >= 30) return 'text-red-600'; if (b >= 25) return 'text-yellow-600'; return 'text-green-600' })
function addMedication() { if (!newMedName.value) return; form.value.medications.push({ name: newMedName.value, dosage: newMedDosage.value }); newMedName.value = ''; newMedDosage.value = '' }
function addLovedFood() { if (!newLovedFood.value.trim()) return; form.value.lovedFoods.push(newLovedFood.value.trim()); newLovedFood.value = '' }
function addHatedFood() { if (!newHatedFood.value.trim()) return; form.value.hatedFoods.push(newHatedFood.value.trim()); newHatedFood.value = '' }
function nextStep() { error.value = ''; if (currentStep.value === 1 && form.value.healthFocus.length === 0) { error.value = 'Veuillez sélectionner au moins un objectif.'; return }; currentStep.value++ }
async function submitOnboarding() {
  error.value = ''; submitting.value = true
  try {
    await api.post('/users/profile', { ...form.value, lastPeriodDate: form.value.cycleTracking ? form.value.lastPeriodDate : null })
    await authStore.refreshProfile(); router.push('/')
  } catch { error.value = "Erreur lors de l'enregistrement." } finally { submitting.value = false }
}
</script>
