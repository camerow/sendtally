// Staging and production pin one exact origin. Local development does not:
// both dev servers take whatever port is free, so a worktree running the web
// app on 5174 against a Worker configured for 5175 has every call blocked by
// CORS and every screen stuck loading. When the configured app URL is itself
// local, any local origin is allowed.
export function allowedOrigin(origin: string, webAppUrl: string): string | null {
  if (origin === webAppUrl) return origin;
  if (!isLocal(webAppUrl)) return null;
  return isLocal(origin) ? origin : null;
}

function isLocal(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === "http:" && (hostname === "localhost" || hostname === "127.0.0.1");
  } catch {
    return false;
  }
}
