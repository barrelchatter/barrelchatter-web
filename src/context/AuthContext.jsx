import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('authUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse stored user', e);
        localStorage.removeItem('authUser');
        localStorage.removeItem('authToken');
      }
    }
    setInitializing(false);
  }, []);

  async function login(email, password) {
    const response = await api.post('/v1/auth/login', { email, password });
    const { token, user: userData } = response.data;

    localStorage.setItem('authToken', token);
    localStorage.setItem('authUser', JSON.stringify(userData));
    setUser(userData);

    return userData;
  }

  function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setUser(null);
  }

  const value = {
    user,
    initializing,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
