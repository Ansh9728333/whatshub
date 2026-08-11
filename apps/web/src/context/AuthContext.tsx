import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, Workspace } from '@whatshub/shared';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  setCurrentWorkspace: (ws: Workspace) => void;
  login: (email: string) => void;
  logout: () => void;
}

const DEFAULT_WORKSPACE: Workspace = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Acme Corp Support',
  slug: 'acme-corp',
  owner_id: 'usr_owner_1',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const DEFAULT_USER: UserProfile = {
  id: 'usr_owner_1',
  email: 'admin@acmecorp.com',
  full_name: 'Alex Vance',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(DEFAULT_USER);
  const [token, setToken] = useState<string | null>('mock_jwt_token_whatshub');
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(DEFAULT_WORKSPACE);
  const [workspaces] = useState<Workspace[]>([DEFAULT_WORKSPACE]);

  const login = (email: string) => {
    setUser({
      id: 'usr_owner_1',
      email,
      full_name: email.split('@')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setToken('mock_jwt_token_whatshub');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        currentWorkspace,
        workspaces,
        setCurrentWorkspace,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
