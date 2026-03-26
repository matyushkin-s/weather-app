<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import TemperatureChart from '@/components/TemperatureChart.vue'
import { useFavoriteWeather } from '@/composables/useFavoriteWeather'
import { usePreferences } from '@/composables/usePreferences'
import { buildCityLabel, formatUpdatedAt, formatWind, getModePoints, getWeatherIconUrl } from '@/utils/weather'

const { favorites, locale, theme, removeFavorite } = usePreferences()
const { items, isLoading, mode, hasFavorites } = useFavoriteWeather(favorites, locale)
const { t } = useI18n()
</script>

<template>
  <section class="favorites-shell">
    <header class="favorites-header">
      <div>
        <h2 class="favorites-title">{{ t('favoritesTitle') }}</h2>
        <p class="favorites-description">{{ t('favoritesSubtitle') }}</p>
      </div>

      <div v-if="hasFavorites" class="segmented-control" role="tablist" :aria-label="t('feelsLike')">
        <button
          class="segmented-item"
          :class="{ 'segmented-item-active': mode === 'day' }"
          type="button"
          @click="mode = 'day'"
        >
          {{ t('day') }}
        </button>
        <button
          class="segmented-item"
          :class="{ 'segmented-item-active': mode === 'week' }"
          type="button"
          @click="mode = 'week'"
        >
          {{ t('week') }}
        </button>
      </div>
    </header>

    <div v-if="isLoading" class="favorites-state">
      <div class="loader"></div>
      <p>{{ t('loading') }}</p>
    </div>

    <div v-else-if="!hasFavorites" class="favorites-state empty-state">
      <p>{{ t('favoritesEmpty') }}</p>
    </div>

    <div v-else class="favorites-grid">
      <article v-for="item in items" :key="`${item.location.lat}-${item.location.lon}`" class="favorite-card">
        <div class="favorite-actions">
          <span class="widget-badge">★ {{ t('favoritesTab') }}</span>
          <button class="icon-button" type="button" :title="t('favoriteRemove')" @click="removeFavorite(item.location)">
            ✕
          </button>
        </div>

        <div v-if="item.error" class="favorites-state error-state">
          <p>{{ item.error }}</p>
        </div>

        <template v-else-if="item.weather">
          <section class="summary-row">
            <div>
              <p class="eyebrow">{{ t('currentConditions') }}</p>
              <h3 class="location-title">{{ buildCityLabel(item.weather.location) }}</h3>
              <p class="weather-description">{{ item.weather.current.description }}</p>
              <p class="update-text">
                {{ t('updatedAt') }}:
                {{ formatUpdatedAt(item.weather.current.timestamp, item.weather.timezoneOffset, locale) }}
              </p>
            </div>

            <div class="weather-temp-shell">
              <img
                class="weather-icon"
                :src="getWeatherIconUrl(item.weather.current.icon)"
                :alt="item.weather.current.description"
              />
              <strong class="temperature">{{ item.weather.current.temperature }}°C</strong>
            </div>
          </section>

          <section class="metrics-grid">
            <div class="metric-card">
              <span class="metric-label">{{ t('humidity') }}</span>
              <strong class="metric-value">{{ item.weather.current.humidity }}%</strong>
            </div>
            <div class="metric-card">
              <span class="metric-label">{{ t('wind') }}</span>
              <strong class="metric-value">{{ formatWind(item.weather.current.windSpeed, locale) }}</strong>
            </div>
          </section>

          <TemperatureChart
            :locale="locale"
            :theme="theme"
            :points="getModePoints(item.weather, mode)"
            :mode="mode"
          />
        </template>
      </article>
    </div>
  </section>
</template>

<style scoped>
.favorites-shell {
  display: grid;
  gap: 1.25rem;
}

.favorites-header,
.favorite-actions,
.summary-row,
.weather-temp-shell {
  display: flex;
}

.favorites-header,
.favorite-actions,
.summary-row {
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
}

.favorite-actions {
  width: 100%;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.favorites-title {
  font-size: clamp(1.6rem, 3vw, 2.25rem);
  font-weight: 800;
  color: var(--color-heading);
}

.favorites-description,
.eyebrow,
.weather-description,
.update-text,
.metric-label {
  color: var(--color-text-soft);
}

.favorites-grid {
  display: grid;
  gap: 1rem;
}

.favorite-card {
  display: grid;
  gap: 1rem;
  border-radius: 28px;
  border: 1px solid var(--color-border);
  background: var(--surface-color);
  padding: 1.25rem;
  box-shadow: var(--shadow-md);
}

.summary-row {
  align-items: flex-start;
}

.location-title {
  font-size: clamp(1.3rem, 2vw, 1.75rem);
  font-weight: 700;
  color: var(--color-heading);
}

.weather-icon {
  width: 72px;
  height: 72px;
}

.temperature {
  font-size: clamp(1.8rem, 3vw, 2.8rem);
  line-height: 1;
  color: var(--color-heading);
}

.favorites-state {
  display: grid;
  place-items: center;
  gap: 1rem;
  min-height: 180px;
  border-radius: 24px;
  border: 1px dashed var(--color-border);
  background: var(--surface-muted);
  padding: 1.5rem;
  text-align: center;
}

.error-state {
  color: var(--danger-color);
}

@media (min-width: 720px) {
  .favorites-header,
  .summary-row {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
