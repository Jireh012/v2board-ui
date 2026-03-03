import { request } from './http'
import type { LoginResult } from './auth'

export interface AdminUser {
  id: number
  email: string
  created_at: number
  plan_id: number | null
  balance: number
  banned: number
}

export interface PageResult<T> {
  data: T[]
  total: number
}

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

export interface AdminOrderRow {
  id: number
  trade_no: string
  user_id: number
  plan_id: number
  period: string
  total_amount: number
  status: number
  created_at: number
}

export interface AdminTicket {
  id: number
  user_id: number
  subject: string
  level: number
  status: number
  reply_status: number
  created_at: number
  updated_at: number
}

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

export async function fetchAdminUsers(current = 1, pageSize = 10): Promise<PageResult<AdminUser>> {
  const url = `/api/v1/admin/user/fetch?current=${current}&pageSize=${pageSize}`
  return request<PageResult<AdminUser>>(url)
}

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

export async function fetchAdminOrders(current = 1, pageSize = 10): Promise<PageResult<AdminOrderRow>> {
  const url = `/api/v1/admin/order/fetch?current=${current}&pageSize=${pageSize}`
  return request<PageResult<AdminOrderRow>>(url)
}

export async function fetchAdminTickets(current = 1, pageSize = 10): Promise<PageResult<AdminTicket>> {
  const url = `/api/v1/admin/ticket/fetch?current=${current}&pageSize=${pageSize}`
  return request<PageResult<AdminTicket>>(url)
}

