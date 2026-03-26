<script setup lang="ts">
import { Chart, registerables, type ChartConfiguration } from 'chart.js'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import type { AppLocale, AppTheme, TemperaturePoint } from '@/types/weather'
import { translate } from '@/i18n'

Chart.register(...registerables)

const props = defineProps<{
  locale: AppLocale
  theme: AppTheme
  points: TemperaturePoint[]
  mode: 'day' | 'week'
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const isRendering = ref(false)
let chart: Chart<'line'> | null = null

const chartTitle = computed(() =>
  props.mode === 'day'
    ? translate(props.locale, 'hourlyChart')
    : translate(props.locale, 'weeklyChart'),
)

function destroyChart(): void {
  if (chart) {
    chart.destroy()
    chart = null
  }
}

function resolveChartColors() {
  const style = getComputedStyle(document.documentElement)

  return {
    line: style.getPropertyValue('--accent-color').trim(),
    fill: style.getPropertyValue('--accent-soft').trim(),
    label: style.getPropertyValue('--color-text-soft').trim(),
    grid: style.getPropertyValue('--color-border').trim(),
  }
}

async function renderChart(): Promise<void> {
  destroyChart()

  if (!canvasRef.value || props.points.length === 0) {
    return
  }

  isRendering.value = true
  await nextTick()

  const colors = resolveChartColors()
  const config: ChartConfiguration<'line'> = {
    type: 'line',
    data: {
      labels: props.points.map((point) => point.label),
      datasets: [
        {
          label: chartTitle.value,
          data: props.points.map((point) => point.value),
          borderColor: colors.line,
          backgroundColor: colors.fill,
          pointBackgroundColor: colors.line,
          pointBorderWidth: 0,
          pointRadius: 3,
          pointHoverRadius: 5,
          fill: true,
          tension: 0.35,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 300,
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context) => `${context.parsed.y}°C`,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: colors.label,
            maxRotation: 0,
          },
          grid: {
            color: colors.grid,
          },
        },
        y: {
          ticks: {
            color: colors.label,
            callback: (value) => `${value}°`,
          },
          grid: {
            color: colors.grid,
          },
        },
      },
    },
  }

  chart = new Chart(canvasRef.value, config)
  isRendering.value = false
}

onMounted(() => {
  void renderChart()
})

watch(
  () => [props.points, props.locale, props.theme, props.mode],
  () => {
    void renderChart()
  },
  { deep: true },
)

onBeforeUnmount(() => {
  destroyChart()
})
</script>

<template>
  <section class="chart-panel">
    <div class="chart-header">
      <div>
        <h4 class="chart-title">{{ chartTitle }}</h4>
        <p class="chart-caption">
          {{ props.mode === 'day' ? translate(props.locale, 'byHours') : translate(props.locale, 'byDays') }}
        </p>
      </div>
      <span v-if="isRendering" class="chart-loading">{{ translate(props.locale, 'chartLoading') }}</span>
    </div>

    <div v-if="props.points.length === 0" class="chart-empty">
      {{ translate(props.locale, 'noResults') }}
    </div>
    <div v-else class="chart-canvas-shell">
      <canvas ref="canvasRef" aria-label="Temperature chart"></canvas>
    </div>
  </section>
</template>

<style scoped>
.chart-panel {
  border-radius: 20px;
  border: 1px solid var(--color-border);
  background: var(--surface-muted);
  padding: 1rem;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.chart-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-heading);
}

.chart-caption,
.chart-loading,
.chart-empty {
  color: var(--color-text-soft);
  font-size: 0.92rem;
}

.chart-canvas-shell {
  position: relative;
  min-height: 260px;
  margin-top: 1rem;
}

@media (max-width: 640px) {
  .chart-header {
    flex-direction: column;
  }

  .chart-canvas-shell {
    min-height: 220px;
  }
}
</style>
