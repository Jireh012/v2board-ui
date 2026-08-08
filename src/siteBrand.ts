import { computed, ref } from 'vue'
import { fetchPublicSiteConfig, type PublicSiteConfig } from './api/site'

const STORAGE_KEY = 'v2board_app_name'
const ADMIN_PATH_KEY = 'v2board_admin_path'
const FALLBACK_NAME = 'V2Board'
const DEFAULT_ADMIN_PATH = 'admin'

const THEME_COLOR_MAP: Record<string, { primary: string; hover: string; soft: string }> = {
  default: { primary: '#2563eb', hover: '#1d4ed8', soft: '#eff6ff' },
  darkblue: { primary: '#1e3a8a', hover: '#172554', soft: '#dbeafe' },
  black: { primary: '#0f172a', hover: '#020617', soft: '#e2e8f0' },
  green: { primary: '#059669', hover: '#047857', soft: '#ecfdf5' }
}

function cssUrl(raw: string): string {
  const escaped = raw.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return `url("${escaped}")`
}

/** Apply public frontend theme to documentElement (user shell + login; admin resets via CSS). */
export function applyFrontendTheme(data: Pick<
  PublicSiteConfig,
  | 'frontend_theme_sidebar'
  | 'frontend_theme_header'
  | 'frontend_theme_color'
  | 'frontend_background_url'
>) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const sidebar = (data.frontend_theme_sidebar || 'light').trim() || 'light'
  const header = (data.frontend_theme_header || 'dark').trim() || 'dark'
  const colorKey = (data.frontend_theme_color || 'default').trim() || 'default'
  const bg = (data.frontend_background_url || '').trim()

  root.dataset.themeSidebar = sidebar === 'dark' ? 'dark' : 'light'
  root.dataset.themeHeader = header === 'dark' ? 'dark' : 'light'
  root.dataset.themeColor = THEME_COLOR_MAP[colorKey] ? colorKey : 'default'

  const colors = THEME_COLOR_MAP[root.dataset.themeColor] || THEME_COLOR_MAP.default
  root.style.setProperty('--primary-color', colors.primary)
  root.style.setProperty('--primary-hover', colors.hover)
  root.style.setProperty('--primary-color-soft', colors.soft)

  if (bg) {
    root.style.setProperty('--app-bg-image', cssUrl(bg))
    root.dataset.appBg = '1'
  } else {
    root.style.removeProperty('--app-bg-image')
    delete root.dataset.appBg
  }
}

function readCachedName(): string {
  try {
    const cached = localStorage.getItem(STORAGE_KEY)
    if (cached && cached.trim()) {
      return cached.trim()
    }
  } catch {
    // ignore storage errors
  }
  return FALLBACK_NAME
}

function writeCachedName(name: string) {
  try {
    localStorage.setItem(STORAGE_KEY, name)
  } catch {
    // ignore storage errors
  }
}

function readCachedAdminPath(): string {
  try {
    const cached = localStorage.getItem(ADMIN_PATH_KEY)
    if (cached && /^[A-Za-z0-9]{5,}$/.test(cached)) {
      return cached
    }
  } catch {
    // ignore
  }
  return DEFAULT_ADMIN_PATH
}

function writeCachedAdminPath(path: string) {
  try {
    localStorage.setItem(ADMIN_PATH_KEY, path)
  } catch {
    // ignore
  }
}

function normalizeAdminPath(raw: unknown): string {
  const s = typeof raw === 'string' ? raw.trim() : ''
  if (!s) return DEFAULT_ADMIN_PATH
  // Backend returns `admin` or ≥8 alphanumeric; accept alphanumeric segment.
  if (/^[A-Za-z0-9]+$/.test(s)) return s
  return DEFAULT_ADMIN_PATH
}

function applyDocumentTitle(name: string) {
  if (typeof document !== 'undefined') {
    document.title = name
  }
}

function asFlag(v: unknown): boolean {
  return v === 1 || v === true || v === '1'
}

/** 响应式站点名；同步预填缓存，避免首屏闪旧硬编码名 */
export const appName = ref(readCachedName())
export const stopRegister = ref(false)
export const inviteForce = ref(false)
export const emailVerify = ref(false)
export const safeMode = ref(false)
export const recaptchaEnable = ref(false)
export const recaptchaSiteKey = ref('')
/** Telegram 群组讨论链接（公开配置；可为空）。 */
export const telegramDiscussLink = ref('')
/** Admin UI path segment (no leading slash), default `admin`. */
export const adminBasePath = ref(readCachedAdminPath())
/** 注册入口是否展示（未停止注册） */
export const registerEnabled = computed(() => !stopRegister.value)
/** Show reCAPTCHA when enabled and site key present */
export const recaptchaRequired = computed(
  () => recaptchaEnable.value && !!recaptchaSiteKey.value.trim()
)

/** Build admin UI URL, e.g. adminUrl('/orders') → `/admin888/orders`. */
export function adminUrl(sub = ''): string {
  const base = '/' + adminBasePath.value
  if (!sub || sub === '/') return base
  return base + (sub.startsWith('/') ? sub : '/' + sub)
}

export function isAdminUiPath(path: string): boolean {
  const base = '/' + adminBasePath.value
  return path === base || path.startsWith(base + '/')
}

applyDocumentTitle(appName.value)

let loadPromise: Promise<string> | null = null

export async function loadSiteBrand(): Promise<string> {
  if (loadPromise) {
    return loadPromise
  }
  loadPromise = (async () => {
    try {
      const data = await fetchPublicSiteConfig()
      const name = (data.app_name || '').trim() || FALLBACK_NAME
      appName.value = name
      stopRegister.value = asFlag(data.stop_register)
      inviteForce.value = asFlag(data.invite_force)
      emailVerify.value = asFlag(data.email_verify)
      safeMode.value = asFlag(data.safe_mode_enable)
      recaptchaEnable.value = asFlag(data.recaptcha_enable)
      recaptchaSiteKey.value = (data.recaptcha_site_key || '').trim()
      telegramDiscussLink.value = (data.telegram_discuss_link || '').trim()
      const path = normalizeAdminPath(data.secure_path)
      adminBasePath.value = path
      writeCachedAdminPath(path)
      writeCachedName(name)
      applyDocumentTitle(name)
      applyFrontendTheme(data)
      return name
    } catch {
      const fallback = readCachedName()
      appName.value = fallback
      adminBasePath.value = readCachedAdminPath()
      applyDocumentTitle(fallback)
      return fallback
    } finally {
      loadPromise = null
    }
  })()
  return loadPromise
}
