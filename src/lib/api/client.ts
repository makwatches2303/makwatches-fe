/**
 * The single canonical API client for MAK Watches.
 *
 * Every new module under src/lib/api builds on this. It is the only place that
 * decides the API origin, attaches credentials, or unwraps the response
 * envelope.
 *
 * Deliberately not here:
 *   - No hardcoded production origin. See src/lib/env.ts.
 *   - No token logging. The previous client console.logged token presence on
 *     every request.
 *   - No parallel axios instance per feature.
 */

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";

import { getApiBaseUrl } from "@/lib/env";
import type { ApiResponse } from "./types";

/** An API call that failed, with the server's message where one was returned. */
export class ApiError extends Error {
  readonly status: number;
  readonly url?: string;
  /** Per-field validation messages, keyed by field name, when the endpoint
   * returns them -- so a form can mark the offending input instead of
   * showing one banner and leaving the customer to guess which box is
   * wrong. */
  readonly fieldErrors?: Record<string, string>;
  /** Stable machine-readable reason (e.g. PINCODE_NOT_SERVICEABLE), for
   * callers that need to branch on it rather than match on wording. */
  readonly code?: string;

  constructor(
    message: string,
    status: number,
    url?: string,
    extra?: { fieldErrors?: Record<string, string>; code?: string }
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.url = url;
    this.fieldErrors = extra?.fieldErrors;
    this.code = extra?.code;
  }

  /** True when the resource genuinely does not exist, as opposed to failing. */
  get isNotFound(): boolean {
    return this.status === 404;
  }

  /** True when the caller needs to authenticate or lacks permission. */
  get isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }
}

/**
 * Read the stored auth token.
 *
 * Both keys are read because the existing app writes `customerToken` for
 * shoppers and `adminToken` for the admin panel. Consolidating that onto one
 * key is deferred: it touches the live auth flow, which Phase 1 leaves working.
 */
function readAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return (
      window.localStorage.getItem("customerToken") ||
      window.localStorage.getItem("adminToken") ||
      null
    );
  } catch {
    // localStorage can throw in private modes and sandboxed contexts.
    return null;
  }
}

function createClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: getApiBaseUrl(),
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  });

  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    // Registration must be sent unauthenticated: a stale token in storage
    // would otherwise be attached and rejected. Behaviour preserved from the
    // client this replaces.
    if (config.url?.includes("/auth/register")) {
      config.headers.delete("Authorization");
      return config;
    }

    const token = readAuthToken();
    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      config.headers.delete("Authorization");
    }
    return config;
  });

  return instance;
}

let cached: AxiosInstance | null = null;

/**
 * The shared axios instance.
 *
 * Created lazily so that a missing NEXT_PUBLIC_API_BASE_URL throws at the first
 * request rather than at module import, which would take down pages that make
 * no API calls at all.
 */
export function apiClient(): AxiosInstance {
  if (!cached) cached = createClient();
  return cached;
}

/** Normalize any thrown value into an ApiError. */
function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{
      message?: string;
      error?: string;
      fieldErrors?: Record<string, string>;
      code?: string;
    }>;
    const status = axiosError.response?.status ?? 0;
    const message =
      axiosError.response?.data?.message ||
      axiosError.response?.data?.error ||
      axiosError.message ||
      "Request failed";
    return new ApiError(message, status, axiosError.config?.url, {
      fieldErrors: axiosError.response?.data?.fieldErrors,
      code: axiosError.response?.data?.code,
    });
  }
  if (error instanceof Error) return new ApiError(error.message, 0);
  return new ApiError("Unknown error", 0);
}

/**
 * Perform a request and unwrap the `{ success, data }` envelope.
 *
 * Throws ApiError on transport failure, on a non-2xx status, and on a 2xx
 * response whose envelope reports `success: false`.
 */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await apiClient().request<ApiResponse<T>>(config);
    const body = response.data;

    if (body && typeof body === "object" && "success" in body) {
      if (!body.success) {
        throw new ApiError(
          body.message || "Request failed",
          response.status,
          config.url
        );
      }
      return body.data;
    }

    // Endpoints that respond with a bare payload rather than the envelope.
    return body as unknown as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw toApiError(error);
  }
}

/**
 * Like `request`, but also returns pagination metadata.
 */
export async function requestWithMeta<T>(
  config: AxiosRequestConfig
): Promise<{ data: T; meta?: ApiResponse<T>["meta"] }> {
  try {
    const response = await apiClient().request<ApiResponse<T>>(config);
    const body = response.data;

    if (body && typeof body === "object" && "success" in body) {
      if (!body.success) {
        throw new ApiError(
          body.message || "Request failed",
          response.status,
          config.url
        );
      }
      return { data: body.data, meta: body.meta };
    }

    return { data: body as unknown as T };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw toApiError(error);
  }
}

/** Convenience verbs. */
export const http = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: "GET", url }),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: "POST", url, data }),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: "PUT", url, data }),

  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: "PATCH", url, data }),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: "DELETE", url }),
};

/**
 * Build a query string from a params object, dropping undefined/null/empty
 * values so the API never receives `?category=&page=`.
 */
export function toQueryString(params: Record<string, unknown>): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (typeof value === "boolean") {
      if (value) search.set(key, "true");
      continue;
    }
    if (Array.isArray(value)) {
      if (value.length > 0) search.set(key, value.join(","));
      continue;
    }
    search.set(key, String(value));
  }

  const qs = search.toString();
  return qs ? `?${qs}` : "";
}
