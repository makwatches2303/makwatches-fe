import axios from "axios";
import { ApiError } from "@/lib/api";

/**
 * The single place that turns a caught error into copy a customer or admin
 * should actually read.
 *
 * Preference order: the backend's own message (it already writes good ones --
 * "Invalid credentials", "Product not found" -- there is no reason to paraphrase
 * it), then a specific read of the failure shape (no response at all means the
 * network failed, not the request), then a generic fallback tuned to the
 * action that was being attempted.
 */
export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }

  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; error?: string }
      | undefined;
    const backendMessage = data?.message || data?.error;
    if (backendMessage) return backendMessage;

    if (!error.response) {
      return "Can't reach the server. Check your connection and try again.";
    }
    return fallback;
  }

  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;

  return fallback;
}
