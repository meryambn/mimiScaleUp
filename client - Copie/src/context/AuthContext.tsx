import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define user roles
export type UserRole = 'admin' | 'mentor' | 'team';

// Define user interface
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  profileImage?: string;
}

// Define context interface
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setCurrentUser: (user: User) => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for saved user on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // In a real app, this would verify the token with the server
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Authentication error:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // In a real app, this would make an API call
      // For now, we'll simulate with mock users
      
      // Mock admin user
      if (email === 'admin@example.com' && password === 'password') {
        const adminUser: User = {
          id: 1,
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin',
        };
        setUser(adminUser);
        localStorage.setItem('currentUser', JSON.stringify(adminUser));
        return;
      }
      
      // Mock mentor user
      if (email === 'mentor@example.com' && password === 'password') {
        const mentorUser: User = {
          id: 2,
          name: 'Mentor User',
          email: 'mentor@example.com',
          role: 'mentor',
        };
        setUser(mentorUser);
        localStorage.setItem('currentUser', JSON.stringify(mentorUser));
        return;
      }
      
      throw new Error('Invalid credentials');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  // Set current user (for testing purposes)
  const setCurrentUser = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('currentUser', JSON.stringify(newUser));
  };

  // Context value
  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    setCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
