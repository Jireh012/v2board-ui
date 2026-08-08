import { request } from './http'

export interface LoginResult {
  token: string
  is_admin: boolean
  auth_data: string
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const body = new URLSearchParams()
  body.set('email', email)
  body.set('password', password)
  const data = await request<LoginResult>('/api/v1/passport/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  }, { auth: false })
  return data
}

export async function register(payload: {
  email: string
  password: string
  invite_code?: string
}): Promise<LoginResult> {
  const body: Record<string, string> = {
    email: payload.email.trim(),
    password: payload.password
  }
  const code = (payload.invite_code || '').trim()
  if (code) {
    body.invite_code = code
  }
  return request<LoginResult>(
    '/api/v1/passport/auth/register',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    },
    { auth: false }
  )
}

