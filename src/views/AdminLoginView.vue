<template>
  <div class="login-page admin-login-page">
    <div class="login-orb login-orb-a" aria-hidden="true" />
    <div class="login-orb login-orb-b" aria-hidden="true" />

    <div class="login-shell">
      <div class="login-brand">
        <div class="login-logo" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h1 class="login-brand-name">{{ appName }}</h1>
        <span class="login-brand-tag">管理控制台</span>
      </div>

      <div class="login-card">
        <h2 class="login-card-title">管理员登录</h2>
        <p class="login-card-sub">使用管理账号进入控制台</p>
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
          <button class="login-submit" type="submit" :disabled="loading">
            {{ loading ? '登录中...' : '登录' }}
          </button>
          <p v-if="error" class="login-error">{{ error }}</p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { adminLogin } from '../api/admin'
import { setSession } from '../auth'
import { adminUrl, appName } from '../siteBrand'
import '../styles/login.css'

const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    const res = await adminLogin(email.value, password.value)
    setSession({
      auth_data: res.auth_data,
      token: res.token,
      is_admin: res.is_admin,
      email: email.value.trim()
    })
    localStorage.setItem('admin_email', email.value.trim())
    await router.push(adminUrl())
  } catch (e) {
    const msg = e instanceof Error ? e.message : '登录失败'
    error.value = msg
  } finally {
    loading.value = false
  }
}
</script>
