<script setup lang="ts">
import { computed, ref } from 'vue'

import { usePreferences } from '@/composables/usePreferences'
import { useWeatherDashboard } from '@/composables/useWeatherDashboard'
import type { AppLocale, AppTheme, WeatherBlockState } from '@/types/weather'
import { translate } from '@/i18n'
import { buildCityLabel, formatUpdatedAt, formatWind, getModePoints, getWeatherIconUrl } from '@/utils/weather'

import CityAutocomplete from './CityAutocomplete.vue'
import ConfirmModal from './ConfirmModal.vue'
import TemperatureChart from './TemperatureChart.vue'

const props = defineProps<{
  block: WeatherBlockState
  locale: AppLocale
  theme: AppTheme
  canDelete: boolean
}>()

const { toggleFavorite, isFavorite } = usePreferences()
const { loadWeatherForBlock, removeBlock, setMode } = useWeatherDashboard()

const deleteModalOpen = ref(false)
const favoritesLimitModalOpen = ref(false)

const isBlockFavorite = computed(() => {
  if (!props.block.location) {
    return false
  }

  return isFavorite(props.block.location)
})

const points = computed(() => {
  if (!props.block.weather) {
    return []
  }

  return getModePoints(props.block.weather, props.block.mode)
})

async function handleSelectedLocation(location: NonNullable<WeatherBlockState['location']>): Promise<void> {
  await loadWeatherForBlock(props.block.id, location, props.locale)
}

function handleFavoriteToggle(): void {
  if (!props.block.location) {
    return
  }

  const result = toggleFavorite(props.block.location)
  if (!result.ok && result.reason === 'limit') {
    favoritesLimitModalOpen.value = true
  }
}

function confirmDelete(): void {
  removeBlock(props.block.id)
  deleteModalOpen.value = false
}

async function refreshBlock(): Promise<void> {
  if (!props.block.location) {
    return
  }

  await loadWeatherForBlock(props.block.id, props.block.location, props.locale)
}
</script>

<template>
  <article class="widget-card">
    <div class="widget-topbar">
      <span class="widget-badge">{{ translate(props.locale, 'widget') }}</span>
      <div class="widget-actions-inline">
        <button
          class="icon-button"
          type="button"
          :aria-pressed="isBlockFavorite"
          :title="isBlockFavorite ? translate(props.locale, 'favoriteRemove') : translate(props.locale, 'favoriteAdd')"
          @click="handleFavoriteToggle"
        >
          {{ isBlockFavorite ? '★' : '☆' }}
        </button>
        <button
          class="icon-button"
          type="button"
          :title="translate(props.locale, 'refresh')"
          @click="refreshBlock"
        >
          ↻
        </button>
        <button
          class="icon-button"
          type="button"
          :disabled="!props.canDelete"
          :title="props.canDelete ? translate(props.locale, 'deleteBlock') : translate(props.locale, 'cannotDeleteLast')"
          @click="deleteModalOpen = true"
        >
          ✕
        </button>
      </div>
    </div>

    <CityAutocomplete
      :locale="props.locale"
      :disabled="props.block.isLoading"
      :selected-location="props.block.location"
      @select="handleSelectedLocation"
    />

    <div v-if="props.block.isLoading" class="state-card">
      <div class="loader"></div>
      <p>{{ translate(props.locale, 'loading') }}</p>
    </div>

    <div v-else-if="props.block.error" class="state-card state-card-error">
      <p>{{ props.block.error }}</p>
      <button class="button button-primary" type="button" @click="refreshBlock">
        {{ translate(props.locale, 'refresh') }}
      </button>
    </div>

    <div v-else-if="props.block.weather" class="widget-content">
      <section class="weather-summary">
        <div>
          <p class="eyebrow">{{ translate(props.locale, 'currentConditions') }}</p>
          <h3 class="location-title">{{ buildCityLabel(props.block.weather.location) }}</h3>
          <p class="weather-description">{{ props.block.weather.current.description }}</p>
          <p class="update-text">
            {{ translate(props.locale, 'updatedAt') }}:
            {{ formatUpdatedAt(props.block.weather.current.timestamp, props.block.weather.timezoneOffset, props.locale) }}
          </p>
        </div>

        <div class="weather-temp-shell">
          <img
            class="weather-icon"
            :src="getWeatherIconUrl(props.block.weather.current.icon)"
            :alt="props.block.weather.current.description"
          />
          <strong class="temperature">{{ props.block.weather.current.temperature }}°C</strong>
        </div>
      </section>

      <section class="metrics-grid">
        <div class="metric-card">
          <span class="metric-label">{{ translate(props.locale, 'humidity') }}</span>
          <strong class="metric-value">{{ props.block.weather.current.humidity }}%</strong>
        </div>
        <div class="metric-card">
          <span class="metric-label">{{ translate(props.locale, 'wind') }}</span>
          <strong class="metric-value">{{ formatWind(props.block.weather.current.windSpeed, props.locale) }}</strong>
        </div>
      </section>

      <section class="mode-panel">
        <span class="field-label">{{ translate(props.locale, 'feelsLike') }}</span>
        <div class="segmented-control" role="tablist" :aria-label="translate(props.locale, 'feelsLike')">
          <button
            class="segmented-item"
            :class="{ 'segmented-item-active': props.block.mode === 'day' }"
            type="button"
            @click="setMode(props.block.id, 'day')"
          >
            {{ translate(props.locale, 'day') }}
          </button>
          <button
            class="segmented-item"
            :class="{ 'segmented-item-active': props.block.mode === 'week' }"
            type="button"
            @click="setMode(props.block.id, 'week')"
          >
            {{ translate(props.locale, 'week') }}
          </button>
        </div>
      </section>

      <TemperatureChart
        :locale="props.locale"
        :theme="props.theme"
        :points="points"
        :mode="props.block.mode"
      />
    </div>

    <div v-else class="state-card state-card-empty">
      <p>{{ translate(props.locale, 'searchPrompt') }}</p>
    </div>

    <ConfirmModal
      :open="deleteModalOpen"
      :title="translate(props.locale, 'confirmDeleteTitle')"
      :description="translate(props.locale, 'confirmDeleteText')"
      :confirm-label="translate(props.locale, 'confirm')"
      :cancel-label="translate(props.locale, 'cancel')"
      tone="danger"
      @confirm="confirmDelete"
      @cancel="deleteModalOpen = false"
    />

    <ConfirmModal
      :open="favoritesLimitModalOpen"
      :title="translate(props.locale, 'favoritesLimitTitle')"
      :description="translate(props.locale, 'favoritesLimitText')"
      :confirm-label="translate(props.locale, 'confirm')"
      :cancel-label="translate(props.locale, 'cancel')"
      @confirm="favoritesLimitModalOpen = false"
      @cancel="favoritesLimitModalOpen = false"
    />
  </article>
</template>

<style scoped>
.widget-card {
  display: grid;
  gap: 1.25rem;
  border-radius: 28px;
  border: 1px solid var(--color-border);
  background: var(--surface-color);
  padding: 1.25rem;
  box-shadow: var(--shadow-md);
}

.widget-topbar,
.widget-actions-inline,
.weather-summary,
.weather-temp-shell,
.mode-panel {
  display: flex;
}

.widget-topbar,
.weather-summary {
  justify-content: space-between;
  gap: 1rem;
}

.widget-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent-color);
  padding: 0.35rem 0.75rem;
  font-size: 0.82rem;
  font-weight: 700;
}

.widget-actions-inline {
  gap: 0.5rem;
}

.weather-summary {
  align-items: center;
}

.eyebrow,
.update-text,
.weather-description,
.metric-label {
  color: var(--color-text-soft);
}

.location-title {
  font-size: clamp(1.35rem, 2vw, 1.8rem);
  font-weight: 700;
  color: var(--color-heading);
}

.weather-description {
  text-transform: capitalize;
}

.weather-temp-shell {
  align-items: center;
  gap: 0.5rem;
}

.weather-icon {
  width: 76px;
  height: 76px;
}

.temperature {
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1;
  color: var(--color-heading);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.metric-card {
  border-radius: 20px;
  background: var(--surface-muted);
  padding: 1rem;
}

.metric-value {
  display: block;
  margin-top: 0.35rem;
  color: var(--color-heading);
  font-size: 1.1rem;
  font-weight: 700;
}

.mode-panel {
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2px;
}

.state-card {
  display: grid;
  place-items: center;
  gap: 1rem;
  min-height: 180px;
  border-radius: 20px;
  border: 1px dashed var(--color-border);
  background: var(--surface-muted);
  text-align: center;
  padding: 1.5rem;
}

.state-card-error {
  color: var(--danger-color);
}

.loader {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 4px solid var(--accent-soft);
  border-top-color: var(--accent-color);
  animation: spin 0.75s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .weather-summary,
  .mode-panel {
    flex-direction: column;
    align-items: flex-start;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
