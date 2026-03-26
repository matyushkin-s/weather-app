<script setup lang="ts">
const props = defineProps<{
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel: string
  tone?: 'default' | 'danger'
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <transition name="modal-fade">
    <div v-if="props.open" class="modal-backdrop" @click.self="emit('cancel')">
      <div
        class="modal-card"
        role="dialog"
        aria-modal="true"
        :aria-label="props.title"
      >
        <h3 class="modal-title">{{ props.title }}</h3>
        <p class="modal-description">{{ props.description }}</p>
        <div class="modal-actions">
          <button class="button button-secondary" type="button" @click="emit('cancel')">
            {{ props.cancelLabel }}
          </button>
          <button
            class="button"
            :class="props.tone === 'danger' ? 'button-danger' : 'button-primary'"
            type="button"
            @click="emit('confirm')"
          >
            {{ props.confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  background: rgba(7, 12, 24, 0.68);
  backdrop-filter: blur(10px);
}

.modal-card {
  width: min(100%, 420px);
  border-radius: 24px;
  border: 1px solid var(--color-border);
  background: var(--surface-color);
  padding: 1.5rem;
  box-shadow: var(--shadow-lg);
}

.modal-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--color-heading);
}

.modal-description {
  margin-top: 0.75rem;
  color: var(--color-text-soft);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

@media (max-width: 480px) {
  .modal-actions {
    flex-direction: column-reverse;
  }

  .modal-actions .button {
    width: 100%;
  }
}
</style>
