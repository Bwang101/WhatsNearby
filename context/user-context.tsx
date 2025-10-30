import { createContext, useContext } from 'react';

interface UserContextType {
  username: string | null;
  isAuthenticated: boolean;
  setUsername: (username: string | null) => void;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}