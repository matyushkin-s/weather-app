<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { usePreferences } from '@/composables/usePreferences'
import { useWeatherDashboard } from '@/composables/useWeatherDashboard'
import type { AppLocale, AppTheme, ForecastMode, WeatherBlockState } from '@/types/weather'
import { buildCityLabel, formatUpdatedAt, formatWind, getModePoints, getWeatherIconUrl } from '@/utils/weather'

import CityAutocomplete from './CityAutocomplete.vue'
import ConfirmModal from './ConfirmModal.vue'
import TemperatureChart from './TemperatureChart.vue'

const props = defineProps<{
  block: WeatherBlockState
  locale: AppLocale
  theme: AppTheme
  canDelete: boolean
  disableSearch?: boolean
  disableFavoriteToggle?: boolean
  onDelete?: (() => void) | null
  forcedMode?: ForecastMode | null
  reload?: (location: NonNullable<WeatherBlockState['location']>) => Promise<void>
}>()

const emit = defineEmits<{
  modeChange: [mode: ForecastMode]
}>()

const { toggleFavorite, isFavorite } = usePreferences()
const { loadWeatherForBlock, removeBlock, setMode } = useWeatherDashboard()
const { t } = useI18n()

const deleteModalOpen = ref(false)
const favoritesLimitModalOpen = ref(false)

const isBlockFavorite = computed(() => {
  if (!props.block.location) {
    return false
  }

  return isFavorite(props.block.location)
})

const activeMode = computed<ForecastMode>(() => props.forcedMode ?? props.block.mode)

const points = computed(() => {
  if (!props.block.weather) {
    return []
  }

  return getModePoints(props.block.weather, activeMode.value)
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
  if (props.onDelete) {
    props.onDelete()
  } else {
    removeBlock(props.block.id)
  }

  deleteModalOpen.value = false
}

async function refreshBlock(): Promise<void> {
  if (!props.block.location) {
    return
  }

  if (props.reload) {
    await props.reload(props.block.location)
  } else {
    await loadWeatherForBlock(props.block.id, props.block.location, props.locale)
  }
}

function handleModeChange(mode: ForecastMode): void {
  if (props.forcedMode) {
    emit('modeChange', mode)
    return
  }

  setMode(props.block.id, mode)
}
</script>

<template>
  <article class="widget-card">
    <div class="widget-topbar">
      <span class="widget-badge">{{ t('widget') }}</span>
      <div class="widget-actions-inline">
        <button
          v-if="!props.disableFavoriteToggle"
          class="icon-button"
          type="button"
          :aria-pressed="isBlockFavorite"
          :title="isBlockFavorite ? t('favoriteRemove') : t('favoriteAdd')"
          :disabled="!props.block.location"
          @click="handleFavoriteToggle"
        >
          {{ isBlockFavorite ? '★' : '☆' }}
        </button>
        <button
          class="icon-button"
          type="button"
          :title="t('refresh')"
          :disabled="!props.block.location"
          @click="refreshBlock"
        >
          ↻
        </button>
        <button
          class="icon-button"
          type="button"
          :disabled="!props.canDelete"
          :title="props.canDelete ? (props.onDelete ? t('favoriteRemove') : t('deleteBlock')) : t('cannotDeleteLast')"
          @click="props.onDelete ? props.onDelete() : (deleteModalOpen = true)"
        >
          ✕
        </button>
      </div>
    </div>

    <CityAutocomplete
      v-if="!props.disableSearch"
      :locale="props.locale"
      :disabled="props.block.isLoading"
      :selected-location="props.block.location"
      @select="handleSelectedLocation"
    />

    <div v-if="props.block.isLoading" class="state-card">
      <div class="loader"></div>
        <p>{{ t('loading') }}</p>
    </div>

    <div v-else-if="props.block.error" class="state-card state-card-error">
      <p>{{ props.block.error }}</p>
      <button class="button button-primary" type="button" @click="refreshBlock">
        {{ t('refresh') }}
      </button>
    </div>

    <div v-else-if="props.block.weather" class="widget-content">
      <section class="weather-summary">
        <div>
          <p class="eyebrow">{{ t('currentConditions') }}</p>
          <h3 class="location-title">{{ buildCityLabel(props.block.weather.location) }}</h3>
          <p class="weather-description">{{ props.block.weather.current.description }}</p>
          <p class="update-text">
            {{ t('updatedAt') }}:
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
          <span class="metric-label">{{ t('humidity') }}</span>
          <strong class="metric-value">{{ props.block.weather.current.humidity }}%</strong>
        </div>
        <div class="metric-card">
          <span class="metric-label">{{ t('wind') }}</span>
          <strong class="metric-value">{{ formatWind(props.block.weather.current.windSpeed, props.locale) }}</strong>
        </div>
      </section>

      <section class="mode-panel">
        <span class="field-label">{{ t('feelsLike') }}</span>
        <div class="segmented-control" role="tablist" :aria-label="t('feelsLike')">
          <button
            class="segmented-item"
            :class="{ 'segmented-item-active': activeMode === 'day' }"
            type="button"
            @click="handleModeChange('day')"
          >
            {{ t('day') }}
          </button>
          <button
            class="segmented-item"
            :class="{ 'segmented-item-active': activeMode === 'week' }"
            type="button"
            @click="handleModeChange('week')"
          >
            {{ t('week') }}
          </button>
        </div>
      </section>

      <TemperatureChart
        :locale="props.locale"
        :theme="props.theme"
        :points="points"
        :mode="activeMode"
      />
    </div>

    <div v-else class="state-card state-card-empty">
      <p>{{ t('searchPrompt') }}</p>
    </div>

    <ConfirmModal
      v-if="!props.onDelete"
      :open="deleteModalOpen"
      :title="t('confirmDeleteTitle')"
      :description="t('confirmDeleteText')"
      :confirm-label="t('confirm')"
      :cancel-label="t('cancel')"
      tone="danger"
      @confirm="confirmDelete"
      @cancel="deleteModalOpen = false"
    />

    <ConfirmModal
      :open="favoritesLimitModalOpen"
      :title="t('favoritesLimitTitle')"
      :description="t('favoritesLimitText')"
      :confirm-label="t('confirm')"
      :cancel-label="t('cancel')"
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

.widget-actions-inline {
  gap: 0.5rem;
}

.weather-summary {
  flex-direction: column;
  align-items: flex-start;
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

.weather-icon {
  width: 76px;
  height: 76px;
}

.temperature {
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1;
  color: var(--color-heading);
}

.metric-value {
  font-size: 1.1rem;
}

.mode-panel {
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 4px;
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

@media (min-width: 640px) {
  .weather-summary,
  .mode-panel {
    flex-direction: row;
    align-items: center;
  }

  .metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
