function readBase(value: string | undefined, fallback: string): string {
  const chosen = typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
  return chosen.replace(/\/+$/, '');
}

export const env = {
  devtoApiBase: readBase(import.meta.env.VITE_DEVTO_API_BASE, 'https://dev.to/api'),
  hnApiBase: readBase(import.meta.env.VITE_HN_API_BASE, 'https://hn.algolia.com/api/v1'),
} as const;
