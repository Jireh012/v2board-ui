import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { adminBasePath, adminUrl, isAdminUiPath } from './siteBrand'
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
import AdminGroupsView from './views/admin/AdminGroupsView.vue'
import AdminRoutesView from './views/admin/AdminRoutesView.vue'
import AdminExternalSubscribeView from './views/admin/AdminExternalSubscribeView.vue'
import AdminSystemConfigView from './views/admin/AdminSystemConfigView.vue'
import AdminQueueView from './views/admin/AdminQueueView.vue'
import AdminNoticesView from './views/admin/AdminNoticesView.vue'
import AdminCouponsView from './views/admin/AdminCouponsView.vue'
import AdminGiftcardsView from './views/admin/AdminGiftcardsView.vue'
import AdminKnowledgeView from './views/admin/AdminKnowledgeView.vue'
import ForgetView from './views/ForgetView.vue'

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
    path: `/${adminBasePath.value}/login`,
    component: AdminLoginView
  },
  {
    path: `/${adminBasePath.value}`,
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
        path: 'config/system',
        component: AdminSystemConfigView
      },
      {
        path: 'queue',
        component: AdminQueueView
      },
      {
        path: 'payments',
        component: AdminPaymentsView
      },
      {
        path: 'servers',
        component: AdminServersView
      },
      {
        path: 'servers/groups',
        component: AdminGroupsView
      },
      {
        path: 'servers/routes',
        component: AdminRoutesView
      },
      {
        path: 'servers/external-subscribe',
        component: AdminExternalSubscribeView
      },
      {
        path: 'notices',
        component: AdminNoticesView
      },
      {
        path: 'coupons',
        component: AdminCouponsView
      },
      {
        path: 'giftcards',
        component: AdminGiftcardsView
      },
      {
        path: 'knowledge',
        component: AdminKnowledgeView
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const PUBLIC_USER_PATHS = new Set(['/login', '/register', '/forget'])

router.beforeEach((to, _from, next) => {
  if (isAdminUiPath(to.path)) {
    if (to.path !== adminUrl('/login') && !localStorage.getItem('auth_data')) {
      return next(adminUrl('/login'))
    }
    return next()
  }

  // User shell routes always require login (not only when safe_mode_enable=1).
  if (!PUBLIC_USER_PATHS.has(to.path) && !localStorage.getItem('auth_data')) {
    return next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  }
  return next()
})

export default router

