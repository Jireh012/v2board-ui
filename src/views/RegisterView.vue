<template>
  <div class="login-page">
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
        <span class="login-brand-tag">用户中心</span>
      </div>

      <div class="login-card">
        <template v-if="!ready">
          <h2 class="login-card-title">加载中…</h2>
          <p class="login-card-sub">正在读取站点注册设置</p>
        </template>

        <template v-else-if="!registerEnabled">
          <h2 class="login-card-title">暂未开放注册</h2>
          <p class="login-card-sub">管理员已关闭新用户注册，请直接登录已有账户。</p>
          <RouterLink class="login-submit login-submit-link" to="/login">返回登录</RouterLink>
        </template>

        <template v-else>
          <h2 class="login-card-title">创建账户</h2>
          <p class="login-card-sub">填写邮箱与密码完成注册</p>
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
                minlength="8"
                autocomplete="new-password"
                placeholder="至少 8 位"
              />
            </label>
            <label class="login-field">
              <span>确认密码</span>
              <input
                v-model="password2"
                type="password"
                required
                minlength="8"
                autocomplete="new-password"
                placeholder="再次输入密码"
              />
            </label>
            <label class="login-field">
              <span>邀请码{{ inviteForce ? '（必填）' : '（可选）' }}</span>
              <input
                v-model="inviteCode"
                type="text"
                :required="inviteForce"
                autocomplete="off"
                placeholder="邀请码"
              />
            </label>
            <button class="login-submit" type="submit" :disabled="loading">
              {{ loading ? '注册中...' : '注册' }}
            </button>
            <p v-if="error" class="login-error">{{ error }}</p>
          </form>
          <p class="login-footer">
            已有账户？
            <RouterLink to="/login">去登录</RouterLink>
          </p>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { register } from '../api/auth'
import { setSession } from '../auth'
import { appName, inviteForce, loadSiteBrand, registerEnabled } from '../siteBrand'
import '../styles/login.css'

const route = useRoute()
const router = useRouter()
const ready = ref(false)
const email = ref('')
const password = ref('')
const password2 = ref('')
const inviteCode = ref('')
const loading = ref(false)
const error = ref('')

onMounted(async () => {
  const code = route.query.code
  if (typeof code === 'string' && code.trim()) {
    inviteCode.value = code.trim()
  } else if (Array.isArray(code) && typeof code[0] === 'string') {
    inviteCode.value = code[0].trim()
  }
  await loadSiteBrand()
  ready.value = true
})

async function onSubmit() {
  error.value = ''
  if (password.value !== password2.value) {
    error.value = '两次输入的密码不一致'
    return
  }
  if (inviteForce.value && !inviteCode.value.trim()) {
    error.value = '请填写邀请码'
    return
  }
  loading.value = true
  try {
    const res = await register({
      email: email.value,
      password: password.value,
      invite_code: inviteCode.value
    })
    setSession({
      auth_data: res.auth_data,
      token: res.token,
      is_admin: res.is_admin,
      email: email.value.trim()
    })
    await router.push('/dashboard')
  } catch (e) {
    error.value = e instanceof Error ? e.message : '注册失败'
  } finally {
    loading.value = false
  }
}
</script>
