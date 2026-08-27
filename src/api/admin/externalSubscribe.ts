import { request } from '../http'
import { apiUrl } from '../paths'

export interface ExternalNameFilterRule {
  pattern: string
  replacement: string
  regex: boolean
}

export interface ExternalSubscribeSource {
  id: number
  name: string
  url: string
  enable: number
  /** 0 direct; 1 auto pre-proxy via reachable library node */
  pre_proxy_enable?: number
  remark?: string | null
  name_filters?: ExternalNameFilterRule[] | null
  last_sync_at?: number | null
  last_sync_status?: string | null
  last_sync_message?: string | null
  /** Upstream used upload bytes */
  traffic_upload?: number | null
  /** Upstream used download bytes */
  traffic_download?: number | null
  /** Upstream plan total bytes; 0/null = unlimited or unknown */
  traffic_total?: number | null
  /** Upstream plan expire unix seconds */
  traffic_expire?: number | null
  /** 1 = quota used up; nodes excluded from user subscribe */
  traffic_exhausted?: number
  node_count?: number
  reachable_count?: number
  created_at?: number
  updated_at?: number
}

export interface ExternalSubscribeNode {
  id: number
  source_id: number
  name: string
  protocol?: string | null
  share_uri?: string | null
  reachable: number
  last_check_at?: number | null
  sort?: number
}

export function fetchExternalSources(): Promise<ExternalSubscribeSource[]> {
  return request<ExternalSubscribeSource[]>(apiUrl('admin', '/external-subscribe/fetch'))
}

export function saveExternalSource(body: {
  id?: number
  name: string
  url: string
  enable?: number
  pre_proxy_enable?: number
  remark?: string
  name_filters?: ExternalNameFilterRule[]
}): Promise<boolean> {
  return request<boolean>(apiUrl('admin', '/external-subscribe/save'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
}

export function dropExternalSource(id: number): Promise<boolean> {
  return request<boolean>(`${apiUrl('admin', '/external-subscribe/drop')}?id=${id}`, {
    method: 'POST'
  })
}

export function updateExternalSource(body: { id: number; enable?: number }): Promise<boolean> {
  return request<boolean>(apiUrl('admin', '/external-subscribe/update'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
}

export function syncExternalSource(id: number): Promise<boolean> {
  return request<boolean>(`${apiUrl('admin', '/external-subscribe/sync')}?id=${id}`, {
    method: 'POST'
  })
}

export function syncAllExternalSources(): Promise<boolean> {
  return request<boolean>(apiUrl('admin', '/external-subscribe/sync-all'), {
    method: 'POST'
  })
}

export function fetchExternalNodes(sourceId: number): Promise<ExternalSubscribeNode[]> {
  return request<ExternalSubscribeNode[]>(
    `${apiUrl('admin', '/external-subscribe/nodes')}?source_id=${sourceId}`
  )
}
