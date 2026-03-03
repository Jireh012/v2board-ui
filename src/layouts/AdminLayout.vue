<template>
  <div class="admin-root">
    <header class="admin-header">
      <div class="logo">V2Board 管理后台</div>
      <nav class="nav-right">
        <span class="admin-email" v-if="adminEmail">当前管理员：{{ adminEmail }}</span>
        <button class="link" @click="logout">退出</button>
      </nav>
    </header>
    <div class="admin-layout">
      <aside class="sidebar">
        <div class="menu-title">控制台</div>
        <ul>
          <li :class="{ active: route.path === '/admin' }">
            <RouterLink to="/admin">概览</RouterLink>
          </li>
        </ul>
        <div class="menu-title">用户与订阅</div>
        <ul>
          <li :class="{ active: route.path.startsWith('/admin/users') }">
            <RouterLink to="/admin/users">用户管理</RouterLink>
          </li>
          <li :class="{ active: route.path.startsWith('/admin/plans') }">
            <RouterLink to="/admin/plans">套餐管理</RouterLink>
          </li>
          <li :class="{ active: route.path.startsWith('/admin/orders') }">
            <RouterLink to="/admin/orders">订单管理</RouterLink>
          </li>
        </ul>
        <div class="menu-title">运营与支持</div>
        <ul>
          <li :class="{ active: route.path.startsWith('/admin/tickets') }">
            <RouterLink to="/admin/tickets">工单管理</RouterLink>
          </li>
          <li :class="{ active: route.path.startsWith('/admin/knowledge') }">
            <RouterLink to="/admin/knowledge">知识库</RouterLink>
          </li>
          <li :class="{ active: route.path.startsWith('/admin/payments') }">
            <RouterLink to="/admin/payments">支付方式</RouterLink>
          </li>
        </ul>
        <div class="menu-title">节点</div>
        <ul>
          <li :class="{ active: route.path.startsWith('/admin/servers/vmess') }">
            <RouterLink to="/admin/servers/vmess">VMess 节点</RouterLink>
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

const adminEmail = computed(() => localStorage.getItem('admin_email') || '')

function logout() {
  localStorage.removeItem('admin_email')
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

.admin-header {
  height: 56px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #020617;
  border-bottom: 1px solid #1f2937;
}

.logo {
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
}

.link {
  border: none;
  background: transparent;
  color: #e5e7eb;
  cursor: pointer;
}

.admin-layout {
  flex: 1;
  display: flex;
  min-height: 0;
}

.sidebar {
  width: 230px;
  background: #020617;
  border-right: 1px solid #1f2937;
  padding: 16px 14px;
  color: #9ca3af;
}

.menu-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  margin: 10px 0 6px;
  color: #6b7280;
}

.sidebar ul {
  list-style: none;
  padding: 0;
  margin: 0 0 4px;
}

.sidebar li {
  margin-bottom: 2px;
}

.sidebar a {
  display: block;
  padding: 7px 9px;
  border-radius: 6px;
  color: inherit;
  text-decoration: none;
  font-size: 13px;
}

.sidebar li.active a,
.sidebar a:hover {
  background: #111827;
  color: #e5e7eb;
}

.content {
  flex: 1;
  padding: 18px 22px;
  background: radial-gradient(circle at top left, #111827 0, #020617 55%);
  color: #e5e7eb;
  overflow: auto;
}
</style>

