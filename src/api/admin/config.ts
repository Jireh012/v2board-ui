import { request } from '../http'

export interface SiteConfig {
  app_name?: string
  app_description?: string
  app_url?: string
  force_https?: number
  logo?: string
  subscribe_url?: string
  subscribe_path?: string
  tos_url?: string
  stop_register?: number
  try_out_plan_id?: number
  try_out_hour?: number
  currency?: string
  currency_symbol?: string
}

export interface SafeConfig {
  email_verify?: number
  safe_mode_enable?: number
  secure_path?: string
  email_whitelist_enable?: number
  email_whitelist_suffix?: string
  email_gmail_limit_enable?: number
  recaptcha_enable?: number
  recaptcha_key?: string
  recaptcha_site_key?: string
  register_limit_by_ip_enable?: number
  register_limit_count?: number
  register_limit_expire?: number
  password_limit_enable?: number
  password_limit_count?: number
  password_limit_expire?: number
}

export interface SubscribeConfig {
  plan_change_enable?: number
  reset_traffic_method?: number
  surplus_enable?: number
  allow_new_period?: number
  new_order_event_id?: number
  renew_order_event_id?: number
  change_order_event_id?: number
  show_info_to_server_enable?: number
  show_subscribe_method?: number
  show_subscribe_expire?: number
}

export interface DepositConfig {
  deposit_bounus?: string[]
}

export interface TicketConfig {
  ticket_status?: number
}

export interface InviteConfig {
  invite_force?: number
  invite_commission?: number
  invite_gen_limit?: number
  invite_never_expire?: number
  commission_first_time_enable?: number
  commission_auto_check_enable?: number
  commission_withdraw_limit?: number
  commission_withdraw_method?: string
  withdraw_close_enable?: number
  commission_distribution_enable?: number
  commission_distribution_l1?: number
  commission_distribution_l2?: number
  commission_distribution_l3?: number
}

export interface FrontendConfig {
  frontend_theme?: string
  frontend_theme_sidebar?: string
  frontend_theme_header?: string
  frontend_theme_color?: string
  frontend_background_url?: string
}

export interface ServerConfig {
  server_api_url?: string
  server_token?: string
  server_pull_interval?: number
  server_push_interval?: number
  server_node_report_min_traffic?: number
  server_device_online_min_traffic?: number
  device_limit_mode?: number
}

export interface EmailConfig {
  email_template?: string
  email_host?: string
  email_port?: string
  email_username?: string
  email_password?: string
  email_encryption?: string
  email_from_address?: string
}

export interface TelegramConfig {
  telegram_bot_enable?: number
  telegram_bot_token?: string
  telegram_discuss_link?: string
}

export interface AppConfig {
  windows_version?: string
  windows_download_url?: string
  macos_version?: string
  macos_download_url?: string
  android_version?: string
  android_download_url?: string
}

export interface ConfigData {
  site?: SiteConfig
  safe?: SafeConfig
  subscribe?: SubscribeConfig
  deposit?: DepositConfig
  ticket?: TicketConfig
  invite?: InviteConfig
  frontend?: FrontendConfig
  server?: ServerConfig
  email?: EmailConfig
  telegram?: TelegramConfig
  app?: AppConfig
}

export function fetchConfig(key?: string): Promise<ConfigData> {
  const url = key
    ? `/api/v1/admin/config/fetch?key=${encodeURIComponent(key)}`
    : '/api/v1/admin/config/fetch'
  return request<ConfigData>(url)
}

export function saveConfig(body: ConfigData): Promise<boolean> {
  return request<boolean>('/api/v1/admin/config/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
}

export function testSendMail(): Promise<boolean> {
  return request<boolean>('/api/v1/admin/config/testSendMail', {
    method: 'POST'
  })
}

export function setTelegramWebhook(): Promise<boolean> {
  return request<boolean>('/api/v1/admin/config/setTelegramWebhook', {
    method: 'POST'
  })
}
