<template>
  <RouterView v-if="isAdminRoute || isLoginRoute" />
  <div v-else class="app-root">
    <header class="app-header">
      <div class="logo">谜之站点</div>
      <nav class="nav-right">
        <button v-if="!isLogin" class="link" @click="goLogin">登录</button>
        <div
          v-else
          class="user-menu-wrapper"
          @click="toggleUserMenu"
          @mouseleave="closeUserMenu"
        >
          <span class="user-email">{{ userEmail }}</span>
          <span class="caret">▼</span>
          <div v-if="showUserMenu" class="user-menu">
            <button class="user-menu-item" @click.stop="goProfile">
              个人中心
            </button>
            <button class="user-menu-item" @click.stop="logout">退出</button>
          </div>
        </div>
      </nav>
    </header>
    <div class="app-layout">
      <aside class="sidebar">
        <div class="menu-group">
          <div class="menu-group-title">总览</div>
          <RouterLink to="/dashboard" class="menu-item">
            <span class="menu-text">仪表盘</span>
          </RouterLink>
          <RouterLink to="/knowledge" class="menu-item">
            <span class="menu-text">使用文档</span>
          </RouterLink>
        </div>

        <div class="menu-group">
          <div class="menu-group-title">订阅</div>
          <RouterLink to="/plan" class="menu-item">
            <span class="menu-text">购买订阅</span>
          </RouterLink>
          <RouterLink to="/server" class="menu-item">
            <span class="menu-text">节点状态</span>
          </RouterLink>
        </div>

        <div class="menu-group">
          <div class="menu-group-title">财务</div>
          <RouterLink to="/order" class="menu-item">
            <span class="menu-text">我的订单</span>
          </RouterLink>
          <RouterLink to="/dashboard/invite" class="menu-item">
            <span class="menu-text">我的邀请</span>
          </RouterLink>
        </div>

        <div class="menu-group">
          <div class="menu-group-title">用户</div>
          <RouterLink to="/dashboard/profile" class="menu-item">
            <span class="menu-text">个人中心</span>
          </RouterLink>
          <RouterLink to="/dashboard/ticket" class="menu-item">
            <span class="menu-text">我的工单</span>
          </RouterLink>
          <RouterLink to="/dashboard/traffic" class="menu-item">
            <span class="menu-text">流量明细</span>
          </RouterLink>
        </div>

        <div v-if="isAdminUser" class="menu-group menu-group-admin">
          <RouterLink to="/admin" class="menu-item admin-link">
            <span class="menu-text">管理后台</span>
          </RouterLink>
        </div>
      </aside>
      <main class="content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter, RouterView, RouterLink } from 'vue-router'
import { getUserInfo, type UserInfo } from './api/user'

const route = useRoute()
const router = useRouter()

const isLogin = computed(() => !!localStorage.getItem('auth_data'))
const isAdminRoute = computed(() => route.path.startsWith('/admin'))
const isLoginRoute = computed(() => route.path === '/login')
const isAdminUser = computed(() => localStorage.getItem('is_admin') === '1')

const userInfo = ref<UserInfo | null>(null)
const userEmail = computed(
  () => userInfo.value?.email || localStorage.getItem('admin_email') || '账户'
)
const showUserMenu = ref(false)

onMounted(async () => {
  if (!isLogin.value) return
  try {
    userInfo.value = await getUserInfo()
  } catch {
    // 忽略获取失败，使用本地邮箱兜底
  }
})

const goLogin = () => {
  router.push('/login')
}

const logout = () => {
  localStorage.removeItem('auth_data')
  localStorage.removeItem('token')
  localStorage.removeItem('admin_email')
  localStorage.removeItem('is_admin')
  router.push('/login')
}

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

const closeUserMenu = () => {
  showUserMenu.value = false
}

const goProfile = () => {
  router.push('/dashboard/profile')
  closeUserMenu()
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

.nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-menu-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.4);
  cursor: pointer;
}

.user-email {
  font-size: 13px;
}

.caret {
  font-size: 10px;
}

.user-menu {
  position: absolute;
  right: 0;
  top: 32px;
  min-width: 140px;
  background: #ffffff;
  color: #111827;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.3);
  padding: 6px 0;
  z-index: 20;
}

.user-menu-item {
  width: 100%;
  padding: 6px 12px;
  background: transparent;
  border: none;
  text-align: left;
  font-size: 13px;
  cursor: pointer;
}

.user-menu-item:hover {
  background: #f3f4f6;
}

.app-layout {
  flex: 1;
  display: flex;
  min-height: 0;
}

.sidebar {
  width: 230px;
  background: #0f172a;
  color: #e5e7eb;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.menu-group {
  margin-top: 8px;
}

.menu-group-title {
  font-size: 12px;
  color: #9ca3af;
  text-transform: none;
  margin: 6px 4px;
}

.menu-item {
  display: block;
  padding: 8px 10px;
  border-radius: 6px;
  color: inherit;
  text-decoration: none;
  font-size: 14px;
}

.menu-item.router-link-active {
  background: #e5f0ff;
  color: #1d4ed8;
}

.menu-item:hover {
  background: #111827;
}

.menu-text {
  margin-left: 0;
}

.content {
  flex: 1;
  padding: 20px 24px;
  overflow: auto;
}
</style>

