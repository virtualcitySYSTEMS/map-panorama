<script setup lang="ts">
  import {
    VcsExpansionPanel,
    VcsFormSection,
    VcsLabel,
    VcsSlider,
    VcsTextField,
    VcsCheckbox,
    type VcsUiApp,
    VcsCoordinate,
  } from '@vcmap/ui';
  import { Math as CesiumMath } from '@vcmap-cesium/engine';
  import {
    VCol,
    VRow,
    VExpansionPanels,
    VContainer,
    VCard,
  } from 'vuetify/components';
  import { computed, inject, onUnmounted, ref, shallowRef, watch } from 'vue';
  import {
    cartesianToMercator,
    type PanoramaDatasetLayer,
    type PanoramaMap,
    PanoramaOverlayMode,
    Projection,
  } from '@vcmap/core';
  import {
    createHideCursorAction,
    createMapMarkerAction,
    createOverlayActions,
  } from './api';
  import { name } from '../package.json';
  import type { PanoramaPlugin } from './index.js';
  import ImageEnhancement from './panoramaImageEnhancement.vue';

  const app = inject<VcsUiApp>('vcsApp')!;
  const map = app.maps.activeMap as PanoramaMap;
  const plugin = app.plugins.getByKey(name) as PanoramaPlugin;

  const { action: hideCursor, destroy: destroyHideCursor } =
    createHideCursorAction(map);
  const { action: mapMarker, destroy: destroyMapMarker } =
    createMapMarkerAction(app);
  const actions = [plugin.layerTypesAction, hideCursor, mapMarker];

  const image = shallowRef(map.currentPanoramaImage);
  const dataset = shallowRef<PanoramaDatasetLayer | undefined>();
  const currentImageListener = map.currentImageChanged.addEventListener(
    (newImage) => {
      image.value = newImage;
    },
  );

  const formattedImageTime = computed(() => {
    if (!image.value?.time) return '';
    return new Intl.DateTimeFormat(app.vueI18n.locale.value, {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(image.value.time);
  });

  watch(
    image,
    (newImage) => {
      dataset.value = newImage?.dataset;
    },
    { immediate: true },
  );

  const imagePosition = computed(() => {
    if (!image.value?.position) {
      return [];
    }
    const mercator = cartesianToMercator(image.value.position);
    return Projection.mercatorToWgs84(mercator);
  });

  const hpr = computed(() => {
    if (!image.value?.orientation) {
      return [];
    }

    return [
      CesiumMath.toDegrees(image.value.orientation.heading),
      CesiumMath.toDegrees(image.value.orientation.pitch),
      CesiumMath.toDegrees(image.value.orientation.roll),
    ];
  });

  const overlayOpacity = ref(
    map.panoramaView.tilePrimitiveCollection.overlayOpacity,
  );
  const localOverlayOpacity = computed({
    get: () => overlayOpacity.value,
    set: (value: number) => {
      if (value < 0) {
        overlayOpacity.value = 0;
      } else if (value > 1) {
        overlayOpacity.value = 1;
      } else {
        overlayOpacity.value = value;
      }
    },
  });
  watch(overlayOpacity, (newOverlayOpacity) => {
    map.panoramaView.tilePrimitiveCollection.overlayOpacity = newOverlayOpacity;
  });

  const {
    actions: overlayActions,
    currentOverlay,
    destroy: destroyOverlayActions,
  } = createOverlayActions(map);

  onUnmounted(() => {
    destroyHideCursor();
    destroyMapMarker();
    destroyOverlayActions();
    currentImageListener();
  });
</script>

<template>
  <vcs-form-section
    heading="panorama.visibility"
    :header-actions="actions"
    :action-button-list-overflow-count="4"
  >
    <v-expansion-panels variant="accordion" multiple>
      <image-enhancement />
      <vcs-expansion-panel
        heading="panorama.complementaryImages.title"
        :header-actions="overlayActions"
      >
        <v-container class="py-0 px-5">
          <v-row no-gutters>
            <v-col cols="4">
              <vcs-label>{{
                $t('panorama.complementaryImages.opacity')
              }}</vcs-label>
            </v-col>
            <v-col>
              <vcs-text-field
                v-model.number="localOverlayOpacity"
                type="number"
                min="0"
                max="1"
                step="0.01"
                :disabled="currentOverlay === PanoramaOverlayMode.None"
              />
            </v-col>
          </v-row>
          <v-row no-gutters>
            <v-col>
              <vcs-slider
                v-model="overlayOpacity"
                :disabled="currentOverlay === PanoramaOverlayMode.None"
                :min="0"
                :max="1"
                :step="0.01"
              >
                <!-- @vue-ignore -->
                <template #append> 1 </template>
                <!-- @vue-ignore -->
                <template #prepend> 0 </template>
              </vcs-slider>
            </v-col>
          </v-row>
        </v-container>
      </vcs-expansion-panel>
      <vcs-expansion-panel heading="panorama.imageMetadata.title">
        <v-container v-if="image" class="py-0 px-5">
          <v-row no-gutters>
            <v-col cols="4">
              <vcs-label>{{ $t('panorama.imageMetadata.name') }}</vcs-label>
            </v-col>
            <v-col>
              <vcs-text-field readonly :model-value="image.name" />
            </v-col>
          </v-row>
          <v-row no-gutters>
            <v-col cols="4">
              <vcs-label
                tooltip="panorama.imageMetadata.positionTooltip"
                tooltip-position="left"
                >{{ $t('panorama.imageMetadata.position') }}</vcs-label
              >
            </v-col>
            <v-col>
              <vcs-coordinate readonly :model-value="imagePosition" />
            </v-col>
          </v-row>
          <v-row no-gutters>
            <v-col cols="4">
              <vcs-label
                tooltip="panorama.imageMetadata.orientationTooltip"
                tooltip-position="left"
                >{{ $t('panorama.imageMetadata.orientation') }}</vcs-label
              >
            </v-col>
            <v-col>
              <vcs-coordinate
                readonly
                :model-value="hpr"
                :unit="'°'"
                :prefixes="['H', 'P', 'R']"
              />
            </v-col>
          </v-row>
          <v-row no-gutters>
            <v-col cols="4">
              <vcs-label>{{ $t('panorama.imageMetadata.time') }}</vcs-label>
            </v-col>
            <v-col>
              <vcs-text-field
                type="datetime"
                readonly
                :model-value="formattedImageTime"
              />
            </v-col>
          </v-row>
          <v-row no-gutters>
            <v-col cols="4">
              <vcs-label>{{
                $t('panorama.imageMetadata.cameraOffset')
              }}</vcs-label>
            </v-col>
            <v-col>
              <vcs-text-field
                readonly
                :model-value="dataset ? dataset.cameraOffset * -1 : 0"
              />
            </v-col>
          </v-row>
          <v-row no-gutters>
            <v-col cols="4">
              <vcs-label>{{ $t('panorama.imageMetadata.tileSize') }}</vcs-label>
            </v-col>
            <v-col>
              <vcs-text-field
                readonly
                :model-value="image.tileSize?.join(' x ') ?? ''"
              />
            </v-col>
          </v-row>
          <v-row no-gutters>
            <v-col cols="4">
              <vcs-label>{{
                $t('panorama.imageMetadata.hasIntensity')
              }}</vcs-label>
            </v-col>
            <v-col>
              <vcs-checkbox
                :disabled="true"
                :model-value="image?.hasIntensity ?? false"
              />
            </v-col>
          </v-row>
          <v-row no-gutters>
            <v-col cols="4">
              <vcs-label>
                {{ $t('panorama.imageMetadata.hasDepth') }}
              </vcs-label>
            </v-col>
            <v-col>
              <vcs-checkbox
                :disabled="true"
                :model-value="image?.hasDepth ?? false"
              />
            </v-col>
          </v-row>
        </v-container>
        <v-card v-else>
          {{ $t('panorama.imageMetadata.noImage') }}
        </v-card>
      </vcs-expansion-panel>
    </v-expansion-panels>
  </vcs-form-section>
</template>

<style scoped></style>
