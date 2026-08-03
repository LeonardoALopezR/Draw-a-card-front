// Deliberately framework-agnostic — no React Native or Expo imports here. If parts of this
// app ever move to a standalone React web app (Constitution Principle IV), this file should
// be portable with zero changes.

export interface ApiClientConfig {
  baseUrl: string;
  getToken?: () => string | undefined | Promise<string | undefined>;
}

export function createApiClient(config: ApiClientConfig) {
  return async function apiClient<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await config.getToken?.();

    const res = await fetch(`${config.baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`API error ${res.status}: ${body}`);
    }

    return res.json() as Promise<T>;
  };
}
