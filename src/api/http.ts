export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

interface RequestOptions {
  auth?: boolean
}

export async function request<T>(
  url: string,
  init: RequestInit = {},
  options: RequestOptions = {}
): Promise<T> {
  const headers = new Headers(init.headers || {})
  if (options.auth !== false) {
    const authData = localStorage.getItem('auth_data')
    if (authData && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${authData}`)
    }
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }
  const resp = await fetch(url, { ...init, headers })

  if (resp.status === 401) {
    localStorage.removeItem('auth_data')
    localStorage.removeItem('token')
    localStorage.removeItem('admin_email')

    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname
      const target =
        currentPath.startsWith('/admin') ? '/admin/login' : '/login'
      if (currentPath !== target) {
        window.location.href = target
      }
    }

    throw new Error('未登录或登录已过期')
  }

  const json = (await resp.json()) as ApiResponse<T>
  if (json.code !== 0) {
    throw new Error(json.message || '请求失败')
  }
  return json.data
}

