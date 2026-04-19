<template>
  <div class="card">
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2"><span class="text-2xl">💧</span><h3 class="font-semibold text-gray-800">Hydratation</h3></div>
      <span class="text-sm font-medium text-primary-600">{{ healthStore.hydration.toFixed(2) }}L / 2.5L</span>
    </div>
    <div class="relative h-3 bg-gray-200 rounded-full mb-4 overflow-hidden">
      <div class="absolute left-0 top-0 h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500" :style="{ width: `${(healthStore.hydration / 2.5) * 100}%` }" />
    </div>
    <div class="flex items-center gap-2">
      <div class="flex gap-1 flex-1">
        <button v-for="amount in increments" :key="amount" @click="healthStore.addHydration(amount)" class="flex-1 py-2 text-xs font-medium rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors border border-primary-200">+{{ amount }}L</button>
      </div>
      <button @click="healthStore.resetHydration()" class="p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors text-xs" title="Réinitialiser">↺</button>
    </div>
    <div class="flex gap-1 mt-2">
      <div v-for="i in 10" :key="i" class="flex-1 h-2 rounded-full transition-colors" :class="(i / 10) * 2.5 <= healthStore.hydration ? 'bg-primary-500' : 'bg-gray-200'" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { useHealthStore } from '../stores/health'
const healthStore = useHealthStore()
const increments = [0.25, 0.5, 0.75]
</script>
