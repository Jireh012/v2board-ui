import { request } from '../http'
import { apiUrl } from '../paths'

export interface QueueStats {
  status?: boolean
  failedJobs?: number
  jobsPerMinute?: number
  recentJobs?: number
  processes?: number
}

export interface QueueWorkloadRow {
  name: string
  display_name: string
  jobs: number
  waiting?: number
  reserved?: number
  processes: number
  active?: number
  occupied?: boolean
}

export interface FailedJob {
  id: number
  uuid: string
  queue: string
  job_type: string
  payload: string
  exception?: string
  failed_at: number
}

export function fetchQueueStats() {
  return request<QueueStats>(apiUrl('admin', 'system/getQueueStats'))
}

export function fetchQueueWorkload() {
  return request<QueueWorkloadRow[]>(apiUrl('admin', 'system/getQueueWorkload'))
}

export function fetchSystemStatus() {
  return request<{ schedule?: boolean; queue_workers?: boolean; horizon?: boolean; uptime?: number }>(
    apiUrl('admin', 'system/getSystemStatus')
  )
}

export function fetchFailedJobs(current = 1, pageSize = 20) {
  const q = new URLSearchParams({ current: String(current), pageSize: String(pageSize) })
  return request<{ list: FailedJob[]; total: number; current: number; pageSize: number }>(
    `${apiUrl('admin', 'system/getFailedJobs')}?${q}`
  )
}

export function retryFailedJob(id: number) {
  return request<boolean>(apiUrl('admin', 'system/retryFailedJob'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  })
}

export function deleteFailedJob(id: number) {
  return request<boolean>(apiUrl('admin', 'system/deleteFailedJob'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  })
}

export function clearFailedJobs() {
  return request<boolean>(apiUrl('admin', 'system/clearFailedJobs'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}'
  })
}
