import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Company, Profile } from '../types';
import { AuthContext, type AuthContextValue } from './auth-context';

const profileSelect = `
  id,
  company_id,
  full_name,
  phone,
  role,
  is_platform_admin,
  is_active,
  created_at,
  company:companies(*)
`;

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async (sessionUser: User | null) => {
    if (!sessionUser) {
      setProfile(null);
      setCompany(null);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select(profileSelect)
      .eq('id', sessionUser.id)
      .maybeSingle();

    if (error) {
      console.error('Failed to load profile', error);
      setProfile(null);
      setCompany(null);
      return;
    }

    const parsedProfile = data as unknown as Profile | null;
    setProfile(parsedProfile);
    setCompany((parsedProfile?.company as Company | null) ?? null);
  }, []);

  const handleSession = useCallback(
    async (session: Session | null) => {
      setUser(session?.user ?? null);
      await loadProfile(session?.user ?? null);
      setIsLoading(false);
    },
    [loadProfile],
  );

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        void handleSession(data.session);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void handleSession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [handleSession]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const refreshProfile = useCallback(async () => {
    await loadProfile(user);
  }, [loadProfile, user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      company,
      isLoading,
      isAuthenticated: Boolean(user),
      isPlatformAdmin: Boolean(profile?.is_platform_admin),
      signOut,
      refreshProfile,
    }),
    [user, profile, company, isLoading, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
