<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import ConfirmModal from '@/components/ConfirmModal.vue'
import WeatherWidget from '@/components/WeatherWidget.vue'
import { useFavoriteWeather } from '@/composables/useFavoriteWeather'
import { usePreferences } from '@/composables/usePreferences'
import type { CityLocation, WeatherBlockState } from '@/types/weather'
import { getLocationKey } from '@/utils/weather'

const { favorites, locale, theme, removeFavorite } = usePreferences()
const { items, isLoading, mode, hasFavorites, reload, reloadLocation } = useFavoriteWeather(favorites, locale)
const { t } = useI18n()

const pendingRemoval = ref<CityLocation | null>(null)

const favoriteBlocks = computed<WeatherBlockState[]>(() =>
  items.value.map((item) => ({
    id: `favorite-${getLocationKey(item.location)}`,
    location: item.location,
    weather: item.weather,
    isLoading: isLoading.value,
    error: item.error,
    mode: mode.value,
  })),
)

function requestRemoveFavorite(location: CityLocation): void {
  pendingRemoval.value = location
}

function cancelRemoveFavorite(): void {
  pendingRemoval.value = null
}

function confirmRemoveFavorite(): void {
  if (pendingRemoval.value) {
    removeFavorite(pendingRemoval.value)
  }

  pendingRemoval.value = null
}

async function handleReload(location?: CityLocation): Promise<void> {
  if (location) {
    await reloadLocation(location)
    return
  }

  await reload()
}

function handleModeChange(nextMode: 'day' | 'week'): void {
  mode.value = nextMode
}
</script>

<template>
  <section class="favorites-shell">
    <header class="favorites-header">
      <div>
        <h2 class="favorites-title">{{ t('favoritesTitle') }}</h2>
        <p class="favorites-description">{{ t('favoritesSubtitle') }}</p>
      </div>

      <div v-if="hasFavorites" class="favorites-controls">
        <div class="segmented-control" role="tablist" :aria-label="t('feelsLike')">
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
      </div>
    </header>

    <div v-if="isLoading && !favoriteBlocks.length" class="favorites-state">
      <div class="loader"></div>
      <p>{{ t('loading') }}</p>
    </div>

    <div v-else-if="!hasFavorites" class="favorites-state empty-state">
      <p>{{ t('favoritesEmpty') }}</p>
    </div>

    <div v-else class="favorites-grid">
      <WeatherWidget
        v-for="block in favoriteBlocks"
        :key="block.id"
        :block="block"
        :locale="locale"
        :theme="theme"
        :can-delete="true"
        :disable-search="true"
        :disable-favorite-toggle="true"
        :on-delete="block.location ? () => requestRemoveFavorite(block.location) : null"
        :forced-mode="mode"
        @mode-change="handleModeChange"
        @refresh="handleReload"
      />
    </div>

    <ConfirmModal
      :open="Boolean(pendingRemoval)"
      :title="t('favoriteRemoveTitle')"
      :description="t('favoriteRemoveText')"
      :confirm-label="t('confirm')"
      :cancel-label="t('cancel')"
      tone="danger"
      @confirm="confirmRemoveFavorite"
      @cancel="cancelRemoveFavorite"
    />
  </section>
</template>

<style scoped>
.favorites-shell {
  display: grid;
  gap: 1.25rem;
}

.favorites-controls {
  display: grid;
  gap: 0.75rem;
}

.favorites-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
}

.favorites-title {
  font-size: clamp(1.6rem, 3vw, 2.25rem);
  font-weight: 800;
  color: var(--color-heading);
}

.favorites-description {
  color: var(--color-text-soft);
}

.favorites-grid {
  display: grid;
  gap: 1rem;
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

@media (min-width: 720px) {
  .favorites-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .favorites-controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
}
</style>
