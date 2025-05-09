// app/_providers/supabase-provider.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import { Session, SupabaseClient } from '@supabase/supabase-js';
import {User} from "@/models";
import {Database} from "@/types/database.types";
import {createSupabaseClient} from "@/lib/supabase";

type SupabaseContextType = {
  supabase: SupabaseClient<Database>;
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: UserRole | null;
};

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState(() => createSupabaseClient());
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setLoading(true);

        if (session) {
          // Fetch the complete user profile with role information
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (userData && !error) {
            setUser(userData as User);
            setRole(userData.role as UserRole);
          }
        } else {
          setUser(null);
          setRole(null);
        }

        setLoading(false);
      }
    );

    // Initial session check
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setSession(session);

        // Fetch the complete user profile with role information
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (userData && !error) {
          setUser(userData as User);
          setRole(userData.role as UserRole);
        }
      }

      setLoading(false);
    };

    initializeAuth().then();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <SupabaseContext.Provider value={{ supabase, user, session, loading, role }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};