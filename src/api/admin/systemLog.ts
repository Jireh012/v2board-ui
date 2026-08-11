import { request } from '../http'
import { apiUrl } from '../paths'

export interface SystemLogRow {
  id: number
  title: string
  level?: string | null
  host?: string | null
  uri: string
  method: string
  data?: string | null
  ip?: string | null
  context?: string | null
  created_at: number
  updated_at?: number
}

export function fetchSystemLogs(current = 1, pageSize = 20, level?: string) {
  const q = new URLSearchParams({
    current: String(current),
    pageSize: String(pageSize)
  })
  if (level) q.set('level', level)
  return request<{ list: SystemLogRow[]; total: number; current: number; pageSize: number }>(
    `${apiUrl('admin', 'system/getSystemLog')}?${q}`
  )
}
