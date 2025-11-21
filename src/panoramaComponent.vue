<script setup lang="ts">
  import { ref, inject } from 'vue';
  import { VCard } from 'vuetify/components';
  import { type VcsUiApp } from '@vcmap/ui';
  import { PanoramaMap } from '@vcmap/core';
  import PanoramaSettings from './panoramaSettings.vue';

  const app = inject<VcsUiApp>('vcsApp')!;
  const isPanorama = ref(false);
  const setIsPanorama = (): void => {
    const { activeMap } = app.maps;
    isPanorama.value = activeMap instanceof PanoramaMap;
  };
  app.maps.mapActivated.addEventListener(setIsPanorama);
  setIsPanorama();
</script>

<template>
  <panorama-settings v-if="isPanorama" />
  <v-card v-else>{{ $t('panorama.notPanoramaMap') }}</v-card>
</template>

<style scoped></style>
