type RuntimeWindow = Window & {
  env?: {
    VITE_API_URL?: string;
  };
};

function normalizeApiUrl(value?: string): string | undefined {
  if (!value || value === '__VITE_API_URL__') {
    return undefined;
  }

  return value;
}

export function getApiBaseUrl(): string {
  const runtimeUrl = normalizeApiUrl((window as RuntimeWindow).env?.VITE_API_URL);
  const buildTimeUrl = normalizeApiUrl(import.meta.env.VITE_API_URL);

  const rawUrl = runtimeUrl ?? buildTimeUrl ?? '';

  // In unified single-domain deployment, if VITE_API_URL is '/api' or '/', return ''
  // to avoid duplicating '/api/api/v1' when combined with endpoint paths starting with '/api/v1'
  if (!rawUrl || rawUrl === '/api' || rawUrl === '/') {
    return '';
  }

  // Strip trailing '/api' or '/'
  return rawUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
}
