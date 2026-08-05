const apiUrl = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5269/api"
).replace(/\/+$/, "");

const apiOrigin = apiUrl.endsWith("/api")
  ? apiUrl.slice(0, -4)
  : apiUrl;

export function resolveMediaUrl(
  path?: string | null,
): string | null {
  if (!path) return null;

  if (/^(https?:|data:|blob:)/i.test(path)) {
    return path;
  }

  return `${apiOrigin}${path.startsWith("/") ? path : `/${path}`}`;
}
