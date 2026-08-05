"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { authService } from "@/src/services/authService";
import type { LoginResponse } from "@/src/types/auth";
import { decodeJwt, isTokenExpired } from "@/src/utils/jwt";

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  role: string;
  ledTeamIds: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (session: LoginResponse) => void;
  logout: () => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
  login: () => {},
  logout: () => {},
  refreshSession: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const processToken = useCallback(
    (token: string, session?: LoginResponse) => {
      if (!token || isTokenExpired(token)) {
        authService.logout();
        setUser(null);
        return;
      }

      const payload = decodeJwt(token);
      if (!payload) {
        authService.logout();
        setUser(null);
        return;
      }

      const userId = (
        payload.nameid ||
        payload.sub ||
        payload[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        ]
      ) as string;
      const tokenRole = (
        payload.role ||
        payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]
      ) as string;
      const tokenEmail = payload.email as string;
      const ledTeamIds =
        typeof payload.led_team_ids === "string"
          ? payload.led_team_ids
              .split(",")
              .map((teamId) => teamId.trim())
              .filter(Boolean)
          : [];

      if (!userId) {
        authService.logout();
        setUser(null);
        return;
      }

      setUser((currentUser) => {
        const email = session?.email || tokenEmail || currentUser?.email || "";

        return {
          id: userId,
          email,
          fullName:
            session?.fullName ||
            currentUser?.fullName ||
            email.split("@")[0] ||
            "User",
          avatarUrl:
            session !== undefined
              ? session.avatarUrl
              : currentUser?.avatarUrl,
          role: tokenRole || session?.role || "User",
          ledTeamIds,
        };
      });
    },
    [],
  );

  const refreshSession = useCallback(async () => {
    const token = authService.getToken();

    if (!token || isTokenExpired(token)) {
      authService.logout();
      setUser(null);
      return;
    }

    processToken(token);

    try {
      const refreshedSession = await authService.refreshSession();
      processToken(refreshedSession.token, refreshedSession);
    } catch {
      if (!authService.getToken()) setUser(null);
    }
  }, [processToken]);

  useEffect(() => {
    let cancelled = false;

    const initializeSession = async () => {
      await refreshSession();
      if (!cancelled) setLoading(false);
    };

    void initializeSession();

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void refreshSession();
      }
    };

    const refreshInterval = window.setInterval(() => {
      void refreshSession();
    }, 30_000);

    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      cancelled = true;
      window.clearInterval(refreshInterval);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [refreshSession]);

  const login = (session: LoginResponse) => {
    processToken(session.token, session);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        loading,
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
