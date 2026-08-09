import { request } from '../http'
import { apiUrl } from '../paths'

export interface ServerRoute {
  id: number
  remarks: string
  match: string[]
  action: string
  action_value: string | null
  created_at: number
  updated_at: number
}

/** 对齐原版面板动作选项（value 为 API 枚举，label 为展示文案） */
export const ROUTE_ACTION_OPTIONS = [
  {
    value: 'block',
    label: '禁止访问(域名目标)',
    needsMatch: true,
    needsActionValue: false,
    matchHint: '域名匹配，每行一条',
    valueLabel: '',
    valuePlaceholder: ''
  },
  {
    value: 'block_ip',
    label: '禁止访问(IP目标)',
    needsMatch: true,
    needsActionValue: false,
    matchHint: 'IP / CIDR，每行一条',
    valueLabel: '',
    valuePlaceholder: ''
  },
  {
    value: 'block_port',
    label: '禁止访问(端口目标)',
    needsMatch: true,
    needsActionValue: false,
    matchHint: '端口号，每行一条',
    valueLabel: '',
    valuePlaceholder: ''
  },
  {
    value: 'protocol',
    label: '禁止访问(协议)',
    needsMatch: true,
    needsActionValue: false,
    matchHint: '协议名，如 bittorrent',
    valueLabel: '',
    valuePlaceholder: ''
  },
  {
    value: 'dns',
    label: '指定DNS服务器进行解析',
    needsMatch: true,
    needsActionValue: true,
    matchHint: '域名匹配，每行一条',
    valueLabel: 'DNS 服务器',
    valuePlaceholder: '例如：8.8.8.8 或 https://dns.google/dns-query'
  },
  {
    value: 'route',
    label: '指定出站服务器(域名目标)',
    needsMatch: true,
    needsActionValue: true,
    matchHint: '域名匹配，每行一条',
    valueLabel: '出站配置',
    valuePlaceholder: '填写完整 Xray outbound JSON，tag 需唯一'
  },
  {
    value: 'route_ip',
    label: '指定出站服务器(IP目标)',
    needsMatch: true,
    needsActionValue: true,
    matchHint: 'IP / CIDR，每行一条',
    valueLabel: '出站配置',
    valuePlaceholder: '填写完整 Xray outbound JSON，tag 需唯一'
  },
  {
    value: 'default_out',
    label: '自定义默认出站',
    needsMatch: false,
    needsActionValue: true,
    matchHint: '',
    valueLabel: '出站配置',
    valuePlaceholder: '填写完整 Xray outbound JSON，作为默认出口'
  }
] as const

export type RouteAction = (typeof ROUTE_ACTION_OPTIONS)[number]['value']

export const ROUTE_ACTIONS = ROUTE_ACTION_OPTIONS.map((o) => o.value)

export function routeActionLabel(action: string): string {
  return ROUTE_ACTION_OPTIONS.find((o) => o.value === action)?.label || action
}

export function routeActionOption(action: string) {
  return ROUTE_ACTION_OPTIONS.find((o) => o.value === action)
}

export function fetchRoutes(): Promise<ServerRoute[]> {
  return request<ServerRoute[]>(apiUrl('admin', '/server/route/fetch'))
}

export function saveRoute(body: {
  id?: number
  remarks: string
  match?: string[]
  action: string
  action_value?: string | null
}): Promise<boolean> {
  return request<boolean>(apiUrl('admin', '/server/route/save'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
}

export function dropRoute(id: number): Promise<boolean> {
  return request<boolean>(`${apiUrl('admin', '/server/route/drop')}?id=${id}`, {
    method: 'POST'
  })
}
