<script setup lang="ts">
  import { computed, ref, watch } from 'vue';
  import { VcsSlider, VcsTextField, VcsLabel } from '@vcmap/ui';
  import { VRow, VCol } from 'vuetify/components';

  const props = withDefaults(
    defineProps<{
      label: string;
      modelValue?: number;
      min?: number;
      max?: number;
      center?: number;
    }>(),
    {
      modelValue: 0,
      min: -1,
      max: 1,
      center: 0,
    },
  );

  function linearScale(value: number, min: number, max: number): number {
    return (value - min) / (max - min);
  }

  function determinePercentage(value: number): number {
    const { min, max, center } = props;
    const valueOffset = Math.abs(center - value);
    if (value > center) {
      return linearScale(valueOffset, 0, Math.abs(max - center));
    }
    if (value < center) {
      return linearScale(valueOffset, 0, Math.abs(center - min)) * -1;
    }

    return 0;
  }

  function determineValue(percentage: number): number {
    const { min, max, center } = props;
    if (percentage > 0) {
      return percentage * Math.abs(max - center) + center;
    }
    if (percentage < 0) {
      return percentage * Math.abs(center - min) + center;
    }

    return center;
  }

  const emit = defineEmits<{
    (e: 'update:modelValue', value: number): void;
  }>();

  const internalValue = ref(props.modelValue);
  watch(
    () => props.modelValue,
    (newValue) => {
      if (newValue !== internalValue.value) {
        internalValue.value = newValue;
      }
    },
  );

  const localValue = computed({
    get: () => determinePercentage(internalValue.value),
    set: (value: number) => {
      const newValue = determineValue(value);
      internalValue.value = newValue;
      emit('update:modelValue', newValue);
    },
  });

  const localPercentage = computed({
    get: () => Math.round(localValue.value * 100),
    set: (value: number) => {
      localValue.value = value / 100;
    },
  });
</script>

<template>
  <v-row no-gutters>
    <v-col cols="4">
      <vcs-label>{{ $t(props.label) }}</vcs-label>
    </v-col>
    <v-col>
      <vcs-text-field
        v-model.number="localPercentage"
        type="number"
        min="-100"
        max="100"
        step="1"
        :unit="'%'"
      />
    </v-col>
  </v-row>
  <v-row no-gutters>
    <v-col>
      <vcs-slider
        v-model="localValue"
        :min="-1"
        :max="1"
        :step="0.01"
        :center="0"
      >
        <!-- @vue-ignore -->
        <template #append> 100% </template>
        <!-- @vue-ignore -->
        <template #prepend> -100% </template>
      </vcs-slider>
    </v-col>
  </v-row>
</template>

<style scoped></style>
