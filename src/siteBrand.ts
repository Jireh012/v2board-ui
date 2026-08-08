import { ref } from 'vue'
import { fetchPublicSiteConfig } from './api/site'

const STORAGE_KEY = 'v2board_app_name'
const FALLBACK_NAME = 'V2Board'

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

function applyDocumentTitle(name: string) {
  if (typeof document !== 'undefined') {
    document.title = name
  }
}

/** 响应式站点名；同步预填缓存，避免首屏闪旧硬编码名 */
export const appName = ref(readCachedName())
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
      writeCachedName(name)
      applyDocumentTitle(name)
      return name
    } catch {
      const fallback = readCachedName()
      appName.value = fallback
      applyDocumentTitle(fallback)
      return fallback
    } finally {
      loadPromise = null
    }
  })()
  return loadPromise
}
