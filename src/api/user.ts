import { request } from './http'
import { apiUrl } from './paths'
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
  /** 用户端「即将到期」徽章提前天数 */
  show_subscribe_expire?: number
  /** 工单开单策略：0 全开；1 仅有付费订单；2 关闭 */
  ticket_status?: number
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
  return request<UserInfo>(apiUrl('user', '/info'))
}

export async function getSubscribe(): Promise<SubscribeInfo> {
  return request<SubscribeInfo>(apiUrl('user', '/getSubscribe'))
}

export async function getUserStat(): Promise<number[]> {
  return request<number[]>(apiUrl('user', '/getStat'))
}

export async function changePassword(old_password: string, new_password: string): Promise<boolean> {
  const params = new URLSearchParams({ old_password, new_password })
  return request<boolean>(`${apiUrl('user', '/changePassword')}?${params}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}'
  })
}

export async function updateUserInfo(params: {
  auto_renewal?: number
  remind_expire?: number
  remind_traffic?: number
}): Promise<boolean> {
  const qs = new URLSearchParams()
  if (params.auto_renewal !== undefined) qs.set('auto_renewal', String(params.auto_renewal))
  if (params.remind_expire !== undefined) qs.set('remind_expire', String(params.remind_expire))
  if (params.remind_traffic !== undefined) qs.set('remind_traffic', String(params.remind_traffic))

  return request<boolean>(`${apiUrl('user', '/update')}?${qs}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}'
  })
}

export async function resetSecurity(): Promise<string> {
  return request<string>(apiUrl('user', '/resetSecurity'), { method: 'POST' })
}

export async function unbindTelegram(): Promise<boolean> {
  return request<boolean>(apiUrl('user', '/unbindTelegram'), { method: 'POST' })
}

export async function redeemGiftcard(giftcard: string): Promise<{ type: number, value: number }> {
  const params = new URLSearchParams({ giftcard })
  return request<{ type: number, value: number }>(`${apiUrl('user', '/redeemGiftcard')}?${params}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}'
  })
}

export async function getTrafficLog(): Promise<TrafficLog[]> {
  return request<TrafficLog[]>(apiUrl('user', '/trafficLog'))
}



