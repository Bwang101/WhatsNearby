import React, { useState } from 'react';
import { UserContext } from './user-context';

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [username, setUsername] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = async (username: string, password: string) => {
    // For demo purposes, accept any non-empty username/password
    if (username && password) {
      setUsername(username);
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUsername(null);
    setIsAuthenticated(false);
  };

  return (
    <UserContext.Provider
      value={{
        username,
        isAuthenticated,
        setUsername,
        login,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}