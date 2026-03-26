import { computed, ref, watch, type Ref } from 'vue'

import { fetchWeatherBundle, toWeatherError } from '@/services/weatherService'
import type { AppLocale, CityLocation, FavoriteWeatherItem, ForecastMode } from '@/types/weather'

export function useFavoriteWeather(favorites: Ref<CityLocation[]>, locale: Ref<AppLocale>) {
  const items = ref<FavoriteWeatherItem[]>([])
  const isLoading = ref(false)
  const mode = ref<ForecastMode>('day')

  async function reload(): Promise<void> {
    if (favorites.value.length === 0) {
      isLoading.value = false
      items.value = []
      return
    }

    isLoading.value = true

    const results = await Promise.all(
      favorites.value.map(async (location) => {
        try {
          const weather = await fetchWeatherBundle(location, locale.value)
          return {
            location,
            weather,
            isLoading: false,
            error: null,
          } satisfies FavoriteWeatherItem
        } catch (error) {
          return {
            location,
            weather: null,
            isLoading: false,
            error: toWeatherError(error, locale.value),
          } satisfies FavoriteWeatherItem
        }
      }),
    )

    items.value = results
    isLoading.value = false
  }

  watch([favorites, locale], () => {
    void reload()
  }, { immediate: true, deep: true })

  const hasFavorites = computed(() => favorites.value.length > 0)

  return {
    items,
    isLoading,
    mode,
    hasFavorites,
    reload,
  }
}
