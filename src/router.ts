import { createRouter, createWebHistory } from 'vue-router'
import type { RouteLocationNormalized, RouteRecordRaw } from 'vue-router'
import { adminBasePath, adminUrl, ensureSiteBrand, safeMode } from './siteBrand'
import LoginView from './views/LoginView.vue'
import RegisterView from './views/RegisterView.vue'
import DashboardHome from './views/DashboardHome.vue'
import PlanView from './views/PlanView.vue'
import OrderView from './views/OrderView.vue'
import OrderDetailView from './views/OrderDetailView.vue'
import TicketView from './views/TicketView.vue'
import TrafficView from './views/TrafficView.vue'
import KnowledgeView from './views/KnowledgeView.vue'
import InviteView from './views/InviteView.vue'
import ProfileView from './views/ProfileView.vue'
import ServerStatusView from './views/ServerStatusView.vue'
import AdminLoginView from './views/AdminLoginView.vue'
import AdminLayout from './layouts/AdminLayout.vue'
import AdminDashboardView from './views/admin/AdminDashboardView.vue'
import AdminUsersView from './views/admin/AdminUsersView.vue'
import AdminPlansView from './views/admin/AdminPlansView.vue'
import AdminOrdersView from './views/admin/AdminOrdersView.vue'
import AdminTicketsView from './views/admin/AdminTicketsView.vue'
import AdminPaymentsView from './views/admin/AdminPaymentsView.vue'
import AdminServersView from './views/admin/AdminServersView.vue'
import AdminNodeTrafficView from './views/admin/AdminNodeTrafficView.vue'
import AdminGroupsView from './views/admin/AdminGroupsView.vue'
import AdminRoutesView from './views/admin/AdminRoutesView.vue'
import AdminExternalSubscribeView from './views/admin/AdminExternalSubscribeView.vue'
import AdminSubscribeRuleView from './views/admin/AdminSubscribeRuleView.vue'
import AdminSystemConfigView from './views/admin/AdminSystemConfigView.vue'
import AdminQueueView from './views/admin/AdminQueueView.vue'
import AdminSystemLogView from './views/admin/AdminSystemLogView.vue'
import AdminNoticesView from './views/admin/AdminNoticesView.vue'
import AdminCouponsView from './views/admin/AdminCouponsView.vue'
import AdminGiftcardsView from './views/admin/AdminGiftcardsView.vue'
import AdminKnowledgeView from './views/admin/AdminKnowledgeView.vue'
import ForgetView from './views/ForgetView.vue'
import DecoyView from './views/DecoyView.vue'

const PUBLIC_USER_PATHS = new Set(['/login', '/register', '/forget'])

const adminChildren: RouteRecordRaw[] = [
  { path: '', component: AdminDashboardView },
  { path: 'users', component: AdminUsersView },
  { path: 'plans', component: AdminPlansView },
  { path: 'orders', component: AdminOrdersView },
  { path: 'tickets', component: AdminTicketsView },
  { path: 'config/system', component: AdminSystemConfigView },
  { path: 'queue', component: AdminQueueView },
  { path: 'system-log', component: AdminSystemLogView },
  { path: 'payments', component: AdminPaymentsView },
  { path: 'servers', component: AdminServersView },
  { path: 'servers/traffic', component: AdminNodeTrafficView },
  { path: 'servers/groups', component: AdminGroupsView },
  { path: 'servers/routes', component: AdminRoutesView },
  { path: 'servers/external-subscribe', component: AdminExternalSubscribeView },
  { path: 'servers/subscribe-rules', component: AdminSubscribeRuleView },
  { path: 'notices', component: AdminNoticesView },
  { path: 'coupons', component: AdminCouponsView },
  { path: 'giftcards', component: AdminGiftcardsView },
  { path: 'knowledge', component: AdminKnowledgeView }
]

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'root',
    component: DecoyView,
    meta: { decoy: true }
  },
  {
    path: '/login',
    component: LoginView
  },
  {
    path: '/register',
    component: RegisterView
  },
  {
    path: '/forget',
    component: ForgetView
  },
  {
    path: '/dashboard',
    component: DashboardHome
  },
  {
    path: '/plan',
    component: PlanView
  },
  {
    path: '/plan/:id',
    component: PlanView
  },
  {
    path: '/server',
    component: ServerStatusView
  },
  {
    path: '/order',
    component: OrderView
  },
  {
    path: '/order/:tradeNo',
    component: OrderDetailView
  },
  {
    path: '/invite',
    component: InviteView
  },
  {
    path: '/ticket',
    component: TicketView
  },
  {
    path: '/traffic',
    component: TrafficView
  },
  {
    path: '/knowledge',
    component: KnowledgeView
  },
  {
    path: '/profile',
    component: ProfileView
  },
  {
    // Alphanumeric only — paths with hyphens/etc. fall through to catch-all.
    path: '/:adminSeg([A-Za-z0-9]+)/login',
    name: 'admin-login',
    component: AdminLoginView,
    meta: { adminSeg: true }
  },
  {
    path: '/:adminSeg([A-Za-z0-9]+)',
    name: 'admin',
    component: AdminLayout,
    meta: { adminSeg: true },
    children: adminChildren
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'decoy-fallback',
    component: DecoyView,
    meta: { decoy: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

function hasAuth(): boolean {
  return !!localStorage.getItem('auth_data')
}

function decoyLocation(to: RouteLocationNormalized) {
  const parts = to.path.split('/').filter(Boolean)
  return {
    name: 'decoy-fallback' as const,
    params: { pathMatch: parts },
    replace: true
  }
}

/** Safe mode on → fake landing; off → user login (logged-out only). */
function decoyOrLogin(to: RouteLocationNormalized) {
  if (safeMode.value) {
    return decoyLocation(to)
  }
  return { path: '/login', replace: true as const }
}

router.beforeEach(async (to, _from, next) => {
  // Logged-in home → user dashboard.
  if (to.path === '/' && hasAuth()) {
    await ensureSiteBrand()
    return next({ path: '/dashboard', replace: true })
  }

  // Decoy routes: need /config to read safe_mode_enable.
  if (to.meta.decoy) {
    await ensureSiteBrand()
    if (hasAuth() && to.path === '/') {
      return next({ path: '/dashboard', replace: true })
    }
    if (!safeMode.value) {
      return next({ path: '/login', replace: true })
    }
    return next()
  }

  // Potential admin UI (param segment). Validate after brand load.
  if (to.meta.adminSeg) {
    const seg = String(to.params.adminSeg || '')
    await ensureSiteBrand()
    if (seg !== adminBasePath.value) {
      return next(decoyOrLogin(to))
    }
    const loginPath = adminUrl('/login')
    if (to.path !== loginPath && !hasAuth()) {
      return next(loginPath)
    }
    return next()
  }

  // Real user/public routes: load brand/config first.
  await ensureSiteBrand()

  // User shell routes always require login.
  if (!PUBLIC_USER_PATHS.has(to.path) && !hasAuth()) {
    return next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  }
  return next()
})

export default router
