import { computed, ref, watch } from 'vue'

import type { AppLocale, AppTheme, CityLocation } from '@/types/weather'
import { getLocationKey } from '@/utils/weather'

const FAVORITES_STORAGE_KEY = 'weather-app:favorites'
const LOCALE_STORAGE_KEY = 'weather-app:locale'
const THEME_STORAGE_KEY = 'weather-app:theme'
const FAVORITES_LIMIT = 5

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    const rawValue = window.localStorage.getItem(key)
    return rawValue ? (JSON.parse(rawValue) as T) : fallback
  } catch {
    return fallback
  }
}

function resolveInitialTheme(): AppTheme {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const storedTheme = readStorage<AppTheme | null>(THEME_STORAGE_KEY, null)
  if (storedTheme) {
    return storedTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const locale = ref<AppLocale>(readStorage<AppLocale>(LOCALE_STORAGE_KEY, 'en'))
const theme = ref<AppTheme>(resolveInitialTheme())
const favorites = ref<CityLocation[]>(readStorage<CityLocation[]>(FAVORITES_STORAGE_KEY, []))

function applyTheme(value: AppTheme): void {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.dataset.theme = value
}

applyTheme(theme.value)

watch(locale, (value) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, JSON.stringify(value))
  }
})

watch(theme, (value) => {
  applyTheme(value)

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(value))
  }
})

watch(
  favorites,
  (value) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(value))
    }
  },
  { deep: true },
)

function isFavorite(location: CityLocation): boolean {
  const locationKey = getLocationKey(location)
  return favorites.value.some((item) => getLocationKey(item) === locationKey)
}

function addFavorite(location: CityLocation): { ok: boolean; reason?: 'limit' } {
  if (isFavorite(location)) {
    return { ok: true }
  }

  if (favorites.value.length >= FAVORITES_LIMIT) {
    return { ok: false, reason: 'limit' }
  }

  favorites.value = [...favorites.value, location]
  return { ok: true }
}

function removeFavorite(location: CityLocation): void {
  const locationKey = getLocationKey(location)
  favorites.value = favorites.value.filter((item) => getLocationKey(item) !== locationKey)
}

function toggleFavorite(location: CityLocation): { ok: boolean; active: boolean; reason?: 'limit' } {
  if (isFavorite(location)) {
    removeFavorite(location)
    return { ok: true, active: false }
  }

  const result = addFavorite(location)
  return {
    ok: result.ok,
    active: result.ok,
    reason: result.reason,
  }
}

function toggleTheme(): void {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}

const favoriteCount = computed(() => favorites.value.length)

export function usePreferences() {
  return {
    locale,
    theme,
    favorites,
    favoriteCount,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    toggleTheme,
  }
}
