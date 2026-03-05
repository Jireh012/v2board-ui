import { request } from './http'

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
    return request<InviteFetchResponse>('/api/v1/user/invite/fetch')
}

export async function saveInvite(): Promise<boolean> {
    return request<boolean>('/api/v1/user/invite/save', { method: 'POST' })
}

export async function fetchInviteDetails(
    current: number = 1,
    pageSize: number = 10
): Promise<InviteDetailsResponse> {
    return request<InviteDetailsResponse>(
        `/api/v1/user/invite/details?current=${current}&page_size=${pageSize}`
    )
}

export async function transferCommission(transfer_amount: number): Promise<boolean> {
    const body = new URLSearchParams()
    body.set('transfer_amount', String(transfer_amount))
    return request<boolean>('/api/v1/user/transferCommission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
    })
}
