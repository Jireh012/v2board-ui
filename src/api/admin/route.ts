import { request } from '../http'

export interface ServerRoute {
  id: number
  remarks: string
  match: string[]
  action: string
  action_value: string | null
  created_at: number
  updated_at: number
}

export const ROUTE_ACTIONS = [
  'block', 'block_ip', 'block_port', 'protocol', 'dns', 'route', 'route_ip', 'default_out'
] as const

export function fetchRoutes(): Promise<ServerRoute[]> {
  return request<ServerRoute[]>('/api/v1/admin/server/route/fetch')
}

export function saveRoute(body: {
  id?: number
  remarks: string
  match?: string[]
  action: string
  action_value?: string | null
}): Promise<boolean> {
  return request<boolean>('/api/v1/admin/server/route/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
}

export function dropRoute(id: number): Promise<boolean> {
  return request<boolean>(`/api/v1/admin/server/route/drop?id=${id}`, {
    method: 'POST'
  })
}
