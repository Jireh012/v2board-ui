import { request } from './http'

export interface Plan {
  id: number
  name: string
  transfer_enable: number
  month_price?: number
  quarter_price?: number
  half_year_price?: number
  year_price?: number
  two_year_price?: number
  three_year_price?: number
  onetime_price?: number
  reset_price?: number
}

export async function fetchPlans(): Promise<Plan[]> {
  return request<Plan[]>('/api/v1/user/plan/fetch')
}

