<template>
  <div class="login-page">
    <div class="login-orb login-orb-a" aria-hidden="true" />
    <div class="login-orb login-orb-b" aria-hidden="true" />

    <div class="login-shell">
      <div class="login-card">
        <h2 class="login-card-title">找回密码</h2>
        <p class="login-card-sub">验证邮箱后设置新密码</p>
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
            <span>邮箱验证码</span>
            <div class="login-code-row">
              <input
                v-model="emailCode"
                type="text"
                inputmode="numeric"
                pattern="\d{6}"
                maxlength="6"
                required
                autocomplete="one-time-code"
                placeholder="6 位验证码"
              />
              <button
                type="button"
                class="login-code-btn"
                :disabled="sending || cooldown > 0 || !email.trim()"
                @click="onSendCode"
              >
                {{ cooldown > 0 ? `${cooldown}s` : sending ? '发送中…' : '发送验证码' }}
              </button>
            </div>
          </label>
          <label class="login-field">
            <span>新密码</span>
            <input
              v-model="password"
              type="password"
              required
              minlength="8"
              autocomplete="new-password"
              placeholder="至少 8 位"
            />
          </label>
          <label class="login-field">
            <span>确认新密码</span>
            <input
              v-model="password2"
              type="password"
              required
              minlength="8"
              autocomplete="new-password"
              placeholder="再次输入密码"
            />
          </label>
          <button class="login-submit" type="submit" :disabled="loading">
            {{ loading ? '提交中...' : '重置密码' }}
          </button>
          <p v-if="success" class="login-success">{{ success }}</p>
          <p v-if="error" class="login-error">{{ error }}</p>
        </form>
        <p class="login-footer">
          想起密码了？
          <RouterLink to="/login">返回登录</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { forgetPassword, sendEmailVerify } from '../api/auth'
import { loadSiteBrand } from '../siteBrand'
import '../styles/login.css'

const router = useRouter()
const email = ref('')
const emailCode = ref('')
const password = ref('')
const password2 = ref('')
const loading = ref(false)
const sending = ref(false)
const error = ref('')
const success = ref('')
const cooldown = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  void loadSiteBrand().finally(() => {
    if (typeof document !== 'undefined') document.title = '找回密码'
  })
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

function startCooldown(seconds = 60) {
  cooldown.value = seconds
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    cooldown.value -= 1
    if (cooldown.value <= 0 && timer) {
      clearInterval(timer)
      timer = null
    }
  }, 1000)
}

async function onSendCode() {
  error.value = ''
  success.value = ''
  if (!email.value.trim()) {
    error.value = '请先填写邮箱'
    return
  }
  sending.value = true
  try {
    await sendEmailVerify(email.value, 1)
    startCooldown(60)
    success.value = '验证码已发送，请查收邮箱'
  } catch (e) {
    error.value = e instanceof Error ? e.message : '发送失败'
  } finally {
    sending.value = false
  }
}

async function onSubmit() {
  error.value = ''
  success.value = ''
  if (password.value !== password2.value) {
    error.value = '两次输入的密码不一致'
    return
  }
  if (!/^\d{6}$/.test(emailCode.value.trim())) {
    error.value = '请输入 6 位数字验证码'
    return
  }
  loading.value = true
  try {
    await forgetPassword({
      email: email.value,
      email_code: emailCode.value,
      password: password.value
    })
    await router.push({ path: '/login', query: { reset: '1' } })
  } catch (e) {
    error.value = e instanceof Error ? e.message : '重置失败'
  } finally {
    loading.value = false
  }
}
</script>
