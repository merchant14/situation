const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001/api/v1";

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const payload = await response.json();

  if (!response.ok) {
    const errors = payload.errors ?? payload;
    throw new Error(typeof errors === "string" ? errors : JSON.stringify(errors));
  }
  return payload as T;
}
