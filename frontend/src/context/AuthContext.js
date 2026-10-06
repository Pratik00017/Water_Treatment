import React, {
  createContext,
  useContext,
  useMemo,
  useState,
} from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('aquaxai-user');

      if (!storedUser) {
        return null;
      }

      return JSON.parse(storedUser);
    } catch (error) {
      console.error('Failed to load saved user:', error);
      return null;
    }
  });

  const login = (profile) => {
    try {
      setUser(profile);

      localStorage.setItem(
        'aquaxai-user',
        JSON.stringify(profile)
      );
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('aquaxai-user');
  };

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      isAuthenticated: Boolean(user),
    }),
    [user]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;