"use client";
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "./supabase";
import type { User, AuthError } from "@supabase/supabase-js";

interface Profile {
  id: string;
  email: string;
  plan_type: "free" | "student_monthly" | "student_annual" | "lifetime";
  searches_used: number;
  searches_reset_at: string;
  summaries_used: number;
  summaries_reset_at: string;
  framework_used: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, promoCode?: string) => Promise<{ error: AuthError | null; promoApplied?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signUp: async () => ({ error: null, promoApplied: false }),
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (data) setProfile(data as Profile);
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signUp = async (email: string, password: string, promoCode?: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (!error && data.user) {
      // Create profile row
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
      nextMonth.setHours(0, 0, 0, 0);
      await supabase.from("profiles").insert({
        id: data.user.id,
        email,
        plan_type: "free",
        searches_used: 0,
        searches_reset_at: nextMonth.toISOString(),
        summaries_used: 0,
        summaries_reset_at: nextMonth.toISOString(),
      });

      // Apply promo code if provided
      let promoApplied = false;
      if (promoCode?.trim()) {
        try {
          const res = await fetch("/api/promo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: promoCode.trim(), userId: data.user.id }),
          });
          const promoData = await res.json();
          if (promoData.success) promoApplied = true;
        } catch { /* promo failed silently, user still gets free account */ }
      }

      await fetchProfile(data.user.id);
      return { error, promoApplied };
    }
    return { error, promoApplied: false };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut: handleSignOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
