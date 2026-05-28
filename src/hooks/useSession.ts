/**
 * useSession — single source of truth for the currently logged-in user.
 *
 * Covers both tracks:
 *   • Delegate  — email stored in localStorage ("prumun_delegate_email")
 *   • Secretariat — Supabase Auth session
 *
 * Returns:
 *   delegateEmail  — string | null
 *   secUser        — Supabase User | null
 *   isDelegate     — boolean
 *   isSecretariat  — boolean
 *   logoutDelegate — () => void
 *   logoutSec      — () => Promise<void>
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type SessionState = {
  delegateEmail: string | null;
  secUser: User | null;
  isDelegate: boolean;
  isSecretariat: boolean;
  logoutDelegate: () => void;
  logoutSec: () => Promise<void>;
};

export function useSession(): SessionState {
  const [delegateEmail, setDelegateEmail] = useState<string | null>(
    () => localStorage.getItem("prumun_delegate_email"),
  );
  const [secUser, setSecUser] = useState<User | null>(null);

  // Listen for localStorage changes (cross-tab) for delegate
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "prumun_delegate_email") {
        setDelegateEmail(e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Supabase auth state for secretariat
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSecUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSecUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const logoutDelegate = () => {
    localStorage.removeItem("prumun_delegate_email");
    setDelegateEmail(null);
  };

  const logoutSec = async () => {
    await supabase.auth.signOut();
    setSecUser(null);
  };

  return {
    delegateEmail,
    secUser,
    isDelegate: !!delegateEmail,
    isSecretariat: !!secUser,
    logoutDelegate,
    logoutSec,
  };
}
