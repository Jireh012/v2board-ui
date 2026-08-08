import { request } from './http'

export interface PublicSiteConfig {
  app_name: string
  stop_register?: number
  invite_force?: number
}

export function fetchPublicSiteConfig(): Promise<PublicSiteConfig> {
  return request<PublicSiteConfig>('/api/v1/passport/comm/config', {}, { auth: false })
}
