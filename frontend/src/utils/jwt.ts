export interface JwtPayload {
  sub?: string;
  nameid?: string;
  email?: string;
  name?: string;
  led_team_ids?: string;
  role?: string;
  exp?: string;
  [key: string]: unknown;
}
export const decodeJwt = (token: string): JwtPayload | null => {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
};
export const isTokenExpired = (token: string): boolean => {
  const payload = decodeJwt(token);
  if (!payload || !payload.exp) return true;

  const currentTime = Math.floor(Date.now() / 1000);
  const expTime = Number(payload.exp);
  return expTime < currentTime;
};
