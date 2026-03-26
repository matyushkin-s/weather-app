import { computed, ref } from 'vue'

import { detectCityByIp } from '@/services/locationService'
import { fetchWeatherBundle, toWeatherError } from '@/services/weatherService'
import type { AppLocale, CityLocation, WeatherBlockState, ForecastMode } from '@/types/weather'

const MAX_BLOCKS = 5

function createBlock(id = crypto.randomUUID()): WeatherBlockState {
  return {
    id,
    location: null,
    weather: null,
    isLoading: false,
    error: null,
    mode: 'day',
  }
}

const blocks = ref<WeatherBlockState[]>([createBlock()])
const bootstrapMessage = ref<string | null>(null)
const ipBootstrapTried = ref(false)

async function loadWeatherForBlock(blockId: string, location: CityLocation, locale: AppLocale): Promise<void> {
  const block = blocks.value.find((item) => item.id === blockId)
  if (!block) {
    return
  }

  block.isLoading = true
  block.error = null

  try {
    const bundle = await fetchWeatherBundle(location, locale)
    block.location = location
    block.weather = bundle
  } catch (error) {
    block.error = toWeatherError(error, locale)
  } finally {
    block.isLoading = false
  }
}

function addBlock(): boolean {
  if (blocks.value.length >= MAX_BLOCKS) {
    return false
  }

  blocks.value = [...blocks.value, createBlock()]
  return true
}

function removeBlock(blockId: string): boolean {
  if (blocks.value.length <= 1) {
    return false
  }

  blocks.value = blocks.value.filter((block) => block.id !== blockId)
  return true
}

function setMode(blockId: string, mode: ForecastMode): void {
  const block = blocks.value.find((item) => item.id === blockId)
  if (!block) {
    return
  }

  block.mode = mode
}

async function refreshAll(locale: AppLocale): Promise<void> {
  await Promise.all(
    blocks.value
      .filter((block) => block.location)
      .map((block) => loadWeatherForBlock(block.id, block.location as CityLocation, locale)),
  )
}

async function bootstrapFirstBlock(locale: AppLocale, autoLocationMessage: string): Promise<void> {
  if (ipBootstrapTried.value) {
    return
  }

  ipBootstrapTried.value = true
  const firstBlock = blocks.value[0]

  if (!firstBlock || firstBlock.location) {
    return
  }

  try {
    const location = await detectCityByIp(locale)
    if (!location) {
      return
    }

    bootstrapMessage.value = autoLocationMessage
    await loadWeatherForBlock(firstBlock.id, location, locale)
  } catch {
    bootstrapMessage.value = null
  }
}

const canAddBlock = computed(() => blocks.value.length < MAX_BLOCKS)

export function useWeatherDashboard() {
  return {
    blocks,
    canAddBlock,
    bootstrapMessage,
    addBlock,
    removeBlock,
    setMode,
    loadWeatherForBlock,
    refreshAll,
    bootstrapFirstBlock,
  }
}
