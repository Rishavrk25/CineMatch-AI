import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authApi from '../api/authApi';
import watchlistApi from '../api/watchlistApi';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [watchlistIds, setWatchlistIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync watchlist IDs whenever user changes
  useEffect(() => {
    if (user?.favoriteMovieIds) {
      setWatchlistIds(new Set(user.favoriteMovieIds.map(String)));
    } else {
      setWatchlistIds(new Set());
    }
  }, [user]);

  // Check current session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('cinematch_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await authApi.getMe();
        if (response.success && response.user) {
          setUser(response.user);
          if (response.user.favoriteMovieIds) {
            setWatchlistIds(new Set(response.user.favoriteMovieIds.map(String)));
          }
        }
      } catch (err) {
        console.warn('Session verification failed:', err);
        localStorage.removeItem('cinematch_token');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await authApi.login(email, password);
      if (res.token) {
        localStorage.setItem('cinematch_token', res.token);
      }
      setUser(res.user);
      if (res.user?.favoriteMovieIds) {
        setWatchlistIds(new Set(res.user.favoriteMovieIds.map(String)));
      }
      return res.user;
    } catch (err) {
      const msg = err.message || 'Login failed';
      setError(msg);
      throw err;
    }
  };

  const register = async (name, email, password) => {
    setError(null);
    try {
      const res = await authApi.register(name, email, password);
      if (res.token) {
        localStorage.setItem('cinematch_token', res.token);
      }
      setUser(res.user);
      return res.user;
    } catch (err) {
      const msg = err.message || 'Registration failed';
      setError(msg);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network failure on logout
    } finally {
      localStorage.removeItem('cinematch_token');
      setUser(null);
      setWatchlistIds(new Set());
    }
  };

  const updatePreferences = async (preferences) => {
    try {
      const res = await authApi.updatePreferences(preferences);
      if (res.user) {
        setUser((prev) => ({ ...prev, ...res.user }));
      }
      return res;
    } catch (err) {
      setError(err.message || 'Failed to update preferences');
      throw err;
    }
  };

  const toggleWatchlist = useCallback(async (movieId) => {
    const sId = String(movieId);
    const inWatchlist = watchlistIds.has(sId);

    // Optimistic UI update
    setWatchlistIds((prev) => {
      const next = new Set(prev);
      if (inWatchlist) next.delete(sId);
      else next.add(sId);
      return next;
    });

    try {
      if (inWatchlist) {
        await watchlistApi.removeFromWatchlist(sId);
      } else {
        await watchlistApi.addToWatchlist(sId);
      }
    } catch (err) {
      // Rollback on error
      setWatchlistIds((prev) => {
        const next = new Set(prev);
        if (inWatchlist) next.add(sId);
        else next.delete(sId);
        return next;
      });
      throw err;
    }
  }, [watchlistIds]);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    watchlistIds,
    isMovieInWatchlist: (id) => watchlistIds.has(String(id)),
    login,
    register,
    logout,
    updatePreferences,
    toggleWatchlist
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
