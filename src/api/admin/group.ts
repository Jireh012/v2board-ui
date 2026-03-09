import { request } from '../http'

export interface ServerGroup {
  id: number
  name: string
  user_count?: number
  server_count?: number
  created_at: number
  updated_at: number
}

export function fetchGroups(): Promise<ServerGroup[]> {
  return request<ServerGroup[]>('/api/v1/admin/server/group/fetch')
}

export function saveGroup(body: { id?: number; name: string }): Promise<boolean> {
  return request<boolean>('/api/v1/admin/server/group/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
}

export function dropGroup(id: number): Promise<boolean> {
  return request<boolean>(`/api/v1/admin/server/group/drop?id=${id}`, {
    method: 'POST'
  })
}
