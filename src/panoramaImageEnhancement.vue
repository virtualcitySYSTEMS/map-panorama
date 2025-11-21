<script setup lang="ts">
  import { inject, ref, watch } from 'vue';
  import { VContainer, VRow, VCol } from 'vuetify/components';
  import {
    type VcsAction,
    type VcsUiApp,
    VcsExpansionPanel,
    VcsLabel,
    VcsCheckbox,
  } from '@vcmap/ui';
  import type { PanoramaMap } from '@vcmap/core';
  import PercentageSlider from './percentageSlider.vue';

  const app = inject<VcsUiApp>('vcsApp')!;
  const map = app.maps.activeMap as PanoramaMap;

  const contrast = ref(map.panoramaView.tilePrimitiveCollection.contrast);
  watch(contrast, (newContrast) => {
    map.panoramaView.tilePrimitiveCollection.contrast = newContrast;
  });

  const brightness = ref(map.panoramaView.tilePrimitiveCollection.brightness);
  watch(brightness, (newBrightness) => {
    map.panoramaView.tilePrimitiveCollection.brightness = newBrightness;
  });

  const { scene } = map.getCesiumWidget();
  const isHDR = ref(scene.highDynamicRange);
  watch(isHDR, (newIsHDR) => {
    scene.highDynamicRange = newIsHDR;
  });

  const gamma = ref(scene.gamma);
  watch(gamma, (newGamma) => {
    scene.gamma = newGamma;
  });

  const exposure = ref(scene.postProcessStages.exposure);
  watch(exposure, (newExposure) => {
    scene.postProcessStages.exposure = newExposure;
  });

  const resetImageEnhancement: VcsAction = {
    name: 'panorama.imageEnhancement.reset',
    icon: '$vcsReturn',
    title: 'panorama.imageEnhancement.reset',
    callback(): void {
      brightness.value = 0;
      contrast.value = 1;
      isHDR.value = true;
      gamma.value = 2.2;
      exposure.value = 1;
    },
  };
</script>

<template>
  <vcs-expansion-panel
    heading="panorama.imageEnhancement.title"
    :header-actions="[resetImageEnhancement]"
  >
    <v-container class="py-0 px-5">
      <v-row no-gutters>
        <v-col cols="4">
          <vcs-label>{{ $t('panorama.imageEnhancement.hdr') }}</vcs-label>
        </v-col>
        <v-col>
          <vcs-checkbox v-model="isHDR" />
        </v-col>
      </v-row>
      <percentage-slider
        v-model="brightness"
        label="panorama.imageEnhancement.brightness"
        :min="-1"
        :max="1"
        :center="0"
      />
      <percentage-slider
        v-model="contrast"
        label="panorama.imageEnhancement.contrast"
        :min="0"
        :max="4"
        :center="1"
      />
      <template v-if="isHDR">
        <percentage-slider
          v-model="gamma"
          label="panorama.imageEnhancement.gamma"
          :min="0.1"
          :max="5"
          :center="2.2"
        />
        <percentage-slider
          v-model="exposure"
          label="panorama.imageEnhancement.exposure"
          :min="0"
          :max="5"
          :center="1"
        />
      </template>
    </v-container>
  </vcs-expansion-panel>
</template>

<style scoped></style>
