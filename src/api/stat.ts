import { request } from './http'
import { apiUrl } from './paths'

export interface TrafficLog {
    id: number
    user_id: number
    u: number
    d: number
    server_rate: number
    record_at: number
}

export async function getTrafficLog(): Promise<TrafficLog[]> {
    return request<TrafficLog[]>(apiUrl('user', '/trafficLog'))
}
