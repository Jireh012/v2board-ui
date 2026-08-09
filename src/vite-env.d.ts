/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SM4_KEY: string
  /** Must match backend site.public_config_path */
  readonly VITE_PUBLIC_CONFIG_PATH: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
