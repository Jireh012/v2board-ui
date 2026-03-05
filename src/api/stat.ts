import { request } from './http'

export interface TrafficLog {
    id: number
    user_id: number
    u: number
    d: number
    server_rate: number
    record_at: number
}

export async function getTrafficLog(): Promise<TrafficLog[]> {
    return request<TrafficLog[]>('/api/v1/user/trafficLog')
}
