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

