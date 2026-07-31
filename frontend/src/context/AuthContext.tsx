'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '@/src/services/authService';
import { decodeJwt, isTokenExpired } from '@/src/utils/jwt';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = authService.getToken();

    if (token && !isTokenExpired(token)) {
      const payload = decodeJwt(token);
      if (payload) {
        const userId = (payload.nameid || payload.sub || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']) as string;
        const role = (payload.role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']) as string;
        const name = (payload.name || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name']) as string;
        const email = payload.email as string;

        setUser({
          id: userId,
          email,
          name,
          role: role || 'User',
        });
      }
    } else if (token) {
      authService.logout();
    }

    setLoading(false);
  }, []);

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
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);