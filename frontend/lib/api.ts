const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001/api/v1";

export class ApiError extends Error { constructor(message: string, public readonly status: number) { super(message); } }

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = { ...(options.headers || {}) } as Record<string, string>;
  // If body is FormData, allow browser to set Content-Type
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const body = payload as { message?: string; errors?: Record<string, string[] | string> } | null;
    const first = body?.errors && Object.values(body.errors)[0];
    throw new ApiError(body?.message ?? (Array.isArray(first) ? first[0] : first) ?? "Something went wrong. Please try again.", response.status);
  }
  return payload as T;
}
