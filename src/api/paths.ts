import { sha256Hex } from './sha256'

function normalizePrefix(raw: string): string {
  let t = (raw || '').trim()
  if (!t) return ''
  if (!t.startsWith('/')) t = '/' + t
  while (t.length > 1 && t.endsWith('/')) t = t.slice(0, -1)
  return t
}

/** Fixed bootstrap path; must match backend ConfigService.FIXED_PUBLIC_CONFIG_PATH */
export const PUBLIC_CONFIG_PATH = '/config'

let passportBase = ''
let userBase = ''
let adminBase = ''

export function setApiBases(
  passport: string,
  user: string,
  _publicPath?: string,
  admin?: string
) {
  passportBase = normalizePrefix(passport)
  userBase = normalizePrefix(user)
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
  return PUBLIC_CONFIG_PATH
}

export function normalizeClassicRel(path: string): string {
  let t = (path || '').trim()
  while (t.startsWith('/')) t = t.slice(1)
  while (t.length > 1 && t.endsWith('/')) t = t.slice(0, -1)
  return t
}

/**
 * Opaque action alias — must match backend PanelApiActionAliases.deriveAlias.
 * SHA-256(UTF-8(SM4_KEY) || 0x00 || zone || 0x00 || classicRel) hex[0:12]
 */
export function deriveActionAlias(zone: 'passport' | 'user' | 'admin', classicRel: string): string {
  const key = import.meta.env.VITE_SM4_KEY || ''
  if (!key) {
    throw new Error('VITE_SM4_KEY is empty')
  }
  const rel = normalizeClassicRel(classicRel)
  const enc = new TextEncoder()
  const keyB = enc.encode(key)
  const zoneB = enc.encode(zone)
  const relB = enc.encode(rel)
  const all = new Uint8Array(keyB.length + 1 + zoneB.length + 1 + relB.length)
  all.set(keyB, 0)
  all[keyB.length] = 0
  all.set(zoneB, keyB.length + 1)
  all[keyB.length + 1 + zoneB.length] = 0
  all.set(relB, keyB.length + 1 + zoneB.length + 1)
  return sha256Hex(all).slice(0, 12)
}

/**
 * Build panel API URL. Source uses classicRel (e.g. '/getSubscribe'); wire is `{prefix}/{alias}`.
 */
export function apiUrl(zone: 'passport' | 'user' | 'admin', path: string): string {
  const base = zone === 'passport' ? passportBase : zone === 'user' ? userBase : adminBase
  if (!base) {
    throw new Error(`${zone} API 前缀尚未加载，请先拉取公开配置`)
  }
  const alias = deriveActionAlias(zone, path)
  return `${base}/${alias}`
}

export function isPanelEncryptedUrl(url: string): boolean {
  if (!url) return false
  if (url === PUBLIC_CONFIG_PATH || url.startsWith(PUBLIC_CONFIG_PATH + '?')) {
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
