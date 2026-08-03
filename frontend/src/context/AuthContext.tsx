'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '@/src/services/authService';
import { decodeJwt, isTokenExpired } from '@/src/utils/jwt';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  ledTeamIds: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const processToken = (token: string) => {
    if (token && !isTokenExpired(token)) {
      const payload = decodeJwt(token);
      if (payload) {
        const userId = (payload.nameid || payload.sub || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']) as string;
        const role = (payload.role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']) as string;
        const name = (payload.name || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name']) as string;
        const email = payload.email as string;
        const ledTeamIds = typeof payload.led_team_ids === 'string' ? payload.led_team_ids.split(',').map((teamId) => teamId.trim()).filter(Boolean): [];

        setUser({
          id: userId,
          email,
          name,
          role: role || 'User',
          ledTeamIds,
        });
      }
    } else {
      authService.logout();
      setUser(null);
    }
  };

  useEffect(() => {
    const token = authService.getToken();
    if (token) {
      processToken(token);
    }
    setLoading(false);
  }, []);

  const login = (token: string) => {
    processToken(token);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);