import { createContext, useContext } from 'react';
import type { User } from '@supabase/supabase-js';
import type { Company, Profile } from '../types';

export interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  company: Company | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isPlatformAdmin: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};
