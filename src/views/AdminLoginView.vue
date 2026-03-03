<template>
  <div class="login-page">
    <div class="login-card">
      <h1 class="title">管理员登录</h1>
      <p class="subtitle">使用管理账号登录控制台</p>
      <form @submit.prevent="onSubmit">
        <label class="field">
          <span>邮箱</span>
          <input v-model="email" type="email" required autocomplete="email" />
        </label>
        <label class="field">
          <span>密码</span>
          <input v-model="password" type="password" required autocomplete="current-password" />
        </label>
        <button class="btn" type="submit" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
        <p v-if="error" class="error-text">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { adminLogin } from '../api/admin'

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
    // 管理端现在也返回 auth_data，与用户登录相同格式
    localStorage.setItem('auth_data', res.auth_data)
    localStorage.setItem('token', res.token)
    localStorage.setItem('admin_email', email.value)
    await router.push('/admin')
  } catch (e) {
    const msg = e instanceof Error ? e.message : '登录失败'
    error.value = msg
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top, #0f172a 0, #020617 60%);
}

.login-card {
  width: 360px;
  padding: 28px 24px 24px;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.96);
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.6);
  color: #e5e7eb;
}

.title {
  font-size: 20px;
  margin: 0 0 4px;
}

.subtitle {
  font-size: 13px;
  margin-bottom: 20px;
  color: #9ca3af;
}

.field {
  display: flex;
  flex-direction: column;
  margin-bottom: 14px;
  font-size: 13px;
}

.field span {
  margin-bottom: 6px;
}

input {
  border-radius: 8px;
  border: 1px solid #334155;
  padding: 8px 10px;
  background: #020617;
  color: inherit;
  outline: none;
}

input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.5);
}

.btn {
  width: 100%;
  margin-top: 8px;
  padding: 9px 12px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #3b82f6, #22c55e);
  color: #f9fafb;
  font-weight: 600;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.error-text {
  margin-top: 10px;
  font-size: 13px;
  color: #fca5a5;
}
</style>

