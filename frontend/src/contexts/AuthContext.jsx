import { createContext, useContext, useState, useEffect } from 'react';
import useAuthUser from '../hooks/useAuthUser';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const { isLoading: userLoading, isError, error, authUser } = useAuthUser();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) {
      setLoading(true);
      return;
    }

    // If there's an error or no authUser, user is not authenticated
    if (isError || !authUser) {
      setIsAuthenticated(false);
      setIsOnboarded(false);
    } else {
      setIsAuthenticated(true);
      setIsOnboarded(authUser.isOnboarded || false);
    }
    
    setLoading(false);
  }, [authUser, userLoading, isError]);

  const value = {
    isAuthenticated,
    isOnboarded,
    loading,
    user: authUser,
    error
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