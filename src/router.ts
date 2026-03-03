import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import LoginView from './views/LoginView.vue'
import DashboardHome from './views/DashboardHome.vue'
import PlanView from './views/PlanView.vue'
import OrderView from './views/OrderView.vue'
import TicketView from './views/TicketView.vue'
import TrafficView from './views/TrafficView.vue'
import AdminLoginView from './views/AdminLoginView.vue'
import AdminLayout from './layouts/AdminLayout.vue'
import AdminDashboardView from './views/admin/AdminDashboardView.vue'
import AdminUsersView from './views/admin/AdminUsersView.vue'
import AdminPlansView from './views/admin/AdminPlansView.vue'
import AdminOrdersView from './views/admin/AdminOrdersView.vue'
import AdminTicketsView from './views/admin/AdminTicketsView.vue'
import AdminPaymentsView from './views/admin/AdminPaymentsView.vue'
import AdminVmessServersView from './views/admin/AdminVmessServersView.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    component: LoginView
  },
  {
    path: '/dashboard',
    component: DashboardHome
  },
  {
    path: '/dashboard/plan',
    component: PlanView
  },
  {
    path: '/dashboard/order',
    component: OrderView
  },
  {
    path: '/dashboard/ticket',
    component: TicketView
  },
  {
    path: '/dashboard/traffic',
    component: TrafficView
  },
  {
    path: '/admin/login',
    component: AdminLoginView
  },
  {
    path: '/admin',
    component: AdminLayout,
    children: [
      {
        path: '',
        component: AdminDashboardView
      },
      {
        path: 'users',
        component: AdminUsersView
      },
      {
        path: 'plans',
        component: AdminPlansView
      },
      {
        path: 'orders',
        component: AdminOrdersView
      },
      {
        path: 'tickets',
        component: AdminTicketsView
      },
      {
        path: 'payments',
        component: AdminPaymentsView
      },
      {
        path: 'servers/vmess',
        component: AdminVmessServersView
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  if (to.path.startsWith('/admin') && to.path !== '/admin/login') {
    const auth = localStorage.getItem('auth_data')
    if (!auth) {
      return next('/admin/login')
    }
  }
  next()
})

export default router

