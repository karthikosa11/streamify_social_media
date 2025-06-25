import { createContext, useContext, useState, useEffect } from 'react';
import useAuthUser from '../hooks/useAuthUser';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const { isLoading: userLoading, authUser } = useAuthUser();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) {
      setLoading(true);
      return;
    }
    if (authUser) {
      setIsAuthenticated(true);
      setIsOnboarded(authUser.isOnboarded);
    } else {
      setIsAuthenticated(false);
      setIsOnboarded(false);
    }
    setLoading(false);
  }, [authUser, userLoading]);

  const value = {
    isAuthenticated,
    isOnboarded,
    loading,
    user: authUser
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