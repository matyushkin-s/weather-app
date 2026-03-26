import axios, { AxiosError } from 'axios'

import type {
  AppLocale,
  CityLocation,
  Coordinates,
  CurrentWeatherApiResponse,
  ForecastApiResponse,
  GeocodingApiItem,
  WeatherBundle,
} from '@/types/weather'
import { apiLanguageByLocale, translate } from '@/i18n'
import { mapGeocodingItem, normalizeWeatherBundle } from '@/utils/weather'

const weatherClient = axios.create({
  baseURL: 'https://api.openweathermap.org',
  timeout: 10000,
})

const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY

function ensureApiKey(locale: AppLocale): string {
  if (!WEATHER_API_KEY) {
    throw new Error(translate(locale, 'apiKeyMissing'))
  }

  return WEATHER_API_KEY
}

function getErrorMessage(error: unknown, locale: AppLocale): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string }>
    return axiosError.response?.data?.message ?? axiosError.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return translate(locale, 'genericError')
}

export async function searchCities(query: string, locale: AppLocale): Promise<CityLocation[]> {
  const trimmedQuery = query.trim()

  if (!trimmedQuery) {
    return []
  }

  const apiKey = ensureApiKey(locale)
  const response = await weatherClient.get<GeocodingApiItem[]>('/geo/1.0/direct', {
    params: {
      q: trimmedQuery,
      limit: 5,
      appid: apiKey,
    },
  })

  const uniqueCities = new Map<string, CityLocation>()

  for (const item of response.data) {
    const city = mapGeocodingItem(item, locale)
    const key = `${city.name}-${city.country}-${city.lat.toFixed(4)}-${city.lon.toFixed(4)}`

    if (!uniqueCities.has(key)) {
      uniqueCities.set(key, city)
    }
  }

  return Array.from(uniqueCities.values())
}

export async function fetchWeatherBundle(
  location: Coordinates & Partial<Pick<CityLocation, 'name' | 'country' | 'state'>>,
  locale: AppLocale,
): Promise<WeatherBundle> {
  const apiKey = ensureApiKey(locale)
  const params = {
    lat: location.lat,
    lon: location.lon,
    appid: apiKey,
    units: 'metric',
    lang: apiLanguageByLocale[locale],
  }

  const [currentResponse, forecastResponse] = await Promise.all([
    weatherClient.get<CurrentWeatherApiResponse>('/data/2.5/weather', { params }),
    weatherClient.get<ForecastApiResponse>('/data/2.5/forecast', { params }),
  ])

  return normalizeWeatherBundle(
    currentResponse.data,
    forecastResponse.data,
    locale,
    location.name && location.country
      ? {
          name: location.name,
          country: location.country,
          state: location.state,
          lat: location.lat,
          lon: location.lon,
        }
      : undefined,
  )
}

export function toWeatherError(error: unknown, locale: AppLocale): string {
  return getErrorMessage(error, locale)
}

export function hasWeatherApiKey(): boolean {
  return Boolean(WEATHER_API_KEY)
}
