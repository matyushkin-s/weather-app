import axios from 'axios'

import type { AppLocale, CityLocation, IpLocationResponse } from '@/types/weather'
import { translate } from '@/i18n'

const locationClient = axios.create({
  baseURL: 'https://ipinfo.io',
  timeout: 8000,
})

export async function detectCityByIp(locale: AppLocale): Promise<CityLocation | null> {
  try {
    const response = await locationClient.get<IpLocationResponse>('/')

    if (response.status !== 200) {
      return null
    }

    const [latRaw, lonRaw] = response.data.loc.split(',').map((value) => Number(value.trim()))

    if (latRaw === undefined || lonRaw === undefined) {
      return null
    }

    if (!Number.isFinite(latRaw) || !Number.isFinite(lonRaw)) {
      return null
    }

    return {
      name: response.data.city,
      country: response.data.country,
      lat: latRaw,
      lon: lonRaw,
    }
  } catch {
    throw new Error(translate(locale, 'genericError'))
  }
}
