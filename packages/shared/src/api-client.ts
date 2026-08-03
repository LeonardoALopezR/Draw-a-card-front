export interface ApiClientConfig {
  baseUrl: string;
  getToken?: () => string | undefined | Promise<string | undefined>;
}

/**
 * Thin fetch wrapper around the Draw-a-card backend API. Platform-agnostic —
 * each app (web, mobile) provides its own baseUrl and token getter, since Next.js
 * (NEXT_PUBLIC_*) and Expo (EXPO_PUBLIC_*) read env vars differently.
 *
 * Usage (web): createApiClient({ baseUrl: process.env.NEXT_PUBLIC_API_URL!, getToken })
 * Usage (mobile): createApiClient({ baseUrl: process.env.EXPO_PUBLIC_API_URL!, getToken })
 */
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
