import { request } from './http'

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
    transferEnable?: number
  } | null
}

export async function fetchOrders(status?: number): Promise<OrderListItem[]> {
  const qs = status != null ? `?status=${status}` : ''
  return request<OrderListItem[]>(`/api/v1/user/order/fetch${qs}`)
}

export async function fetchOrderDetail(tradeNo: string): Promise<OrderDetail> {
  const url = `/api/v1/user/order/detail?trade_no=${encodeURIComponent(tradeNo)}`
  return request<OrderDetail>(url)
}

export async function createOrder(planId: number, period: string): Promise<string> {
  const body = new URLSearchParams()
  body.set('plan_id', String(planId))
  body.set('period', period)
  const tradeNo = await request<string>('/api/v1/user/order/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  })
  return tradeNo
}

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  return request<PaymentMethod[]>('/api/v1/user/order/getPaymentMethod')
}

export async function checkout(tradeNo: string, methodId: number): Promise<unknown> {
  const body = new URLSearchParams()
  body.set('trade_no', tradeNo)
  body.set('method', String(methodId))
  return request<unknown>('/api/v1/user/order/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  })
}

export async function checkOrderStatus(tradeNo: string): Promise<number> {
  const url = `/api/v1/user/order/check?trade_no=${encodeURIComponent(tradeNo)}`
  return request<number>(url)
}

export async function cancelOrder(tradeNo: string): Promise<boolean> {
  const body = new URLSearchParams()
  body.set('trade_no', tradeNo)
  return request<boolean>('/api/v1/user/order/cancel', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  })
}

