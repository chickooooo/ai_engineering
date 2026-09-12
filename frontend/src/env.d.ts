/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Origin the API lives at. Empty means "use the dev-server proxy". */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
