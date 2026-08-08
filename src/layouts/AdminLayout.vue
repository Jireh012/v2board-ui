<template>
  <div class="admin-root">
    <header class="app-header">
      <div class="header-content">
        <RouterLink to="/dashboard" class="logo" title="返回用户端">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="brand-meta">
            <span class="brand-name">{{ appName }}</span>
            <span class="admin-badge">管理后台</span>
          </div>
        </RouterLink>

        <div class="header-center">
          <span class="page-chip">{{ pageTitle }}</span>
        </div>

        <nav class="nav-right">
          <div
            class="user-profile-trigger"
            :class="{ open: showUserMenu }"
            @click="toggleUserMenu"
            @mouseleave="closeUserMenu"
          >
            <div class="avatar">{{ adminEmail.charAt(0).toUpperCase() || 'A' }}</div>
            <div class="user-info-text">
              <span class="user-email">{{ adminEmail || '管理员' }}</span>
              <span class="user-role">Administrator</span>
            </div>
            <span class="caret" :class="{ open: showUserMenu }">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </span>

            <transition name="fade-slide">
              <div v-if="showUserMenu" class="user-dropdown">
                <div class="dropdown-header">
                  <div class="big-avatar">{{ adminEmail.charAt(0).toUpperCase() || 'A' }}</div>
                  <div class="dropdown-user-info">
                    <div class="dropdown-email">{{ adminEmail || '管理员' }}</div>
                    <div class="dropdown-status">管理员</div>
                  </div>
                </div>
                <div class="dropdown-divider"></div>
                <button class="dropdown-item" @click.stop="goUserHome">
                  <span class="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  </span>
                  返回用户端
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
          <div v-for="group in menuGroups" :key="group.title" class="menu-group">
            <div class="menu-group-title">{{ group.title }}</div>
            <RouterLink
              v-for="item in group.items"
              :key="item.to"
              :to="item.to"
              class="menu-item"
              :class="{ 'router-link-active': isActive(item) }"
            >
              <div class="menu-icon" aria-hidden="true">
                <span v-html="item.icon"></span>
              </div>
              <span class="menu-text">{{ item.label }}</span>
            </RouterLink>
          </div>
        </div>
        <div class="sidebar-footer">{{ appName }} Admin</div>
      </aside>

      <main class="content">
        <div class="content-limit admin-page">
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
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter, RouterView, RouterLink } from 'vue-router'
import { clearSession, currentUserEmail } from '../auth'
import { appName } from '../siteBrand'
import '../styles/admin.css'

onMounted(() => document.body.classList.add('admin-theme'))
onUnmounted(() => document.body.classList.remove('admin-theme'))

const route = useRoute()
const router = useRouter()
const showUserMenu = ref(false)
const adminEmail = currentUserEmail

const icons = {
  dashboard: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>',
  settings: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>',
  payment: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>',
  server: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>',
  group: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h10v10H7z"/><path d="M3 3h4v4H3z"/><path d="M17 3h4v4h-4z"/><path d="M3 17h4v4H3z"/><path d="M17 17h4v4h-4z"/></svg>',
  route: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg>',
  link: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  plan: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>',
  order: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>',
  coupon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" x2="7.01" y1="7" y2="7"/></svg>',
  gift: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect width="20" height="5" x="2" y="7"/><line x1="12" x2="12" y1="22" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>',
  user: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  ticket: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5v2"/><path d="M15 11v2"/><path d="M15 17v2"/><path d="M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7a2 2 0 0 1 2-2z"/></svg>',
  notice: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  knowledge: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6.5 15.5H20"/></svg>'
}

const menuGroups = [
  {
    title: '总览',
    items: [{ to: '/admin', label: '仪表盘', icon: icons.dashboard, exact: true }]
  },
  {
    title: '设置',
    items: [
      { to: '/admin/config/system', label: '系统配置', icon: icons.settings, match: '/admin/config' },
      { to: '/admin/payments', label: '支付配置', icon: icons.payment, match: '/admin/payments' }
    ]
  },
  {
    title: '服务器',
    items: [
      { to: '/admin/servers', label: '节点管理', icon: icons.server, exact: true },
      { to: '/admin/servers/groups', label: '权限组管理', icon: icons.group, exact: true },
      { to: '/admin/servers/routes', label: '路由管理', icon: icons.route, exact: true },
      { to: '/admin/servers/external-subscribe', label: '第三方订阅源', icon: icons.link, exact: true }
    ]
  },
  {
    title: '财务',
    items: [
      { to: '/admin/plans', label: '订阅管理', icon: icons.plan, match: '/admin/plans' },
      { to: '/admin/orders', label: '订单管理', icon: icons.order, match: '/admin/orders' },
      { to: '/admin/coupons', label: '优惠券管理', icon: icons.coupon, match: '/admin/coupons' },
      { to: '/admin/giftcards', label: '礼品卡管理', icon: icons.gift, match: '/admin/giftcards' }
    ]
  },
  {
    title: '用户',
    items: [
      { to: '/admin/users', label: '用户管理', icon: icons.user, match: '/admin/users' },
      { to: '/admin/tickets', label: '工单管理', icon: icons.ticket, match: '/admin/tickets' }
    ]
  },
  {
    title: '内容',
    items: [
      { to: '/admin/notices', label: '公告管理', icon: icons.notice, match: '/admin/notices' },
      { to: '/admin/knowledge', label: '知识库管理', icon: icons.knowledge, match: '/admin/knowledge' }
    ]
  }
]

const pageTitleMap: Record<string, string> = {
  '/admin': '仪表盘',
  '/admin/config/system': '系统配置',
  '/admin/users': '用户管理',
  '/admin/plans': '订阅管理',
  '/admin/orders': '订单管理',
  '/admin/tickets': '工单管理',
  '/admin/payments': '支付配置',
  '/admin/servers': '节点管理',
  '/admin/servers/groups': '权限组管理',
  '/admin/servers/routes': '路由管理',
  '/admin/servers/external-subscribe': '第三方订阅源',
  '/admin/notices': '公告管理',
  '/admin/coupons': '优惠券管理',
  '/admin/giftcards': '礼品卡管理',
  '/admin/knowledge': '知识库管理'
}

const pageTitle = computed(() => {
  const path = route.path
  if (pageTitleMap[path]) return pageTitleMap[path]
  if (path.startsWith('/admin/config')) return '系统配置'
  if (path.startsWith('/admin/users')) return '用户管理'
  if (path.startsWith('/admin/plans')) return '订阅管理'
  if (path.startsWith('/admin/orders')) return '订单管理'
  if (path.startsWith('/admin/tickets')) return '工单管理'
  if (path.startsWith('/admin/payments')) return '支付配置'
  if (path.startsWith('/admin/servers')) return '节点管理'
  if (path.startsWith('/admin/notices')) return '公告管理'
  if (path.startsWith('/admin/coupons')) return '优惠券管理'
  if (path.startsWith('/admin/giftcards')) return '礼品卡管理'
  if (path.startsWith('/admin/knowledge')) return '知识库管理'
  return '仪表盘'
})

function isActive(item: { to: string; exact?: boolean; match?: string }) {
  if (item.exact) return route.path === item.to
  if (item.match) return route.path.startsWith(item.match)
  return route.path === item.to
}

function toggleUserMenu() {
  showUserMenu.value = !showUserMenu.value
}

function closeUserMenu() {
  showUserMenu.value = false
}

function goUserHome() {
  closeUserMenu()
  router.push('/dashboard')
}

function logout() {
  closeUserMenu()
  clearSession()
  router.push('/admin/login')
}
</script>

<style scoped>
.admin-root {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color);
  overflow: hidden;
}

.app-header {
  position: relative;
  height: 68px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #eef2f7;
  padding: 0 28px;
  display: flex;
  align-items: center;
  z-index: 100;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.02);
}

.header-content {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.logo {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  color: var(--text-main);
  text-decoration: none;
  flex-shrink: 0;
  min-width: 0;
  margin-right: auto;
  transition: opacity 0.15s ease;
}

.logo:hover { opacity: 0.92; }

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(145deg, #3b82f6, #2563eb);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  box-shadow: 0 8px 18px -6px rgba(37, 99, 235, 0.45);
  flex-shrink: 0;
}

.logo-icon svg { width: 22px; height: 22px; }

.brand-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.brand-name {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--text-main);
  white-space: nowrap;
}

.admin-badge {
  padding: 4px 10px;
  border-radius: 999px;
  background: linear-gradient(180deg, #eff6ff, #dbeafe);
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.header-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
}

.header-center .page-chip {
  pointer-events: auto;
}

.page-chip {
  display: inline-flex;
  align-items: center;
  padding: 7px 14px;
  border-radius: 999px;
  background: #f8fafc;
  border: 1px solid #eef2f7;
  font-size: 13px;
  font-weight: 700;
  color: #475569;
}

.nav-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex-shrink: 0;
}

.user-profile-trigger {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 12px 5px 6px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.user-profile-trigger:hover,
.user-profile-trigger.open {
  border-color: #bfdbfe;
  background: #f8fbff;
  box-shadow: 0 8px 18px -8px rgba(37, 99, 235, 0.28);
}

.avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(145deg, #60a5fa, #2563eb);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 14px;
  color: #ffffff;
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.25);
  flex-shrink: 0;
}

.user-info-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.user-email {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-main);
  white-space: nowrap;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.user-role {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  letter-spacing: 0.02em;
  line-height: 1.2;
}

.caret {
  color: #94a3b8;
  transition: transform 0.2s ease, color 0.15s ease;
  display: flex;
  margin-left: 2px;
}

.user-profile-trigger:hover .caret,
.caret.open { color: #64748b; }

.caret.open { transform: rotate(180deg); }

.user-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  min-width: 268px;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 22px 40px -16px rgba(15, 23, 42, 0.22);
  padding: 8px;
  z-index: 1000;
}

.user-dropdown::before {
  content: '';
  position: absolute;
  top: -14px;
  left: 0;
  right: 0;
  height: 14px;
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
  flex-shrink: 0;
}

.dropdown-email {
  font-size: 14px;
  font-weight: 800;
  color: var(--text-main);
}

.dropdown-status {
  font-size: 12px;
  color: var(--primary-color);
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
}

.menu-item:hover {
  background-color: var(--bg-color);
  color: var(--text-main);
}

.menu-icon {
  width: 20px;
  height: 20px;
  opacity: 0.7;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-icon :deep(svg) {
  width: 20px;
  height: 20px;
}

.menu-item.router-link-active {
  background-color: #eff6ff;
  color: var(--primary-color);
}

.menu-item.router-link-active .menu-icon {
  opacity: 1;
  color: var(--primary-color);
}

.sidebar-footer {
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
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
  .app-header { padding: 0 16px; }
  .sidebar { width: 80px; padding: 24px 8px; }
  .menu-text, .menu-group-title, .sidebar-footer, .admin-badge, .header-center, .user-info-text { display: none; }
  .menu-item { justify-content: center; }
  .menu-icon { width: 24px; height: 24px; }
  .user-profile-trigger { padding: 4px; }
}
</style>
