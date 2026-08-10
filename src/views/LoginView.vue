<template>
  <div class="login-page">
    <div class="login-orb login-orb-a" aria-hidden="true" />
    <div class="login-orb login-orb-b" aria-hidden="true" />

    <div class="login-shell">
      <div class="login-card">
        <h2 class="login-card-title">欢迎回来</h2>
        <p class="login-card-sub">使用邮箱与密码登录账户</p>
        <form @submit.prevent="onSubmit">
          <label class="login-field">
            <span>邮箱</span>
            <input
              v-model="email"
              type="email"
              required
              autocomplete="email"
              placeholder="name@example.com"
            />
          </label>
          <label class="login-field">
            <span>密码</span>
            <input
              v-model="password"
              type="password"
              required
              autocomplete="current-password"
              placeholder="请输入密码"
            />
          </label>
          <RecaptchaV2
            v-if="recaptchaRequired"
            ref="captchaRef"
            :site-key="recaptchaSiteKey"
            @token="onCaptchaToken"
            @expired="onCaptchaExpired"
          />
          <button class="login-submit" type="submit" :disabled="loading">
            {{ loading ? '登录中...' : '登录' }}
          </button>
          <p v-if="hint" class="login-success">{{ hint }}</p>
          <p v-if="error" class="login-error">{{ error }}</p>
        </form>
        <p class="login-footer login-footer-links">
          <RouterLink to="/forget">忘记密码？</RouterLink>
          <template v-if="registerEnabled">
            <span class="login-footer-sep">·</span>
            还没有账户？
            <RouterLink to="/register">注册</RouterLink>
          </template>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import RecaptchaV2 from '../components/RecaptchaV2.vue'
import { login } from '../api/auth'
import { setSession } from '../auth'
import {
  isAdminUiPath,
  loadSiteBrand,
  recaptchaRequired,
  recaptchaSiteKey,
  registerEnabled
} from '../siteBrand'
import '../styles/login.css'

const route = useRoute()
const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const hint = ref('')
const captchaToken = ref('')
const captchaRef = ref<{ reset: () => void } | null>(null)

onMounted(() => {
  void loadSiteBrand().finally(() => {
    if (typeof document !== 'undefined') document.title = '成员登录'
  })
  if (route.query.reset === '1') {
    hint.value = '密码已重置，请使用新密码登录'
  }
})

function onCaptchaToken(token: string) {
  captchaToken.value = token
}

function onCaptchaExpired() {
  captchaToken.value = ''
}

function resolvePostLoginPath(raw: unknown): string {
  if (typeof raw !== 'string' || !raw.startsWith('/') || raw.startsWith('//')) {
    return '/dashboard'
  }
  if (
    isAdminUiPath(raw) ||
    raw.startsWith('/login') ||
    raw.startsWith('/register') ||
    raw.startsWith('/forget')
  ) {
    return '/dashboard'
  }
  return raw
}

async function onSubmit() {
  error.value = ''
  if (recaptchaRequired.value && !captchaToken.value) {
    error.value = '请先完成人机验证'
    return
  }
  loading.value = true
  try {
    const res = await login(
      email.value,
      password.value,
      recaptchaRequired.value ? captchaToken.value : undefined
    )
    setSession({
      auth_data: res.auth_data,
      token: res.token,
      is_admin: res.is_admin,
      email: email.value.trim()
    })
    await router.push(resolvePostLoginPath(route.query.redirect))
  } catch (e) {
    const msg = e instanceof Error ? e.message : '登录失败'
    error.value = msg
    captchaToken.value = ''
    captchaRef.value?.reset()
  } finally {
    loading.value = false
  }
}
</script>
