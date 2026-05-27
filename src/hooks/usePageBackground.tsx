import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import { useTheme } from "@/hooks/useTheme";
import type { PageBackgroundKey, PageBackground } from "@/lib/munApi";
import { getPageBackgrounds } from "@/lib/munApi";

export const usePageBackground = (key: PageBackgroundKey) => {
  const { edition } = useActiveEdition();
  const [bg, setBg] = useState<PageBackground | null>(null);

  useEffect(() => {
    if (!edition) return;
    let mounted = true;
    getPageBackgrounds(edition.id).then(map => { if (mounted) setBg(map[key] ?? null); });
    const ch = supabase.channel(`page-bg-${key}-${Math.random().toString(36).slice(2)}`);
    ch.on("postgres_changes", { event: "*", schema: "public", table: "page_backgrounds" }, () => {
      getPageBackgrounds(edition.id).then(map => { if (mounted) setBg(map[key] ?? null); });
    }).subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [edition?.id, key]);

  return bg;
};

export const PageBackdrop = ({ pageKey }: { pageKey: PageBackgroundKey }) => {
  const bg = usePageBackground(pageKey);
  const { theme } = useTheme();
  if (!bg) return null;

  const isDark = theme === "dark";
  // Fallback to light settings if dark not configured
  const url = isDark ? (bg.image_url_dark ?? bg.image_url) : bg.image_url;
  if (!url) return null;
  const fit = (isDark ? (bg.fit_dark ?? bg.fit) : bg.fit) ?? "cover";
  const position = (isDark ? (bg.position_dark ?? bg.position) : bg.position) ?? "center";
  const blur = (isDark ? (bg.blur_dark ?? bg.blur) : bg.blur) ?? 0;
  const opacity = (isDark ? (bg.opacity_dark ?? bg.opacity) : bg.opacity) ?? 0.25;

  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 bg-no-repeat pointer-events-none"
      style={{
        backgroundImage: `url(${url})`,
        backgroundSize: fit,
        backgroundPosition: position,
        opacity,
        filter: blur > 0 ? `blur(${blur}px)` : undefined,
      }}
    />
  );
};
