import { request } from '../http'
import { apiUrl } from '../paths'

export interface AdminPayment {
  id: number
  name: string
  payment: string
  icon?: string
  handling_fee_fixed: number
  handling_fee_percent: number
  enable: number
  sort?: number
  notify_domain?: string
  uuid: string
  notify_url: string
}

export interface FormField {
  label: string
  description: string
  type: string
  value?: string
}

export type PaymentFormDef = Record<string, FormField>

export function fetchPayments(): Promise<AdminPayment[]> {
  return request<AdminPayment[]>(apiUrl('admin', '/payment/fetch'))
}

export function fetchPaymentMethods(): Promise<string[]> {
  return request<string[]>(apiUrl('admin', '/payment/methods'))
}

export function fetchPaymentForm(payment: string, id: number): Promise<PaymentFormDef[]> {
  return request<PaymentFormDef[]>(
    `${apiUrl('admin', '/payment/form')}?payment=${encodeURIComponent(payment)}&id=${id}`
  )
}

export function savePayment(body: Record<string, unknown>): Promise<boolean> {
  return request<boolean>(apiUrl('admin', '/payment/save'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
}

export function togglePayment(id: number): Promise<boolean> {
  return request<boolean>(`${apiUrl('admin', '/payment/show')}?id=${id}`, {
    method: 'POST'
  })
}

export function dropPayment(id: number): Promise<boolean> {
  return request<boolean>(`${apiUrl('admin', '/payment/drop')}?id=${id}`, {
    method: 'POST'
  })
}

export function sortPayments(ids: number[]): Promise<boolean> {
  return request<boolean>(apiUrl('admin', '/payment/sort'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ids)
  })
}
