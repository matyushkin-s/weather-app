export type AppLocale = 'en' | 'uk'
export type AppTheme = 'light' | 'dark'
export type ForecastMode = 'day' | 'week'

export interface Coordinates {
  lat: number
  lon: number
}

export interface CityLocation extends Coordinates {
  name: string
  country: string
  state?: string
}

export interface CurrentWeather {
  temperature: number
  description: string
  icon: string
  humidity: number
  windSpeed: number
  timestamp: number
}

export interface TemperaturePoint {
  timestamp: number
  label: string
  value: number
}

export interface WeatherBundle {
  location: CityLocation
  timezoneOffset: number
  current: CurrentWeather
  hourly: TemperaturePoint[]
  daily: TemperaturePoint[]
}

export interface WeatherBlockState {
  id: string
  location: CityLocation | null
  weather: WeatherBundle | null
  isLoading: boolean
  error: string | null
  mode: ForecastMode
}

export interface FavoriteWeatherItem {
  location: CityLocation
  weather: WeatherBundle | null
  isLoading: boolean
  error: string | null
}

export interface GeocodingApiItem {
  name: string
  lat: number
  lon: number
  country: string
  state?: string
  local_names?: Partial<Record<AppLocale, string>>
}

export interface CurrentWeatherApiResponse {
  coord: Coordinates
  weather: Array<{
    description: string
    icon: string
  }>
  main: {
    temp: number
    humidity: number
  }
  wind: {
    speed: number
  }
  dt: number
  timezone: number
  name: string
  sys: {
    country: string
  }
}

export interface ForecastApiResponse {
  list: Array<{
    dt: number
    main: {
      temp: number
    }
    weather: Array<{
      description: string
      icon: string
    }>
  }>
  city: {
    name: string
    country: string
    timezone: number
    coord: Coordinates
  }
}

export interface IpLocationResponse {
  ip: string
  hostname: string
  city: string
  region: string
  country: string
  loc: string
  org: string
  postal: string
  timezone: string
}
