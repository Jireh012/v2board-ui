import { copyText } from './clipboard'

/**
 * PHP / knowledge HTML often uses onclick="copy('...')".
 * Expose a compatible global with Clipboard API + execCommand fallback.
 */
export function installLegacyCopy(): void {
  ;(window as Window & { copy?: (text?: string) => Promise<boolean> }).copy = async (text?: string) => {
    try {
      await copyText(String(text ?? ''))
      showCopyToast('已复制到剪贴板')
      return true
    } catch {
      showCopyToast('复制失败，请手动复制', true)
      return false
    }
  }
}

function showCopyToast(message: string, error = false) {
  const existing = document.getElementById('v2-legacy-copy-toast')
  if (existing) existing.remove()
  const el = document.createElement('div')
  el.id = 'v2-legacy-copy-toast'
  el.textContent = message
  el.setAttribute(
    'style',
    [
      'position:fixed',
      'left:50%',
      'bottom:28px',
      'transform:translateX(-50%)',
      'z-index:10000',
      'padding:10px 16px',
      'border-radius:10px',
      'font:600 13px/1.4 system-ui,sans-serif',
      'color:#fff',
      `background:${error ? '#b91c1c' : '#0f172a'}`,
      'box-shadow:0 8px 24px rgba(15,23,42,.25)',
      'pointer-events:none'
    ].join(';')
  )
  document.body.appendChild(el)
  window.setTimeout(() => el.remove(), 2200)
}
