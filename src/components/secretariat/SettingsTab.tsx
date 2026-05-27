import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { updateEdition, uploadEditionLogo, type Edition } from "@/lib/munApi";
import crest from "@/assets/prumun-crest.png";
import { Save, Upload, ImageIcon, Trash2 } from "lucide-react";

const toLocalInput = (iso: string | null | undefined) => {
  if (!iso) return "";
  const d = new Date(iso);
  // YYYY-MM-DDTHH:mm in local time
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const SettingsTab = ({ edition, onSaved }: { edition: Edition; onSaved: () => void }) => {
  const buildForm = (e: Edition) => ({
    name: e.name,
    hero_tagline: (e as any).hero_tagline ?? "REGISTRATIONS OPEN",
    countdown_title: e.countdown_title,
    countdown_subtitle: e.countdown_subtitle ?? "",
    event_date: toLocalInput(e.event_date),
    event_end_date: toLocalInput(e.event_end_date),
    venue_name: e.venue_name ?? "",
    venue_address: e.venue_address ?? "",
    instagram_url: e.instagram_url ?? "",
    youtube_url: e.youtube_url ?? "",
    facebook_url: e.facebook_url ?? "",
    stat_delegates: e.stat_delegates ?? "500+",
    stat_committees: e.stat_committees ?? "6",
    stat_years: e.stat_years ?? "10",
    stat_portfolios: e.stat_portfolios ?? "100+",
  });

  const [form, setForm] = useState(buildForm(edition));
  const [saving, setSaving] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const [headerBusy, setHeaderBusy] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(edition.logo_url);
  const [headerPreview, setHeaderPreview] = useState<string | null>(edition.header_logo_url);
  const fileRef = useRef<HTMLInputElement>(null);
  const headerFileRef = useRef<HTMLInputElement>(null);

  // Re-sync form when edition prop changes (e.g. after refresh from realtime)
  useEffect(() => {
    setForm(buildForm(edition));
    setLogoPreview(edition.logo_url);
    setHeaderPreview(edition.header_logo_url);
  }, [edition.id, edition.event_date, edition.name, edition.logo_url, edition.header_logo_url]);

  const onPickLogo = async (file: File | null, kind: "site" | "header") => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Logo too large", description: "Max 2 MB.", variant: "destructive" });
      return;
    }
    const setBusy = kind === "header" ? setHeaderBusy : setLogoBusy;
    setBusy(true);
    try {
      const url = await uploadEditionLogo(edition.id, file, kind);
      const patch = kind === "header" ? { header_logo_url: url } : { logo_url: url };
      const { error } = await updateEdition(edition.id, patch as any);
      if (error) throw error;
      if (kind === "header") setHeaderPreview(url); else setLogoPreview(url);
      toast({ title: kind === "header" ? "🧭 Header logo updated" : "🖼️ Site logo updated", description: kind === "header" ? "Live in the navbar." : "Live across the homepage hero." });
      onSaved();
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const clearLogo = async (kind: "site" | "header") => {
    if (!confirm(kind === "header" ? "Reset header logo to the site logo / default?" : "Reset to the default PRUMUN crest?")) return;
    const setBusy = kind === "header" ? setHeaderBusy : setLogoBusy;
    setBusy(true);
    const patch = kind === "header" ? { header_logo_url: null } : { logo_url: null };
    const { error } = await updateEdition(edition.id, patch as any);
    setBusy(false);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    if (kind === "header") setHeaderPreview(null); else setLogoPreview(null);
    toast({ title: "Logo reset" });
    onSaved();
  };

  const save = async () => {
    setSaving(true);
    const patch = {
      name: form.name,
      hero_tagline: form.hero_tagline,
      countdown_title: form.countdown_title,
      countdown_subtitle: form.countdown_subtitle || null,
      event_date: new Date(form.event_date).toISOString(),
      event_end_date: form.event_end_date ? new Date(form.event_end_date).toISOString() : null,
      venue_name: form.venue_name || null,
      venue_address: form.venue_address || null,
      instagram_url: form.instagram_url || null,
      youtube_url: form.youtube_url || null,
      facebook_url: form.facebook_url || null,
      stat_delegates: form.stat_delegates,
      stat_committees: form.stat_committees,
      stat_years: form.stat_years,
      stat_portfolios: form.stat_portfolios,
    };
    const { error, data } = await updateEdition(edition.id, patch as any);
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "✅ Settings saved", description: "Live across the website." });
    onSaved();
  };

  const F = (k: keyof typeof form) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value }),
  });

  return (
    <div className="glass-strong rounded-3xl p-6 space-y-4 max-w-3xl">
      <h3 className="font-display text-xl font-bold">Site Settings</h3>

      {/* Site (general) logo — used everywhere except the navbar header */}
      <div className="glass rounded-2xl p-4 flex items-center gap-4 flex-wrap">
        <div className="w-16 h-16 rounded-full bg-white ring-2 ring-primary/30 flex items-center justify-center shadow-soft shrink-0">
          <img src={logoPreview || crest} alt="Site logo" className="w-12 h-12 object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <Label className="flex items-center gap-2"><ImageIcon className="w-4 h-4 text-primary" /> Site logo (homepage hero & everywhere else)</Label>
          <p className="text-xs text-muted-foreground">Shown on the homepage hero, registration pages, etc. PNG/SVG, ≤ 2 MB.</p>
        </div>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden"
          onChange={e => onPickLogo(e.target.files?.[0] ?? null, "site")} />
        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={logoBusy}>
          <Upload className="w-3 h-3" /> {logoBusy ? "Uploading…" : "Upload"}
        </Button>
        {logoPreview && (
          <Button variant="ghost" size="sm" onClick={() => clearLogo("site")} disabled={logoBusy} className="text-destructive">
            <Trash2 className="w-3 h-3" /> Reset
          </Button>
        )}
      </div>

      {/* Header-only logo */}
      <div className="glass rounded-2xl p-4 flex items-center gap-4 flex-wrap">
        <div className="w-16 h-16 rounded-full bg-white ring-2 ring-accent/40 flex items-center justify-center shadow-soft shrink-0">
          <img src={headerPreview || logoPreview || crest} alt="Header logo" className="w-12 h-12 object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <Label className="flex items-center gap-2"><ImageIcon className="w-4 h-4 text-accent" /> Header logo (navbar only)</Label>
          <p className="text-xs text-muted-foreground">Overrides the site logo in the navbar. Falls back to the site logo if empty.</p>
        </div>
        <input ref={headerFileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden"
          onChange={e => onPickLogo(e.target.files?.[0] ?? null, "header")} />
        <Button variant="outline" size="sm" onClick={() => headerFileRef.current?.click()} disabled={headerBusy}>
          <Upload className="w-3 h-3" /> {headerBusy ? "Uploading…" : "Upload"}
        </Button>
        {headerPreview && (
          <Button variant="ghost" size="sm" onClick={() => clearLogo("header")} disabled={headerBusy} className="text-destructive">
            <Trash2 className="w-3 h-3" /> Reset
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-1.5 md:col-span-2"><Label>Edition name (also the headline)</Label><Input {...F("name")} /></div>
        <div className="space-y-1.5 md:col-span-2"><Label>Hero tagline (small badge above the title — leave blank to hide)</Label><Input {...F("hero_tagline")} placeholder="REGISTRATIONS OPEN" /></div>
        <div className="space-y-1.5"><Label>Countdown title</Label><Input {...F("countdown_title")} /></div>
        <div className="space-y-1.5"><Label>Countdown subtitle</Label><Input {...F("countdown_subtitle")} /></div>
        <div className="space-y-1.5"><Label>Event start date & time</Label><Input type="datetime-local" {...F("event_date")} /></div>
        <div className="space-y-1.5"><Label>Event end date & time</Label><Input type="datetime-local" {...F("event_end_date")} /></div>
        <div className="space-y-1.5"><Label>Venue name</Label><Input {...F("venue_name")} /></div>
        <div className="space-y-1.5"><Label>Venue address</Label><Input {...F("venue_address")} /></div>
        <div className="space-y-1.5"><Label>Instagram URL</Label><Input {...F("instagram_url")} /></div>
        <div className="space-y-1.5"><Label>YouTube URL</Label><Input {...F("youtube_url")} /></div>
        <div className="space-y-1.5 md:col-span-2"><Label>Facebook URL</Label><Input {...F("facebook_url")} /></div>
      </div>

      <div className="pt-2">
        <h4 className="font-display text-base font-bold mb-3">Homepage Stats</h4>
        <div className="grid md:grid-cols-4 gap-3">
          <div className="space-y-1.5"><Label>Delegates</Label><Input {...F("stat_delegates")} /></div>
          <div className="space-y-1.5"><Label>Committees</Label><Input {...F("stat_committees")} /></div>
          <div className="space-y-1.5"><Label>Years Legacy</Label><Input {...F("stat_years")} /></div>
          <div className="space-y-1.5"><Label>Portfolios</Label><Input {...F("stat_portfolios")} /></div>
        </div>
      </div>

      <Button variant="hero" onClick={save} disabled={saving}>
        <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save Settings"}
      </Button>
    </div>
  );
};
