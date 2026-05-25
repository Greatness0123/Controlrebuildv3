import { useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { LoginPayload } from '../types/auth';

export const useAuth = () => {
  const { user, isAuthenticated, setUser, setLoading, logout: localLogout } = useAuthStore();

  const checkAuth = useCallback(async () => {
    setLoading(true);
    try {
      const userInfo = await window.entryAPI.getUserInfo();
      setUser(userInfo);
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [setUser, setLoading]);

  const login = useCallback(async (payload: LoginPayload) => {
    setLoading(true);
    try {
      const result = await window.entryAPI.loginWithEmail(payload);
      if (result.success && result.user) {
        setUser(result.user);
      }
      return result;
    } finally {
      setLoading(false);
    }
  }, [setUser, setLoading]);

  const logout = useCallback(async () => {
    try {
      await window.settingsAPI.logout();
      localLogout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [localLogout]);

  useEffect(() => {
    if (!window.entryAPI) return;

    const unsubUserChanged = window.entryAPI.onUserChanged((_, user) => {
      setUser(user);
    });

    // Initial check
    checkAuth();

    return () => {
      unsubUserChanged();
    };
  }, [setUser, checkAuth]);

  return { login, logout, checkAuth, user, isAuthenticated };
};
