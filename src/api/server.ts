import { request } from './http'

export interface ServerNode {
  id: number
  type: string
  name: string
  host?: string
  port?: number | string
  /** 流量倍率，如 1、1.5、2 */
  rate?: string
  is_online: number
  sort?: number
  cache_key?: string
  last_check_at?: number
  [key: string]: unknown
}

export async function fetchServers(): Promise<ServerNode[]> {
  return request<ServerNode[]>('/api/v1/user/server/fetch')
}
