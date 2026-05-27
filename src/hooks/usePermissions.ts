// Per-tab permissions for the Secretariat console. The first secretariat
// (lowest created_at) is the OWNER and has full access to every tab + member
// management. Other secretariats inherit "view" by default unless the owner
// has set a more specific level via the Members tab.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ALL_TABS, getPermissionsForUser, isOwnerSecretariat,
  type PermissionLevel, type TabKey,
} from "@/lib/munApi";

export type PermissionsState = {
  loading: boolean;
  isOwner: boolean;
  perms: Record<TabKey, PermissionLevel>;
  /** Returns true if the user has at least the given level for the tab. */
  can: (tab: TabKey, min: PermissionLevel) => boolean;
};

const ORDER: PermissionLevel[] = ["none", "view", "edit", "delete"];
const rank = (l: PermissionLevel) => ORDER.indexOf(l);

const emptyPerms = (): Record<TabKey, PermissionLevel> =>
  Object.fromEntries(ALL_TABS.map(t => [t.key, "none"])) as Record<TabKey, PermissionLevel>;

export const usePermissions = (userId: string | null): PermissionsState => {
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [perms, setPerms] = useState<Record<TabKey, PermissionLevel>>(emptyPerms());

  useEffect(() => {
    let alive = true;
    if (!userId) { setLoading(false); return; }
    (async () => {
      const [owner, p] = await Promise.all([
        isOwnerSecretariat(userId),
        getPermissionsForUser(userId),
      ]);
      if (!alive) return;
      setIsOwner(owner);
      // Default for secretariats is "edit" on all tabs (per-user override below).
      // Owner gets "delete" everywhere.
      const base = emptyPerms();
      ALL_TABS.forEach(t => { base[t.key] = owner ? "delete" : "edit"; });
      Object.entries(p).forEach(([k, v]) => { base[k as TabKey] = v as PermissionLevel; });
      setPerms(base);
      setLoading(false);
    })();

    // Live updates so revoking permissions reflects immediately.
    const ch = supabase.channel(`perm-${userId}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "member_permissions", filter: `user_id=eq.${userId}` },
        () => getPermissionsForUser(userId).then(p => setPerms(prev => {
          const next = { ...prev };
          Object.entries(p).forEach(([k, v]) => { next[k as TabKey] = v as PermissionLevel; });
          return next;
        })))
      .subscribe();
    return () => { alive = false; supabase.removeChannel(ch); };
  }, [userId]);

  return {
    loading,
    isOwner,
    perms,
    can: (tab, min) => isOwner || rank(perms[tab] ?? "none") >= rank(min),
  };
};
