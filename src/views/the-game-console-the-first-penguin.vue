<template>
  <game-scene
    class=" w-full h-full"
    @init="handleInit"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';

import GameScene from '../games/the-first-penguin/game-scene.vue';

import { useLoading } from '../composables/use-loading';

const loading = useLoading();

function handleInit() {
  loading.hide();
}
</script>

<style scoped lang="sass">
</style>
