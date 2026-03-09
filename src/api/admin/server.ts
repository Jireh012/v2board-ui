import { request } from '../http'

export interface ServerNode {
  id: number
  type: string
  name: string
  host: string
  port: number | string
  rate: string
  show: number
  sort: number
  tags?: string[]
  group_id?: number[]
  route_id?: number[]
  parent_id?: number | null
  created_at: number
  updated_at: number
  // type-specific fields are dynamic
  [key: string]: unknown
}

export type ServerType = 'vmess' | 'vless' | 'trojan' | 'shadowsocks' | 'hysteria' | 'tuic' | 'anytls' | 'v2node'

export function fetchNodes(): Promise<ServerNode[]> {
  return request<ServerNode[]>('/api/v1/admin/server/manage/getNodes')
}

export function sortNodes(body: Record<string, Record<string, number>>): Promise<boolean> {
  return request<boolean>('/api/v1/admin/server/manage/sort', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
}

export function saveNode(type: ServerType, body: Record<string, unknown>): Promise<boolean> {
  return request<boolean>(`/api/v1/admin/server/${type}/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
}

export function dropNode(type: ServerType, id: number): Promise<boolean> {
  return request<boolean>(`/api/v1/admin/server/${type}/drop?id=${id}`, {
    method: 'POST'
  })
}

export function updateNode(type: ServerType, body: { id: number; show?: number }): Promise<boolean> {
  return request<boolean>(`/api/v1/admin/server/${type}/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
}

export function copyNode(type: ServerType, id: number): Promise<boolean> {
  return request<boolean>(`/api/v1/admin/server/${type}/copy?id=${id}`, {
    method: 'POST'
  })
}
