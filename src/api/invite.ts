import { request } from './http'
import { apiUrl } from './paths'

export interface InviteCode {
    id: number
    user_id: number
    code: string
    status: number
    pv: number
    created_at: number
    updated_at: number
}

export interface InviteFetchResponse {
    codes: InviteCode[]
    stat: number[]
}

export interface CommissionLog {
    id: number
    trade_no: string
    order_amount: number
    get_amount: number
    created_at: number
}

export interface InviteDetailsResponse {
    data: CommissionLog[]
    total: number
}

export async function fetchInvite(): Promise<InviteFetchResponse> {
    return request<InviteFetchResponse>(apiUrl('user', '/invite/fetch'))
}

export async function saveInvite(): Promise<boolean> {
    return request<boolean>(apiUrl('user', '/invite/save'), { method: 'POST' })
}

export async function dropInvite(id: number): Promise<boolean> {
    const q = new URLSearchParams({ id: String(id) })
    return request<boolean>(`${apiUrl('user', '/invite/drop')}?${q}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
    })
}

export async function fetchInviteDetails(
    current: number = 1,
    pageSize: number = 10
): Promise<InviteDetailsResponse> {
    return request<InviteDetailsResponse>(
        `${apiUrl('user', '/invite/details')}?current=${current}&page_size=${pageSize}`
    )
}

export async function transferCommission(transfer_amount: number): Promise<boolean> {
    const params = new URLSearchParams({ transfer_amount: String(transfer_amount) })
    return request<boolean>(`${apiUrl('user', '/transferCommission')}?${params}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
    })
}
