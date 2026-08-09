import { request } from './http'
import { apiUrl } from './paths'

export interface LoginResult {
  token: string
  is_admin: boolean
  auth_data: string
}

export async function login(
  email: string,
  password: string,
  recaptchaData?: string
): Promise<LoginResult> {
  const body: Record<string, string> = {
    email: email.trim(),
    password
  }
  const token = (recaptchaData || '').trim()
  if (token) {
    body.recaptcha_data = token
  }
  return request<LoginResult>(
    apiUrl('passport', '/auth/login'),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    },
    { auth: false }
  )
}

export async function register(payload: {
  email: string
  password: string
  invite_code?: string
  email_code?: string
  recaptcha_data?: string
}): Promise<LoginResult> {
  const body: Record<string, string> = {
    email: payload.email.trim(),
    password: payload.password
  }
  const code = (payload.invite_code || '').trim()
  if (code) {
    body.invite_code = code
  }
  const emailCode = (payload.email_code || '').trim()
  if (emailCode) {
    body.email_code = emailCode
  }
  const captcha = (payload.recaptcha_data || '').trim()
  if (captcha) {
    body.recaptcha_data = captcha
  }
  return request<LoginResult>(
    apiUrl('passport', '/auth/register'),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    },
    { auth: false }
  )
}

/** isforget: 0 = register, 1 = reset password */
export async function sendEmailVerify(email: string, isforget: 0 | 1): Promise<boolean> {
  return request<boolean>(
    apiUrl('passport', '/comm/sendEmailVerify'),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), isforget })
    },
    { auth: false }
  )
}

export async function forgetPassword(payload: {
  email: string
  email_code: string
  password: string
}): Promise<boolean> {
  return request<boolean>(
    apiUrl('passport', '/auth/forget'),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: payload.email.trim(),
        email_code: payload.email_code.trim(),
        password: payload.password
      })
    },
    { auth: false }
  )
}
