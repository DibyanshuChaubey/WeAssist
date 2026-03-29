import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User } from '../types/index';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (user: User & { token?: string }, options?: { storage?: 'local' | 'session' }) => void;
  logout: () => void;
  isAdmin: boolean;
  isStudent: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper: Synchronously restore auth from localStorage
const restoreAuthFromStorage = () => {
  try {
    const sessionToken = sessionStorage.getItem('authToken');
    const sessionUser = sessionStorage.getItem('user');

    if (sessionToken && sessionUser) {
      const parsedUser = JSON.parse(sessionUser);
      return { currentUser: parsedUser, token: sessionToken };
    }

    const storedToken = localStorage.getItem('authToken');
    const stored = localStorage.getItem('user');
    
    if (storedToken && stored) {
      const parsedUser = JSON.parse(stored);
      return { currentUser: parsedUser, token: storedToken };
    }
  } catch (error) {
    console.error('Failed to restore auth from storage:', error);
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('user');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }
  
  return { currentUser: null, token: null };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Synchronously initialize state from localStorage
  const initialAuth = restoreAuthFromStorage();
  const [currentUser, setCurrentUser] = useState<User | null>(initialAuth.currentUser);
  const [token, setToken] = useState<string | null>(initialAuth.token);

  // Log restoration on mount (for debugging)
  useEffect(() => {
    if (currentUser) {
      console.log('✓ Auth restored from localStorage on mount:', currentUser.email);
    }
  }, []);

  const login = useCallback((user: User & { token?: string }, options?: { storage?: 'local' | 'session' }) => {
    const { token: accessToken, ...userWithoutToken } = user;
    const storageType = options?.storage ?? 'local';
    setCurrentUser(userWithoutToken as User);

    // Ensure only one storage source is active at a time.
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('user');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');

    if (accessToken) {
      setToken(accessToken);
      if (storageType === 'session') {
        sessionStorage.setItem('authToken', accessToken);
      } else {
        localStorage.setItem('authToken', accessToken);
      }
      console.log(`✓ Token stored (${storageType})`);
    }

    if (storageType === 'session') {
      sessionStorage.setItem('user', JSON.stringify(userWithoutToken));
    } else {
      localStorage.setItem('user', JSON.stringify(userWithoutToken));
    }
    console.log(`✓ User stored (${storageType}):`, userWithoutToken);
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setToken(null);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
  }, []);

  const isAuthenticated = currentUser !== null && !!token;
  const isAdmin = currentUser?.role === 'admin';
  const isStudent = currentUser?.role === 'student';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        token,
        login,
        logout,
        isAdmin,
        isStudent,
        isLoading: false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
