import { request } from './http'
import { apiUrl } from './paths'

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
    return request<Ticket[]>(apiUrl('user', '/ticket/fetch'))
}

export async function fetchTicketDetail(id: number): Promise<Ticket> {
    return request<Ticket>(`${apiUrl('user', '/ticket/fetch')}?id=${id}`)
}

export async function saveTicket(params: {
    subject: string
    level: number
    message: string
}): Promise<boolean> {
    const qs = new URLSearchParams({
        subject: params.subject,
        level: String(params.level),
        message: params.message
    })
    return request<boolean>(`${apiUrl('user', '/ticket/save')}?${qs}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
    })
}

export async function replyTicket(id: number, message: string): Promise<boolean> {
    const qs = new URLSearchParams({ id: String(id), message })
    return request<boolean>(`${apiUrl('user', '/ticket/reply')}?${qs}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
    })
}

export async function closeTicket(id: number): Promise<boolean> {
    const qs = new URLSearchParams({ id: String(id) })
    return request<boolean>(`${apiUrl('user', '/ticket/close')}?${qs}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
    })
}

export async function withdrawTicket(withdraw_method: string, withdraw_account: string): Promise<boolean> {
    const qs = new URLSearchParams({ withdraw_method, withdraw_account })
    return request<boolean>(`${apiUrl('user', '/ticket/withdraw')}?${qs}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
    })
}
