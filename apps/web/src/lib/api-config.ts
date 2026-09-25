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

  const apiUrl = runtimeUrl ?? buildTimeUrl;
  if (!apiUrl) {
    throw new Error('Missing required environment variable: VITE_API_URL');
  }

  return apiUrl;
}
