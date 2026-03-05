<template>
  <RouterView v-if="isAdminRoute || isLoginRoute" />
  <div v-else class="app-root">
    <header class="app-header">
      <div class="header-content">
        <div class="logo">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span>谜之站点</span>
        </div>
        
        <nav class="nav-right">
          <button v-if="!isLogin" class="btn-login" @click="goLogin">登录</button>
          <div
            v-else
            class="user-profile-trigger"
            @click="toggleUserMenu"
            @mouseleave="closeUserMenu"
          >
            <div class="avatar">
              {{ userEmail.charAt(0).toUpperCase() }}
            </div>
            <div class="user-info-text">
              <span class="user-email">{{ userEmail }}</span>
            </div>
            <span class="caret" :class="{ open: showUserMenu }">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </span>
            
            <transition name="fade-slide">
              <div v-if="showUserMenu" class="user-dropdown">
                <div class="dropdown-header">
                  <div class="big-avatar">{{ userEmail.charAt(0).toUpperCase() }}</div>
                  <div class="dropdown-user-info">
                    <div class="dropdown-email">{{ userEmail }}</div>
                    <div class="dropdown-status">在线</div>
                  </div>
                </div>
                <div class="dropdown-divider"></div>
                <button class="dropdown-item" @click.stop="goProfile">
                  <span class="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </span>
                  个人中心
                </button>
                <button class="dropdown-item danger" @click.stop="logout">
                  <span class="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  </span>
                  退出登录
                </button>
              </div>
            </transition>
          </div>
        </nav>
      </div>
    </header>

    <div class="app-layout">
      <aside class="sidebar">
        <div class="sidebar-scroll">
          <div class="menu-group">
            <div class="menu-group-title">总览</div>
            <RouterLink to="/dashboard" class="menu-item">
              <div class="menu-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
              </div>
              <span class="menu-text">仪表盘</span>
            </RouterLink>
            <RouterLink to="/knowledge" class="menu-item">
              <div class="menu-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6.5 15.5H20"/></svg>
              </div>
              <span class="menu-text">使用文档</span>
            </RouterLink>
          </div>

          <div class="menu-group">
            <div class="menu-group-title">服务订阅</div>
            <RouterLink to="/plan" class="menu-item">
              <div class="menu-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3.5 17.5 1.5-4.5 9-4.5L18.5 4 19 6.5l-4.5 9-4.5 1.5-1 1-1-1Z"/><path d="m13 13 4 4"/><path d="m14.5 10 1.5 1.5"/></svg>
              </div>
              <span class="menu-text">购买订阅</span>
            </RouterLink>
            <RouterLink to="/server" class="menu-item">
              <div class="menu-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>
              </div>
              <span class="menu-text">节点状态</span>
            </RouterLink>
          </div>

          <div class="menu-group">
            <div class="menu-group-title">财务中心</div>
            <RouterLink to="/order" class="menu-item">
              <div class="menu-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="6" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
              </div>
              <span class="menu-text">我的订单</span>
            </RouterLink>
            <RouterLink to="/invite" class="menu-item">
              <div class="menu-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
              </div>
              <span class="menu-text">我的邀请</span>
            </RouterLink>
          </div>

          <div class="menu-group">
            <div class="menu-group-title">个人管理</div>
            <RouterLink to="/profile" class="menu-item">
              <div class="menu-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>
              </div>
              <span class="menu-text">基本设置</span>
            </RouterLink>
            <RouterLink to="/ticket" class="menu-item">
              <div class="menu-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h.01"/><path d="M15 18H9"/><path d="M19 14V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v8"/><path d="M15 2H9"/><path d="M12 11V6"/><path d="m15 11-3 3-3-3"/><path d="M19 14a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2"/></svg>
              </div>
              <span class="menu-text">我的工单</span>
            </RouterLink>
            <RouterLink to="/traffic" class="menu-item">
              <div class="menu-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
              </div>
              <span class="menu-text">流量明细</span>
            </RouterLink>
          </div>
        </div>

        <div v-if="isAdminUser" class="menu-group admin-group">
          <RouterLink to="/admin" class="menu-item admin-link">
            <div class="menu-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            </div>
            <span class="menu-text">后台管理</span>
          </RouterLink>
        </div>
      </aside>
      
      <main class="content">
        <div class="content-limit">
          <RouterView v-slot="{ Component }">
            <transition name="page" mode="out-in">
              <component :is="Component" />
            </transition>
          </RouterView>
        </div>
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
    // ignore
  }
})

const goLogin = () => router.push('/login')
const logout = () => {
  localStorage.clear()
  router.push('/login')
}
const toggleUserMenu = () => { showUserMenu.value = !showUserMenu.value }
const closeUserMenu = () => { showUserMenu.value = false }
const goProfile = () => {
  router.push('/profile')
  closeUserMenu()
}
</script>

<style scoped>
.app-root {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color);
  overflow: hidden;
}

.app-header {
  height: 72px;
  background-color: #ffffff;
  border-bottom: 1px solid var(--border-color);
  padding: 0 24px;
  display: flex;
  align-items: center;
  z-index: 100;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}

.header-content {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.02em;
}

.logo-icon {
  width: 38px;
  height: 38px;
  background: linear-gradient(135deg, var(--primary-color), #4f46e5);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  box-shadow: 0 8px 16px -4px rgba(37, 99, 235, 0.4);
}

.logo-icon svg { width: 22px; height: 22px; }

.user-profile-trigger {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 14px;
  background: #f8fafc;
  border: 1px solid var(--border-color);
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.user-profile-trigger:hover {
  background: #ffffff;
  border-color: #e2e8f0;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  color: #475569;
}

.user-email {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
}

.caret {
  color: #94a3b8;
  transition: transform 0.3s;
}

.caret.open { transform: rotate(180deg); }

.user-dropdown {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 260px;
  background: #ffffff;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
  padding: 8px;
  z-index: 1000;
}

.dropdown-header {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.big-avatar {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #eff6ff;
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 800;
}

.dropdown-email {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-main);
  word-break: break-all;
}

.dropdown-status {
  font-size: 12px;
  color: #10b981;
  font-weight: 500;
  margin-top: 2px;
}

.dropdown-divider {
  height: 1px;
  background-color: var(--border-color);
  margin: 4px 0;
}

.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: none;
  background: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
  text-align: left;
  transition: all 0.2s;
}

.dropdown-item:hover {
  background: var(--bg-color);
  color: var(--text-main);
}

.dropdown-item.danger { color: #ef4444; }
.dropdown-item.danger:hover { background: #fef2f2; }

.app-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 260px;
  background-color: #ffffff;
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  z-index: 50;
}

.sidebar-scroll {
  flex: 1;
  overflow-y: auto;
}

.menu-group {
  margin-bottom: 24px;
}

.menu-group-title {
  font-size: 11px;
  font-weight: 800;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 12px;
  padding-left: 12px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.menu-item:hover {
  background-color: var(--bg-color);
  color: var(--text-main);
}

.menu-icon {
  width: 20px;
  height: 20px;
  opacity: 0.7;
}

.menu-item.router-link-active {
  background-color: #eff6ff;
  color: var(--primary-color);
}

.menu-item.router-link-active .menu-icon {
  opacity: 1;
  color: var(--primary-color);
}

.admin-group {
  margin-top: auto;
  border-top: 1px solid var(--border-color);
  padding-top: 24px;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
  background-color: var(--bg-color);
}

.content-limit {
  max-width: 1200px;
  margin: 0 auto;
}

/* Transitions */
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.fade-slide-enter-from, .fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.page-enter-active, .page-leave-active {
  transition: opacity 0.25s, transform 0.25s;
}
.page-enter-from { opacity: 0; transform: translateY(10px); }
.page-leave-to { opacity: 0; transform: translateY(-10px); }

@media (max-width: 1024px) {
  .sidebar { width: 80px; padding: 24px 8px; }
  .menu-text, .menu-group-title { display: none; }
  .menu-item { justify-content: center; }
  .menu-icon { width: 24px; height: 24px; }
}
</style>
