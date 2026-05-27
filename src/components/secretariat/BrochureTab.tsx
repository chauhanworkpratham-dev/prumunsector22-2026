import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { getAllBrochures, uploadBrochureFile, publishBrochure, deleteBrochure, type Brochure } from "@/lib/munApi";
import { Upload, FileText, Trash2, Download, Star } from "lucide-react";

export const BrochureTab = ({ editionId }: { editionId: string }) => {
  const [items, setItems] = useState<Brochure[]>([]);
  const [title, setTitle] = useState("Official Brochure");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const inp = useRef<HTMLInputElement>(null);

  const refresh = () => getAllBrochures(editionId).then(setItems);
  useEffect(() => { refresh(); }, [editionId]);

  const submit = async () => {
    if (!file) { toast({ title: "Pick a PDF", variant: "destructive" }); return; }
    setBusy(true);
    try {
      const url = await uploadBrochureFile(editionId, file);
      await publishBrochure(editionId, title, url);
      setFile(null); refresh();
      toast({ title: "Brochure published" });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const remove = async (id: string) => { if (confirm("Delete?")) { await deleteBrochure(id); refresh(); } };

  return (
    <div className="space-y-6">
      <div className="glass-strong rounded-3xl p-6 space-y-3">
        <h3 className="font-display text-xl font-bold">Upload New Brochure</h3>
        <div className="space-y-1.5"><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
        <input ref={inp} type="file" accept="application/pdf" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
        <button onClick={() => inp.current?.click()} className="w-full glass rounded-2xl p-6 border-2 border-dashed border-primary/40 hover:border-primary text-center">
          <Upload className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="font-semibold text-sm">{file ? file.name : "Click to choose PDF"}</p>
        </button>
        <Button variant="hero" onClick={submit} disabled={!file || busy}>{busy ? "Publishing…" : "Publish Brochure"}</Button>
      </div>

      <div className="space-y-2">
        {items.map(b => (
          <div key={b.id} className="glass-strong rounded-2xl p-4 flex items-center gap-3">
            <FileText className="w-6 h-6 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm flex items-center gap-2">{b.title} {b.is_current && <Star className="w-3 h-3 text-warning fill-warning" />}</div>
              <div className="text-xs text-muted-foreground">v{b.version} · {new Date(b.created_at).toLocaleDateString()}</div>
            </div>
            <Button variant="outline" size="sm" asChild><a href={b.file_url} target="_blank" rel="noreferrer"><Download className="w-3 h-3" /></a></Button>
            <Button variant="ghost" size="sm" onClick={() => remove(b.id)} className="text-destructive"><Trash2 className="w-3 h-3" /></Button>
          </div>
        ))}
        {items.length === 0 && <div className="glass rounded-2xl p-8 text-center text-muted-foreground text-sm">No brochures yet.</div>}
      </div>
    </div>
  );
};
