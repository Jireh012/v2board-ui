<template>
  <RouterView v-if="isAdminRoute || isLoginRoute" />
  <div v-else class="app-root">
    <header class="app-header">
      <div class="logo">V2Board</div>
      <nav class="nav-right">
        <button v-if="!isLogin" class="link" @click="goLogin">登录</button>
        <button v-else class="link" @click="logout">退出登录</button>
      </nav>
    </header>
    <div class="app-layout">
      <aside class="sidebar">
        <div class="menu-title">用户中心</div>
        <ul>
          <li :class="{ active: route.path === '/dashboard' }">
            <RouterLink to="/dashboard">仪表盘</RouterLink>
          </li>
          <li :class="{ active: route.path.startsWith('/dashboard/plan') }">
            <RouterLink to="/dashboard/plan">订阅套餐</RouterLink>
          </li>
          <li :class="{ active: route.path.startsWith('/dashboard/order') }">
            <RouterLink to="/dashboard/order">订单记录</RouterLink>
          </li>
          <li :class="{ active: route.path.startsWith('/dashboard/ticket') }">
            <RouterLink to="/dashboard/ticket">工单中心</RouterLink>
          </li>
          <li :class="{ active: route.path.startsWith('/dashboard/traffic') }">
            <RouterLink to="/dashboard/traffic">流量明细</RouterLink>
          </li>
        </ul>
      </aside>
      <main class="content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter, RouterView, RouterLink } from 'vue-router'

const route = useRoute()
const router = useRouter()

const isLogin = computed(() => !!localStorage.getItem('auth_data'))
const isAdminRoute = computed(() => route.path.startsWith('/admin'))
const isLoginRoute = computed(() => route.path === '/login')

const goLogin = () => {
  router.push('/login')
}

const logout = () => {
  localStorage.removeItem('auth_data')
  localStorage.removeItem('token')
  localStorage.removeItem('admin_email')
  router.push('/login')
}
</script>

<style scoped>
.app-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  color: #1f2933;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.app-header {
  height: 56px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #111827;
  color: #f9fafb;
}

.logo {
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.nav-right .link {
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.app-layout {
  flex: 1;
  display: flex;
  min-height: 0;
}

.sidebar {
  width: 220px;
  background: #1f2933;
  color: #d8e2ec;
  padding: 16px 12px;
}

.menu-title {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 8px;
  color: #9fb3c8;
}

.sidebar ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar li {
  margin-bottom: 4px;
}

.sidebar a {
  display: block;
  padding: 8px 10px;
  border-radius: 6px;
  color: inherit;
  text-decoration: none;
  font-size: 14px;
}

.sidebar li.active a,
.sidebar a:hover {
  background: #243b53;
}

.content {
  flex: 1;
  padding: 20px 24px;
  overflow: auto;
}
</style>

