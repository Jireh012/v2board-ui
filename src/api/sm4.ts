import smCrypto from 'sm-crypto'

const { sm4 } = smCrypto

export interface Sm4Envelope {
  iv: string
  payload: string
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) {
    out[i] = bin.charCodeAt(i)
  }
  return out
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i])
  }
  return btoa(bin)
}

function bytesToBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlToBytes(b64url: string): Uint8Array {
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/')
  while (b64.length % 4) b64 += '='
  return base64ToBytes(b64)
}

/** Match backend Sm4Util.parseKey: 32 hex or 16 UTF-8 bytes → hex for sm-crypto. */
export function keyToHex(configured: string): string {
  const trimmed = configured.trim()
  if (!trimmed) {
    throw new Error('VITE_SM4_KEY is empty')
  }
  if (/^[0-9a-fA-F]{32}$/.test(trimmed)) {
    return trimmed.toLowerCase()
  }
  const utf8 = new TextEncoder().encode(trimmed)
  if (utf8.length !== 16) {
    throw new Error('VITE_SM4_KEY must be 16 UTF-8 bytes or 32 hex chars')
  }
  return bytesToHex(utf8)
}

function panelKeyHex(): string {
  return keyToHex(import.meta.env.VITE_SM4_KEY || '')
}

export function encryptToEnvelope(plaintextUtf8: string): Sm4Envelope {
  const keyHex = panelKeyHex()
  const iv = crypto.getRandomValues(new Uint8Array(16))
  const ivHex = bytesToHex(iv)
  const cipherHex = sm4.encrypt(plaintextUtf8, keyHex, {
    mode: 'cbc',
    iv: ivHex,
    padding: 'pkcs#7'
  }) as string
  return {
    iv: bytesToBase64(iv),
    payload: bytesToBase64(hexToBytes(cipherHex))
  }
}

export function decryptFromEnvelope(envelope: Sm4Envelope): string {
  const keyHex = panelKeyHex()
  const ivHex = bytesToHex(base64ToBytes(envelope.iv))
  const payloadHex = bytesToHex(base64ToBytes(envelope.payload))
  return sm4.decrypt(payloadHex, keyHex, {
    mode: 'cbc',
    iv: ivHex,
    padding: 'pkcs#7'
  }) as string
}

/** Compact form for X-A header: base64url(iv).base64url(ct) */
export function encryptToCompact(plaintextUtf8: string): string {
  const keyHex = panelKeyHex()
  const iv = crypto.getRandomValues(new Uint8Array(16))
  const ivHex = bytesToHex(iv)
  const cipherHex = sm4.encrypt(plaintextUtf8, keyHex, {
    mode: 'cbc',
    iv: ivHex,
    padding: 'pkcs#7'
  }) as string
  return `${bytesToBase64Url(iv)}.${bytesToBase64Url(hexToBytes(cipherHex))}`
}

export function decryptFromCompact(compact: string): string {
  const keyHex = panelKeyHex()
  const dot = compact.indexOf('.')
  if (dot <= 0 || dot >= compact.length - 1) {
    throw new Error('SM4 compact ciphertext must be iv.payload')
  }
  const ivHex = bytesToHex(base64UrlToBytes(compact.slice(0, dot)))
  const payloadHex = bytesToHex(base64UrlToBytes(compact.slice(dot + 1)))
  return sm4.decrypt(payloadHex, keyHex, {
    mode: 'cbc',
    iv: ivHex,
    padding: 'pkcs#7'
  }) as string
}

export function isSm4Envelope(value: unknown): value is Sm4Envelope {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as Sm4Envelope).iv === 'string' &&
    typeof (value as Sm4Envelope).payload === 'string'
  )
}
