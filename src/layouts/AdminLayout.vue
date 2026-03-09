<template>
  <div class="admin-root">
    <!-- 顶部导航栏：深蓝底，左侧站点名(可点击回用户端)、中间当前页标题、右侧用户信息 -->
    <header class="admin-header">
      <RouterLink to="/dashboard" class="site-name">谜之站点</RouterLink>
      <span class="page-title">{{ pageTitle }}</span>
      <div class="header-right">
        <button type="button" class="icon-btn" aria-label="设置" title="设置">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
        </button>
        <div
          class="user-dropdown"
          @click="toggleUserMenu"
          @mouseleave="closeUserMenu"
        >
          <span class="user-email">{{ adminEmail }}</span>
          <span class="caret">▼</span>
          <Transition name="dropdown">
            <div v-if="showUserMenu" class="dropdown-menu">
              <button type="button" class="dropdown-item" @click="logout">退出</button>
            </div>
          </Transition>
        </div>
      </div>
    </header>

    <div class="admin-layout">
      <aside class="sidebar">
        <div class="menu-group">
          <div class="menu-group-title">仪表盘</div>
          <ul>
            <li :class="{ active: route.path === '/admin' }">
              <RouterLink to="/admin">
                <span class="menu-icon">🕐</span>
                <span>仪表盘</span>
              </RouterLink>
            </li>
          </ul>
        </div>
        <div class="menu-group">
          <div class="menu-group-title">设置</div>
          <ul>
            <li :class="{ active: route.path.startsWith('/admin/config') }">
              <RouterLink to="/admin/config/system">
                <span class="menu-icon">⚙️</span>
                <span>系统配置</span>
              </RouterLink>
            </li>
            <li :class="{ active: route.path.startsWith('/admin/payments') }">
              <RouterLink to="/admin/payments">
                <span class="menu-icon">💳</span>
                <span>支付配置</span>
              </RouterLink>
            </li>
          </ul>
        </div>
        <div class="menu-group">
          <div class="menu-group-title">服务器</div>
          <ul>
            <li :class="{ active: route.path === '/admin/servers' }">
              <RouterLink to="/admin/servers">
                <span class="menu-icon">📦</span>
                <span>节点管理</span>
              </RouterLink>
            </li>
            <li :class="{ active: route.path === '/admin/servers/groups' }">
              <RouterLink to="/admin/servers/groups">
                <span class="menu-icon">📂</span>
                <span>权限组管理</span>
              </RouterLink>
            </li>
            <li :class="{ active: route.path === '/admin/servers/routes' }">
              <RouterLink to="/admin/servers/routes">
                <span class="menu-icon">🔀</span>
                <span>路由管理</span>
              </RouterLink>
            </li>
          </ul>
        </div>
        <div class="menu-group">
          <div class="menu-group-title">财务</div>
          <ul>
            <li :class="{ active: route.path.startsWith('/admin/plans') }">
              <RouterLink to="/admin/plans">
                <span class="menu-icon">📋</span>
                <span>订阅管理</span>
              </RouterLink>
            </li>
            <li :class="{ active: route.path.startsWith('/admin/orders') }">
              <RouterLink to="/admin/orders">
                <span class="menu-icon">📑</span>
                <span>订单管理</span>
              </RouterLink>
            </li>
            <li :class="{ active: route.path.startsWith('/admin/coupons') }">
              <RouterLink to="/admin/coupons">
                <span class="menu-icon">🏷️</span>
                <span>优惠券管理</span>
              </RouterLink>
            </li>
            <li :class="{ active: route.path.startsWith('/admin/giftcards') }">
              <RouterLink to="/admin/giftcards">
                <span class="menu-icon">🎁</span>
                <span>礼品卡管理</span>
              </RouterLink>
            </li>
          </ul>
        </div>
        <div class="menu-group">
          <div class="menu-group-title">用户</div>
          <ul>
            <li :class="{ active: route.path.startsWith('/admin/users') }">
              <RouterLink to="/admin/users">
                <span class="menu-icon">👤</span>
                <span>用户管理</span>
              </RouterLink>
            </li>
            <li :class="{ active: route.path.startsWith('/admin/tickets') }">
              <RouterLink to="/admin/tickets">
                <span class="menu-icon">🛟</span>
                <span>工单管理</span>
              </RouterLink>
            </li>
          </ul>
        </div>
        <div class="menu-group">
          <div class="menu-group-title">内容</div>
          <ul>
            <li :class="{ active: route.path.startsWith('/admin/notices') }">
              <RouterLink to="/admin/notices">
                <span class="menu-icon">📢</span>
                <span>公告管理</span>
              </RouterLink>
            </li>
            <li :class="{ active: route.path.startsWith('/admin/knowledge') }">
              <RouterLink to="/admin/knowledge">
                <span class="menu-icon">📚</span>
                <span>知识库管理</span>
              </RouterLink>
            </li>
          </ul>
        </div>
        <div class="sidebar-footer">谜之站点 v1.7.5</div>
      </aside>
      <main class="content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter, RouterView, RouterLink } from 'vue-router'

const route = useRoute()
const router = useRouter()
const showUserMenu = ref(false)

const adminEmail = computed(() => localStorage.getItem('admin_email') || '')

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

function toggleUserMenu() {
  showUserMenu.value = !showUserMenu.value
}

function closeUserMenu() {
  showUserMenu.value = false
}

function logout() {
  closeUserMenu()
  localStorage.removeItem('admin_email')
  localStorage.removeItem('is_admin')
  localStorage.removeItem('auth_data')
  router.push('/admin/login')
}
</script>

<style scoped>
.admin-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #0b1120;
  color: #e5e7eb;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* 顶部深蓝导航栏 */
.admin-header {
  height: 56px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #1e3a5f;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.site-name {
  font-weight: 600;
  font-size: 16px;
  color: #fff;
  text-decoration: none;
  transition: opacity 0.15s;
}
.site-name:hover {
  opacity: 0.9;
}

.page-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 15px;
  font-weight: 500;
  color: #fff;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.icon-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: transparent;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}
.icon-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.icon {
  width: 18px;
  height: 18px;
}

.user-dropdown {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  color: #fff;
  font-size: 13px;
}
.user-dropdown:hover {
  background: rgba(255, 255, 255, 0.1);
}

.user-email {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.caret {
  font-size: 10px;
  opacity: 0.8;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  min-width: 120px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  padding: 4px;
  z-index: 100;
}

.dropdown-item {
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: transparent;
  color: #e5e7eb;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  border-radius: 4px;
}
.dropdown-item:hover {
  background: #334155;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.admin-layout {
  flex: 1;
  display: flex;
  min-height: 0;
}

.sidebar {
  width: 230px;
  background: #0f172a;
  border-right: 1px solid #1e293b;
  padding: 16px 0;
  color: #94a3b8;
  display: flex;
  flex-direction: column;
}

.menu-group {
  padding: 0 12px 8px;
}

.menu-group-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 12px 0 6px;
  color: #64748b;
  padding: 0 8px;
}

.sidebar ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar li {
  margin-bottom: 2px;
}

.sidebar a {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  color: inherit;
  text-decoration: none;
  font-size: 13px;
}

.sidebar li.active a,
.sidebar a:hover {
  background: #1e293b;
  color: #e5e7eb;
}

.menu-icon {
  font-size: 14px;
  opacity: 0.9;
}

.sidebar-footer {
  margin-top: auto;
  padding: 16px 20px 8px;
  font-size: 11px;
  color: #64748b;
  border-top: 1px solid #1e293b;
}

.content {
  flex: 1;
  padding: 18px 22px;
  background: radial-gradient(circle at top left, #111827 0, #020617 55%);
  color: #e5e7eb;
  overflow: auto;
}
</style>
