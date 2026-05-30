import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  updateEdition, uploadEditionLogo, type Edition,
  BACKGROUND_PAGES, getPageBackgrounds, upsertPageBackground,
  uploadPageBackgroundImage, type PageBackground, type BgFit, type BgPosition,
} from "@/lib/munApi";
import crest from "@/assets/prumun-crest.png";
import {
  Save, Upload, ImageIcon, Layout, Type, Palette, Sliders,
  Settings2, Sparkles, Sun, Moon, Globe, CreditCard, QrCode,
  ShieldAlert, Megaphone, Building2, Instagram, Youtube, Facebook,
  MapPin, CalendarDays, Trophy, Users, BarChart3, Eye, EyeOff,
  CheckCircle2, Clock, RefreshCw, Loader2, ChevronDown, ChevronRight,
  AlertCircle, Info, Layers, Monitor, Smartphone,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────
   Types & constants
────────────────────────────────────────────── */
const FITS: BgFit[]         = ["cover", "contain", "fill"];
const POSITIONS: BgPosition[] = ["center","top","bottom","left","right","top left","top right","bottom left","bottom right"];
type PaymentMode = "upi" | "cash" | "none";

/* sidebar nav items */
const SECTIONS = [
  { id: "branding",    label: "Branding & Identity", icon: Sparkles,    desc: "Logos, conference name, taglines"      },
  { id: "hero",        label: "Hero & Countdown",    icon: Layout,      desc: "Homepage hero content & dates"         },
  { id: "stats",       label: "Stats & Numbers",     icon: BarChart3,   desc: "Delegate & committee counters"         },
  { id: "socials",     label: "Social & Contact",    icon: Globe,       desc: "Footer links, venue, social handles"   },
  { id: "payment",     label: "Payment Settings",    icon: CreditCard,  desc: "UPI, bank, modes, instructions"        },
  { id: "qr",          label: "QR & Entry Copy",     icon: QrCode,      desc: "QR ticket messages & status texts"     },
  { id: "ui_copy",     label: "UI Microcopy",        icon: Type,        desc: "Button labels, action texts, notices"  },
  { id: "disclaimers", label: "Disclaimers",         icon: ShieldAlert, desc: "Legal disclaimers shown to delegates"  },
  { id: "backdrops",   label: "Page Backdrops",      icon: Layers,      desc: "Per-page background images"           },
  { id: "design",      label: "Design System",       icon: Palette,     desc: "Colors, radius, fonts (local)"        },
] as const;
type SectionId = typeof SECTIONS[number]["id"];

/* ──────────────────────────────────────────────
   Field helpers
────────────────────────────────────────────── */
const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-semibold text-foreground/80">{label}</Label>
    {children}
    {hint && <p className="text-[10px] text-muted-foreground leading-snug">{hint}</p>}
  </div>
);

const SectionHeader = ({ icon: Icon, label, desc }: { icon: React.ElementType; label: string; desc: string }) => (
  <div className="flex items-start gap-3 pb-5 mb-5 border-b border-border/50">
    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <h3 className="font-display text-lg font-bold">{label}</h3>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  </div>
);

const Divider = ({ label }: { label: string }) => (
  <div className="flex items-center gap-3 py-2">
    <div className="flex-1 h-px bg-border/60" />
    <span className="text-[9px] font-bold tracking-[0.2em] text-muted-foreground uppercase">{label}</span>
    <div className="flex-1 h-px bg-border/60" />
  </div>
);

/* ──────────────────────────────────────────────
   Main component
────────────────────────────────────────────── */
export const EditsTab = ({ edition, onSaved }: { edition: Edition; onSaved: () => void }) => {
  const [section, setSection]   = useState<SectionId>("branding");
  const [saving,  setSaving]    = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const [hdrBusy,  setHdrBusy]  = useState(false);
  const [payQrBusy, setPayQrBusy] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  /* ── form state covering every Edition field ── */
  const init = (e: Edition) => ({
    /* identity */
    name:                   e.name                   ?? "",
    hero_tagline:           (e as any).hero_tagline   ?? "",
    hero_subtitle_accent:   (e as any).hero_subtitle_accent ?? "Diplomacy · Debate · Destiny",
    hero_subtitle:          (e as any).hero_subtitle  ?? "The premier Model United Nations conference at Prudence School, Dwarka — where the next generation of global leaders finds its voice.",
    /* hero / dates */
    countdown_title:        e.countdown_title         ?? "Conference Begins In",
    countdown_subtitle:     e.countdown_subtitle      ?? "",
    event_date:             e.event_date              ? new Date(e.event_date).toISOString().slice(0,16)     : "",
    event_end_date:         e.event_end_date          ? new Date(e.event_end_date).toISOString().slice(0,16) : "",
    /* stats */
    stat_delegates:         e.stat_delegates          ?? "500+",
    stat_committees:        e.stat_committees         ?? "6",
    stat_years:             e.stat_years              ?? "10",
    stat_portfolios:        e.stat_portfolios         ?? "100+",
    /* venue */
    venue_name:             e.venue_name              ?? "",
    venue_address:          e.venue_address           ?? "",
    /* socials */
    instagram_url:          e.instagram_url           ?? "",
    youtube_url:            e.youtube_url             ?? "",
    facebook_url:           e.facebook_url            ?? "",
    /* payment */
    payment_mode_delegate:  e.payment_mode_delegate   ?? "upi" as PaymentMode,
    payment_mode_eb:        e.payment_mode_eb         ?? "upi" as PaymentMode,
    payment_mode_oc:        e.payment_mode_oc         ?? "upi" as PaymentMode,
    upi_id:                 e.upi_id                  ?? "",
    bank_details:           e.bank_details            ?? "",
    payment_instructions:   e.payment_instructions    ?? "",
    /* payment qr image URL stored separately */
    payment_qr_url:         e.payment_qr_url          ?? "",
    /* qr entry messages */
    qr_pending_title:               e.qr_pending_title               ?? "Registration Pending",
    qr_message_approved:            e.qr_message_approved            ?? "Approved — present this QR at entry",
    qr_message_delegate_pending:    e.qr_message_delegate_pending    ?? "Awaiting payment verification.",
    qr_message_eb_pending:          e.qr_message_eb_pending          ?? "Awaiting board role verification.",
    qr_message_oc_pending:          e.qr_message_oc_pending          ?? "Awaiting OC tracking approval.",
    /* ui microcopy */
    txt_pay_upi_btn:                e.txt_pay_upi_btn                ?? "Pay via UPI",
    txt_pay_cash_notice:            e.txt_pay_cash_notice            ?? "Pay cash at the venue registration desk.",
    txt_auto_lock_notice:           e.txt_auto_lock_notice           ?? "Portfolio locked after payment approval.",
    txt_receipt_uploaded:           e.txt_receipt_uploaded           ?? "Receipt uploaded — awaiting review.",
    txt_payment_rejected:           e.txt_payment_rejected           ?? "Payment rejected — please re-upload.",
    txt_locked_awaiting_entry:      e.txt_locked_awaiting_entry      ?? "Locked · Show QR at entry gate.",
    txt_change_portfolio_btn:       e.txt_change_portfolio_btn       ?? "Change Portfolio",
    txt_needs_reselection:          e.txt_needs_reselection          ?? "Your portfolio needs to be reselected.",
    txt_upload_receipt:             e.txt_upload_receipt             ?? "Upload Payment Receipt",
    /* disclaimers */
    disclaimer_qr:          e.disclaimer_qr           ?? "",
    disclaimer_ai:          e.disclaimer_ai           ?? "",
  });

  const [form, setForm]             = useState(init(edition));
  const [logoPreview, setLogo]      = useState<string|null>(edition.logo_url);
  const [hdrPreview,  setHdr]       = useState<string|null>(edition.header_logo_url);
  const [payQrPreview, setPayQr]    = useState<string|null>(edition.payment_qr_url);

  /* backdrop state */
  const [savedBgs,    setSavedBgs]   = useState<Record<string, PageBackground>>({});
  const [bgDrafts,    setBgDrafts]   = useState<Record<string, { light: any; dark: any }>>({});
  const [bgModes,     setBgModes]    = useState<Record<string, "light"|"dark">>({});
  const [savingBgKey, setBgSaving]   = useState<string|null>(null);

  /* design prefs */
  const [design, setDesign] = useState({
    primaryColor: localStorage.getItem("mun_style_primary")    || "#1a6ef0",
    scrollColor:  localStorage.getItem("mun_style_scroll")     || "#1a6ef0",
    borderRadius: localStorage.getItem("mun_style_radius")     || "1rem",
    fontFamily:   localStorage.getItem("mun_style_font")       || "DM Sans",
    transition:   localStorage.getItem("mun_style_transition") || "300ms",
  });

  /* file refs */
  const logoRef    = useRef<HTMLInputElement>(null);
  const hdrRef     = useRef<HTMLInputElement>(null);
  const payQrRef   = useRef<HTMLInputElement>(null);
  const bgRefs     = useRef<Record<string, HTMLInputElement|null>>({});

  useEffect(() => {
    setForm(init(edition));
    setLogo(edition.logo_url);
    setHdr(edition.header_logo_url);
    setPayQr(edition.payment_qr_url);
    loadBgs();
  }, [edition]);

  const loadBgs = async () => {
    const map = await getPageBackgrounds(edition.id);
    setSavedBgs(map);
    const drafts: any = {};
    BACKGROUND_PAGES.forEach(p => {
      const s = map[p.key];
      drafts[p.key] = {
        light: { image_url: s?.image_url ?? null,      opacity: s?.opacity      ?? 0.25, fit: s?.fit      ?? "cover", position: s?.position      ?? "center", blur: s?.blur      ?? 0 },
        dark:  { image_url: s?.image_url_dark ?? null, opacity: s?.opacity_dark ?? 0.25, fit: s?.fit_dark ?? "cover", position: s?.position_dark ?? "center", blur: s?.blur_dark ?? 0 },
      };
    });
    setBgDrafts(drafts);
  };

  /* ── field helpers ── */
  const set = (k: keyof typeof form, v: any) => setForm(prev => ({ ...prev, [k]: v }));
  const F = (k: keyof typeof form) => ({ value: form[k] as string, onChange: (e: any) => set(k, e.target.value) });

  /* ── logo upload ── */
  const uploadLogo = async (file: File|null, kind: "site"|"header"|"payment_qr") => {
    if (!file) return;
    if (kind === "site")    setLogoBusy(true);
    if (kind === "header")  setHdrBusy(true);
    if (kind === "payment_qr") setPayQrBusy(true);
    try {
      const preview = URL.createObjectURL(file);
      if (kind === "site")       setLogo(preview);
      else if (kind === "header") setHdr(preview);
      else                        setPayQr(preview);
      const { error } = await uploadEditionLogo(edition.id, file, kind as any);
      if (error) throw error;
      toast({ title: "Image uploaded successfully!" });
      onSaved();
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setLogoBusy(false); setHdrBusy(false); setPayQrBusy(false);
    }
  };

  /* ── save all text/config fields ── */
  const save = async () => {
    setSaving(true);
    try {
      const patch: Partial<Edition> = {
        name:                            form.name,
        hero_tagline:                    form.hero_tagline,
        countdown_title:                 form.countdown_title,
        countdown_subtitle:              form.countdown_subtitle || null,
        event_date:                      new Date(form.event_date).toISOString(),
        event_end_date:                  form.event_end_date ? new Date(form.event_end_date).toISOString() : null,
        stat_delegates:                  form.stat_delegates,
        stat_committees:                 form.stat_committees,
        stat_years:                      form.stat_years,
        stat_portfolios:                 form.stat_portfolios,
        venue_name:                      form.venue_name   || null,
        venue_address:                   form.venue_address || null,
        instagram_url:                   form.instagram_url || null,
        youtube_url:                     form.youtube_url   || null,
        facebook_url:                    form.facebook_url  || null,
        payment_mode_delegate:           form.payment_mode_delegate as any,
        payment_mode_eb:                 form.payment_mode_eb       as any,
        payment_mode_oc:                 form.payment_mode_oc       as any,
        upi_id:                          form.upi_id || null,
        bank_details:                    form.bank_details || null,
        payment_instructions:            form.payment_instructions || null,
        payment_qr_url:                  form.payment_qr_url || null,
        qr_pending_title:                form.qr_pending_title,
        qr_message_approved:             form.qr_message_approved,
        qr_message_delegate_pending:     form.qr_message_delegate_pending,
        qr_message_eb_pending:           form.qr_message_eb_pending,
        qr_message_oc_pending:           form.qr_message_oc_pending,
        txt_pay_upi_btn:                 form.txt_pay_upi_btn,
        txt_pay_cash_notice:             form.txt_pay_cash_notice,
        txt_auto_lock_notice:            form.txt_auto_lock_notice,
        txt_receipt_uploaded:            form.txt_receipt_uploaded,
        txt_payment_rejected:            form.txt_payment_rejected,
        txt_locked_awaiting_entry:       form.txt_locked_awaiting_entry,
        txt_change_portfolio_btn:        form.txt_change_portfolio_btn,
        txt_needs_reselection:           form.txt_needs_reselection,
        txt_upload_receipt:              form.txt_upload_receipt,
        disclaimer_qr:                   form.disclaimer_qr,
        disclaimer_ai:                   form.disclaimer_ai,
      };
      const { error } = await updateEdition(edition.id, patch as any);
      if (error) throw error;
      toast({ title: "Changes saved!", description: "All CMS updates are live across the site." });
      onSaved();
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  /* ── backdrop helpers ── */
  const setBgSide = (key: string, mode: "light"|"dark", patch: any) =>
    setBgDrafts(prev => ({ ...prev, [key]: { ...prev[key], [mode]: { ...prev[key]?.[mode], ...patch } } }));

  const pickBg = (key: string, mode: "light"|"dark", file: File) => {
    const url = URL.createObjectURL(file);
    setBgSide(key, mode, { pendingFile: file, image_url: url });
  };

  const saveBg = async (key: string) => {
    const d = bgDrafts[key]; if (!d) return;
    setBgSaving(key);
    try {
      let lightUrl = d.light.image_url;
      let darkUrl  = d.dark.image_url;
      if (d.light.pendingFile) lightUrl = await uploadPageBackgroundImage(edition.id, key, d.light.pendingFile, "light");
      if (d.dark.pendingFile)  darkUrl  = await uploadPageBackgroundImage(edition.id, key, d.dark.pendingFile,  "dark");
      const { error } = await upsertPageBackground(edition.id, key, {
        image_url: lightUrl, opacity: d.light.opacity, fit: d.light.fit, position: d.light.position, blur: d.light.blur,
        image_url_dark: darkUrl, opacity_dark: d.dark.opacity, fit_dark: d.dark.fit, position_dark: d.dark.position, blur_dark: d.dark.blur,
      });
      if (error) throw error;
      toast({ title: `Backdrop saved — ${key}` });
      loadBgs();
    } catch (e: any) {
      toast({ title: "Backdrop save failed", description: e.message, variant: "destructive" });
    } finally { setBgSaving(null); }
  };

  /* ── design prefs ── */
  const saveDesign = () => {
    Object.entries(design).forEach(([k, v]) => localStorage.setItem(`mun_style_${k}`, v));
    document.documentElement.style.setProperty("--radius", design.borderRadius);
    toast({ title: "Design preferences saved locally." });
  };

  const PayModeSelector = ({ field }: { field: "payment_mode_delegate"|"payment_mode_eb"|"payment_mode_oc" }) => (
    <div className="flex rounded-xl border border-border overflow-hidden text-xs">
      {(["upi","cash","none"] as PaymentMode[]).map(m => (
        <button key={m} type="button"
          onClick={() => set(field, m)}
          className={cn("flex-1 py-2 font-semibold transition-colors capitalize",
            form[field] === m ? "bg-primary text-white" : "hover:bg-secondary text-muted-foreground"
          )}>
          {m}
        </button>
      ))}
    </div>
  );

  const ImageUploader = ({
    label, hint, preview, fallback, busy, fileRef: ref, onPick, onUpload, accept = "image/*",
  }: {
    label: string; hint?: string; preview: string|null; fallback?: string;
    busy: boolean; fileRef: React.RefObject<HTMLInputElement>;
    onPick?: (f: File) => void; onUpload?: (f: File) => void; accept?: string;
  }) => (
    <div className="space-y-2">
      <Label className="text-xs font-semibold">{label}</Label>
      <div className="glass rounded-2xl p-4 flex flex-col items-center gap-3">
        <div className="w-24 h-24 rounded-xl bg-secondary flex items-center justify-center overflow-hidden border border-border/60">
          {preview
            ? <img src={preview} alt="" className="w-full h-full object-contain" />
            : fallback
              ? <img src={fallback} alt="" className="w-full h-full object-contain opacity-30" />
              : <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
          }
        </div>
        <input type="file" accept={accept} hidden ref={ref}
          onChange={e => {
            const f = e.target.files?.[0];
            if (!f) return;
            if (onPick) onPick(f);
            if (onUpload) onUpload(f);
          }} />
        <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => ref.current?.click()} disabled={busy}>
          {busy ? <><Loader2 className="w-3 h-3 animate-spin" /> Uploading…</> : <><Upload className="w-3 h-3" /> Choose image</>}
        </Button>
        {hint && <p className="text-[10px] text-muted-foreground text-center">{hint}</p>}
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════ */
  return (
    <div className="glass-strong rounded-3xl overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-primary text-white flex items-center justify-center">
            <Settings2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">Centralised CMS</h2>
            <p className="text-[10px] text-muted-foreground">Every editable element in one place — text, images, colors, copy</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="pill bg-success/10 text-success text-[9px]">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse inline-block" /> Live
          </span>
          {section !== "backdrops" && section !== "design" && (
            <Button onClick={save} disabled={saving}
              className="bg-gradient-primary text-white border-0 font-semibold text-xs shadow-sm hover:opacity-90">
              {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</> : <><Save className="w-3.5 h-3.5" /> Save changes</>}
            </Button>
          )}
        </div>
      </div>

      <div className="flex min-h-[600px]">
        {/* ── Sidebar ── */}
        <aside className="w-52 shrink-0 border-r border-border/50 py-4 px-2 bg-gradient-surface hidden md:block">
          <p className="section-label px-3 mb-3">Sections</p>
          <nav className="space-y-0.5">
            {SECTIONS.map(s => {
              const Icon = s.icon;
              return (
                <button key={s.id} onClick={() => setSection(s.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all text-xs font-medium",
                    section === s.id
                      ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  )}>
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="leading-tight">{s.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ── Mobile section picker ── */}
        <div className="md:hidden w-full border-b border-border/50 px-4 py-2 bg-gradient-surface">
          <select value={section} onChange={e => setSection(e.target.value as SectionId)}
            className="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs font-semibold">
            {SECTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>

        {/* ── Content panel ── */}
        <div className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-240px)] min-w-0">

          {/* ════════════════════ BRANDING ════════════════════ */}
          {section === "branding" && (
            <div className="space-y-6 animate-fade-in">
              <SectionHeader icon={Sparkles} label="Branding & Identity"
                desc="Conference name, logo assets, and hero tagline shown on every page." />

              <div className="grid md:grid-cols-3 gap-4">
                <ImageUploader label="Site / Hero Logo" hint="Shown on homepage crest"
                  preview={logoPreview} fallback={crest}
                  busy={logoBusy} fileRef={logoRef} onUpload={f => uploadLogo(f, "site")} />
                <div className="md:col-span-2 space-y-4">
                  <Field label="Conference name" hint="Full edition name e.g. PRUMUN 2026">
                    <Input {...F("name")} placeholder="PRUMUN 2026" />
                  </Field>
                  <Field label="Hero eyebrow pill" hint="Leave empty to hide. Optional small pill shown on hero.">
                    <Input {...F("hero_tagline")} placeholder="Leave blank to hide" />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════ HERO / COUNTDOWN ════════════════════ */}
          {section === "hero" && (
            <div className="space-y-5 animate-fade-in">
              <SectionHeader icon={Layout} label="Hero & Countdown"
                desc="Everything shown in the full-screen hero section on the homepage." />

              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Countdown title" hint="Text above the countdown units">
                  <Input {...F("countdown_title")} placeholder="Conference Begins In" />
                </Field>
                <Field label="Countdown subtitle" hint="Optional smaller text below (leave empty to hide)">
                  <Input {...F("countdown_subtitle")} placeholder="Seats are filling fast…" />
                </Field>
                <Field label="Event start date & time">
                  <Input type="datetime-local" {...F("event_date")} />
                </Field>
                <Field label="Event end date & time" hint="Optional — leave blank for single-day events">
                  <Input type="datetime-local" {...F("event_end_date")} />
                </Field>
                <Field label="Hero italic tagline" hint='Shown below the title. E.g. "Diplomacy · Debate · Destiny"' className="md:col-span-2">
                  <Input {...F("hero_subtitle_accent")} placeholder="Diplomacy · Debate · Destiny" />
                </Field>
                <Field label="Hero subtitle paragraph" hint="Full description shown below the italic line." className="md:col-span-2">
                  <Textarea {...F("hero_subtitle")} rows={3} placeholder="The premier Model United Nations conference…" />
                </Field>
              </div>
            </div>
          )}

          {/* ════════════════════ STATS ════════════════════ */}
          {section === "stats" && (
            <div className="space-y-5 animate-fade-in">
              <SectionHeader icon={BarChart3} label="Stats & Numbers"
                desc="The four stat counters shown below the hero on the homepage." />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { field: "stat_delegates",  label: "Delegates",     icon: Users    },
                  { field: "stat_committees", label: "Committees",    icon: Building2 },
                  { field: "stat_years",      label: "Years Legacy",  icon: Trophy   },
                  { field: "stat_portfolios", label: "Portfolios",    icon: BarChart3 },
                ].map(({ field, label, icon: Icon }) => (
                  <div key={field} className="glass rounded-2xl p-4 space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <Label className="text-xs font-semibold">{label}</Label>
                    <Input {...F(field as keyof typeof form)} placeholder="500+" />
                  </div>
                ))}
              </div>
              <div className="glass rounded-xl p-3 flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                Values can include units like "500+" or "10+". They are displayed exactly as typed.
              </div>
            </div>
          )}

          {/* ════════════════════ SOCIALS / CONTACT ════════════════════ */}
          {section === "socials" && (
            <div className="space-y-5 animate-fade-in">
              <SectionHeader icon={Globe} label="Social & Contact"
                desc="Footer social links, venue address, and map label." />

              <Divider label="Social media" />
              <div className="grid md:grid-cols-3 gap-4">
                <Field label="Instagram URL">
                  <div className="flex gap-2 items-center">
                    <Instagram className="w-4 h-4 text-muted-foreground shrink-0" />
                    <Input {...F("instagram_url")} placeholder="https://instagram.com/prumun" />
                  </div>
                </Field>
                <Field label="YouTube URL">
                  <div className="flex gap-2 items-center">
                    <Youtube className="w-4 h-4 text-muted-foreground shrink-0" />
                    <Input {...F("youtube_url")} placeholder="https://youtube.com/@prumun" />
                  </div>
                </Field>
                <Field label="Facebook URL">
                  <div className="flex gap-2 items-center">
                    <Facebook className="w-4 h-4 text-muted-foreground shrink-0" />
                    <Input {...F("facebook_url")} placeholder="https://facebook.com/prumun" />
                  </div>
                </Field>
              </div>

              <Divider label="Venue" />
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Venue name" hint="Shown in footer and hero meta strip">
                  <div className="flex gap-2 items-center">
                    <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                    <Input {...F("venue_name")} placeholder="Prudence School, Sector 22" />
                  </div>
                </Field>
                <Field label="Full venue address" hint="Shown in footer contact section">
                  <div className="flex gap-2 items-start">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-2.5" />
                    <Textarea rows={2} {...F("venue_address")} placeholder="Sector 22, Dwarka, New Delhi — 110077" />
                  </div>
                </Field>
              </div>
            </div>
          )}

          {/* ════════════════════ PAYMENT ════════════════════ */}
          {section === "payment" && (
            <div className="space-y-5 animate-fade-in">
              <SectionHeader icon={CreditCard} label="Payment Settings"
                desc="Payment modes per participant role, UPI ID, bank details, QR image, and instructions." />

              <Divider label="Payment modes per role" />
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { field: "payment_mode_delegate", label: "Delegate mode"          },
                  { field: "payment_mode_eb",        label: "Executive Board mode"  },
                  { field: "payment_mode_oc",        label: "Organising Committee"  },
                ].map(({ field, label }) => (
                  <div key={field} className="glass rounded-2xl p-4 space-y-2">
                    <Label className="text-xs font-semibold">{label}</Label>
                    <PayModeSelector field={field as any} />
                  </div>
                ))}
              </div>

              <Divider label="UPI / Bank details" />
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="UPI ID" hint="e.g. prumun@okaxis — shown to delegates on the payment screen">
                  <Input {...F("upi_id")} placeholder="prumun@okaxis" />
                </Field>
                <Field label="Bank details" hint="Multi-line: shown when bank transfer is needed">
                  <Textarea rows={3} {...F("bank_details")} placeholder={"Bank: XYZ Bank\nAccount: 00000000\nIFSC: XYZB0001"} />
                </Field>
              </div>

              <Divider label="Payment QR code image" />
              <div className="grid md:grid-cols-2 gap-6 items-start">
                <ImageUploader label="UPI QR code image"
                  hint="Upload a QR image. Delegates scan this directly. PNG recommended."
                  preview={payQrPreview} busy={payQrBusy}
                  fileRef={payQrRef} onUpload={f => uploadLogo(f, "payment_qr")} />
                <Field label="Payment instructions" hint="Rich instructions shown in the delegate payment modal">
                  <Textarea rows={6} {...F("payment_instructions")}
                    placeholder={"1. Scan the UPI QR or use the UPI ID above.\n2. Enter the exact amount shown.\n3. Screenshot the payment confirmation.\n4. Upload it using the button below."} />
                </Field>
              </div>
            </div>
          )}

          {/* ════════════════════ QR ENTRY COPY ════════════════════ */}
          {section === "qr" && (
            <div className="space-y-5 animate-fade-in">
              <SectionHeader icon={QrCode} label="QR & Entry Copy"
                desc="All text shown on delegate QR ticket cards based on their registration and payment status." />

              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Pending header title" hint="Shown when registration is submitted but not yet approved">
                  <Input {...F("qr_pending_title")} />
                </Field>
                <Field label="Approved entry message" hint="Shown on the approved QR ticket">
                  <Input {...F("qr_message_approved")} />
                </Field>
                <Field label="Delegate payment pending" hint="Status message for delegates awaiting payment review">
                  <Textarea rows={2} {...F("qr_message_delegate_pending")} />
                </Field>
                <Field label="Executive Board pending" hint="Status message for EB members awaiting role verification">
                  <Textarea rows={2} {...F("qr_message_eb_pending")} />
                </Field>
                <Field label="Organising Committee pending" hint="Status message for OC members awaiting approval">
                  <Textarea rows={2} {...F("qr_message_oc_pending")} />
                </Field>
              </div>
            </div>
          )}

          {/* ════════════════════ UI MICROCOPY ════════════════════ */}
          {section === "ui_copy" && (
            <div className="space-y-5 animate-fade-in">
              <SectionHeader icon={Type} label="UI Microcopy"
                desc="Every button label, status notice, and action text shown in the delegate portal." />

              <Divider label="Payment flow buttons & notices" />
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="UPI pay button text" hint="Label on the 'Pay now' button">
                  <Input {...F("txt_pay_upi_btn")} />
                </Field>
                <Field label="Cash payment notice" hint="Shown when payment mode is 'cash'">
                  <Textarea rows={2} {...F("txt_pay_cash_notice")} />
                </Field>
                <Field label="Upload receipt button label">
                  <Input {...F("txt_upload_receipt")} />
                </Field>
                <Field label="Receipt uploaded confirmation notice">
                  <Textarea rows={2} {...F("txt_receipt_uploaded")} />
                </Field>
                <Field label="Payment rejected notice" hint="Shown when secretariat rejects a receipt">
                  <Textarea rows={2} {...F("txt_payment_rejected")} />
                </Field>
              </div>

              <Divider label="Portfolio & lock status" />
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Auto-lock notice" hint="Shown when portfolio gets locked post-payment">
                  <Textarea rows={2} {...F("txt_auto_lock_notice")} />
                </Field>
                <Field label="Locked awaiting entry" hint="Shown after payment approved — QR active state text">
                  <Textarea rows={2} {...F("txt_locked_awaiting_entry")} />
                </Field>
                <Field label="Change portfolio button label">
                  <Input {...F("txt_change_portfolio_btn")} />
                </Field>
                <Field label="Needs reselection notice" hint="Shown when delegate must pick a new portfolio">
                  <Textarea rows={2} {...F("txt_needs_reselection")} />
                </Field>
              </div>
            </div>
          )}

          {/* ════════════════════ DISCLAIMERS ════════════════════ */}
          {section === "disclaimers" && (
            <div className="space-y-5 animate-fade-in">
              <SectionHeader icon={ShieldAlert} label="Disclaimers"
                desc="Legal and informational disclaimers shown to delegates at specific touchpoints." />

              <Field label="QR entry disclaimer"
                hint="Shown on the delegate's QR ticket page — attendance rules, seat policies, etc.">
                <Textarea rows={5} {...F("disclaimer_qr")}
                  placeholder="Your QR code is personal and non-transferable. Prudence School authorities reserve the right to deny entry to any participant..." />
              </Field>

              <Field label="AI assistant disclaimer"
                hint="Shown before delegates use the AI debate prep assistant. Include usage limits and terms.">
                <Textarea rows={5} {...F("disclaimer_ai")}
                  placeholder="The AI assistant is provided for educational debate preparation purposes only. Responses are AI-generated and should not be treated as official PRUMUN guidance..." />
              </Field>
            </div>
          )}

          {/* ════════════════════ PAGE BACKDROPS ════════════════════ */}
          {section === "backdrops" && (
            <div className="space-y-5 animate-fade-in">
              <SectionHeader icon={Layers} label="Page Backdrops"
                desc="Upload custom background images for each public page. Separate light and dark mode images supported." />

              <div className="grid sm:grid-cols-2 gap-4">
                {BACKGROUND_PAGES.map(p => {
                  const d = bgDrafts[p.key] ?? { light: {}, dark: {} };
                  const mode = bgModes[p.key] ?? "light";
                  const side = d[mode] ?? {};
                  const isSaving = savingBgKey === p.key;

                  return (
                    <div key={p.key} className="glass rounded-2xl p-4 space-y-3">
                      {/* Page label + light/dark toggle */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{p.label}</span>
                        <div className="flex rounded-lg border border-border/50 overflow-hidden text-[9px] font-semibold">
                          <button onClick={() => setBgModes(prev => ({ ...prev, [p.key]: "light" }))}
                            className={cn("px-2 py-1 flex items-center gap-1 transition-colors",
                              mode === "light" ? "bg-primary text-white" : "text-muted-foreground hover:bg-secondary")}>
                            <Sun className="w-2.5 h-2.5" /> Light
                          </button>
                          <button onClick={() => setBgModes(prev => ({ ...prev, [p.key]: "dark" }))}
                            className={cn("px-2 py-1 flex items-center gap-1 transition-colors",
                              mode === "dark" ? "bg-primary text-white" : "text-muted-foreground hover:bg-secondary")}>
                            <Moon className="w-2.5 h-2.5" /> Dark
                          </button>
                        </div>
                      </div>

                      {/* Preview */}
                      <div className="aspect-video rounded-xl bg-secondary border border-border/40 relative overflow-hidden">
                        {side.image_url
                          ? <img src={side.image_url} alt="" className="absolute inset-0 w-full h-full"
                              style={{ objectFit: side.fit ?? "cover", opacity: side.opacity ?? 0.25, filter: side.blur > 0 ? `blur(${side.blur}px)` : undefined }} />
                          : <div className="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground">No backdrop set</div>
                        }
                      </div>

                      {/* Controls */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[9px]">Fit</Label>
                          <select value={side.fit ?? "cover"} onChange={e => setBgSide(p.key, mode, { fit: e.target.value })}
                            className="h-7 w-full rounded-lg border border-input bg-background px-2 text-[10px]">
                            {FITS.map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px]">Position</Label>
                          <select value={side.position ?? "center"} onChange={e => setBgSide(p.key, mode, { position: e.target.value })}
                            className="h-7 w-full rounded-lg border border-input bg-background px-2 text-[10px]">
                            {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1 col-span-2">
                          <Label className="text-[9px]">Opacity — {Math.round((side.opacity ?? 0.25) * 100)}%</Label>
                          <Slider value={[(side.opacity ?? 0.25) * 100]} min={10} max={100} step={5}
                            onValueChange={v => setBgSide(p.key, mode, { opacity: v[0] / 100 })} />
                        </div>
                        <div className="space-y-1 col-span-2">
                          <Label className="text-[9px]">Blur — {side.blur ?? 0}px</Label>
                          <Slider value={[side.blur ?? 0]} min={0} max={20} step={1}
                            onValueChange={v => setBgSide(p.key, mode, { blur: v[0] })} />
                        </div>
                      </div>

                      {/* Actions */}
                      <input type="file" accept="image/*" hidden
                        ref={el => { bgRefs.current[`${p.key}-${mode}`] = el; }}
                        onChange={e => { const f = e.target.files?.[0]; if (f) pickBg(p.key, mode, f); }} />
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1 text-xs"
                          onClick={() => bgRefs.current[`${p.key}-${mode}`]?.click()}>
                          <Upload className="w-3 h-3" /> Choose
                        </Button>
                        <Button size="sm" className="flex-1 text-xs bg-gradient-primary text-white border-0 hover:opacity-90" onClick={() => saveBg(p.key)} disabled={isSaving}>
                          {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════════════════════ DESIGN SYSTEM ════════════════════ */}
          {section === "design" && (
            <div className="space-y-6 animate-fade-in">
              <SectionHeader icon={Palette} label="Design System"
                desc="Local CSS overrides — applied in your browser via CSS custom properties." />

              <div className="glass rounded-xl p-3 flex items-start gap-2 text-xs text-muted-foreground mb-2">
                <AlertCircle className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
                These preferences are stored locally in your browser and not synced to the database.
                To change the site-wide design system, edit <code className="font-mono bg-secondary px-1 rounded">tailwind.config.ts</code> and <code className="font-mono bg-secondary px-1 rounded">index.css</code>.
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Primary brand color</Label>
                  <div className="flex gap-2">
                    <input type="color" value={design.primaryColor} onChange={e => setDesign(p => ({ ...p, primaryColor: e.target.value }))}
                      className="w-10 h-10 rounded-lg border border-border cursor-pointer p-0.5 bg-background" />
                    <Input value={design.primaryColor} onChange={e => setDesign(p => ({ ...p, primaryColor: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Scrollbar accent color</Label>
                  <div className="flex gap-2">
                    <input type="color" value={design.scrollColor} onChange={e => setDesign(p => ({ ...p, scrollColor: e.target.value }))}
                      className="w-10 h-10 rounded-lg border border-border cursor-pointer p-0.5 bg-background" />
                    <Input value={design.scrollColor} onChange={e => setDesign(p => ({ ...p, scrollColor: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Border radius</Label>
                  <select value={design.borderRadius} onChange={e => setDesign(p => ({ ...p, borderRadius: e.target.value }))}
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm">
                    <option value="0.5rem">0.5rem — Sharp / SaaS</option>
                    <option value="0.75rem">0.75rem — Balanced</option>
                    <option value="1rem">1rem — Frosted / Curved</option>
                    <option value="1.5rem">1.5rem — Organic / Soft</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Body font family</Label>
                  <select value={design.fontFamily} onChange={e => setDesign(p => ({ ...p, fontFamily: e.target.value }))}
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm">
                    <option value="DM Sans">DM Sans — Clean, optical-size</option>
                    <option value="Inter">Inter — Neutral, legible</option>
                    <option value="Outfit">Outfit — Rounded, cinematic</option>
                    <option value="Roboto">Roboto — Technical, flat</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Transition speed</Label>
                  <select value={design.transition} onChange={e => setDesign(p => ({ ...p, transition: e.target.value }))}
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm">
                    <option value="150ms">150ms — Snappy</option>
                    <option value="300ms">300ms — Default</option>
                    <option value="500ms">500ms — Smooth</option>
                    <option value="700ms">700ms — Cinematic</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-border/50">
                <Button onClick={saveDesign} className="bg-gradient-primary text-white border-0 font-semibold hover:opacity-90">
                  <Palette className="w-4 h-4" /> Apply locally
                </Button>
              </div>
            </div>
          )}

          {/* ── Bottom save bar (for all content sections) ── */}
          {!["backdrops","design"].includes(section) && (
            <div className="mt-8 pt-5 border-t border-border/50 flex items-center justify-between gap-4">
              <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-success" />
                Changes save instantly to the live database.
              </p>
              <Button onClick={save} disabled={saving}
                className="bg-gradient-primary text-white border-0 font-semibold shadow-sm hover:opacity-90">
                {saving
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                  : <><Save className="w-4 h-4" /> Save all changes</>
                }
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
