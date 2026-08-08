import smCrypto from 'sm-crypto'
import { request } from './http'

const { sm4 } = smCrypto

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
}

interface Sm4Envelope {
  iv: string
  payload: string
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) {
    out[i] = bin.charCodeAt(i)
  }
  return out
}

/** Match backend Sm4Util.parseKey: 32 hex or 16 UTF-8 bytes → hex for sm-crypto. */
function keyToHex(configured: string): string {
  const trimmed = configured.trim()
  if (/^[0-9a-fA-F]{32}$/.test(trimmed)) {
    return trimmed.toLowerCase()
  }
  const utf8 = new TextEncoder().encode(trimmed)
  if (utf8.length !== 16) {
    throw new Error('VITE_SM4_KEY must be 16 UTF-8 bytes or 32 hex chars')
  }
  return bytesToHex(utf8)
}

function decryptPublicConfigEnvelope(envelope: Sm4Envelope): PublicSiteConfig {
  const keyHex = keyToHex(import.meta.env.VITE_SM4_KEY || '')
  const ivHex = bytesToHex(base64ToBytes(envelope.iv))
  const payloadHex = bytesToHex(base64ToBytes(envelope.payload))
  const json = sm4.decrypt(payloadHex, keyHex, {
    mode: 'cbc',
    iv: ivHex,
    padding: 'pkcs#7'
  })
  return JSON.parse(json) as PublicSiteConfig
}

export async function fetchPublicSiteConfig(): Promise<PublicSiteConfig> {
  const envelope = await request<Sm4Envelope>('/api/v1/passport/comm/config', {}, { auth: false })
  if (!envelope?.iv || !envelope?.payload) {
    throw new Error('公开配置响应格式无效')
  }
  return decryptPublicConfigEnvelope(envelope)
}
