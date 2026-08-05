// Deliberately framework-agnostic — no React Native or Expo imports here. If parts of this
// app ever move to a standalone React web app (Constitution Principle IV), this file should
// be portable with zero changes.

export interface ApiClientConfig {
  baseUrl: string;
  getToken?: () => string | undefined | Promise<string | undefined>;
  // Extra request headers beyond the bearer token — see src/lib/api.ts for the concrete
  // (temporary) use of this: attaching the backend's dev-only X-User-Id stand-in header
  // (specs/001-registration-kyc/spec.md Assumptions, finding 5).
  getHeaders?: () =>
    | Record<string, string>
    | undefined
    | Promise<Record<string, string> | undefined>;
}

// Handle returned by createApiClient() — the type any src/domain module should use when it
// needs to accept a configured client via dependency injection (see
// src/domain/registration.ts / src/domain/profile.ts) rather than importing src/lib/api.ts
// directly, which would pull React Native/Expo modules (via src/lib/supabase-client.ts) into
// src/domain's dependency graph and break Constitution Principle IV's "zero RN imports"
// portability guarantee.
export type ApiClient = ReturnType<typeof createApiClient>;

interface RawErrorBody {
  error?: unknown;
  message?: unknown;
  issues?: unknown;
}

/**
 * Typed, discriminable API error thrown by the client whenever the backend responds with a
 * non-2xx status. `code` mirrors the backend's own `error` field verbatim (e.g.
 * "UsernameTaken", "EmailTaken", "PhoneNotVerified", "ValidationError" — see the Draw-a-card
 * backend repo's src/modules/identity/routes.ts error mapper) so callers can branch on it
 * directly — `if (err instanceof ApiError && err.code === "EmailTaken")` — instead of parsing
 * `error.message` strings. See docs/conventions.md's Error handling section ("Network/API
 * errors surface as typed errors from src/domain/api-client.ts, not raw fetch rejections
 * leaking into component code").
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly issues?: { path: string; message: string }[];

  constructor(
    status: number,
    code: string,
    message: string,
    issues?: { path: string; message: string }[]
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.issues = issues;
  }
}

export function createApiClient(config: ApiClientConfig) {
  return async function apiClient<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await config.getToken?.();
    const extraHeaders = await config.getHeaders?.();

    const res = await fetch(`${config.baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...extraHeaders,
        ...options.headers,
      },
    });

    if (!res.ok) {
      // Every mapped error in the backend's identity module (routes.ts's error mapper) returns
      // JSON shaped { error, message, issues? } — fall back to a generic code/message if the
      // body isn't JSON (e.g. an upstream proxy/500 HTML page) rather than throwing a secondary
      // parse error that would hide the original HTTP status.
      let code = "UnknownError";
      let message = `API error ${res.status}`;
      let issues: { path: string; message: string }[] | undefined;
      try {
        const body = (await res.json()) as RawErrorBody;
        if (typeof body.error === "string") {
          code = body.error;
        }
        if (typeof body.message === "string") {
          message = body.message;
        }
        if (Array.isArray(body.issues)) {
          issues = body.issues as { path: string; message: string }[];
        }
      } catch {
        // Non-JSON error body — keep the generic fallback above.
      }
      throw new ApiError(res.status, code, message, issues);
    }

    return res.json() as Promise<T>;
  };
}
