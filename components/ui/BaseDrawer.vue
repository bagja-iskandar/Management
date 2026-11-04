<template>
  <Teleport to="body">
    <Transition name="drawer-fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        @click.self="handleBackdropClick"
      >
        <Transition name="drawer-slide">
          <div
            v-if="isOpen"
            ref="panelRef"
            class="h-full w-full bg-[#111318] border-l border-white/[0.1] shadow-2xl text-[#F3F4F6] flex flex-col overflow-hidden focus:outline-none"
            :class="[resolvedWidth, props.class]"
            tabindex="-1"
          >
            <!-- Drawer Header -->
            <header
              v-if="$slots.header || title || closable"
              class="flex items-center justify-between gap-3 px-6 py-4.5 border-b border-white/[0.07] shrink-0"
            >
              <slot name="header">
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
              </slot>

              <div class="flex items-center gap-2 shrink-0">
                <BaseButton
                  v-if="closable"
                  variant="ghost"
                  size="icon"
                  icon="X"
                  aria-label="Close drawer"
                  @click="close"
                />
              </div>
            </header>

            <!-- Drawer Body -->
            <div class="p-6 overflow-y-auto flex-1 min-h-0 space-y-4">
              <slot />
            </div>

            <!-- Drawer Footer -->
            <footer
              v-if="$slots.footer"
              class="px-6 py-4 border-t border-white/[0.07] bg-white/[0.02] flex items-center justify-end gap-3 shrink-0"
            >
              <slot name="footer" />
            </footer>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseButton from './BaseButton.vue'
import { useModalLifecycle } from '~/composables/useModalLifecycle'

export type DrawerWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | string

export interface BaseDrawerProps {
  modelValue?: boolean
  show?: boolean
  title?: string
  subtitle?: string
  width?: DrawerWidth
  closable?: boolean
  class?: string
}

const props = withDefaults(defineProps<BaseDrawerProps>(), {
  modelValue: undefined,
  show: undefined,
  title: '',
  subtitle: '',
  width: 'xl',
  closable: true,
  class: ''
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}>()

const titleId = `drawer-title-${Math.random().toString(36).substring(2, 9)}`
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
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl'
}

const resolvedWidth = computed(() => {
  if (props.width in widthMap) {
    return widthMap[props.width]
  }
  return props.width || 'sm:max-w-xl'
})
</script>

<style scoped>
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 200ms ease;
}

.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}

.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(100%);
}

@media (prefers-reduced-motion: reduce) {
  .drawer-fade-enter-active,
  .drawer-fade-leave-active,
  .drawer-slide-enter-active,
  .drawer-slide-leave-active {
    transition: none;
  }
}
</style>
