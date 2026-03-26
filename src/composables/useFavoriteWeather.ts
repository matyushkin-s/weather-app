import { computed, ref, watch, type Ref } from 'vue'

import { fetchWeatherBundle, toWeatherError } from '@/services/weatherService'
import type { AppLocale, CityLocation, FavoriteWeatherItem, ForecastMode } from '@/types/weather'
import { getLocationKey } from '@/utils/weather'

export function useFavoriteWeather(favorites: Ref<CityLocation[]>, locale: Ref<AppLocale>) {
  const items = ref<FavoriteWeatherItem[]>([])
  const isLoading = ref(false)
  const mode = ref<ForecastMode>('day')

  async function fetchItem(location: CityLocation): Promise<FavoriteWeatherItem> {
    try {
      const weather = await fetchWeatherBundle(location, locale.value)

      return {
        location,
        weather,
        isLoading: false,
        error: null,
      }
    } catch (error) {
      return {
        location,
        weather: null,
        isLoading: false,
        error: toWeatherError(error, locale.value),
      }
    }
  }

  async function reload(): Promise<void> {
    if (favorites.value.length === 0) {
      isLoading.value = false
      items.value = []
      return
    }

    isLoading.value = true

    items.value = await Promise.all(favorites.value.map((location) => fetchItem(location)))
    isLoading.value = false
  }

  async function reloadLocation(location: CityLocation): Promise<void> {
    const locationKey = getLocationKey(location)
    const targetIndex = items.value.findIndex((item) => getLocationKey(item.location) === locationKey)

    const refreshedItem = await fetchItem(location)

    if (targetIndex === -1) {
      items.value = [...items.value, refreshedItem]
      return
    }

    const nextItems = [...items.value]
    nextItems[targetIndex] = refreshedItem
    items.value = nextItems
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
    reloadLocation,
  }
}
