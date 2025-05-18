import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define user roles
export type UserRole = 'admin' | 'mentor' | 'team' | 'startup' | 'particulier';

// Define user interface
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  profileImage?: string;
  token: string;
}

// Define context interface
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Initialize user from localStorage if available
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('Initialized user from localStorage:', parsedUser);
        return parsedUser;
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
    return null;
  });

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          motDePasse: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Identifiants invalides');
      }

      // Log the actual role from the backend
      console.log('User role from backend:', data.utilisateur.role);

      // Normalize the role to ensure it matches our expected values
      let normalizedRole = data.utilisateur.role.toLowerCase();

      // Make sure the role is one of our valid types
      if (!['admin', 'mentor', 'team', 'startup', 'particulier'].includes(normalizedRole)) {
        console.warn(`Unknown role "${data.utilisateur.role}" - defaulting to "admin" for admin users`);
        // If email contains "admin", assume it's an admin
        if (data.utilisateur.email.includes('admin')) {
          normalizedRole = 'admin';
        }
      }

      console.log('Normalized role:', normalizedRole);

      const userData = {
        id: data.utilisateur.id,
        name: data.utilisateur.name,
        email: data.utilisateur.email,
        role: normalizedRole as UserRole,
        profileImage: data.utilisateur.profileImage,
        token: data.token,
      };

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', data.token);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
