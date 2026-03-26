<script setup lang="ts">
import { debounce } from 'lodash'
import {computed, onBeforeUnmount, ref, useId, watch} from 'vue'
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

const inputId = useId();
const query = ref(props.selectedLocation ? buildCityLabel(props.selectedLocation) : '')
const suggestions = ref<CityLocation[]>([])
const isLoading = ref(false)
const isOpen = ref(false)
const error = ref<string | null>(null)
const skipNextSearch = ref(false)
let requestId = 0
const { t } = useI18n()

async function fetchSuggestions(value: string): Promise<void> {
  const currentRequestId = ++requestId
  isLoading.value = true
  isOpen.value = true
  error.value = null

  try {
    const result = await searchCities(value, props.locale)
    if (currentRequestId !== requestId) return

    suggestions.value = result
  } catch (searchError) {
    if (currentRequestId !== requestId) return

    suggestions.value = []
    error.value = toWeatherError(searchError, props.locale)
  } finally {
    if (currentRequestId === requestId) {
      isLoading.value = false
    }
  }
}

const debouncedFetch = debounce(fetchSuggestions, 400)

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

  const normalizedQuery = value.trim()

  if (!normalizedQuery || normalizedQuery.length < 3) {
    debouncedFetch.cancel()
    requestId += 1
    suggestions.value = []
    error.value = null
    isLoading.value = false
    isOpen.value = false
    return
  }

  debouncedFetch(normalizedQuery)
})

onBeforeUnmount(() => {
  debouncedFetch.cancel()
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

function clearInput(id: string): void {
  debouncedFetch.cancel()
  requestId += 1
  query.value = ''
  suggestions.value = []
  error.value = null
  isLoading.value = false
  isOpen.value = false
  document.getElementById(id)?.focus()
}

const shouldShowDropdown = computed(() => isOpen.value && (isLoading.value || suggestions.value.length > 0 || Boolean(error.value)))
</script>

<template>
  <div class="autocomplete">
    <label class="field-label" :for="inputId">{{ t('searchPlaceholder') }}</label>
    <div class="search-shell">
      <input
        :id="inputId"
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
      <button
        v-if="query && !props.disabled"
        class="clear-button"
        type="button"
        :aria-label="t('cancel')"
        :title="t('cancel')"
        @click="clearInput(inputId)"
      >
        ×
      </button>
    </div>
    <p class="field-hint" :class="{'field-hint--transparent': query}">{{ t('searchHint') }}</p>

    <transition name="fade-slide">
      <ul v-if="shouldShowDropdown" class="suggestions" role="listbox">
        <li v-if="isLoading" class="suggestion suggestion-loading">
          <span class="inline-loader" aria-hidden="true"></span>
        </li>
        <li v-else-if="error" class="suggestion suggestion-error">{{ error }}</li>
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
  padding: 0.875rem 2.8rem 0.875rem 1rem;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.search-input:focus {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 4px var(--accent-soft);
}

.clear-button {
  position: absolute;
  top: 50%;
  right: 1rem;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  border-radius: 999px;
  border: 0;
  background: transparent;
  color: var(--color-text-soft);
  font-size: 1.2rem;
  line-height: 1;
  cursor: pointer;
}

.clear-button:hover,
.clear-button:focus-visible {
  background: var(--accent-soft);
}

.suggestions {
  position: absolute;
  top: 72%;
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

.suggestion-loading {
  display: grid;
  place-items: center;
  padding: 0.75rem;
}

.inline-loader {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid var(--accent-soft);
  border-top-color: var(--accent-color);
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
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
