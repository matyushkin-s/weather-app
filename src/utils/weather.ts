import Decimal from 'decimal.js'

import type {
  AppLocale,
  CityLocation,
  CurrentWeatherApiResponse,
  ForecastApiResponse,
  ForecastMode,
  GeocodingApiItem,
  TemperaturePoint,
  WeatherBundle,
} from '@/types/weather'
import { formatLocale } from '@/i18n'

interface InterpolationPoint {
  timestamp: number
  value: Decimal
}

function toLocalDate(timestamp: number, timezoneOffset: number): Date {
  return new Date((timestamp + timezoneOffset) * 1000)
}

function formatDayKeyFromDate(date: Date): string {
  const year = date.getUTCFullYear()
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0')
  const day = `${date.getUTCDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toLocalDayKey(timestamp: number, timezoneOffset: number): string {
  return formatDayKeyFromDate(toLocalDate(timestamp, timezoneOffset))
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

function isLocalMidnight(timestamp: number, timezoneOffset: number): boolean {
  const localDate = toLocalDate(timestamp, timezoneOffset)
  return localDate.getUTCHours() === 0 && localDate.getUTCMinutes() === 0
}

function roundTemperature(value: Decimal.Value): number {
  return new Decimal(value).toDecimalPlaces(1).toNumber()
}

function interpolateHourlyPoints(points: InterpolationPoint[]): InterpolationPoint[] {
  if (points.length <= 1) {
    return points
  }

  const interpolated = new Map<number, Decimal>()

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index]
    const end = points[index + 1]

    if (!start || !end || end.timestamp <= start.timestamp) {
      continue
    }

    const intervalHours = Math.round((end.timestamp - start.timestamp) / 3600)
    if (intervalHours <= 0) {
      continue
    }

    for (let step = 0; step < intervalHours; step += 1) {
      const timestamp = start.timestamp + step * 3600
      const ratio = new Decimal(step).div(intervalHours)
      const value = start.value.plus(end.value.minus(start.value).mul(ratio))
      interpolated.set(timestamp, value)
    }
  }

  const lastPoint = points[points.length - 1]
  if (lastPoint) {
    interpolated.set(lastPoint.timestamp, lastPoint.value)
  }

  return Array.from(interpolated.entries())
    .map(([timestamp, value]) => ({ timestamp, value }))
    .sort((left, right) => left.timestamp - right.timestamp)
}

function buildHourlyPoints(
  forecast: ForecastApiResponse,
  current: CurrentWeatherApiResponse,
  locale: AppLocale,
  timezoneOffset: number,
): TemperaturePoint[] {
  const currentDayKey = toLocalDayKey(current.dt, timezoneOffset)
  const nextDayDate = toLocalDate(current.dt, timezoneOffset)
  nextDayDate.setUTCDate(nextDayDate.getUTCDate() + 1)
  const nextDayKey = formatDayKeyFromDate(nextDayDate)

  const rawPoints = forecast.list
    .filter((item) => {
      const itemDayKey = toLocalDayKey(item.dt, timezoneOffset)

      if (itemDayKey === currentDayKey) {
        return true
      }

      return itemDayKey === nextDayKey && isLocalMidnight(item.dt, timezoneOffset)
    })
    .sort((left, right) => left.dt - right.dt)
    .map((item) => ({
      timestamp: item.dt,
      value: new Decimal(item.main.temp),
    }))

  const hourlyPoints = interpolateHourlyPoints(rawPoints)

  return hourlyPoints.map((point) => ({
    timestamp: point.timestamp,
    label: formatHourLabel(point.timestamp, timezoneOffset, locale),
    value: roundTemperature(point.value),
  }))
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
  const hourly = buildHourlyPoints(forecast, current, locale, timezoneOffset)

  const dailyMap = new Map<string, { timestamp: number; total: Decimal; count: number }>()

  for (const item of forecast.list) {
    const key = toLocalDayKey(item.dt, timezoneOffset)
    const existing = dailyMap.get(key)

    if (existing) {
      existing.total = existing.total.plus(item.main.temp)
      existing.count += 1
      continue
    }

    dailyMap.set(key, {
      timestamp: item.dt,
      total: new Decimal(item.main.temp),
      count: 1,
    })
  }

  const daily = Array.from(dailyMap.values())
    .slice(0, 5)
    .map((item) => ({
      timestamp: item.timestamp,
      label: formatDayLabel(item.timestamp, timezoneOffset, locale),
      value: roundTemperature(item.total.div(item.count)),
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
      temperature: roundTemperature(current.main.temp),
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