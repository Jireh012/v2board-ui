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

export async function getUserInfo(): Promise<UserInfo> {
  return request<UserInfo>('/api/v1/user/info')
}

export async function getSubscribe(): Promise<SubscribeInfo> {
  return request<SubscribeInfo>('/api/v1/user/getSubscribe')
}

export async function getUserStat(): Promise<number[]> {
  return request<number[]>('/api/v1/user/getStat')
}

