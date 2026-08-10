import { request } from '../http'
import { apiUrl } from '../paths'

export type SubscribeRuleFormat =
  | 'clash'
  | 'stash'
  | 'surge'
  | 'surfboard'
  | 'singbox'
  | 'quantumultx'
  | 'loon'

export interface SubscribeRuleTemplate {
  format: SubscribeRuleFormat | string
  content: string
  source_url?: string | null
  update_source?: string | null
  updated_at?: number | null
  created_at?: number | null
  is_default?: boolean
  fallback_format?: string | null
  warning?: string | null
}

export function fetchSubscribeRule(format: string): Promise<SubscribeRuleTemplate> {
  return request<SubscribeRuleTemplate>(
    `${apiUrl('admin', '/subscribe-rule/fetch')}?format=${encodeURIComponent(format)}`
  )
}

export function saveSubscribeRule(body: {
  format: string
  content: string
  source_url?: string | null
}): Promise<SubscribeRuleTemplate> {
  return request<SubscribeRuleTemplate>(apiUrl('admin', '/subscribe-rule/save'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
}

export function syncSubscribeRule(body: {
  format: string
  url?: string | null
  source_url?: string | null
}): Promise<SubscribeRuleTemplate> {
  return request<SubscribeRuleTemplate>(apiUrl('admin', '/subscribe-rule/sync'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
}

export function restoreSubscribeRule(format: string): Promise<SubscribeRuleTemplate> {
  return request<SubscribeRuleTemplate>(apiUrl('admin', '/subscribe-rule/restore'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ format })
  })
}
