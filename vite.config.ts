import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'weather-app'
  const configuredBase = process.env.VITE_BASE_PATH ?? `/${repositoryName}/`

  return {
    base: command === 'build' ? configuredBase : '/',
    plugins: [
      vue(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
  }
})
