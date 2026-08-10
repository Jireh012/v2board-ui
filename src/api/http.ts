import { clearSession } from '../auth'
import { adminUrl, isAdminUiPath } from '../siteBrand'
import { encryptToCompact, encryptToEnvelope, decryptFromEnvelope, isSm4Envelope } from './sm4'
import { isPanelEncryptedUrl } from './paths'

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

interface RequestOptions {
  auth?: boolean
  /** Skip panel SM4 (plaintext guest callbacks). Default: auto by URL. */
  panelSm4?: boolean
}

export async function request<T>(
  url: string,
  init: RequestInit = {},
  options: RequestOptions = {}
): Promise<T> {
  const headers = new Headers(init.headers || {})
  const usePanelSm4 = options.panelSm4 ?? isPanelEncryptedUrl(url)

  if (options.auth !== false) {
    const authData = localStorage.getItem('auth_data')
    if (authData) {
      if (usePanelSm4) {
        if (!headers.has('X-A')) {
          headers.set('X-A', encryptToCompact(authData))
        }
        headers.delete('Authorization')
      } else if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${authData}`)
      }
    }
  }

  let body = init.body
  if (usePanelSm4 && body != null && typeof body === 'string') {
    const ct = (headers.get('Content-Type') || '').toLowerCase()
    if (ct.includes('application/json') || ct === '') {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json')
      }
      const envelope = encryptToEnvelope(body)
      body = JSON.stringify(envelope)
    } else if (ct.includes('application/x-www-form-urlencoded')) {
      throw new Error('加密区请使用 JSON 请求体')
    }
  }

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }

  const resp = await fetch(url, { ...init, headers, body })

  if (resp.status === 401) {
    clearSession()

    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname
      const target = isAdminUiPath(currentPath) ? adminUrl('/login') : '/login'
      if (currentPath !== target) {
        window.location.href = target
      }
    }

    throw new Error('未登录或登录已过期')
  }

  const raw = await resp.json()
  let json: ApiResponse<T>

  if (usePanelSm4) {
    if (!isSm4Envelope(raw)) {
      // Fail-closed errors (missing SM4 key) may be plaintext
      if (raw && typeof raw === 'object' && 'code' in raw && 'message' in raw) {
        const plaintextErr = raw as ApiResponse<unknown>
        console.error('[panel-sm4] plaintext error', plaintextErr)
        throw new Error(String(plaintextErr.message || '请求失败'))
      }
      throw new Error('响应不是 SM4 信封')
    }
    const plain = decryptFromEnvelope(raw)
    try {
      json = JSON.parse(plain) as ApiResponse<T>
    } catch (e) {
      console.error('[panel-sm4] decrypted body is not JSON', plain, e)
      throw new Error('解密响应解析失败')
    }
  } else {
    json = raw as ApiResponse<T>
  }

  if (json.code !== 0) {
    // Decrypted (or plaintext) business error — keep in DevTools for debugging alerts
    console.error(usePanelSm4 ? '[panel-sm4] api error' : '[api] error', json)
    throw new Error(json.message || '请求失败')
  }
  return json.data
}
