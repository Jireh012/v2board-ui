import { request } from './http'
import type { LoginResult } from './auth'

// ==================== 通用 ====================
export interface PageResult<T> {
  data: T[]
  total: number
}

export interface OrderFilter {
  key: string
  condition: string
  value: string
}

// ==================== User ====================
export interface AdminUser {
  id: number
  email: string
  uuid: string
  token: string
  group_id: number | null
  plan_id: number | null
  expired_at: number | null
  u: number | null
  d: number | null
  transfer_enable: number | null
  device_limit: number | null
  banned: number
  is_admin: number
  balance: number
  commission_balance: number
  commission_type: number | null
  commission_rate: number | null
  discount: number | null
  speed_limit: number | null
  invite_user_id: number | null
  telegram_id: number | null
  t: number | null
  created_at: number
  updated_at: number
  plan_name?: string
  total_used?: number
  invite_user?: AdminUser
}

// ==================== Plan ====================
export interface AdminPlan {
  id?: number
  name: string
  groupId?: number
  transferEnable?: number
  show?: number
  renew?: number
  sort?: number
  monthPrice?: number
  yearPrice?: number
  count?: number
}

// ==================== Order ====================
export interface AdminOrderRow {
  id: number
  invite_user_id: number | null
  user_id: number
  plan_id: number
  coupon_id: number | null
  payment_id: number | null
  type: number
  period: string
  trade_no: string
  callback_no: string | null
  total_amount: number
  handling_amount: number | null
  discount_amount: number | null
  surplus_amount: number | null
  refund_amount: number | null
  balance_amount: number | null
  surplus_order_ids: string | null
  status: number
  commission_status: number
  commission_balance: number
  actual_commission_balance: number | null
  paid_at: number | null
  created_at: number
  updated_at: number
  plan_name?: string
}

export interface AdminOrderDetail extends AdminOrderRow {
  commission_log?: CommissionLog[]
  surplus_orders?: AdminOrderRow[]
}

export interface CommissionLog {
  id: number
  invite_user_id: number
  user_id: number
  trade_no: string
  order_amount: number
  get_amount: number
  created_at: number
  updated_at: number
}

// ==================== Ticket ====================
export interface AdminTicket {
  id: number
  user_id: number
  subject: string
  level: number
  status: number
  reply_status: number
  created_at: number
  updated_at: number
  message?: TicketMessage[]
}

export interface TicketMessage {
  id: number
  ticket_id: number
  user_id: number
  message: string
  created_at: number
  updated_at: number
  is_me: boolean
}

// ==================== Stat ====================
export interface StatOverride {
  online_user: number
  month_income: number
  month_register_total: number
  day_register_total: number
  ticket_pending_total: number
  commission_pending_total: number
  day_income: number
  last_month_income: number
  commission_month_payout: number
  commission_last_month_payout: number
}

export interface StatOrderTrend {
  type: string
  date: string
  value: number
}

export interface StatServerRank {
  server_id: number
  server_type: string
  server_name: string
  u: number
  d: number
  total: number
}

export interface StatUserRank {
  user_id: number
  email: string
  u: number
  d: number
  total: number
}

export interface StatUserRecord {
  id: number
  user_id: number
  server_rate: number
  u: number
  d: number
  record_at: number
  record_type: string
  created_at: number
  updated_at: number
}

// ==================== Notice ====================
export interface AdminNotice {
  id?: number
  title: string
  content: string
  show?: number
  img_url?: string
  tags?: string
  created_at?: number
  updated_at?: number
}

// ==================== Coupon ====================
export interface AdminCoupon {
  id?: number
  name?: string
  code?: string
  type?: number  // 1=金额, 2=比例
  value?: number
  show?: number
  limit_use?: number
  limit_use_with_user?: number
  limit_plan_ids?: string
  limit_period?: string
  started_at?: number
  ended_at?: number
  created_at?: number
  updated_at?: number
}

// ==================== Giftcard ====================
export interface AdminGiftcard {
  id?: number
  name?: string
  code?: string
  type?: number
  value?: number
  plan_id?: number | null
  limit_use?: number
  used_user_ids?: string
  started_at?: number
  ended_at?: number
  created_at?: number
  updated_at?: number
}

// ==================== Knowledge ====================
export interface AdminKnowledge {
  id?: number
  category?: string
  title: string
  language?: string
  show?: number
  sort?: number
  body?: string
  created_at?: number
  updated_at?: number
}

// ==================== Auth ====================
export async function adminLogin(email: string, password: string): Promise<LoginResult> {
  const body = new URLSearchParams()
  body.set('email', email)
  body.set('password', password)
  return request<LoginResult>('/api/v1/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  }, { auth: false })
}

// ==================== User API ====================
export async function fetchAdminUsers(
  current = 1, pageSize = 10, filters: OrderFilter[] = [],
  sort = 'created_at', sortType = 'DESC'
): Promise<PageResult<AdminUser>> {
  const params = new URLSearchParams()
  params.set('current', String(current))
  params.set('pageSize', String(pageSize))
  params.set('sort', sort)
  params.set('sort_type', sortType)
  filters.forEach((f, i) => {
    params.set(`filter[${i}][key]`, f.key)
    params.set(`filter[${i}][condition]`, f.condition)
    params.set(`filter[${i}][value]`, f.value)
  })
  return request<PageResult<AdminUser>>(`/api/v1/admin/user/fetch?${params.toString()}`)
}

export async function getAdminUserInfo(id: number): Promise<AdminUser> {
  return request<AdminUser>(`/api/v1/admin/user/getUserInfoById?id=${id}`)
}

export async function updateAdminUser(data: Record<string, unknown>): Promise<boolean> {
  return request<boolean>('/api/v1/admin/user/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
}

export async function generateAdminUser(data: Record<string, unknown>): Promise<boolean> {
  return request<boolean>('/api/v1/admin/user/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
}

export async function banAdminUsers(filters: OrderFilter[]): Promise<boolean> {
  const params = new URLSearchParams()
  filters.forEach((f, i) => {
    params.set(`filter[${i}][key]`, f.key)
    params.set(`filter[${i}][condition]`, f.condition)
    params.set(`filter[${i}][value]`, f.value)
  })
  return request<boolean>(`/api/v1/admin/user/ban?${params.toString()}`, { method: 'POST' })
}

export async function deleteAdminUser(id: number): Promise<boolean> {
  const body = new URLSearchParams()
  body.set('id', String(id))
  return request<boolean>('/api/v1/admin/user/delUser', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })
}

export async function resetAdminUserSecret(id: number): Promise<boolean> {
  const body = new URLSearchParams()
  body.set('id', String(id))
  return request<boolean>('/api/v1/admin/user/resetSecret', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })
}

// ==================== Plan API ====================
export async function fetchAdminPlans(): Promise<AdminPlan[]> {
  return request<AdminPlan[]>('/api/v1/admin/plan/fetch')
}

export async function saveAdminPlan(plan: AdminPlan, forceUpdate = false): Promise<boolean> {
  return request<boolean>(`/api/v1/admin/plan/save?force_update=${forceUpdate ? 'true' : 'false'}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(plan)
  })
}

export async function dropAdminPlan(id: number): Promise<boolean> {
  const body = new URLSearchParams()
  body.set('id', String(id))
  return request<boolean>('/api/v1/admin/plan/drop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })
}

export async function sortAdminPlans(ids: number[]): Promise<boolean> {
  return request<boolean>('/api/v1/admin/plan/sort', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ids)
  })
}

// ==================== Order API ====================
export async function fetchAdminOrders(
  current = 1, pageSize = 10, filters: OrderFilter[] = [], isCommission = false
): Promise<PageResult<AdminOrderRow>> {
  const params = new URLSearchParams()
  params.set('current', String(current))
  params.set('pageSize', String(pageSize))
  if (isCommission) params.set('is_commission', 'true')
  filters.forEach((f, i) => {
    params.set(`filter[${i}][key]`, f.key)
    params.set(`filter[${i}][condition]`, f.condition)
    params.set(`filter[${i}][value]`, f.value)
  })
  return request<PageResult<AdminOrderRow>>(`/api/v1/admin/order/fetch?${params.toString()}`)
}

export async function fetchAdminOrderDetail(id: number): Promise<AdminOrderDetail> {
  const body = new URLSearchParams()
  body.set('id', String(id))
  return request<AdminOrderDetail>('/api/v1/admin/order/detail', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })
}

export async function paidAdminOrder(tradeNo: string): Promise<boolean> {
  const body = new URLSearchParams()
  body.set('trade_no', tradeNo)
  return request<boolean>('/api/v1/admin/order/paid', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })
}

export async function cancelAdminOrder(tradeNo: string): Promise<boolean> {
  const body = new URLSearchParams()
  body.set('trade_no', tradeNo)
  return request<boolean>('/api/v1/admin/order/cancel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })
}

export async function updateAdminOrder(tradeNo: string, commissionStatus: number): Promise<boolean> {
  const body = new URLSearchParams()
  body.set('trade_no', tradeNo)
  body.set('commission_status', String(commissionStatus))
  return request<boolean>('/api/v1/admin/order/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })
}

export async function assignAdminOrder(
  planId: number, email: string, period: string, totalAmount: number
): Promise<string> {
  const body = new URLSearchParams()
  body.set('plan_id', String(planId))
  body.set('email', email)
  body.set('period', period)
  body.set('total_amount', String(totalAmount))
  return request<string>('/api/v1/admin/order/assign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })
}

// ==================== Ticket API ====================
export async function fetchAdminTickets(current = 1, pageSize = 10): Promise<PageResult<AdminTicket>> {
  return request<PageResult<AdminTicket>>(`/api/v1/admin/ticket/fetch?current=${current}&pageSize=${pageSize}`)
}

export async function fetchAdminTicketDetail(id: number): Promise<AdminTicket> {
  return request<AdminTicket>(`/api/v1/admin/ticket/fetch?id=${id}`)
}

export async function replyAdminTicket(id: number, message: string): Promise<boolean> {
  return request<boolean>('/api/v1/admin/ticket/reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, message })
  })
}

export async function closeAdminTicket(id: number): Promise<boolean> {
  const body = new URLSearchParams()
  body.set('id', String(id))
  return request<boolean>('/api/v1/admin/ticket/close', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })
}

// ==================== Stat API ====================
export async function fetchStatOverride(): Promise<StatOverride> {
  return request<StatOverride>('/api/v1/admin/stat/getOverride')
}

export async function fetchStatOrder(): Promise<StatOrderTrend[]> {
  return request<StatOrderTrend[]>('/api/v1/admin/stat/getOrder')
}

export async function fetchStatServerLastRank(): Promise<StatServerRank[]> {
  return request<StatServerRank[]>('/api/v1/admin/stat/getServerLastRank')
}

export async function fetchStatServerTodayRank(): Promise<StatServerRank[]> {
  return request<StatServerRank[]>('/api/v1/admin/stat/getServerTodayRank')
}

export async function fetchStatUserTodayRank(): Promise<StatUserRank[]> {
  return request<StatUserRank[]>('/api/v1/admin/stat/getUserTodayRank')
}

export async function fetchStatUserLastRank(): Promise<StatUserRank[]> {
  return request<StatUserRank[]>('/api/v1/admin/stat/getUserLastRank')
}

export async function fetchStatUser(
  userId: number, current = 1, pageSize = 10
): Promise<PageResult<StatUserRecord>> {
  return request<PageResult<StatUserRecord>>(
    `/api/v1/admin/stat/getStatUser?user_id=${userId}&current=${current}&pageSize=${pageSize}`
  )
}

// ==================== Notice API ====================
export async function fetchAdminNotices(): Promise<AdminNotice[]> {
  return request<AdminNotice[]>('/api/v1/admin/notice/fetch')
}

export async function saveAdminNotice(notice: AdminNotice): Promise<boolean> {
  return request<boolean>('/api/v1/admin/notice/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(notice)
  })
}

export async function showAdminNotice(id: number): Promise<boolean> {
  const body = new URLSearchParams()
  body.set('id', String(id))
  return request<boolean>('/api/v1/admin/notice/show', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })
}

export async function dropAdminNotice(id: number): Promise<boolean> {
  const body = new URLSearchParams()
  body.set('id', String(id))
  return request<boolean>('/api/v1/admin/notice/drop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })
}

// ==================== Coupon API ====================
export async function fetchAdminCoupons(
  current = 1, pageSize = 10
): Promise<PageResult<AdminCoupon>> {
  return request<PageResult<AdminCoupon>>(
    `/api/v1/admin/coupon/fetch?current=${current}&pageSize=${pageSize}`
  )
}

export async function generateAdminCoupon(coupon: AdminCoupon): Promise<boolean> {
  return request<boolean>('/api/v1/admin/coupon/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(coupon)
  })
}

export async function showAdminCoupon(id: number): Promise<boolean> {
  const body = new URLSearchParams()
  body.set('id', String(id))
  return request<boolean>('/api/v1/admin/coupon/show', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })
}

export async function dropAdminCoupon(id: number): Promise<boolean> {
  const body = new URLSearchParams()
  body.set('id', String(id))
  return request<boolean>('/api/v1/admin/coupon/drop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })
}

// ==================== Giftcard API ====================
export async function fetchAdminGiftcards(
  current = 1, pageSize = 10
): Promise<PageResult<AdminGiftcard>> {
  return request<PageResult<AdminGiftcard>>(
    `/api/v1/admin/giftcard/fetch?current=${current}&pageSize=${pageSize}`
  )
}

export async function generateAdminGiftcard(giftcard: AdminGiftcard): Promise<boolean> {
  return request<boolean>('/api/v1/admin/giftcard/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(giftcard)
  })
}

export async function dropAdminGiftcard(id: number): Promise<boolean> {
  const body = new URLSearchParams()
  body.set('id', String(id))
  return request<boolean>('/api/v1/admin/giftcard/drop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })
}

// ==================== Knowledge API ====================
export async function fetchAdminKnowledge(): Promise<AdminKnowledge[]> {
  return request<AdminKnowledge[]>('/api/v1/admin/knowledge/fetch')
}

export async function fetchAdminKnowledgeCategory(): Promise<string[]> {
  return request<string[]>('/api/v1/admin/knowledge/category')
}

export async function saveAdminKnowledge(knowledge: AdminKnowledge): Promise<boolean> {
  return request<boolean>('/api/v1/admin/knowledge/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(knowledge)
  })
}

export async function showAdminKnowledge(id: number): Promise<boolean> {
  const body = new URLSearchParams()
  body.set('id', String(id))
  return request<boolean>('/api/v1/admin/knowledge/show', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })
}

export async function sortAdminKnowledge(ids: number[]): Promise<boolean> {
  return request<boolean>('/api/v1/admin/knowledge/sort', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ids)
  })
}

export async function dropAdminKnowledge(id: number): Promise<boolean> {
  const body = new URLSearchParams()
  body.set('id', String(id))
  return request<boolean>('/api/v1/admin/knowledge/drop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })
}
