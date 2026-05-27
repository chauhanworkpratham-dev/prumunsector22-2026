import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { 
  updateEdition, uploadEditionLogo, type Edition, 
  BACKGROUND_PAGES, getPageBackgrounds, upsertPageBackground, 
  uploadPageBackgroundImage, type PageBackground, type BgFit, type BgPosition 
} from "@/lib/munApi";
import crest from "@/assets/prumun-crest.png";
import { 
  Save, Upload, ImageIcon, Trash2, Layout, Image as ImageIcon2, 
  Type, Palette, Sliders, Play, Settings2, ShieldCheck, Mail, Phone, Sun, Moon, Sparkles 
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const FITS: BgFit[] = ["cover", "contain", "fill"];
const POSITIONS: BgPosition[] = ["center", "top", "bottom", "left", "right", "top left", "top right", "bottom left", "bottom right"];

export const EditsTab = ({ edition, onSaved }: { edition: Edition; onSaved: () => void }) => {
  const [subTab, setSubTab] = useState("branding");
  
  // ---- Main Edition settings ----
  const buildForm = (e: Edition) => ({
    name: e.name,
    hero_tagline: (e as any).hero_tagline ?? "REGISTRATIONS OPEN",
    countdown_title: e.countdown_title,
    countdown_subtitle: e.countdown_subtitle ?? "",
    event_date: e.event_date ? new Date(e.event_date).toISOString().slice(0, 16) : "",
    event_end_date: e.event_end_date ? new Date(e.event_end_date).toISOString().slice(0, 16) : "",
    venue_name: e.venue_name ?? "",
    venue_address: e.venue_address ?? "",
    instagram_url: e.instagram_url ?? "",
    youtube_url: e.youtube_url ?? "",
    facebook_url: e.facebook_url ?? "",
    stat_delegates: e.stat_delegates ?? "500+",
    stat_committees: e.stat_committees ?? "6",
    stat_years: e.stat_years ?? "10",
    stat_portfolios: e.stat_portfolios ?? "100+",
    
    // QR / disclaimers / settings merged:
    qr_pending_title: e.qr_pending_title ?? "Registration Pending",
    qr_message_approved: e.qr_message_approved ?? "Approved — use this QR to enter",
    qr_message_delegate_pending: e.qr_message_delegate_pending ?? "Awaiting proof of payment verification.",
    qr_message_eb_pending: e.qr_message_eb_pending ?? "Awaiting board role verification.",
    qr_message_oc_pending: e.qr_message_oc_pending ?? "Awaiting OC tracking approval.",
    disclaimer_qr: e.disclaimer_qr ?? "",
    disclaimer_ai: e.disclaimer_ai ?? "",
  });

  const [form, setForm] = useState(buildForm(edition));
  const [saving, setSaving] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const [headerBusy, setHeaderBusy] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(edition.logo_url);
  const [headerPreview, setHeaderPreview] = useState<string | null>(edition.header_logo_url);
  
  const fileRef = useRef<HTMLInputElement>(null);
  const headerFileRef = useRef<HTMLInputElement>(null);

  // ---- Page Backgrounds (from BackgroundsTab) ----
  const [savedBgs, setSavedBgs] = useState<Record<string, PageBackground>>({});
  const [bgDrafts, setBgDrafts] = useState<Record<string, { light: any; dark: any }>>({});
  const [bgModes, setBgModes] = useState<Record<string, "light" | "dark">>({});
  const [savingBgKey, setSavingBgKey] = useState<string | null>(null);
  const bgInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // ---- Theme, Spacing, Animations local settings (CMS visual preferences) ----
  const [customStyle, setCustomStyle] = useState({
    primaryColor: localStorage.getItem("mun_style_primary") || "#0f62fe",
    borderRadius: localStorage.getItem("mun_style_radius") || "1rem",
    fontFamily: localStorage.getItem("mun_style_font") || "Outfit",
    scrollColor: localStorage.getItem("mun_style_scroll") || "#0f62fe",
    transitionSpeed: localStorage.getItem("mun_style_transition") || "300ms",
    animationType: localStorage.getItem("mun_style_animation") || "float",
  });

  useEffect(() => {
    setForm(buildForm(edition));
    setLogoPreview(edition.logo_url);
    setHeaderPreview(edition.header_logo_url);
    loadBackgrounds();
  }, [edition]);

  const loadBackgrounds = async () => {
    const map = await getPageBackgrounds(edition.id);
    setSavedBgs(map);
    const initialDrafts: any = {};
    BACKGROUND_PAGES.forEach(p => {
      const s = map[p.key];
      initialDrafts[p.key] = {
        light: s ? { image_url: s.image_url, opacity: s.opacity, fit: s.fit, position: s.position, blur: s.blur } : { image_url: null, opacity: 0.25, fit: "cover", position: "center", blur: 0 },
        dark: s ? { image_url: s.image_url_dark, opacity: s.opacity_dark, fit: s.fit_dark, position: s.position_dark, blur: s.blur_dark } : { image_url: null, opacity: 0.25, fit: "cover", position: "center", blur: 0 }
      };
    });
    setBgDrafts(initialDrafts);
  };

  const saveStylePreferences = () => {
    localStorage.setItem("mun_style_primary", customStyle.primaryColor);
    localStorage.setItem("mun_style_radius", customStyle.borderRadius);
    localStorage.setItem("mun_style_font", customStyle.fontFamily);
    localStorage.setItem("mun_style_scroll", customStyle.scrollColor);
    localStorage.setItem("mun_style_transition", customStyle.transitionSpeed);
    localStorage.setItem("mun_style_animation", customStyle.animationType);
    toast({ title: "🎨 Design preferences saved!", description: "Applied locally to your browser." });
  };

  const uploadLogo = async (file: File | null, kind: "site" | "header") => {
    if (!file) return;
    const setBusy = kind === "header" ? setHeaderBusy : setLogoBusy;
    setBusy(true);
    try {
      // Mock or call Supabase via a general bucket or the upload logo endpoint
      const path = `logos/${edition.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const { error } = await uploadEditionLogo(edition.id, file, kind as any);
      if (error) throw error;
      toast({ title: "🖼️ Logo uploaded successfully!" });
      onSaved();
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const saveGeneralContent = async () => {
    setSaving(true);
    try {
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
        qr_pending_title: form.qr_pending_title,
        qr_message_approved: form.qr_message_approved,
        qr_message_delegate_pending: form.qr_message_delegate_pending,
        qr_message_eb_pending: form.qr_message_eb_pending,
        qr_message_oc_pending: form.qr_message_oc_pending,
        disclaimer_qr: form.disclaimer_qr,
        disclaimer_ai: form.disclaimer_ai,
      };
      const { error } = await updateEdition(edition.id, patch as any);
      if (error) throw error;
      toast({ title: "✅ Merged CMS Edits Saved!", description: "Settings and copy are live across the site." });
      onSaved();
    } catch (e: any) {
      toast({ title: "Failed to save settings", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const saveBackground = async (key: string) => {
    const d = bgDrafts[key];
    if (!d) return;
    setSavingBgKey(key);
    try {
      let lightUrl = d.light.image_url;
      let darkUrl = d.dark.image_url;
      if (d.light.pendingFile) lightUrl = await uploadPageBackgroundImage(edition.id, key, d.light.pendingFile, "light");
      if (d.dark.pendingFile) darkUrl = await uploadPageBackgroundImage(edition.id, key, d.dark.pendingFile, "dark");

      const { error } = await upsertPageBackground(edition.id, key, {
        image_url: lightUrl,
        opacity: d.light.opacity,
        fit: d.light.fit,
        position: d.light.position,
        blur: d.light.blur,
        image_url_dark: darkUrl,
        opacity_dark: d.dark.opacity,
        fit_dark: d.dark.fit,
        position_dark: d.dark.position,
        blur_dark: d.dark.blur,
      });
      if (error) throw error;
      toast({ title: `Background saved: ${key}` });
      loadBackgrounds();
    } catch (e: any) {
      toast({ title: "Failed to save backdrop", description: e.message, variant: "destructive" });
    } finally { setSavingBgKey(null); }
  };

  const pickBgImage = (key: string, mode: "light" | "dark", file: File) => {
    const url = URL.createObjectURL(file);
    setBgDrafts(prev => {
      const copy = { ...prev };
      copy[key] = {
        ...copy[key],
        [mode]: { ...copy[key][mode], pendingFile: file, previewUrl: url, image_url: url }
      };
      return copy;
    });
  };

  const setBgFitPos = (key: string, mode: "light" | "dark", patch: any) => {
    setBgDrafts(prev => {
      const copy = { ...prev };
      copy[key] = {
        ...copy[key],
        [mode]: { ...copy[key][mode], ...patch }
      };
      return copy;
    });
  };

  const F = (k: keyof typeof form) => ({
    value: form[k],
    onChange: (e: any) => setForm({ ...form, [k]: e.target.value }),
  });

  return (
    <div className="glass-strong rounded-3xl p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-3 border-b border-border/40 pb-4">
        <Layout className="w-6 h-6 text-primary" />
        <div>
          <h2 className="font-display text-2xl font-bold gradient-text-deep">Centralized CMS (Edits)</h2>
          <p className="text-xs text-muted-foreground">Replaces multiple setting panels with one comprehensive website configurator.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sub-Menu Navigation */}
        <div className="lg:w-48 shrink-0 flex flex-row lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none border-b lg:border-b-0 lg:border-r border-border/40 pr-0 lg:pr-4">
          {[
            { id: "branding", label: "Branding & Logos", icon: Sparkles },
            { id: "homepage", label: "Homepage Hero", icon: Layout },
            { id: "backgrounds", label: "Page Backdrops", icon: ImageIcon2 },
            { id: "content", label: "Labels & Disclaimers", icon: Type },
            { id: "ui", label: "QR & UI Copy", icon: Sliders },
            { id: "design", label: "Main Design System", icon: Palette },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap text-left w-full ${
                  subTab === tab.id 
                    ? "bg-primary/10 text-primary border border-primary/20" 
                    : "text-muted-foreground hover:bg-secondary/40"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* CMS Configuration Forms */}
        <div className="flex-1 min-w-0">
          {subTab === "branding" && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="font-display text-lg font-bold">Branding Assets</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="glass rounded-2xl p-4 space-y-3">
                  <Label className="font-bold flex items-center gap-2"><ImageIcon className="w-4 h-4 text-primary" /> Site Branding Logo</Label>
                  <div className="aspect-square w-24 mx-auto rounded-2xl bg-white border border-border/40 flex items-center justify-center p-2 shadow-soft">
                    <img src={logoPreview || crest} alt="Site logo preview" className="max-h-full object-contain" />
                  </div>
                  <Input type="file" accept="image/*" ref={fileRef} onChange={e => uploadLogo(e.target.files?.[0] ?? null, "site")} className="hidden" />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="w-full" onClick={() => fileRef.current?.click()} disabled={logoBusy}>
                      <Upload className="w-3 h-3 mr-1" /> {logoBusy ? "Uploading..." : "Upload Site Logo"}
                    </Button>
                  </div>
                </div>

                <div className="glass rounded-2xl p-4 space-y-3">
                  <Label className="font-bold flex items-center gap-2"><ImageIcon className="w-4 h-4 text-accent" /> Navbar Header Logo</Label>
                  <div className="aspect-square w-24 mx-auto rounded-2xl bg-white border border-border/40 flex items-center justify-center p-2 shadow-soft">
                    <img src={headerPreview || logoPreview || crest} alt="Header logo preview" className="max-h-full object-contain" />
                  </div>
                  <Input type="file" accept="image/*" ref={headerFileRef} onChange={e => uploadLogo(e.target.files?.[0] ?? null, "header")} className="hidden" />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="w-full" onClick={() => headerFileRef.current?.click()} disabled={headerBusy}>
                      <Upload className="w-3 h-3 mr-1" /> {headerBusy ? "Uploading..." : "Upload Header Logo"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <Label>Conference primary name</Label>
                  <Input {...F("name")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Badge hero tagline</Label>
                  <Input {...F("hero_tagline")} placeholder="REGISTRATIONS OPEN" />
                </div>
              </div>
            </div>
          )}

          {subTab === "homepage" && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="font-display text-lg font-bold">Homepage Content & Stats</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Countdown title</Label>
                  <Input {...F("countdown_title")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Countdown subtitle</Label>
                  <Input {...F("countdown_subtitle")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Event venue name</Label>
                  <Input {...F("venue_name")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Event venue address</Label>
                  <Input {...F("venue_address")} />
                </div>
              </div>

              <div className="border-t border-border/40 pt-4 mt-2">
                <Label className="font-bold block mb-3 text-primary">Live Legacy Counters</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <Label>Delegates stat</Label>
                    <Input {...F("stat_delegates")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Committees stat</Label>
                    <Input {...F("stat_committees")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Years Legacy stat</Label>
                    <Input {...F("stat_years")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Portfolios stat</Label>
                    <Input {...F("stat_portfolios")} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {subTab === "backgrounds" && (
            <div className="space-y-5 animate-fade-in max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <h3 className="font-display text-lg font-bold">Interactive Page Backgrounds</h3>
                <p className="text-xs text-muted-foreground mt-1">Upload high-resolution image/video backdrops for specific sub-pages.</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {BACKGROUND_PAGES.map(p => {
                  const d = bgDrafts[p.key] || { light: {}, dark: {} };
                  const mode = bgModes[p.key] || "light";
                  const side = d[mode];
                  const previewUrl = side.previewUrl || side.image_url;
                  const isSaving = savingBgKey === p.key;

                  return (
                    <div key={p.key} className="glass rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold text-xs">{p.label}</Label>
                        <div className="flex rounded-lg border border-border/40 overflow-hidden text-[9px]">
                          <button onClick={() => setBgModes({ ...bgModes, [p.key]: "light" })} className={`px-2 py-0.5 flex items-center gap-1 ${mode === "light" ? "bg-primary text-white" : "bg-transparent text-muted-foreground"}`}><Sun className="w-2.5 h-2.5" /> Light</button>
                          <button onClick={() => setBgModes({ ...bgModes, [p.key]: "dark" })} className={`px-2 py-0.5 flex items-center gap-1 ${mode === "dark" ? "bg-primary text-white" : "bg-transparent text-muted-foreground"}`}><Moon className="w-2.5 h-2.5" /> Dark</button>
                        </div>
                      </div>

                      <div className="aspect-video rounded-xl bg-muted border border-border/40 flex items-center justify-center relative overflow-hidden">
                        {previewUrl ? (
                          <img src={previewUrl} alt="" className="absolute inset-0 w-full h-full" style={{ objectFit: side.fit, opacity: side.opacity, filter: side.blur > 0 ? `blur(${side.blur}px)` : undefined }} />
                        ) : (
                          <span className="text-[10px] text-muted-foreground">No image backdrop</span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="space-y-1">
                          <Label className="text-[9px]">Fit</Label>
                          <select value={side.fit} onChange={e => setBgFitPos(p.key, mode, { fit: e.target.value })} className="h-8 w-full rounded border bg-background px-2 text-xs">
                            {FITS.map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px]">Opacity ({Math.round(side.opacity * 100)}%)</Label>
                          <Slider value={[side.opacity * 100]} min={10} max={100} step={10} onValueChange={v => setBgFitPos(p.key, mode, { opacity: v[0] / 100 })} />
                        </div>
                      </div>

                      <input type="file" accept="image/*" hidden ref={el => (bgInputRefs.current[`${p.key}-${mode}`] = el)} onChange={e => { const f = e.target.files?.[0]; if (f) pickBgImage(p.key, mode, f); }} />
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => bgInputRefs.current[`${p.key}-${mode}`]?.click()}>Choose File</Button>
                        <Button size="sm" variant="hero" className="text-xs" onClick={() => saveBackground(p.key)} disabled={isSaving}>
                          Save Backdrop
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {subTab === "content" && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="font-display text-lg font-bold">General Disclaimers & Contact Copy</h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Delegate Entry QR Code Disclaimer (locks, seat allocation alerts)</Label>
                  <Textarea rows={3} {...F("disclaimer_qr")} />
                </div>
                <div className="space-y-1.5">
                  <Label>AI Chat Assistant Disclaimer (Debate prep terms, constraints)</Label>
                  <Textarea rows={3} {...F("disclaimer_ai")} />
                </div>
              </div>

              <div className="border-t border-border/40 pt-4">
                <Label className="font-bold block mb-2 text-primary">Footer Contact Information</Label>
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>Instagram Handle</Label>
                    <Input {...F("instagram_url")} placeholder="https://instagram.com/..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label>YouTube Link</Label>
                    <Input {...F("youtube_url")} placeholder="https://youtube.com/..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Facebook Link</Label>
                    <Input {...F("facebook_url")} placeholder="https://facebook.com/..." />
                  </div>
                </div>
              </div>
            </div>
          )}

          {subTab === "ui" && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="font-display text-lg font-bold">Steppers & UI Modal Texts</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>QR Code Pending header title</Label>
                  <Input {...F("qr_pending_title")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Approved entry ticket description</Label>
                  <Input {...F("qr_message_approved")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Delegate pending proof verification message</Label>
                  <Input {...F("qr_message_delegate_pending")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Executive Board verification message</Label>
                  <Input {...F("qr_message_eb_pending")} />
                </div>
                <div className="space-y-1.5">
                  <Label>OC verification message</Label>
                  <Input {...F("qr_message_oc_pending")} />
                </div>
              </div>
            </div>
          )}

          {subTab === "design" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="font-display text-lg font-bold">Dynamic Design preferences</h3>
                <p className="text-xs text-muted-foreground mt-1">Configure premium local CSS style constants applied locally.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Branding Primary HEX Color</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={customStyle.primaryColor} onChange={e => setCustomStyle({ ...customStyle, primaryColor: e.target.value })} className="w-12 h-10 p-0.5" />
                    <Input type="text" value={customStyle.primaryColor} onChange={e => setCustomStyle({ ...customStyle, primaryColor: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Custom Scrollbar HEX Accent</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={customStyle.scrollColor} onChange={e => setCustomStyle({ ...customStyle, scrollColor: e.target.value })} className="w-12 h-10 p-0.5" />
                    <Input type="text" value={customStyle.scrollColor} onChange={e => setCustomStyle({ ...customStyle, scrollColor: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Border Radius styling</Label>
                  <select value={customStyle.borderRadius} onChange={e => setCustomStyle({ ...customStyle, borderRadius: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="0.5rem">0.5rem (Sharp SaaS)</option>
                    <option value="1rem">1rem (Frosted curved)</option>
                    <option value="1.5rem">1.5rem (Fluid organic)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Global typography family</Label>
                  <select value={customStyle.fontFamily} onChange={e => setCustomStyle({ ...customStyle, fontFamily: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="Inter">Inter (Clean modern)</option>
                    <option value="Outfit">Outfit (Cinematic rounded)</option>
                    <option value="Roboto">Roboto (Technical plain)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-border/40">
                <Button variant="hero" onClick={saveStylePreferences}>Apply Design styling</Button>
              </div>
            </div>
          )}

          {/* Central CMS Save General button */}
          {subTab !== "design" && subTab !== "backgrounds" && (
            <div className="flex justify-end pt-6 border-t border-border/40 mt-4">
              <Button variant="hero" onClick={saveGeneralContent} disabled={saving} className="shadow-elegant">
                <Save className="w-4 h-4 mr-2" /> {saving ? "Saving CMS content..." : "Save Merged CMS changes"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
