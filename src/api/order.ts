import { request } from './http'
import { apiUrl } from './paths'

export interface PaymentMethod {
  id: number
  name: string
  payment: string
  icon: string
  handling_fee_fixed: number
  handling_fee_percent: number
}

export interface OrderListItem {
  trade_no: string
  plan_id: number
  period: string
  total_amount: number
  status: number
  created_at: number
  plan?: {
    id: number
    name: string
  } | null
}

export interface OrderDetail {
  trade_no: string
  plan_id: number
  period: string
  total_amount: number
  status: number
  created_at?: number
  surplus_order_ids?: string | null
  plan?: {
    id: number
    name: string
    transfer_enable?: number
  } | null
}

export interface OrderPageResult {
  data: OrderListItem[]
  total: number
}

/** Full list (PHP-compatible). Prefer {@link fetchOrdersPage} for the order list UI. */
export async function fetchOrders(status?: number): Promise<OrderListItem[]> {
  const qs = status != null ? `?status=${status}` : ''
  return request<OrderListItem[]>(apiUrl('user', '/order/fetch') + qs)
}

/** Paginated fetch for infinite scroll on「我的订单」. */
export async function fetchOrdersPage(opts: {
  status?: number
  current?: number
  pageSize?: number
} = {}): Promise<OrderPageResult> {
  const params = new URLSearchParams()
  if (opts.status != null) params.set('status', String(opts.status))
  params.set('current', String(opts.current ?? 1))
  params.set('pageSize', String(opts.pageSize ?? 10))
  return request<OrderPageResult>(`${apiUrl('user', '/order/fetch')}?${params.toString()}`)
}

export async function fetchOrderDetail(tradeNo: string): Promise<OrderDetail> {
  const url = `${apiUrl('user', '/order/detail')}?trade_no=${encodeURIComponent(tradeNo)}`
  return request<OrderDetail>(url)
}

export async function createOrder(
  planId: number,
  period: string,
  couponCode?: string,
  /** 充值金额（分）；planId===0 时必填 */
  depositAmountCents?: number
): Promise<string> {
  const params = new URLSearchParams()
  params.set('plan_id', String(planId))
  if (planId === 0) {
    if (depositAmountCents == null || depositAmountCents <= 0) {
      throw new Error('充值金额必须大于 0')
    }
    params.set('deposit_amount', String(depositAmountCents))
    if (period) {
      params.set('period', period)
    }
  } else {
    params.set('period', period)
    const code = (couponCode || '').trim()
    if (code) {
      params.set('coupon_code', code)
    }
  }
  return request<string>(`${apiUrl('user', '/order/save')}?${params}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}'
  })
}

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  return request<PaymentMethod[]>(apiUrl('user', '/order/getPaymentMethod'))
}

export async function checkout(tradeNo: string, methodId: number): Promise<unknown> {
  const params = new URLSearchParams({
    trade_no: tradeNo,
    method: String(methodId)
  })
  return request<unknown>(`${apiUrl('user', '/order/checkout')}?${params}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}'
  })
}

export async function checkOrderStatus(tradeNo: string): Promise<number> {
  const url = `${apiUrl('user', '/order/check')}?trade_no=${encodeURIComponent(tradeNo)}`
  return request<number>(url)
}

export async function cancelOrder(tradeNo: string): Promise<boolean> {
  const params = new URLSearchParams({ trade_no: tradeNo })
  return request<boolean>(`${apiUrl('user', '/order/cancel')}?${params}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}'
  })
}

