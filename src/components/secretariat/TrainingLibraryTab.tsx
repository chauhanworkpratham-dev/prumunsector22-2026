import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getTrainingResources, createTrainingResource, deleteTrainingResource, type TrainingResource } from "@/lib/munApi";
import { Plus, Trash2, Video, FileText, StickyNote, Link as LinkIcon, Upload, ExternalLink } from "lucide-react";

const ICONS = { video: Video, pdf: FileText, note: StickyNote, link: LinkIcon };
type RType = "video" | "pdf" | "note" | "link";

// "pdf" + "video" support direct file upload to the public training-files
// bucket; "link" + "note" only need a URL. The radio at the top swaps the
// input UI so the secretariat can't, e.g., paste a YouTube link in PDF mode.
const isFileType = (t: RType) => t === "pdf" || t === "video";

export const TrainingLibraryTab = ({ editionId }: { editionId: string }) => {
  const [items, setItems] = useState<TrainingResource[]>([]);
  const [type, setType] = useState<RType>("video");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = () => getTrainingResources(editionId).then(setItems);
  useEffect(() => { refresh(); }, [editionId]);

  const reset = () => { setTitle(""); setDesc(""); setUrl(""); setFile(null); };

  const uploadFileForType = async (t: RType, f: File): Promise<string> => {
    const accept = t === "pdf" ? ["application/pdf"] : [
      "video/mp4", "video/quicktime", "video/webm", "video/x-matroska", "video/x-msvideo",
    ];
    if (accept.length && !accept.includes(f.type) && t === "pdf") {
      throw new Error("Please upload a PDF file.");
    }
    if (t === "video" && !f.type.startsWith("video/")) {
      throw new Error("Please upload a video file.");
    }
    const ext = f.name.split(".").pop() || "bin";
    const path = `${editionId}/${t}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
    const { error } = await supabase.storage.from("training-files")
      .upload(path, f, { upsert: false, cacheControl: "3600", contentType: f.type });
    if (error) throw error;
    const { data } = supabase.storage.from("training-files").getPublicUrl(path);
    return data.publicUrl;
  };

  const add = async () => {
    if (!title.trim()) { toast({ title: "Title required", variant: "destructive" }); return; }
    if (isFileType(type) && !file && !url.trim()) {
      toast({ title: "Pick a file to upload (or paste a hosted URL)", variant: "destructive" });
      return;
    }
    if (!isFileType(type) && !url.trim()) {
      toast({ title: "URL required", variant: "destructive" });
      return;
    }

    setBusy(true);
    try {
      let finalUrl = url.trim();
      if (isFileType(type) && file) finalUrl = await uploadFileForType(type, file);
      const { error } = await createTrainingResource({
        edition_id: editionId, type, title: title.trim(),
        description: desc.trim() || null, url: finalUrl, sort_order: items.length,
      });
      if (error) throw error;
      reset();
      refresh();
      toast({ title: "Resource added" });
    } catch (e: any) {
      toast({ title: "Failed to add", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete?")) return;
    await deleteTrainingResource(id);
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="glass-strong rounded-3xl p-6 space-y-3">
        <h3 className="font-display text-xl font-bold">Add Training Resource</h3>

        {/* Type picker */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(["video","pdf","note","link"] as RType[]).map(t => {
            const Icon = ICONS[t];
            const active = type === t;
            return (
              <button key={t} type="button"
                onClick={() => { setType(t); setFile(null); setUrl(""); }}
                className={`rounded-xl border-2 p-3 text-left transition-all ${active ? "border-primary bg-primary/5 shadow-soft" : "border-border hover:border-primary/40"}`}>
                <Icon className={`w-5 h-5 mb-1 ${active ? "text-primary" : "text-muted-foreground"}`} />
                <div className="text-xs font-bold capitalize">{t}</div>
                <div className="text-[10px] text-muted-foreground">
                  {t === "video" || t === "pdf" ? "Upload a file" : "Paste a link/URL"}
                </div>
              </button>
            );
          })}
        </div>

        <div className="space-y-1.5"><Label>Title</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. ECOSOC Procedure Primer" />
        </div>

        <div className="space-y-1.5"><Label>Description (optional)</Label>
          <Textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} />
        </div>

        {isFileType(type) ? (
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><Upload className="w-3 h-3" /> {type === "pdf" ? "PDF file" : "Video file"}</Label>
            <Input type="file"
              accept={type === "pdf" ? "application/pdf" : "video/*"}
              onChange={e => setFile(e.target.files?.[0] ?? null)} />
            {file && <p className="text-[11px] text-muted-foreground">Selected: {file.name} ({Math.round(file.size/1024)} KB)</p>}
            <details className="text-[11px] text-muted-foreground">
              <summary className="cursor-pointer">…or paste an external URL instead</summary>
              <Input className="mt-2" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://drive.google.com/…" />
            </details>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><LinkIcon className="w-3 h-3" /> URL</Label>
            <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" />
          </div>
        )}

        <Button variant="hero" onClick={add} disabled={busy}>
          <Plus className="w-4 h-4" /> {busy ? "Adding…" : "Add resource"}
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {items.map(r => {
          const Icon = ICONS[r.type];
          return (
            <div key={r.id} className="glass-strong rounded-2xl p-4 flex gap-3">
              <Icon className="w-6 h-6 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{r.title}</div>
                <a href={r.url} target="_blank" rel="noreferrer"
                  className="text-xs text-primary hover:underline truncate flex items-center gap-1">
                  {r.url} <ExternalLink className="w-3 h-3" />
                </a>
                {r.description && <div className="text-xs mt-1 text-muted-foreground">{r.description}</div>}
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{r.type}</div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => remove(r.id)} className="text-destructive">
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          );
        })}
        {items.length === 0 && <div className="md:col-span-2 glass rounded-2xl p-8 text-center text-muted-foreground text-sm">No resources yet.</div>}
      </div>
    </div>
  );
};
