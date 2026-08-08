import { computed, ref } from 'vue'
import { fetchPublicSiteConfig } from './api/site'

const STORAGE_KEY = 'v2board_app_name'
const ADMIN_PATH_KEY = 'v2board_admin_path'
const FALLBACK_NAME = 'V2Board'
const DEFAULT_ADMIN_PATH = 'admin'

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
      const path = normalizeAdminPath(data.secure_path)
      adminBasePath.value = path
      writeCachedAdminPath(path)
      writeCachedName(name)
      applyDocumentTitle(name)
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
