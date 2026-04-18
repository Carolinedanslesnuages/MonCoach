<template>
  <div class="min-h-screen bg-gray-50 pb-20">
    <slot />
    <BottomNav />
  </div>
</template>
<script setup lang="ts">
import BottomNav from './BottomNav.vue'
</script>
