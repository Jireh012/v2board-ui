import { request } from '../http'

export interface SiteConfig {
  app_name?: string
  app_description?: string
  app_url?: string
  force_https?: number
  logo?: string
  subscribe_url?: string
  subscribe_path?: string
  tos_url?: string
  stop_register?: number
  try_out_plan_id?: number
  try_out_hour?: number
  currency?: string
  currency_symbol?: string
}

export interface ConfigData {
  site?: SiteConfig
  safe?: Record<string, unknown>
  subscribe?: Record<string, unknown>
  deposit?: Record<string, unknown>
  invite?: Record<string, unknown>
  frontend?: Record<string, unknown>
  server?: Record<string, unknown>
  email?: Record<string, unknown>
  telegram?: Record<string, unknown>
  app?: Record<string, unknown>
  ticket?: Record<string, unknown>
}

/**
 * 获取系统配置。不传 key 返回完整配置；传 key 只返回该分组。
 */
export function fetchConfig(key?: string): Promise<ConfigData> {
  const url = key ? `/api/v1/admin/config/fetch?key=${encodeURIComponent(key)}` : '/api/v1/admin/config/fetch'
  return request<ConfigData>(url)
}

/**
 * 保存系统配置。body 可与 fetch 返回结构一致，只传要更新的分组即可。
 */
export function saveConfig(body: ConfigData): Promise<boolean> {
  return request<boolean>('/api/v1/admin/config/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
}
