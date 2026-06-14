import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, userAPI } from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Silent auth check: only fetch profile if we have a local session indicator
    const hasLocalSession = localStorage.getItem('ctc_user');
    if (hasLocalSession) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await userAPI.getProfile();
      setUser(data);
      setToken('cookie_session'); // Dummy token state for backward compatibility
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      logoutState();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('ctc_user', JSON.stringify(data.user));
    setToken('cookie_session');
    setUser(data.user);
    return data.user;
  };

  const register = async (userData) => {
    const { data } = await authAPI.register(userData);
    localStorage.setItem('ctc_user', JSON.stringify(data.user));
    setToken('cookie_session');
    setUser(data.user);
    return data.user;
  };

  const logoutState = () => {
    localStorage.removeItem('ctc_user');
    setToken(null);
    setUser(null);
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('API logout failed:', error);
    }
    logoutState();
  };


  const refreshUser = async () => {
    try {
      const { data } = await userAPI.getProfile();
      setUser(data);
      return data;
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
