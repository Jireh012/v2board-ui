import { request } from './http'

/** 与后端 Plan 实体一致，JSON 为 camelCase */
export interface Plan {
  id: number
  name: string
  transferEnable: number
  monthPrice?: number
  quarterPrice?: number
  halfYearPrice?: number
  yearPrice?: number
  twoYearPrice?: number
  threeYearPrice?: number
  onetimePrice?: number
  resetPrice?: number
}

export interface FetchPlansParams {
  /** period=按周期(价格) traffic=按流量 不传=默认排序 */
  order_by?: 'period' | 'traffic'
  order?: 'asc' | 'desc'
}

export async function fetchPlans(params?: FetchPlansParams): Promise<Plan[]> {
  const search = new URLSearchParams()
  if (params?.order_by) search.set('order_by', params.order_by)
  if (params?.order) search.set('order', params.order)
  const qs = search.toString()
  const url = qs ? `/api/v1/user/plan/fetch?${qs}` : '/api/v1/user/plan/fetch'
  return request<Plan[]>(url)
}

export async function fetchPlanById(id: number): Promise<Plan> {
  return request<Plan>(`/api/v1/user/plan/fetch?id=${id}`)
}

