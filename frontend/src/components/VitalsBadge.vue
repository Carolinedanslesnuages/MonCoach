<template>
  <span :class="badgeClass">{{ systolic }}/{{ diastolic }} mmHg</span>
</template>
<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ systolic: number; diastolic: number }>()
const badgeClass = computed(() => {
  if (props.systolic > 140 || props.systolic < 90) return 'badge-danger'
  if (props.systolic > 130 || props.diastolic > 85) return 'badge-warning'
  return 'badge-success'
})
</script>
