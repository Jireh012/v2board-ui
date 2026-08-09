import { request } from './http'
import { apiUrl } from './paths'

export interface Notice {
  id: number
  title: string
  content: string
  img_url?: string | null
  tags?: string | null
  created_at: number
  updated_at: number
}

export interface NoticeListResult {
  data: Notice[]
  total: number
}

export async function fetchNotices(
  current = 1,
  pageSize = 5
): Promise<NoticeListResult> {
  return request<NoticeListResult>(
    `${apiUrl('user', '/notice/fetch')}?current=${current}&pageSize=${pageSize}`
  )
}

export async function getNoticeDetail(id: number): Promise<Notice> {
  return request<Notice>(`${apiUrl('user', '/notice/fetch')}?id=${id}`)
}


