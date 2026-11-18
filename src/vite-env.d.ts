/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEVTO_API_BASE?: string;
  readonly VITE_HN_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
