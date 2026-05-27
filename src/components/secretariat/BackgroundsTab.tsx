import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  BACKGROUND_PAGES, getPageBackgrounds, upsertPageBackground,
  uploadPageBackgroundImage, type PageBackground, type PageBackgroundKey,
  type BgFit, type BgPosition,
} from "@/lib/munApi";
import { Image as ImageIcon, Trash2, Save, Loader2, Eye, Sun, Moon } from "lucide-react";

type Mode = "light" | "dark";

type Side = {
  image_url: string | null;
  opacity: number;
  fit: BgFit;
  position: BgPosition;
  blur: number;
  pendingFile?: File | null;
  previewUrl?: string | null;
};

type Draft = { light: Side; dark: Side };

const DEFAULT_SIDE: Side = { image_url: null, opacity: 0.25, fit: "cover", position: "center", blur: 0 };
const DEFAULT_DRAFT: Draft = { light: { ...DEFAULT_SIDE }, dark: { ...DEFAULT_SIDE } };

const FITS: BgFit[] = ["cover", "contain", "fill"];
const POSITIONS: BgPosition[] = ["center", "top", "bottom", "left", "right", "top left", "top right", "bottom left", "bottom right"];

const sideFromSaved = (s: PageBackground | undefined, mode: Mode): Side => {
  if (!s) return { ...DEFAULT_SIDE };
  if (mode === "light") {
    return {
      image_url: s.image_url,
      opacity: s.opacity ?? 0.25,
      fit: (s.fit as BgFit) ?? "cover",
      position: (s.position as BgPosition) ?? "center",
      blur: s.blur ?? 0,
    };
  }
  return {
    image_url: s.image_url_dark,
    opacity: s.opacity_dark ?? 0.25,
    fit: (s.fit_dark as BgFit) ?? "cover",
    position: (s.position_dark as BgPosition) ?? "center",
    blur: s.blur_dark ?? 0,
  };
};

const sideEqual = (a: Side, b: Side) =>
  a.image_url === b.image_url && a.opacity === b.opacity && a.fit === b.fit && a.position === b.position && a.blur === b.blur;

export const BackgroundsTab = ({ editionId }: { editionId: string }) => {
  const [saved, setSaved] = useState<Record<string, PageBackground>>({});
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [modes, setModes] = useState<Record<string, Mode>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const reload = async () => {
    const map = await getPageBackgrounds(editionId);
    setSaved(map);
    setDrafts(d => {
      const next = { ...d };
      BACKGROUND_PAGES.forEach(p => {
        const cur = next[p.key];
        const lightDirty = cur?.light.pendingFile;
        const darkDirty = cur?.dark.pendingFile;
        next[p.key] = {
          light: lightDirty ? cur!.light : sideFromSaved(map[p.key], "light"),
          dark: darkDirty ? cur!.dark : sideFromSaved(map[p.key], "dark"),
        };
      });
      return next;
    });
  };
  useEffect(() => { reload(); }, [editionId]);

  const isDirty = (key: string) => {
    const d = drafts[key]; if (!d) return false;
    if (d.light.pendingFile || d.dark.pendingFile) return true;
    return !sideEqual(d.light, sideFromSaved(saved[key], "light"))
        || !sideEqual(d.dark, sideFromSaved(saved[key], "dark"));
  };

  const setSide = (key: PageBackgroundKey, mode: Mode, patch: Partial<Side>) =>
    setDrafts(prev => {
      const cur = prev[key] ?? DEFAULT_DRAFT;
      return { ...prev, [key]: { ...cur, [mode]: { ...cur[mode], ...patch } } };
    });

  const onPick = (key: PageBackgroundKey, mode: Mode, file: File) => {
    const url = URL.createObjectURL(file);
    setSide(key, mode, { pendingFile: file, previewUrl: url });
  };

  const save = async (key: PageBackgroundKey) => {
    const d = drafts[key]; if (!d) return;
    setSavingKey(key);
    try {
      let lightUrl = d.light.image_url;
      let darkUrl = d.dark.image_url;
      if (d.light.pendingFile) lightUrl = await uploadPageBackgroundImage(editionId, key, d.light.pendingFile, "light");
      if (d.dark.pendingFile) darkUrl = await uploadPageBackgroundImage(editionId, key, d.dark.pendingFile, "dark");

      const { error } = await upsertPageBackground(editionId, key, {
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
      toast({ title: "🖼 Saved" });
      setDrafts(prev => ({
        ...prev,
        [key]: {
          light: { ...prev[key].light, image_url: lightUrl, pendingFile: null, previewUrl: null },
          dark: { ...prev[key].dark, image_url: darkUrl, pendingFile: null, previewUrl: null },
        },
      }));
      reload();
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSavingKey(null);
    }
  };

  const clearMode = (key: PageBackgroundKey, mode: Mode) =>
    setSide(key, mode, { image_url: null, pendingFile: null, previewUrl: null });

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-display text-xl font-bold flex items-center gap-2"><ImageIcon className="w-5 h-5 text-primary" /> Page Background Images</h3>
        <p className="text-xs text-muted-foreground mt-1">Each page has separate <strong>Light</strong> and <strong>Dark</strong> mode backgrounds. Toggle the sun/moon to edit each. Hit <strong>Save</strong> to apply both at once.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {BACKGROUND_PAGES.map(p => {
          const d = drafts[p.key] ?? DEFAULT_DRAFT;
          const mode = modes[p.key] ?? "light";
          const side = d[mode];
          const previewUrl = side.previewUrl ?? side.image_url;
          const dirty = isDirty(p.key);
          const isSaving = savingKey === p.key;
          const previewBg = mode === "dark" ? "bg-zinc-900" : "bg-zinc-100";

          return (
            <div key={p.key} className="glass-strong rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-semibold text-sm">{p.label}</h4>
                <div className="flex items-center gap-2">
                  <div className="flex rounded-lg border border-border overflow-hidden text-[10px]">
                    <button
                      onClick={() => setModes(m => ({ ...m, [p.key]: "light" }))}
                      className={`px-2 py-1 flex items-center gap-1 ${mode === "light" ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground"}`}
                    ><Sun className="w-3 h-3" /> Light</button>
                    <button
                      onClick={() => setModes(m => ({ ...m, [p.key]: "dark" }))}
                      className={`px-2 py-1 flex items-center gap-1 ${mode === "dark" ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground"}`}
                    ><Moon className="w-3 h-3" /> Dark</button>
                  </div>
                  {dirty
                    ? <span className="text-[10px] uppercase tracking-wider text-warning font-bold">Unsaved</span>
                    : (saved[p.key]?.image_url || saved[p.key]?.image_url_dark)
                      ? <span className="text-[10px] uppercase tracking-wider text-success font-bold flex items-center gap-1"><Eye className="w-3 h-3" /> Live</span>
                      : <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Empty</span>}
                </div>
              </div>

              <div className={`relative aspect-video rounded-xl overflow-hidden border border-border flex items-center justify-center ${previewBg}`}>
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={`${p.label} ${mode} background preview`}
                    className="absolute inset-0 w-full h-full"
                    style={{
                      objectFit: side.fit,
                      objectPosition: side.position,
                      opacity: side.opacity,
                      filter: side.blur > 0 ? `blur(${side.blur}px)` : undefined,
                    }}
                  />
                ) : (
                  <span className={`text-xs ${mode === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>No {mode} background — page renders normally</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Fit</Label>
                  <Select value={side.fit} onValueChange={(v) => setSide(p.key, mode, { fit: v as BgFit })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{FITS.map(f => <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Position</Label>
                  <Select value={side.position} onValueChange={(v) => setSide(p.key, mode, { position: v as BgPosition })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{POSITIONS.map(f => <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground flex justify-between"><span>Opacity</span><span>{Math.round(side.opacity * 100)}%</span></Label>
                <Slider value={[Math.round(side.opacity * 100)]} min={5} max={100} step={5}
                  onValueChange={v => setSide(p.key, mode, { opacity: v[0] / 100 })} />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground flex justify-between"><span>Blur</span><span>{side.blur}px</span></Label>
                <Slider value={[side.blur]} min={0} max={20} step={1}
                  onValueChange={v => setSide(p.key, mode, { blur: v[0] })} />
              </div>

              <div className="flex gap-2 flex-wrap pt-1">
                <input
                  ref={el => (inputRefs.current[`${p.key}-${mode}`] = el)}
                  type="file" accept="image/*" hidden
                  onChange={e => { const f = e.target.files?.[0]; if (f) onPick(p.key, mode, f); e.target.value = ""; }}
                />
                <Button size="sm" variant="outline" onClick={() => inputRefs.current[`${p.key}-${mode}`]?.click()} disabled={isSaving}>
                  <ImageIcon className="w-3 h-3" /> {previewUrl ? `Replace ${mode}` : `Pick ${mode} image`}
                </Button>
                <Button size="sm" variant="hero" onClick={() => save(p.key)} disabled={isSaving || !dirty}>
                  {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                </Button>
                {previewUrl && (
                  <Button size="sm" variant="ghost" onClick={() => clearMode(p.key, mode)} disabled={isSaving}>
                    <Trash2 className="w-3 h-3" /> Clear {mode}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
