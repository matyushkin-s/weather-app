<script setup lang="ts">
import TemperatureChart from '@/components/TemperatureChart.vue'
import { useFavoriteWeather } from '@/composables/useFavoriteWeather'
import { usePreferences } from '@/composables/usePreferences'
import { translate } from '@/i18n'
import { buildCityLabel, formatUpdatedAt, formatWind, getModePoints, getWeatherIconUrl } from '@/utils/weather'

const { favorites, locale, theme, removeFavorite } = usePreferences()
const { items, isLoading, mode, hasFavorites } = useFavoriteWeather(favorites, locale)
</script>

<template>
  <section class="favorites-shell">
    <header class="favorites-header">
      <div>
        <h2 class="favorites-title">{{ translate(locale, 'favoritesTitle') }}</h2>
        <p class="favorites-description">{{ translate(locale, 'favoritesSubtitle') }}</p>
      </div>

      <div v-if="hasFavorites" class="segmented-control" role="tablist" :aria-label="translate(locale, 'feelsLike')">
        <button
          class="segmented-item"
          :class="{ 'segmented-item-active': mode === 'day' }"
          type="button"
          @click="mode = 'day'"
        >
          {{ translate(locale, 'day') }}
        </button>
        <button
          class="segmented-item"
          :class="{ 'segmented-item-active': mode === 'week' }"
          type="button"
          @click="mode = 'week'"
        >
          {{ translate(locale, 'week') }}
        </button>
      </div>
    </header>

    <div v-if="isLoading" class="favorites-state">
      <div class="loader"></div>
      <p>{{ translate(locale, 'loading') }}</p>
    </div>

    <div v-else-if="!hasFavorites" class="favorites-state empty-state">
      <p>{{ translate(locale, 'favoritesEmpty') }}</p>
    </div>

    <div v-else class="favorites-grid">
      <article v-for="item in items" :key="`${item.location.lat}-${item.location.lon}`" class="favorite-card">
        <div class="favorite-actions">
          <span class="widget-badge">★ {{ translate(locale, 'favoritesTab') }}</span>
          <button class="icon-button" type="button" :title="translate(locale, 'favoriteRemove')" @click="removeFavorite(item.location)">
            ✕
          </button>
        </div>

        <div v-if="item.error" class="favorites-state error-state">
          <p>{{ item.error }}</p>
        </div>

        <template v-else-if="item.weather">
          <section class="summary-row">
            <div>
              <p class="eyebrow">{{ translate(locale, 'currentConditions') }}</p>
              <h3 class="location-title">{{ buildCityLabel(item.weather.location) }}</h3>
              <p class="weather-description">{{ item.weather.current.description }}</p>
              <p class="update-text">
                {{ translate(locale, 'updatedAt') }}:
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
              <span class="metric-label">{{ translate(locale, 'humidity') }}</span>
              <strong class="metric-value">{{ item.weather.current.humidity }}%</strong>
            </div>
            <div class="metric-card">
              <span class="metric-label">{{ translate(locale, 'wind') }}</span>
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
  justify-content: space-between;
  gap: 1rem;
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
  align-items: center;
}

.location-title {
  font-size: clamp(1.3rem, 2vw, 1.75rem);
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
  width: 72px;
  height: 72px;
}

.temperature {
  font-size: clamp(1.8rem, 3vw, 2.8rem);
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
  font-weight: 700;
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

.error-state {
  color: var(--danger-color);
}

@media (max-width: 720px) {
  .favorites-header,
  .summary-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
