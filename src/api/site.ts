import { request } from './http'
import { getPublicConfigPath, setApiBases } from './paths'
import { decryptFromEnvelope, isSm4Envelope, type Sm4Envelope } from './sm4'

export interface PublicSiteConfig {
  app_name: string
  stop_register?: number
  invite_force?: number
  email_verify?: number
  safe_mode_enable?: number
  /** Admin UI path segment; empty/missing → client default `admin` */
  secure_path?: string
  recaptcha_enable?: number
  recaptcha_site_key?: string
  /** User shell sidebar: light | dark */
  frontend_theme_sidebar?: string
  /** User shell header: light | dark */
  frontend_theme_header?: string
  /** Theme color key: default | darkblue | black | green */
  frontend_theme_color?: string
  /** Optional background image URL (empty ok) */
  frontend_background_url?: string
  /** Telegram discuss / group invite link (empty ok) */
  telegram_discuss_link?: string
  passport_api_prefix?: string
  user_api_prefix?: string
  admin_api_prefix?: string
}

/**
 * Bootstrap: GET fixed `/api/config` → outer SM4 envelope of whole ApiResponse;
 * data includes brand flags + passport/user/admin prefixes.
 */
export async function fetchPublicSiteConfig(): Promise<PublicSiteConfig> {
  const path = getPublicConfigPath()
  // Raw fetch: response body is envelope of entire ApiResponse (not only data).
  const resp = await fetch(path, { headers: { Accept: 'application/json' } })
  if (!resp.ok) {
    throw new Error(`公开配置请求失败 (${resp.status})`)
  }
  const raw = await resp.json()
  if (!isSm4Envelope(raw)) {
    throw new Error('公开配置响应不是 SM4 信封')
  }
  const plain = decryptFromEnvelope(raw as Sm4Envelope)
  const json = JSON.parse(plain) as { code: number; message: string; data: PublicSiteConfig }
  if (json.code !== 0) {
    throw new Error(json.message || '获取公开配置失败')
  }
  const data = json.data
  if (!data?.app_name) {
    throw new Error('公开配置缺少 app_name')
  }
  setApiBases(
    data.passport_api_prefix || '',
    data.user_api_prefix || '',
    path,
    data.admin_api_prefix || ''
  )
  return data
}

/** Optional helper using request() after bases known (not used for bootstrap). */
export async function fetchPublicSiteConfigViaRequest(): Promise<PublicSiteConfig> {
  return request<PublicSiteConfig>(getPublicConfigPath(), {}, { auth: false, panelSm4: true })
}
