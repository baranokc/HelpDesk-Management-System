const DEFAULT_API_BASE_URL =
  "https://helpdesk-backend-an12.onrender.com/api";

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL?.trim() || DEFAULT_API_BASE_URL
).replace(/\/+$/, "");

export const API_ORIGIN = API_BASE_URL.replace(/\/api$/i, "");

export function resolveHubUrl(
  configuredUrl: string | undefined,
  hubPath: string,
): string {
  const explicitUrl = configuredUrl?.trim();

  if (explicitUrl) {
    return explicitUrl.replace(/\/+$/, "");
  }

  return `${API_ORIGIN}${hubPath.startsWith("/") ? hubPath : `/${hubPath}`}`;
}
