import { API_ORIGIN } from "@/src/lib/apiUrl";

export function resolveMediaUrl(
  path?: string | null,
): string | null {
  if (!path) return null;

  if (/^(https?:|data:|blob:)/i.test(path)) {
    return path;
  }

  return `${API_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}
