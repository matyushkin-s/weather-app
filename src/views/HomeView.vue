<script setup lang="ts">
import { onMounted, watch } from 'vue'

import WeatherWidget from '@/components/WeatherWidget.vue'
import { usePreferences } from '@/composables/usePreferences'
import { useWeatherDashboard } from '@/composables/useWeatherDashboard'
import { translate } from '@/i18n'

const { locale, theme } = usePreferences()
const { blocks, canAddBlock, bootstrapMessage, addBlock, refreshAll, bootstrapFirstBlock } = useWeatherDashboard()

onMounted(() => {
  void bootstrapFirstBlock(locale.value, translate(locale.value, 'autoLocation'))
})

watch(locale, (value) => {
  if (bootstrapMessage.value) {
    bootstrapMessage.value = translate(value, 'autoLocation')
  }

  void refreshAll(value)
})

function handleAddBlock(): void {
  addBlock()
}
</script>

<template>
  <section class="view-shell">
    <header class="view-header">
      <div>
        <h2 class="view-title">{{ translate(locale, 'dashboardTab') }}</h2>
        <p class="view-description">{{ translate(locale, 'appSubtitle') }}</p>
        <p v-if="bootstrapMessage" class="view-note">{{ bootstrapMessage }}</p>
      </div>

      <button class="button button-primary" type="button" :disabled="!canAddBlock" @click="handleAddBlock">
        {{ translate(locale, 'addBlock') }}
      </button>
    </header>

    <p v-if="!canAddBlock" class="limit-note">{{ translate(locale, 'maxBlocksReached') }}</p>

    <div class="widgets-grid">
      <WeatherWidget
        v-for="block in blocks"
        :key="block.id"
        :block="block"
        :locale="locale"
        :theme="theme"
        :can-delete="blocks.length > 1"
      />
    </div>
  </section>
</template>

<style scoped>
.view-shell {
  display: grid;
  gap: 1.25rem;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.view-title {
  font-size: clamp(1.6rem, 3vw, 2.25rem);
  font-weight: 800;
  color: var(--color-heading);
}

.view-description,
.view-note,
.limit-note {
  color: var(--color-text-soft);
}

.view-note,
.limit-note {
  margin-top: 0.5rem;
}

.widgets-grid {
  display: grid;
  gap: 1rem;
}

@media (max-width: 640px) {
  .view-header {
    flex-direction: column;
  }

  .view-header .button {
    width: 100%;
  }
}
</style>
