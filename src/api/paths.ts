function normalizePrefix(raw: string): string {
  let t = (raw || '').trim()
  if (!t) return ''
  if (!t.startsWith('/')) t = '/' + t
  while (t.length > 1 && t.endsWith('/')) t = t.slice(0, -1)
  return t
}

let passportBase = ''
let userBase = ''
let adminBase = ''
let publicConfigPath = normalizePrefix(import.meta.env.VITE_PUBLIC_CONFIG_PATH || '')

export function setApiBases(
  passport: string,
  user: string,
  publicPath?: string,
  admin?: string
) {
  passportBase = normalizePrefix(passport)
  userBase = normalizePrefix(user)
  if (publicPath !== undefined) {
    publicConfigPath = normalizePrefix(publicPath)
  }
  if (admin !== undefined) {
    adminBase = normalizePrefix(admin)
  }
}

export function getPassportBase(): string {
  return passportBase
}

export function getUserBase(): string {
  return userBase
}

export function getAdminBase(): string {
  return adminBase
}

export function getPublicConfigPath(): string {
  return publicConfigPath
}

/** Build panel API URL: apiUrl('user', '/order/fetch') */
export function apiUrl(zone: 'passport' | 'user' | 'admin', path: string): string {
  const base = zone === 'passport' ? passportBase : zone === 'user' ? userBase : adminBase
  if (!base) {
    throw new Error(`${zone} API 前缀尚未加载，请先拉取公开配置`)
  }
  const p = path.startsWith('/') ? path : '/' + path
  return base + p
}

export function isPanelEncryptedUrl(url: string): boolean {
  if (!url) return false
  if (publicConfigPath && (url === publicConfigPath || url.startsWith(publicConfigPath + '?'))) {
    return true
  }
  if (passportBase && (url === passportBase || url.startsWith(passportBase + '/'))) {
    return true
  }
  if (userBase && (url === userBase || url.startsWith(userBase + '/'))) {
    return true
  }
  if (adminBase && (url === adminBase || url.startsWith(adminBase + '/'))) {
    return true
  }
  return false
}
