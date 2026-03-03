import { request } from './http'

export interface PaymentMethod {
  id: number
  name: string
  payment: string
  icon: string
  handling_fee_fixed: number
  handling_fee_percent: number
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

