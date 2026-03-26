import type {
  AppLocale,
  CityLocation,
  ForecastApiResponse,
  ForecastMode,
  GeocodingApiItem,
  TemperaturePoint,
  WeatherBundle,
  CurrentWeatherApiResponse,
} from '@/types/weather'
import { formatLocale } from '@/i18n'

function toLocalDate(timestamp: number, timezoneOffset: number): Date {
  return new Date((timestamp + timezoneOffset) * 1000)
}

function toLocalDayKey(timestamp: number, timezoneOffset: number): string {
  const date = toLocalDate(timestamp, timezoneOffset)
  const year = date.getUTCFullYear()
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0')
  const day = `${date.getUTCDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatHourLabel(timestamp: number, timezoneOffset: number, locale: AppLocale): string {
  return new Intl.DateTimeFormat(formatLocale(locale), {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(toLocalDate(timestamp, timezoneOffset))
}

function formatDayLabel(timestamp: number, timezoneOffset: number, locale: AppLocale): string {
  return new Intl.DateTimeFormat(formatLocale(locale), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(toLocalDate(timestamp, timezoneOffset))
}

export function mapGeocodingItem(item: GeocodingApiItem, locale: AppLocale): CityLocation {
  const localizedName = item.local_names?.[locale]

  return {
    name: localizedName ?? item.name,
    country: item.country,
    state: item.state,
    lat: item.lat,
    lon: item.lon,
  }
}

export function buildCityLabel(location: CityLocation): string {
  return [location.name, location.state, location.country].filter(Boolean).join(', ')
}

export function getWeatherIconUrl(icon: string): string {
  return `https://openweathermap.org/img/wn/${icon}@2x.png`
}

export function getModePoints(bundle: WeatherBundle, mode: ForecastMode): TemperaturePoint[] {
  return mode === 'day' ? bundle.hourly : bundle.daily
}

export function normalizeWeatherBundle(
  current: CurrentWeatherApiResponse,
  forecast: ForecastApiResponse,
  locale: AppLocale,
  fallbackLocation?: CityLocation,
): WeatherBundle {
  const timezoneOffset = current.timezone
  const currentDayKey = toLocalDayKey(current.dt, timezoneOffset)

  const hourly = forecast.list
    .filter((item) => toLocalDayKey(item.dt, timezoneOffset) === currentDayKey)
    .map((item) => ({
      timestamp: item.dt,
      label: formatHourLabel(item.dt, timezoneOffset, locale),
      value: Math.round(item.main.temp),
    }))

  const dailyMap = new Map<string, { timestamp: number; total: number; count: number }>()

  for (const item of forecast.list) {
    const key = toLocalDayKey(item.dt, timezoneOffset)
    const existing = dailyMap.get(key)

    if (existing) {
      existing.total += item.main.temp
      existing.count += 1
      continue
    }

    dailyMap.set(key, {
      timestamp: item.dt,
      total: item.main.temp,
      count: 1,
    })
  }

  const daily = Array.from(dailyMap.values())
    .slice(0, 5)
    .map((item) => ({
      timestamp: item.timestamp,
      label: formatDayLabel(item.timestamp, timezoneOffset, locale),
      value: Math.round(item.total / item.count),
    }))

  const forecastCity = forecast.city
  const location = fallbackLocation ?? {
    name: current.name || forecastCity.name,
    country: current.sys.country || forecastCity.country,
    lat: current.coord.lat,
    lon: current.coord.lon,
  }

  return {
    location,
    timezoneOffset,
    current: {
      temperature: Math.round(current.main.temp),
      description: current.weather[0]?.description ?? '',
      icon: current.weather[0]?.icon ?? '01d',
      humidity: current.main.humidity,
      windSpeed: current.wind.speed,
      timestamp: current.dt,
    },
    hourly,
    daily,
  }
}

export function formatUpdatedAt(timestamp: number, timezoneOffset: number, locale: AppLocale): string {
  return new Intl.DateTimeFormat(formatLocale(locale), {
    hour: 'numeric',
    minute: '2-digit',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(toLocalDate(timestamp, timezoneOffset))
}

export function formatWind(speed: number, locale: AppLocale): string {
  const value = new Intl.NumberFormat(formatLocale(locale), {
    maximumFractionDigits: 1,
  }).format(speed)

  return `${value} m/s`
}

export function getLocationKey(location: Pick<CityLocation, 'lat' | 'lon'>): string {
  return `${location.lat.toFixed(4)}:${location.lon.toFixed(4)}`
}
