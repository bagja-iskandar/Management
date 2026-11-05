<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-y-auto bg-black/80 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        @click.self="handleBackdropClick"
      >
        <div
          ref="panelRef"
          class="w-full rounded-2xl bg-[#111318] border border-white/[0.1] shadow-2xl text-[#F3F4F6] flex flex-col overflow-hidden max-h-[90vh] my-auto focus:outline-none"
          :class="[resolvedMaxWidth, props.class]"
          tabindex="-1"
        >
          <!-- Modal Header -->
          <header
            v-if="$slots.header || title || closable"
            class="flex items-center justify-between gap-3 px-6 sm:px-7 pt-6 pb-5 sm:pt-7 sm:pb-5.5 border-b border-white/[0.07] shrink-0"
          >
            <slot name="header">
              <div class="flex items-center gap-3 min-w-0">
                <!-- Icon container -->
                <div
                  v-if="icon"
                  class="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center shrink-0 shadow-sm"
                  aria-hidden="true"
                >
                  <NexuraIcon
                    :name="icon"
                    size="sm"
                    :class="iconColor || 'text-indigo-400'"
                  />
                </div>

                <div class="space-y-0.5 min-w-0">
                  <h3
                    :id="titleId"
                    class="font-sans text-base font-semibold text-[#F3F4F6] truncate"
                  >
                    {{ title }}
                  </h3>
                  <p
                    v-if="subtitle"
                    class="font-sans text-xs text-[#8A8F9E] truncate"
                  >
                    {{ subtitle }}
                  </p>
                </div>
              </div>
            </slot>

            <div class="flex items-center gap-2 shrink-0">
              <slot name="actions" />

              <BaseButton
                v-if="closable"
                variant="ghost"
                size="icon"
                icon="X"
                aria-label="Close dialog"
                @click="close"
              />
            </div>
          </header>

          <!-- Modal Body -->
          <div class="p-6 sm:p-7 overflow-y-auto flex-1 min-h-0 space-y-4">
            <slot />
          </div>

          <!-- Modal Footer -->
          <footer
            v-if="$slots.footer"
            class="px-6 sm:px-7 pt-4.5 pb-6 sm:pt-5 sm:pb-6.5 border-t border-white/[0.07] bg-white/[0.02] flex items-center justify-end gap-3 shrink-0"
          >
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, type Component } from 'vue'
import BaseButton from './BaseButton.vue'
import NexuraIcon from './NexuraIcon.vue'
import { useModalLifecycle } from '~/composables/useModalLifecycle'

export type ModalMaxWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | string

export interface BaseModalProps {
  modelValue?: boolean
  show?: boolean
  title?: string
  subtitle?: string
  icon?: string | Component | object
  iconColor?: string
  maxWidth?: ModalMaxWidth
  closable?: boolean
  class?: string
}

const props = withDefaults(defineProps<BaseModalProps>(), {
  modelValue: undefined,
  show: undefined,
  title: '',
  subtitle: '',
  icon: undefined,
  iconColor: 'text-indigo-400',
  maxWidth: 'lg',
  closable: true,
  class: ''
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}>()

const titleId = `modal-title-${Math.random().toString(36).substring(2, 9)}`
const panelRef = ref<HTMLElement | null>(null)

const isOpen = computed(() => {
  if (typeof props.modelValue === 'boolean') return props.modelValue
  if (typeof props.show === 'boolean') return props.show
  return false
})

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function handleBackdropClick() {
  if (props.closable) {
    close()
  }
}

// Integrated modal lifecycle: scroll lock, escape listener, focus trap
useModalLifecycle({
  isOpen,
  panelRef,
  onClose: () => {
    if (props.closable) close()
  }
})

const widthMap: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl'
}

const resolvedMaxWidth = computed(() => {
  if (props.maxWidth in widthMap) {
    return widthMap[props.maxWidth]
  }
  return props.maxWidth || 'max-w-lg'
})
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 150ms ease, transform 150ms ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .modal-fade-enter-active,
  .modal-fade-leave-active {
    transition: none;
  }
}
</style>
