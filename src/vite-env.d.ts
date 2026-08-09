/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SM4_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
