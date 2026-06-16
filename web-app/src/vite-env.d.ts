/// <reference types="vite/client" />

/**
 * Tipagem das variáveis de ambiente expostas ao frontend.
 * O Vite só injeta variáveis com prefixo `VITE_` (ver `.env.example`).
 */
interface ImportMetaEnv {
  /** URL base da API NestJS (backend-api). */
  readonly VITE_API_BASE_URL?: string;
  /** URL base do motor de recomendação (recommendation-engine). */
  readonly VITE_AI_ENGINE_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
