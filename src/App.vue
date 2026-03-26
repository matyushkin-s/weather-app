<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'

import { usePreferences } from '@/composables/usePreferences'
import { hasWeatherApiKey } from '@/services/weatherService'
import { localeLabels, translate } from '@/i18n'

const { locale, theme, toggleTheme } = usePreferences()
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="hero-copy">
        <p class="hero-badge">OpenWeather + Vue 3</p>
        <h1 class="app-title">{{ translate(locale, 'appTitle') }}</h1>
        <p class="app-subtitle">{{ translate(locale, 'appSubtitle') }}</p>
      </div>

      <div class="toolbar-grid">
        <nav class="main-nav" aria-label="Primary navigation">
          <RouterLink class="nav-link" to="/">{{ translate(locale, 'dashboardTab') }}</RouterLink>
          <RouterLink class="nav-link" to="/favorites">{{ translate(locale, 'favoritesTab') }}</RouterLink>
        </nav>

        <div class="toolbar-actions">
          <button class="button button-secondary" type="button" @click="toggleTheme">
            {{ translate(locale, 'theme') }}: {{ translate(locale, theme) }}
          </button>

          <div class="segmented-control" :aria-label="translate(locale, 'language')">
            <button
              v-for="item in (['en', 'uk'] as const)"
              :key="item"
              class="segmented-item"
              :class="{ 'segmented-item-active': locale === item }"
              type="button"
              @click="locale = item"
            >
              {{ localeLabels[item] }}
            </button>
          </div>
        </div>
      </div>
    </header>

    <div v-if="!hasWeatherApiKey()" class="notice-card notice-warning">
      {{ translate(locale, 'apiKeyMissing') }}
    </div>

    <main class="page-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  display: grid;
  gap: 1.5rem;
}

.app-header,
.toolbar-grid,
.toolbar-actions,
.main-nav {
  display: flex;
}

.app-header,
.toolbar-grid {
  justify-content: space-between;
  gap: 1rem;
}

.app-header {
  align-items: flex-start;
  padding: 1.5rem;
  border-radius: 32px;
  border: 1px solid var(--color-border);
  background: linear-gradient(135deg, var(--hero-gradient-start), var(--hero-gradient-end));
  box-shadow: var(--shadow-lg);
}

.hero-badge {
  display: inline-flex;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  color: var(--color-heading);
  padding: 0.35rem 0.7rem;
  font-size: 0.8rem;
  font-weight: 700;
}

.app-title {
  margin-top: 0.9rem;
  font-size: clamp(2rem, 4vw, 3.4rem);
  line-height: 1;
  font-weight: 800;
  color: var(--color-heading);
}

.app-subtitle {
  margin-top: 0.75rem;
  max-width: 36rem;
  color: var(--color-text-soft);
}

.toolbar-grid,
.toolbar-actions {
  align-items: center;
}

.toolbar-grid {
  flex-direction: column;
}

.toolbar-actions,
.main-nav {
  gap: 0.75rem;
}

.nav-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0.75rem 1rem;
  border-radius: 999px;
  color: var(--color-heading);
  background: rgba(255, 255, 255, 0.18);
}

.nav-link.router-link-active {
  background: var(--surface-color);
  box-shadow: var(--shadow-sm);
}

.notice-card {
  border-radius: 20px;
  padding: 1rem 1.25rem;
}

.notice-warning {
  border: 1px solid rgba(255, 184, 0, 0.4);
  background: rgba(255, 184, 0, 0.12);
  color: var(--color-heading);
}

.page-content {
  min-height: 55vh;
}

@media (max-width: 900px) {
  .app-header,
  .toolbar-grid,
  .toolbar-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .main-nav {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .toolbar-actions {
    flex-direction: column;
  }

  .main-nav {
    grid-template-columns: 1fr;
  }
}
</style>