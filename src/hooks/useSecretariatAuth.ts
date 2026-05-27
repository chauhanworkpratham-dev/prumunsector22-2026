import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const useSecretariatAuth = (redirectIfNot = true) => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isSec, setIsSec] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkRole = async (uid: string | null) => {
      if (!uid) {
        if (mounted) {
          setUserId(null);
          setIsSec(false);
          setChecking(false);
          if (redirectIfNot) navigate("/secretariat-login");
        }
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid)
        .eq("role", "secretariat")
        .maybeSingle();
      if (!mounted) return;
      const ok = !!data;
      setUserId(uid);
      setIsSec(ok);
      setChecking(false);
      if (!ok && redirectIfNot) navigate("/secretariat-login");
    };

    // Bootstrap: check current session first so the page doesn't flicker.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) checkRole(session?.user?.id ?? null);
    });

    // Keep in sync with future auth state changes (sign-in / sign-out).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      checkRole(session?.user?.id ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, redirectIfNot]);

  return { checking, isSec, userId };
};
