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

function isWriteMethod(method: string): boolean {
  const m = method.toUpperCase()
  return m === 'POST' || m === 'PUT' || m === 'PATCH'
}

function isFormBody(body: BodyInit): boolean {
  if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) {
    return true
  }
  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    return true
  }
  return false
}

export async function request<T>(
  url: string,
  init: RequestInit = {},
  options: RequestOptions = {}
): Promise<T> {
  const headers = new Headers(init.headers || {})
  const usePanelSm4 = options.panelSm4 ?? isPanelEncryptedUrl(url)
  const method = (init.method || 'GET').toUpperCase()

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
  if (usePanelSm4 && isWriteMethod(method)) {
    // URLSearchParams/FormData 会绕过下方 string 加密分支，原样发出 form → 后端 400
    if (body != null && isFormBody(body)) {
      throw new Error('加密区请使用 JSON 请求体（参数请放在 query）')
    }
    const ct = (headers.get('Content-Type') || '').toLowerCase()
    if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
      throw new Error('加密区请使用 JSON 请求体（参数请放在 query）')
    }
    // 无 body 的 POST（如 ?id= 切换显隐）统一发加密 "{}"，避免中间层补 form Content-Type
    let plain: string
    if (body == null || body === '') {
      plain = '{}'
    } else if (typeof body === 'string') {
      plain = body
    } else {
      throw new Error('加密区请使用 JSON 请求体')
    }
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(encryptToEnvelope(plain))
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
