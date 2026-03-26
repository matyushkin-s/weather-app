import axios from 'axios'

import type { AppLocale, CityLocation, IpLocationResponse } from '@/types/weather'
import { translate } from '@/i18n'

const locationClient = axios.create({
  baseURL: 'https://ipwho.is',
  timeout: 8000,
})

export async function detectCityByIp(locale: AppLocale): Promise<CityLocation | null> {
  try {
    const response = await locationClient.get<IpLocationResponse>('/')

    if (!response.data.success) {
      return null
    }

    return {
      name: response.data.city,
      country: response.data.country_code,
      lat: response.data.latitude,
      lon: response.data.longitude,
    }
  } catch {
    throw new Error(translate(locale, 'genericError'))
  }
}
