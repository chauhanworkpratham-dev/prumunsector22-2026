import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useSession } from "@/hooks/useSession";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import { Plus, X, Upload, Trash2, Pencil, Save, Trophy, ChevronLeft, ChevronRight, Image, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Winner = { name: string; award: string; committee: string };
type GalleryEdition = {
  id: string; year: string; title: string; tagline: string;
  description: string; photos: string[]; winners: Winner[];
  delegates: string; committees: string;
};

const GALLERY_KEY = "mun_gallery_editions";
const loadGallery = (): GalleryEdition[] => {
  try { const s = localStorage.getItem(GALLERY_KEY); return s ? JSON.parse(s) : []; } catch { return []; }
};
const saveGallery = (d: GalleryEdition[]) => localStorage.setItem(GALLERY_KEY, JSON.stringify(d));

export default function GalleryPage() {
  const { isSecretariat } = useSession();
  const { edition } = useActiveEdition();
  const [editions, setEditions] = useState<GalleryEdition[]>([]);
  const [lightbox, setLightbox] = useState<{ photos: string[]; idx: number } | null>(null);
  const [editing, setEditing] = useState<GalleryEdition | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const blank = { year: "", title: "", tagline: "", description: "", photos: [], winners: [], delegates: "", committees: "" };
  const [newEd, setNewEd] = useState<Omit<GalleryEdition, "id">>(blank);

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
    setAddOpen(false); setNewEd(blank);
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

  const lbPrev = () => setLightbox(l => l ? { ...l, idx: (l.idx - 1 + l.photos.length) % l.photos.length } : null);
  const lbNext = () => setLightbox(l => l ? { ...l, idx: (l.idx + 1) % l.photos.length } : null);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Dark header */}
      <div className="page-hero">
        <div className="container max-w-5xl">
          <span className="eyebrow" style={{ color: "rgba(201,151,58,0.85)" }}>Media Library</span>
          <h1 className="font-display font-bold text-white leading-tight" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>
            Moments. Memories.<br className="hidden sm:block" /> Diplomacy in motion.
          </h1>
        </div>
      </div>

      <section className="py-16 bg-white">
        <div className="container max-w-5xl">

          {/* Brochure download banner */}
          <div className="flex items-center justify-between border border-navy/8 rounded-sm p-5 mb-12 shadow-card">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-sm bg-gold/10 flex items-center justify-center shrink-0">
                <Download className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="font-semibold text-navy text-sm">Official {edition?.name ?? "PRUMUN"} Brochure</p>
                <p className="text-navy/45 text-xs mt-0.5">All committees, agendas, rules of procedure, and study guides.</p>
              </div>
            </div>
            <a href="/brochure" className="btn-gold text-xs shrink-0">
              <Download className="w-3.5 h-3.5" /> Download PDF
            </a>
          </div>

          {/* Secretariat add button */}
          {isSecretariat && (
            <div className="flex justify-end mb-6">
              <button onClick={() => setAddOpen(true)} className="btn-gold text-xs">
                <Plus className="w-3.5 h-3.5" /> Add Edition
              </button>
            </div>
          )}

          {editions.length === 0 && (
            <div className="border border-navy/8 rounded-sm py-20 text-center">
              <Image className="w-10 h-10 text-navy/15 mx-auto mb-3" />
              <p className="text-navy/40 text-sm font-medium">No editions added yet.</p>
              {isSecretariat && <p className="text-navy/30 text-xs mt-1">Click "Add Edition" to get started.</p>}
            </div>
          )}

          {editions.map(ed => (
            <div key={ed.id} className="mb-16">
              {/* Edition header */}
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <span className="eyebrow">{ed.year}</span>
                  <h2 className="font-display font-bold text-navy text-2xl md:text-3xl">{ed.title}</h2>
                  {ed.tagline && <p className="text-gold font-semibold text-sm mt-0.5">{ed.tagline}</p>}
                  {ed.description && <p className="text-navy/50 text-xs mt-2 max-w-xl leading-relaxed">{ed.description}</p>}
                  {(ed.delegates || ed.committees) && (
                    <div className="flex gap-4 mt-3 text-xs font-bold text-navy/50">
                      {ed.delegates && <span>{ed.delegates} Delegates</span>}
                      {ed.committees && <span>{ed.committees} Committees</span>}
                    </div>
                  )}
                </div>
                {isSecretariat && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setEditing(ed)} className="btn-ghost text-xs px-3 py-1.5">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteEdition(ed.id)} className="text-red-400 hover:text-red-600 transition-colors p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Photo section label */}
              {ed.photos.length > 0 && (
                <>
                  <p className="font-semibold text-navy text-sm mb-3 flex items-center gap-2">
                    <span className="w-4 h-px bg-gold inline-block" />
                    Photo highlights
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
                    {ed.photos.map((ph, i) => (
                      <button key={i}
                        onClick={() => setLightbox({ photos: ed.photos, idx: i })}
                        className={cn(
                          "overflow-hidden rounded-sm bg-navy/5 hover:opacity-90 transition-opacity",
                          i === 0 ? "col-span-2 aspect-[4/3]" : "aspect-video"
                        )}>
                        <img src={ph} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Winners */}
              {ed.winners.length > 0 && (
                <div>
                  <p className="font-semibold text-navy text-sm mb-3 flex items-center gap-2">
                    <span className="w-4 h-px bg-gold inline-block" />
                    Video reels
                  </p>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {ed.winners.map((w, i) => (
                      <div key={i} className="flex items-center gap-3 border border-navy/8 rounded-sm px-4 py-3">
                        <Trophy className="w-4 h-4 text-gold shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-navy">{w.name}</p>
                          <p className="text-[10px] text-navy/40">{w.award} · {w.committee}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="h-px bg-navy/6 mt-10" />
            </div>
          ))}
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[60] bg-black/92 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}>
          <button onClick={e => { e.stopPropagation(); lbPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <img src={lightbox.photos[lightbox.idx]} alt="" className="max-h-[90vh] max-w-[90vw] rounded-sm object-contain"
            onClick={e => e.stopPropagation()} />
          <button onClick={e => { e.stopPropagation(); lbNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors">
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
          <button onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 text-xs">
            {lightbox.idx + 1} / {lightbox.photos.length}
          </p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(addOpen || editing) && (
        <div className="fixed inset-0 z-50 bg-navy/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => { setAddOpen(false); setEditing(null); }}>
          <div className="bg-white rounded-sm p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up shadow-elegant"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-xl font-bold text-navy">{editing ? "Edit Edition" : "Add Edition"}</h3>
              <button onClick={() => { setAddOpen(false); setEditing(null); }} className="text-navy/35 hover:text-navy">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-navy/45 block mb-1.5">Year</label>
                  <Input value={editing?.year ?? newEd.year}
                    onChange={e => editing ? setEditing(p => p ? { ...p, year: e.target.value } : p) : setNewEd(p => ({ ...p, year: e.target.value }))}
                    placeholder="2024" className="border-navy/15" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-navy/45 block mb-1.5">Title</label>
                  <Input value={editing?.title ?? newEd.title}
                    onChange={e => editing ? setEditing(p => p ? { ...p, title: e.target.value } : p) : setNewEd(p => ({ ...p, title: e.target.value }))}
                    placeholder="PRUMUN 2024" className="border-navy/15" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-navy/45 block mb-1.5">Description</label>
                <Textarea rows={3}
                  value={editing?.description ?? newEd.description}
                  onChange={e => editing ? setEditing(p => p ? { ...p, description: e.target.value } : p) : setNewEd(p => ({ ...p, description: e.target.value }))}
                  className="border-navy/15 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-navy/45 block mb-1.5">Photos</label>
                <label className="flex items-center gap-2 border border-navy/12 rounded-sm px-4 py-3 cursor-pointer hover:bg-navy/3 transition text-sm text-navy/55">
                  <Upload className="w-4 h-4" /> Upload photos (multiple)
                  <input type="file" multiple accept="image/*" className="hidden"
                    onChange={e => Array.from(e.target.files ?? []).forEach(f => addPhoto(f, editing ? "edit" : "new"))} />
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => { setAddOpen(false); setEditing(null); }} className="btn-ghost text-xs px-4 py-1.5">Cancel</button>
                <button onClick={editing ? saveEdit : addEdition} className="btn-gold text-xs px-4">
                  <Save className="w-3.5 h-3.5" /> {editing ? "Save changes" : "Add Edition"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
