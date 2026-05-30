import { useEffect, useState } from "react";
import { Navbar }  from "@/components/Navbar";
import { Footer }  from "@/components/Footer";
import { Button }  from "@/components/ui/button";
import { Input }   from "@/components/ui/input";
import { Label }   from "@/components/ui/label";
import { Textarea }from "@/components/ui/textarea";
import { useSession } from "@/hooks/useSession";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import { Plus, X, Upload, Trash2, Pencil, Save, Image, Trophy, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Winner = { name: string; award: string; committee: string };
type GalleryEdition = {
  id: string;
  year: string;
  title: string;
  tagline: string;
  description: string;
  photos: string[];
  winners: Winner[];
  delegates: string;
  committees: string;
};

const GALLERY_KEY = "mun_gallery_editions";

const loadGallery = (): GalleryEdition[] => {
  try { const s = localStorage.getItem(GALLERY_KEY); return s ? JSON.parse(s) : []; }
  catch { return []; }
};
const saveGallery = (data: GalleryEdition[]) => localStorage.setItem(GALLERY_KEY, JSON.stringify(data));

export default function GalleryPage() {
  const { isSecretariat } = useSession();
  const { edition } = useActiveEdition();
  const [editions,   setEditions]   = useState<GalleryEdition[]>([]);
  const [lightbox,   setLightbox]   = useState<{ photos: string[]; idx: number } | null>(null);
  const [editing,    setEditing]    = useState<GalleryEdition | null>(null);
  const [addOpen,    setAddOpen]    = useState(false);
  const [newEd,      setNewEd]      = useState<Omit<GalleryEdition, "id">>({
    year: "", title: "", tagline: "", description: "", photos: [], winners: [], delegates: "", committees: "",
  });
  const [newWinner, setNewWinner]   = useState<Winner>({ name: "", award: "", committee: "" });

  useEffect(() => { setEditions(loadGallery()); }, []);

  const addPhoto = (file: File, target: "new" | "edit") => {
    const r = new FileReader();
    r.onload = ev => {
      const src = ev.target!.result as string;
      if (target === "new") setNewEd(p => ({ ...p, photos: [...p.photos, src] }));
      else if (editing) setEditing(p => p ? { ...p, photos: [...p.photos, src] } : p);
    };
    r.readAsDataURL(file);
  };

  const addEdition = () => {
    if (!newEd.year || !newEd.title) return;
    const updated = [{ ...newEd, id: `ge-${Date.now()}` }, ...editions];
    setEditions(updated); saveGallery(updated);
    setAddOpen(false);
    setNewEd({ year: "", title: "", tagline: "", description: "", photos: [], winners: [], delegates: "", committees: "" });
  };

  const saveEdit = () => {
    if (!editing) return;
    const updated = editions.map(e => e.id === editing.id ? editing : e);
    setEditions(updated); saveGallery(updated); setEditing(null);
  };

  const deleteEdition = (id: string) => {
    const updated = editions.filter(e => e.id !== id);
    setEditions(updated); saveGallery(updated);
  };

  const lightboxPrev = () => setLightbox(l => l ? { ...l, idx: (l.idx - 1 + l.photos.length) % l.photos.length } : null);
  const lightboxNext = () => setLightbox(l => l ? { ...l, idx: (l.idx + 1) % l.photos.length } : null);

  return (
    <div className="min-h-screen bg-background mesh-bg">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 md:pt-32 pb-10 container text-center">
        <p className="section-label">Our Legacy</p>
        <h1 className="font-display text-4xl md:text-6xl font-bold gradient-text-deep leading-tight mt-2 mb-4">
          Gallery &amp; Past MUNs
        </h1>
        <p className="text-muted-foreground text-sm max-w-xl mx-auto">
          Relive the moments, debates, and victories from every edition of {edition?.name?.split(" ")[0] ?? "PRUMUN"}.
        </p>
        {isSecretariat && (
          <Button variant="hero" className="mt-6" onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4" /> Add Edition
          </Button>
        )}
      </section>

      {/* Grid */}
      <section className="container pb-24 space-y-16">
        {editions.length === 0 && (
          <div className="glass rounded-3xl p-20 text-center text-muted-foreground">
            <Image className="w-12 h-12 mx-auto mb-4 opacity-25" />
            <p className="font-semibold">No editions added yet.</p>
            {isSecretariat && <p className="text-xs mt-1">Click "Add Edition" above to get started.</p>}
          </div>
        )}

        {editions.map(ed => (
          <div key={ed.id} className="space-y-5">
            {/* Edition header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="section-label">{ed.year}</span>
                <h2 className="font-display text-2xl md:text-3xl font-bold">{ed.title}</h2>
                {ed.tagline && <p className="text-primary font-semibold text-sm mt-0.5">{ed.tagline}</p>}
                {ed.description && <p className="text-muted-foreground text-sm mt-2 max-w-2xl leading-relaxed">{ed.description}</p>}
                {(ed.delegates || ed.committees) && (
                  <div className="flex gap-4 mt-3">
                    {ed.delegates && <span className="text-xs font-bold text-primary">{ed.delegates} Delegates</span>}
                    {ed.committees && <span className="text-xs font-bold text-primary">{ed.committees} Committees</span>}
                  </div>
                )}
              </div>
              {isSecretariat && (
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => setEditing(ed)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteEdition(ed.id)} className="text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              )}
            </div>

            {/* Photo masonry grid */}
            {ed.photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {ed.photos.map((ph, i) => (
                  <button key={i} onClick={() => setLightbox({ photos: ed.photos, idx: i })}
                    className={cn(
                      "aspect-video rounded-xl overflow-hidden bg-secondary hover:scale-[1.02] transition-all duration-300 shadow-card hover:shadow-elegant",
                      i === 0 && "col-span-2 row-span-2 aspect-square"
                    )}>
                    <img src={ph} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Winners */}
            {ed.winners.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="w-4 h-4 text-warning" />
                  <h3 className="font-bold text-sm">Award Winners</h3>
                </div>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {ed.winners.map((w, i) => (
                    <div key={i} className="flex items-center gap-3 glass rounded-xl px-3 py-2.5">
                      <div className="w-8 h-8 rounded-full bg-warning/15 flex items-center justify-center shrink-0">
                        <Trophy className="w-4 h-4 text-warning" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{w.name}</p>
                        <p className="text-[11px] text-muted-foreground">{w.award} · {w.committee}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="h-px bg-border/40" />
          </div>
        ))}
      </section>

      {/* ── Lightbox ── */}
      {lightbox && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button onClick={e => { e.stopPropagation(); lightboxPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition-colors">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <img
            src={lightbox.photos[lightbox.idx]}
            alt=""
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          <button onClick={e => { e.stopPropagation(); lightboxNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition-colors">
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
          <button onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs">
            {lightbox.idx + 1} / {lightbox.photos.length}
          </p>
        </div>
      )}

      {/* ── Add/Edit Modal ── */}
      {(addOpen || editing) && (
        <EditionModal
          value={editing ?? newEd as any}
          isEdit={!!editing}
          onClose={() => { setAddOpen(false); setEditing(null); }}
          onSave={editing ? saveEdit : addEdition}
          onChange={editing ? (v: any) => setEditing(v) : (v: any) => setNewEd(v)}
          onPhotoAdd={(file) => addPhoto(file, editing ? "edit" : "new")}
        />
      )}

      <Footer />
    </div>
  );
}

const EditionModal = ({
  value, isEdit, onClose, onSave, onChange, onPhotoAdd,
}: {
  value: GalleryEdition;
  isEdit: boolean;
  onClose: () => void;
  onSave: () => void;
  onChange: (v: GalleryEdition) => void;
  onPhotoAdd: (f: File) => void;
}) => {
  const [newWinner, setNewWinner] = useState<Winner>({ name: "", award: "", committee: "" });
  const set = (k: keyof GalleryEdition, v: any) => onChange({ ...value, [k]: v });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass-strong rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-xl font-bold">{isEdit ? "Edit Edition" : "Add Past Edition"}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Year</Label><Input value={value.year} onChange={e => set("year", e.target.value)} placeholder="2024" /></div>
            <div className="space-y-1.5"><Label>Title</Label><Input value={value.title} onChange={e => set("title", e.target.value)} placeholder="PRUMUN 2024" /></div>
          </div>
          <div className="space-y-1.5"><Label>Tagline</Label><Input value={value.tagline} onChange={e => set("tagline", e.target.value)} placeholder="Shaping Tomorrow's Leaders" /></div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea rows={3} value={value.description} onChange={e => set("description", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>No. of Delegates</Label><Input value={value.delegates} onChange={e => set("delegates", e.target.value)} placeholder="250" /></div>
            <div className="space-y-1.5"><Label>No. of Committees</Label><Input value={value.committees} onChange={e => set("committees", e.target.value)} placeholder="8" /></div>
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <Label>Photos</Label>
            <label className="flex items-center gap-2 glass rounded-xl px-4 py-3 cursor-pointer hover:bg-secondary transition">
              <Upload className="w-4 h-4" /><span className="text-sm">Upload photos (multiple)</span>
              <input type="file" multiple accept="image/*" className="hidden" onChange={e => Array.from(e.target.files ?? []).forEach(onPhotoAdd)} />
            </label>
            {value.photos.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {value.photos.map((ph, i) => (
                  <div key={i} className="relative aspect-video rounded-lg overflow-hidden bg-secondary">
                    <img src={ph} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => set("photos", value.photos.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Winners */}
          <div className="space-y-2">
            <Label>Award Winners</Label>
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="Name" value={newWinner.name} onChange={e => setNewWinner(p => ({ ...p, name: e.target.value }))} />
              <Input placeholder="Award" value={newWinner.award} onChange={e => setNewWinner(p => ({ ...p, award: e.target.value }))} />
              <Input placeholder="Committee" value={newWinner.committee} onChange={e => setNewWinner(p => ({ ...p, committee: e.target.value }))} />
            </div>
            <Button variant="outline" size="sm" onClick={() => {
              if (!newWinner.name || !newWinner.award) return;
              set("winners", [...value.winners, { ...newWinner }]);
              setNewWinner({ name: "", award: "", committee: "" });
            }}><Plus className="w-3 h-3" /> Add Winner</Button>
            {value.winners.map((w, i) => (
              <div key={i} className="flex items-center gap-2 text-xs glass rounded-xl px-3 py-2">
                <Trophy className="w-3.5 h-3.5 text-warning shrink-0" />
                <span className="flex-1">{w.name} — {w.award} ({w.committee})</span>
                <button onClick={() => set("winners", value.winners.filter((_, j) => j !== i))}><X className="w-3 h-3 text-destructive" /></button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button variant="hero" onClick={onSave} disabled={!value.year || !value.title}>
              <Save className="w-4 h-4" /> {isEdit ? "Save changes" : "Add Edition"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
