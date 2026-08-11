import { request } from './http'
import { apiUrl } from './paths'
import type { LoginResult } from './auth'

// ==================== 通用 ====================
export interface PageResult<T> {
  data: T[]
  total: number
  /** 与筛选同范围、跨分页的聚合（用户 / 订单 / 优惠券 / 礼品卡等） */
  stats?: {
    banned?: number
    with_plan?: number
    expired?: number
    pending?: number
    completed?: number
    /** 订单金额合计（分） */
    amount_cents?: number
    /** 优惠券：启用 / 有效期内 */
    showing?: number
    active?: number
    /** 礼品卡：可用 / 已兑完 */
    available?: number
    used_up?: number
  }
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
  is_staff?: number | null
  balance: number
  commission_balance: number
  commission_type: number | null
  commission_rate: number | null
  discount: number | null
  speed_limit: number | null
  invite_user_id: number | null
  telegram_id: number | null
  t: number | null
  remarks?: string | null
  last_login_at?: number | null
  created_at: number
  updated_at: number
  plan_name?: string
  total_used?: number
  invite_user?: AdminUser
}

// ==================== Plan ====================
/** 与后端 Plan JSON（snake_case）对齐；transfer_enable 单位为 GB */
export interface AdminPlan {
  id?: number
  name: string
  group_id?: number | null
  transfer_enable?: number | null
  device_limit?: number | null
  speed_limit?: number | null
  show?: number
  renew?: number
  sort?: number | null
  content?: string | null
  month_price?: number | null
  quarter_price?: number | null
  half_year_price?: number | null
  year_price?: number | null
  two_year_price?: number | null
  three_year_price?: number | null
  onetime_price?: number | null
  reset_price?: number | null
  reset_traffic_method?: number | null
  capacity_limit?: number | null
  created_at?: number
  updated_at?: number
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
  email?: string | null
  remarks?: string | null
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

/** 管理端按天聚合后的流量行（id/created_at 可能不存在） */
export interface StatUserRecord {
  id?: number
  user_id: number
  server_rate: number
  u: number
  d: number
  record_at: number
  record_type?: string
  created_at?: number
  updated_at?: number
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
  type?: number  // 1=金额(分), 2=比例(%)
  value?: number
  show?: number
  limit_use?: number | null
  limit_use_with_user?: number | null
  limit_plan_ids?: string | null
  limit_period?: string | null
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
  /** 1余额(分) 2延长天 3流量GB 4清空已用 5指定套餐 */
  type?: number
  value?: number
  plan_id?: number | null
  limit_use?: number | null
  used_user_ids?: string | null
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
  return request<LoginResult>(apiUrl('admin', '/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  }, { auth: false })
}

// ==================== User API ====================
/** sort: created_at (默认) | total_used | expired_at | t（最近使用）；sortType: ASC | DESC */
export async function fetchAdminUsers(
  current = 1, pageSize = 10, filters: OrderFilter[] = [],
  sort: 'created_at' | 'total_used' | 'expired_at' | 't' | string = 'created_at',
  sortType: 'ASC' | 'DESC' = 'DESC'
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
  return request<PageResult<AdminUser>>(`${apiUrl('admin', '/user/fetch')}?${params.toString()}`)
}

export async function getAdminUserInfo(id: number): Promise<AdminUser> {
  return request<AdminUser>(`${apiUrl('admin', '/user/getUserInfoById')}?id=${id}`)
}

export async function updateAdminUser(data: Record<string, unknown>): Promise<boolean> {
  return request<boolean>(apiUrl('admin', '/user/update'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
}

export async function generateAdminUser(data: Record<string, unknown>): Promise<boolean> {
  return request<boolean>(apiUrl('admin', '/user/generate'), {
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
  return request<boolean>(`${apiUrl('admin', '/user/ban')}?${params.toString()}`, { method: 'POST' })
}

export async function deleteAdminUser(id: number): Promise<boolean> {
  // Panel SM4 区禁止 form-urlencoded；id 走 query，空 POST（与 payment/show 一致）
  return request<boolean>(`${apiUrl('admin', '/user/delUser')}?id=${id}`, {
    method: 'POST'
  })
}

export async function resetAdminUserSecret(id: number): Promise<boolean> {
  return request<boolean>(`${apiUrl('admin', '/user/resetSecret')}?id=${id}`, {
    method: 'POST'
  })
}

export async function getAdminUserSubscribeUrl(id: number): Promise<string> {
  return request<string>(`${apiUrl('admin', '/user/getSubscribeUrl')}?id=${id}`)
}

export interface AdminUserLoginLog {
  id: number
  user_id: number
  ip: string | null
  user_agent: string | null
  created_at: number
}

export interface AdminUserLoginLogResult extends PageResult<AdminUserLoginLog> {
  email?: string
  last_login_at?: number | null
}

export async function fetchAdminUserLoginLog(
  userId: number,
  current = 1,
  pageSize = 10
): Promise<AdminUserLoginLogResult> {
  return request<AdminUserLoginLogResult>(
    `${apiUrl('admin', '/user/getLoginLog')}?user_id=${userId}&current=${current}&pageSize=${pageSize}`
  )
}

// ==================== Plan API ====================
export async function fetchAdminPlans(): Promise<AdminPlan[]> {
  return request<AdminPlan[]>(apiUrl('admin', '/plan/fetch'))
}

export async function saveAdminPlan(plan: AdminPlan, forceUpdate = false): Promise<boolean> {
  return request<boolean>(`${apiUrl('admin', '/plan/save')}?force_update=${forceUpdate ? 'true' : 'false'}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(plan)
  })
}

export async function dropAdminPlan(id: number): Promise<boolean> {
  return request<boolean>(`${apiUrl('admin', '/plan/drop')}?id=${id}`, {
    method: 'POST'
  })
}

export async function sortAdminPlans(ids: number[]): Promise<boolean> {
  return request<boolean>(apiUrl('admin', '/plan/sort'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ids)
  })
}

/** 快速切换前台显示 / 允许续费 */
export async function updateAdminPlanFlags(
  id: number,
  flags: { show?: number; renew?: number }
): Promise<boolean> {
  const params = new URLSearchParams()
  params.set('id', String(id))
  if (flags.show !== undefined) params.set('show', String(flags.show))
  if (flags.renew !== undefined) params.set('renew', String(flags.renew))
  return request<boolean>(`${apiUrl('admin', '/plan/update')}?${params.toString()}`, {
    method: 'POST'
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
  return request<PageResult<AdminOrderRow>>(`${apiUrl('admin', '/order/fetch')}?${params.toString()}`)
}

export async function fetchAdminOrderDetail(id: number): Promise<AdminOrderDetail> {
  return request<AdminOrderDetail>(`${apiUrl('admin', '/order/detail')}?id=${id}`, {
    method: 'POST'
  })
}

export async function paidAdminOrder(tradeNo: string): Promise<boolean> {
  const qs = new URLSearchParams({ trade_no: tradeNo })
  return request<boolean>(`${apiUrl('admin', '/order/paid')}?${qs}`, {
    method: 'POST'
  })
}

export async function cancelAdminOrder(tradeNo: string): Promise<boolean> {
  const qs = new URLSearchParams({ trade_no: tradeNo })
  return request<boolean>(`${apiUrl('admin', '/order/cancel')}?${qs}`, {
    method: 'POST'
  })
}

export async function updateAdminOrder(tradeNo: string, commissionStatus: number): Promise<boolean> {
  const qs = new URLSearchParams({
    trade_no: tradeNo,
    commission_status: String(commissionStatus)
  })
  return request<boolean>(`${apiUrl('admin', '/order/update')}?${qs}`, {
    method: 'POST'
  })
}

export async function assignAdminOrder(
  planId: number, email: string, period: string, totalAmount: number
): Promise<string> {
  const qs = new URLSearchParams({
    plan_id: String(planId),
    email,
    period,
    total_amount: String(totalAmount)
  })
  return request<string>(`${apiUrl('admin', '/order/assign')}?${qs}`, {
    method: 'POST'
  })
}

// ==================== Ticket API ====================
export async function fetchAdminTickets(
  current = 1,
  pageSize = 10,
  opts: { status?: number | null; reply_status?: number[] | null; email?: string | null } = {}
): Promise<PageResult<AdminTicket>> {
  const params = new URLSearchParams()
  params.set('current', String(current))
  params.set('pageSize', String(pageSize))
  if (opts.status != null) params.set('status', String(opts.status))
  if (opts.reply_status?.length) {
    opts.reply_status.forEach((s) => params.append('reply_status', String(s)))
  }
  if (opts.email) params.set('email', opts.email)
  return request<PageResult<AdminTicket>>(`${apiUrl('admin', '/ticket/fetch')}?${params.toString()}`)
}

export async function fetchAdminTicketDetail(id: number): Promise<AdminTicket> {
  return request<AdminTicket>(`${apiUrl('admin', '/ticket/fetch')}?id=${id}`)
}

export async function replyAdminTicket(id: number, message: string): Promise<boolean> {
  const qs = new URLSearchParams({ id: String(id), message })
  return request<boolean>(`${apiUrl('admin', '/ticket/reply')}?${qs}`, {
    method: 'POST'
  })
}

export async function closeAdminTicket(id: number): Promise<boolean> {
  return request<boolean>(`${apiUrl('admin', '/ticket/close')}?id=${id}`, {
    method: 'POST'
  })
}

// ==================== Stat API ====================
export async function fetchStatOverride(): Promise<StatOverride> {
  return request<StatOverride>(apiUrl('admin', '/stat/getOverride'))
}

export async function fetchStatOrder(): Promise<StatOrderTrend[]> {
  return request<StatOrderTrend[]>(apiUrl('admin', '/stat/getOrder'))
}

export async function fetchStatServerLastRank(): Promise<StatServerRank[]> {
  return request<StatServerRank[]>(apiUrl('admin', '/stat/getServerLastRank'))
}

export async function fetchStatServerTodayRank(): Promise<StatServerRank[]> {
  return request<StatServerRank[]>(apiUrl('admin', '/stat/getServerTodayRank'))
}

export async function fetchStatUserTodayRank(): Promise<StatUserRank[]> {
  return request<StatUserRank[]>(apiUrl('admin', '/stat/getUserTodayRank'))
}

export async function fetchStatUserLastRank(): Promise<StatUserRank[]> {
  return request<StatUserRank[]>(apiUrl('admin', '/stat/getUserLastRank'))
}

export async function fetchStatUser(
  userId: number, current = 1, pageSize = 10
): Promise<PageResult<StatUserRecord>> {
  return request<PageResult<StatUserRecord>>(
    `${apiUrl('admin', '/stat/getStatUser')}?user_id=${userId}&current=${current}&pageSize=${pageSize}`
  )
}

// ==================== Notice API ====================
export async function fetchAdminNotices(): Promise<AdminNotice[]> {
  return request<AdminNotice[]>(apiUrl('admin', '/notice/fetch'))
}

export async function saveAdminNotice(notice: AdminNotice): Promise<boolean> {
  return request<boolean>(apiUrl('admin', '/notice/save'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(notice)
  })
}

export async function showAdminNotice(id: number): Promise<boolean> {
  return request<boolean>(`${apiUrl('admin', '/notice/show')}?id=${id}`, {
    method: 'POST'
  })
}

export async function dropAdminNotice(id: number): Promise<boolean> {
  return request<boolean>(`${apiUrl('admin', '/notice/drop')}?id=${id}`, {
    method: 'POST'
  })
}

// ==================== Coupon API ====================
export async function fetchAdminCoupons(
  current = 1, pageSize = 10
): Promise<PageResult<AdminCoupon>> {
  return request<PageResult<AdminCoupon>>(
    `${apiUrl('admin', '/coupon/fetch')}?current=${current}&pageSize=${pageSize}`
  )
}

export async function generateAdminCoupon(coupon: AdminCoupon): Promise<boolean> {
  return request<boolean>(apiUrl('admin', '/coupon/generate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(coupon)
  })
}

export async function showAdminCoupon(id: number): Promise<boolean> {
  return request<boolean>(`${apiUrl('admin', '/coupon/show')}?id=${id}`, {
    method: 'POST'
  })
}

export async function dropAdminCoupon(id: number): Promise<boolean> {
  return request<boolean>(`${apiUrl('admin', '/coupon/drop')}?id=${id}`, {
    method: 'POST'
  })
}

// ==================== Giftcard API ====================
export async function fetchAdminGiftcards(
  current = 1, pageSize = 10
): Promise<PageResult<AdminGiftcard>> {
  return request<PageResult<AdminGiftcard>>(
    `${apiUrl('admin', '/giftcard/fetch')}?current=${current}&pageSize=${pageSize}`
  )
}

export async function generateAdminGiftcard(giftcard: AdminGiftcard): Promise<boolean> {
  return request<boolean>(apiUrl('admin', '/giftcard/generate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(giftcard)
  })
}

export async function dropAdminGiftcard(id: number): Promise<boolean> {
  return request<boolean>(`${apiUrl('admin', '/giftcard/drop')}?id=${id}`, {
    method: 'POST'
  })
}

// ==================== Knowledge API ====================
export async function fetchAdminKnowledge(): Promise<AdminKnowledge[]> {
  return request<AdminKnowledge[]>(apiUrl('admin', '/knowledge/fetch'))
}

export async function fetchAdminKnowledgeById(id: number): Promise<AdminKnowledge> {
  return request<AdminKnowledge>(`${apiUrl('admin', '/knowledge/fetch')}?id=${id}`)
}

export async function fetchAdminKnowledgeCategory(): Promise<string[]> {
  return request<string[]>(apiUrl('admin', '/knowledge/category'))
}

export async function saveAdminKnowledge(knowledge: AdminKnowledge): Promise<boolean> {
  return request<boolean>(apiUrl('admin', '/knowledge/save'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(knowledge)
  })
}

export async function showAdminKnowledge(id: number): Promise<boolean> {
  return request<boolean>(`${apiUrl('admin', '/knowledge/show')}?id=${id}`, {
    method: 'POST'
  })
}

export async function sortAdminKnowledge(ids: number[]): Promise<boolean> {
  return request<boolean>(apiUrl('admin', '/knowledge/sort'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Wire format must be snake_case (global Jackson SNAKE_CASE → SortRequest.knowledgeIds)
    body: JSON.stringify({ knowledge_ids: ids })
  })
}

export async function dropAdminKnowledge(id: number): Promise<boolean> {
  return request<boolean>(`${apiUrl('admin', '/knowledge/drop')}?id=${id}`, {
    method: 'POST'
  })
}
