import React, { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('aquaxai-user')) || null;
    } catch {
      return null;
    }
  });

  const login = (profile) => {
    setUser(profile);
    localStorage.setItem('aquaxai-user', JSON.stringify(profile));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('aquaxai-user');
  };

  const value = useMemo(() => ({ user, login, logout, isAuthenticated: Boolean(user) }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
