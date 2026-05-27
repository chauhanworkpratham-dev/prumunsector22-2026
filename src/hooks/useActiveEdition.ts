import { useEffect, useState } from "react";
import { getActiveEdition, type Edition } from "@/lib/munApi";
import { supabase } from "@/integrations/supabase/client";

export const useActiveEdition = () => {
  const [edition, setEdition] = useState<Edition | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = () => getActiveEdition().then(setEdition);

  useEffect(() => {
    let mounted = true;
    getActiveEdition().then(e => {
      if (mounted) { setEdition(e); setLoading(false); }
    });

    // Live updates so secretariat changes reflect across the public site.
    // Use a unique channel name per hook instance so multiple mounts don't
    // share (and re-subscribe to) the same channel.
    const ch = supabase.channel(`editions-live-${Math.random().toString(36).slice(2)}`);
    ch.on("postgres_changes", { event: "*", schema: "public", table: "editions" }, () => {
      if (mounted) reload();
    }).subscribe();

    return () => { mounted = false; supabase.removeChannel(ch); };
  }, []);

  return { edition, loading, refresh: reload };
};
