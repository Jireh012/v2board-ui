import { request } from './http'
import type { Plan } from './plan'

export interface UserInfo {
  email: string
  transfer_enable: number
  device_limit: number
  last_login_at: number | null
  created_at: number
  banned: number
  auto_renewal: number
  remind_expire: number
  remind_traffic: number
  expired_at: number | null
  balance: number
  commission_balance: number
  plan_id: number | null
  discount: number
  commission_rate: number
  telegram_id: number | null
  uuid: string
}

export interface SubscribeInfo {
  plan_id: number | null
  token: string
  expired_at: number | null
  u: number
  d: number
  transfer_enable: number
  device_limit: number | null
  email: string
  uuid: string
  subscribe_url: string
  reset_day: number | null
  allow_new_period: number
  alive_ip: number
  plan?: Plan
}

export interface TrafficLog {
  id: number
  user_id: number
  u: number
  d: number
  server_rate: number
  record_at: number
}

export async function getUserInfo(): Promise<UserInfo> {
  return request<UserInfo>('/api/v1/user/info')
}

export async function getSubscribe(): Promise<SubscribeInfo> {
  return request<SubscribeInfo>('/api/v1/user/getSubscribe')
}

export async function getUserStat(): Promise<number[]> {
  return request<number[]>('/api/v1/user/getStat')
}

export async function changePassword(old_password: string, new_password: string): Promise<boolean> {
  const body = new URLSearchParams()
  body.set('old_password', old_password)
  body.set('new_password', new_password)
  return request<boolean>('/api/v1/user/changePassword', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })
}

export async function updateUserInfo(params: {
  auto_renewal?: number
  remind_expire?: number
  remind_traffic?: number
}): Promise<boolean> {
  const body = new URLSearchParams()
  if (params.auto_renewal !== undefined) body.set('auto_renewal', String(params.auto_renewal))
  if (params.remind_expire !== undefined) body.set('remind_expire', String(params.remind_expire))
  if (params.remind_traffic !== undefined) body.set('remind_traffic', String(params.remind_traffic))

  return request<boolean>('/api/v1/user/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })
}

export async function resetSecurity(): Promise<string> {
  return request<string>('/api/v1/user/resetSecurity', { method: 'POST' })
}

export async function redeemGiftcard(giftcard: string): Promise<{ type: number, value: number }> {
  const body = new URLSearchParams()
  body.set('giftcard', giftcard)
  return request<{ type: number, value: number }>('/api/v1/user/redeemGiftcard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })
}

export async function getTrafficLog(): Promise<TrafficLog[]> {
  return request<TrafficLog[]>('/api/v1/user/trafficLog')
}



