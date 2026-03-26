<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { searchCities, toWeatherError } from '@/services/weatherService'
import type { AppLocale, CityLocation } from '@/types/weather'
import { buildCityLabel } from '@/utils/weather'

const props = defineProps<{
  locale: AppLocale
  disabled?: boolean
  selectedLocation: CityLocation | null
}>()

const emit = defineEmits<{
  select: [location: CityLocation]
}>()

const query = ref(props.selectedLocation ? buildCityLabel(props.selectedLocation) : '')
const suggestions = ref<CityLocation[]>([])
const isLoading = ref(false)
const isOpen = ref(false)
const error = ref<string | null>(null)
const skipNextSearch = ref(false)
let requestId = 0
const { t } = useI18n()

let debounceTimer: ReturnType<typeof setTimeout> | null = null

watch(
  () => props.selectedLocation,
  (location) => {
    query.value = location ? buildCityLabel(location) : ''
  },
)

watch(query, (value) => {
  if (skipNextSearch.value) {
    skipNextSearch.value = false
    return
  }

  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  if (!value.trim()) {
    requestId += 1
    suggestions.value = []
    error.value = null
    isLoading.value = false
    isOpen.value = false
    return
  }

  debounceTimer = setTimeout(async () => {
    const currentRequestId = ++requestId
    isLoading.value = true
    error.value = null

    try {
      const result = await searchCities(value, props.locale)
      if (currentRequestId !== requestId) {
        return
      }

      suggestions.value = result
      isOpen.value = true
    } catch (searchError) {
      if (currentRequestId !== requestId) {
        return
      }

      suggestions.value = []
      error.value = toWeatherError(searchError, props.locale)
    } finally {
      if (currentRequestId === requestId) {
        isLoading.value = false
      }
    }
  }, 400)
})

onBeforeUnmount(() => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
})

function handleSelect(location: CityLocation): void {
  requestId += 1
  skipNextSearch.value = true
  query.value = buildCityLabel(location)
  suggestions.value = []
  isOpen.value = false
  emit('select', location)
}

function handleBlur(): void {
  window.setTimeout(() => {
    isOpen.value = false
  }, 120)
}

function handleFocus(): void {
  if (suggestions.value.length > 0) {
    isOpen.value = true
  }
}

function handleEnter(): void {
  if (suggestions.value[0]) {
    handleSelect(suggestions.value[0])
  }
}

const shouldShowDropdown = computed(() => isOpen.value && (isLoading.value || suggestions.value.length > 0 || Boolean(error.value)))
</script>

<template>
  <div class="autocomplete">
    <label class="field-label" for="city-search">{{ t('searchPlaceholder') }}</label>
    <div class="search-shell">
      <input
        id="city-search"
        v-model="query"
        class="search-input"
        type="text"
        :placeholder="t('searchPlaceholder')"
        :disabled="props.disabled"
        autocomplete="off"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown.enter.prevent="handleEnter"
      />
      <span v-if="isLoading" class="search-status">{{ t('loading') }}</span>
    </div>
    <p class="field-hint">{{ t('searchHint') }}</p>

    <transition name="fade-slide">
      <ul v-if="shouldShowDropdown" class="suggestions" role="listbox">
        <li v-if="error" class="suggestion suggestion-error">{{ error }}</li>
        <li v-else-if="!isLoading && suggestions.length === 0" class="suggestion suggestion-empty">
          {{ t('noResults') }}
        </li>
        <li v-for="item in suggestions" :key="`${item.lat}-${item.lon}`" class="suggestion-row">
          <button class="suggestion" type="button" @click="handleSelect(item)">
            {{ buildCityLabel(item) }}
          </button>
        </li>
      </ul>
    </transition>
  </div>
</template>

<style scoped>
.autocomplete {
  position: relative;
}

.autocomplete .field-label {
  margin-bottom: 8px;
}

.search-shell {
  position: relative;
}

.search-input {
  width: 100%;
  min-height: 48px;
  border-radius: 16px;
  border: 1px solid var(--color-border);
  background: var(--input-background);
  color: var(--color-text);
  padding: 0.875rem 1rem;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.search-input:focus {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 4px var(--accent-soft);
}

.search-status {
  position: absolute;
  top: 50%;
  right: 1rem;
  transform: translateY(-50%);
  color: var(--color-text-soft);
  font-size: 0.85rem;
}

.suggestions {
  position: absolute;
  z-index: 15;
  width: 100%;
  margin-top: 0.5rem;
  padding: 0.4rem;
  list-style: none;
  border-radius: 18px;
  border: 1px solid var(--color-border);
  background: var(--surface-color);
  box-shadow: var(--shadow-md);
}

.suggestion-row + .suggestion-row {
  margin-top: 0.25rem;
}

.suggestion {
  width: 100%;
  border: 0;
  border-radius: 14px;
  background: transparent;
  color: var(--color-text);
  text-align: left;
  padding: 0.75rem;
  cursor: pointer;
}

.suggestion:hover,
.suggestion:focus-visible {
  background: var(--accent-soft);
}

.suggestion-error,
.suggestion-empty {
  cursor: default;
  color: var(--color-text-soft);
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
