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

  async function reloadAll(): Promise<void> {
    if (favorites.value.length === 0) {
      isLoading.value = false
      items.value = []
      return
    }

    isLoading.value = true

    items.value = await Promise.all(favorites.value.map((location) => fetchItem(location)))
    isLoading.value = false
  }

  async function reload(location?: CityLocation): Promise<void> {
    if (!location) {
      await reloadAll()
      return
    }

    const locationKey = getLocationKey(location)
    const index = items.value.findIndex((item) => getLocationKey(item.location) === locationKey)

    if (index === -1) {
      const fetched = await fetchItem(location)
      items.value = [...items.value, fetched]
      return
    }

    const current = items.value[index]
    if (!current) {
      return
    }

    const loadingItem: FavoriteWeatherItem = {
      ...current,
      isLoading: true,
      error: null,
    }

    const nextItems = [...items.value]
    nextItems[index] = loadingItem
    items.value = nextItems

    const fetched = await fetchItem(location)
    const updatedItems = [...items.value]
    updatedItems[index] = fetched
    items.value = updatedItems
  }

  watch([favorites, locale], () => {
    void reloadAll()
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
