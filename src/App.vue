<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { usePreferences } from '@/composables/usePreferences'
import { hasWeatherApiKey } from '@/services/weatherService'
import { localeLabels } from '@/i18n'

const { locale, theme, toggleTheme } = usePreferences()
const { t } = useI18n()
</script>

<template>
  <div class="app-shell weather-app">
    <header class="app-header">
      <div class="hero-copy">
        <p class="hero-badge">OpenWeather + Vue 3</p>
        <h1 class="app-title">{{ t('appTitle') }}</h1>
        <p class="app-subtitle">{{ t('appSubtitle') }}</p>
      </div>

      <div class="toolbar-grid">
        <nav class="main-nav" aria-label="Primary navigation">
          <RouterLink class="nav-link" to="/">{{ t('dashboardTab') }}</RouterLink>
          <RouterLink class="nav-link" to="/favorites">{{ t('favoritesTab') }}</RouterLink>
        </nav>

        <div class="toolbar-actions">
          <button class="button button-secondary" type="button" @click="toggleTheme">
            {{ t('theme') }}: {{ t(theme) }}
          </button>

          <div class="segmented-control" :aria-label="t('language')">
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
      {{ t('apiKeyMissing') }}
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
  gap: 1rem;
}

.app-header {
  flex-direction: column;
  align-items: stretch;
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
  align-items: stretch;
}

.toolbar-grid {
  flex-direction: column;
}

.toolbar-actions,
.main-nav {
  flex-direction: column;
  gap: 0.75rem;
}

.toolbar-actions .button,
.main-nav .nav-link {
  width: 100%;
}

.nav-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0.75rem 1rem;
  border-radius: 999px;
  color: var(--color-heading);
  border: 1px solid var(--surface-color);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.nav-link.router-link-active {
  background: var(--surface-color);
  box-shadow: var(--shadow-sm);
  pointer-events: none;
}

.nav-link:hover {
  transform: translateY(-1px);
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

@media (min-width: 900px) {
  .toolbar-actions {
    flex-direction: row;
    align-items: center;
  }

  .main-nav {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .toolbar-actions .button,
  .main-nav .nav-link {
    width: auto;
  }
}

@media (min-width: 900px) {
  .app-header,
  .toolbar-actions {
    flex-direction: row;
  }

  .app-header,
  .toolbar-grid {
    justify-content: space-between;
  }
}
</style>