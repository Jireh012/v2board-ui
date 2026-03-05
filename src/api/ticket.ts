import { request } from './http'

export interface Ticket {
    id: number
    subject: string
    level: number
    status: number
    reply_status: number
    created_at: number
    updated_at: number
    message?: TicketMessage[]
}

export interface TicketMessage {
    id: number
    user_id: number
    ticket_id: number
    message: string
    is_me: boolean
    created_at: number
    updated_at: number
}

export async function fetchTickets(): Promise<Ticket[]> {
    return request<Ticket[]>('/api/v1/user/ticket/fetch')
}

export async function fetchTicketDetail(id: number): Promise<Ticket> {
    return request<Ticket>(`/api/v1/user/ticket/fetch?id=${id}`)
}

export async function saveTicket(params: {
    subject: string
    level: number
    message: string
}): Promise<boolean> {
    const body = new URLSearchParams()
    body.set('subject', params.subject)
    body.set('level', String(params.level))
    body.set('message', params.message)
    return request<boolean>('/api/v1/user/ticket/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
    })
}

export async function replyTicket(id: number, message: string): Promise<boolean> {
    const body = new URLSearchParams()
    body.set('id', String(id))
    body.set('message', message)
    return request<boolean>('/api/v1/user/ticket/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
    })
}

export async function closeTicket(id: number): Promise<boolean> {
    const body = new URLSearchParams()
    body.set('id', String(id))
    return request<boolean>('/api/v1/user/ticket/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
    })
}

export async function withdrawTicket(withdraw_method: string, withdraw_account: string): Promise<boolean> {
    const body = new URLSearchParams()
    body.set('withdraw_method', withdraw_method)
    body.set('withdraw_account', withdraw_account)
    return request<boolean>('/api/v1/user/ticket/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
    })
}
