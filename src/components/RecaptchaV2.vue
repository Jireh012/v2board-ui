<template>
  <div class="recaptcha-wrap">
    <div ref="host" />
    <p v-if="loadError" class="login-error">{{ loadError }}</p>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  siteKey: string
}>()

const emit = defineEmits<{
  token: [string]
  expired: []
}>()

const host = ref<HTMLElement | null>(null)
const loadError = ref('')
let widgetId: number | null = null

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string
          callback: (token: string) => void
          'expired-callback': () => void
        }
      ) => number
      reset: (id?: number) => void
    }
    __v2RecaptchaOnLoad?: () => void
  }
}

function loadScript(): Promise<void> {
  if (window.grecaptcha) {
    return Promise.resolve()
  }
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-v2-recaptcha]')
    if (existing) {
      window.__v2RecaptchaOnLoad = () => resolve()
      return
    }
    const s = document.createElement('script')
    s.src = 'https://www.google.com/recaptcha/api.js?onload=__v2RecaptchaOnLoad&render=explicit'
    s.async = true
    s.defer = true
    s.dataset.v2Recaptcha = '1'
    window.__v2RecaptchaOnLoad = () => resolve()
    s.onerror = () => reject(new Error('reCAPTCHA 脚本加载失败'))
    document.head.appendChild(s)
  })
}

async function renderWidget() {
  loadError.value = ''
  if (!props.siteKey || !host.value) return
  try {
    await loadScript()
    await new Promise<void>((resolve) => {
      window.grecaptcha!.ready(() => resolve())
    })
    if (widgetId != null) {
      window.grecaptcha!.reset(widgetId)
      return
    }
    widgetId = window.grecaptcha!.render(host.value, {
      sitekey: props.siteKey,
      callback: (token: string) => emit('token', token),
      'expired-callback': () => {
        emit('expired')
        emit('token', '')
      }
    })
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'reCAPTCHA 加载失败'
  }
}

function reset() {
  if (widgetId != null && window.grecaptcha) {
    window.grecaptcha.reset(widgetId)
  }
}

defineExpose({ reset })

onMounted(() => {
  void renderWidget()
})

watch(
  () => props.siteKey,
  () => {
    widgetId = null
    if (host.value) host.value.innerHTML = ''
    void renderWidget()
  }
)

onBeforeUnmount(() => {
  widgetId = null
})
</script>

<style scoped>
.recaptcha-wrap {
  margin: 0.5rem 0 0.75rem;
  min-height: 78px;
}
</style>
