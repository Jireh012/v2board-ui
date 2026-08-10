<template>
  <div class="login-page admin-login-page">
    <div class="login-orb login-orb-a" aria-hidden="true" />
    <div class="login-orb login-orb-b" aria-hidden="true" />

    <div class="login-shell">
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
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { adminLogin } from '../api/admin'
import { setSession } from '../auth'
import { adminUrl, loadSiteBrand } from '../siteBrand'
import '../styles/login.css'

const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

// Retry/refresh API bases (parity with LoginView; covers ensureSiteBrand failure).
onMounted(() => {
  void loadSiteBrand().finally(() => {
    if (typeof document !== 'undefined') document.title = '管理登录'
  })
})

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
