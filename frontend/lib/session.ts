export function clearSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("access_token");
  sessionStorage.removeItem("refresh_token");
  sessionStorage.removeItem("user_id");
  window.dispatchEvent(new Event("auth-session-changed"));
}

export function getUserIdClaim(token: string): string | null {
  try {
    const encodedPayload = token.split(".")[1];
    if (!encodedPayload) return null;
    const base64 = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(window.atob(base64)) as { user_id?: string | number };
    return payload.user_id == null ? null : String(payload.user_id);
  } catch {
    return null;
  }
}
