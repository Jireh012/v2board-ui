/**
 * Copy text to clipboard. Falls back when Clipboard API is unavailable
 * (non-HTTPS / missing permission / older browsers).
 */
export async function copyText(text: string): Promise<void> {
  const value = text ?? ''
  if (!value) {
    throw new Error('没有可复制的内容')
  }
  try {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(value)
      return
    }
  } catch {
    // fall through to execCommand
  }
  const ta = document.createElement('textarea')
  ta.value = value
  ta.setAttribute('readonly', '')
  ta.style.position = 'fixed'
  ta.style.left = '-9999px'
  ta.style.top = '0'
  document.body.appendChild(ta)
  ta.focus()
  ta.select()
  ta.setSelectionRange(0, value.length)
  const ok = document.execCommand('copy')
  document.body.removeChild(ta)
  if (!ok) {
    throw new Error('复制失败，请手动复制')
  }
}
