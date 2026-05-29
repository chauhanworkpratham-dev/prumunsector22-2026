// About Us + Past Events public page
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageBackdrop } from "@/hooks/usePageBackground";
import { Image, Users, Trophy, Plus, X, Upload, Trash2, Pencil, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useSession } from "@/hooks/useSession";
import { cn } from "@/lib/utils";

type PastEvent = {
  id: string;
  year: string;
  title: string;
  description: string;
  photos: string[];     // base64 or URL
  winners: { name: string; award: string; committee: string }[];
};

const ABOUT_KEY   = "mun_about_content";
const EVENTS_KEY  = "mun_past_events";

export default function AboutPage() {
  const { isSecretariat } = useSession();
  const [editMode, setEditMode] = useState(false);
  const [about, setAbout]  = useState(
    "PRUMUN (Prudence Model United Nations) is an annual inter-school simulation of the United Nations " +
    "organized by Prudence School, Ashok Vihar. Since our inception, we have brought together hundreds of " +
    "young delegates from across Delhi NCR to debate, deliberate, and develop into the world leaders of tomorrow. " +
    "Our conferences are designed to challenge participants intellectually while building their confidence, " +
    "empathy, and collaborative skills in a real-world diplomatic setting."
  );
  const [editAbout, setEditAbout] = useState(about);
  const [events, setEvents]   = useState<PastEvent[]>([]);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [newEvent, setNewEvent] = useState<Omit<PastEvent, "id">>({
    year: "", title: "", description: "", photos: [], winners: [],
  });
  const [newWinner, setNewWinner] = useState({ name: "", award: "", committee: "" });

  useEffect(() => {
    const a = localStorage.getItem(ABOUT_KEY);
    if (a) { setAbout(a); setEditAbout(a); }
    const e = localStorage.getItem(EVENTS_KEY);
    if (e) setEvents(JSON.parse(e));
  }, []);

  const saveAbout = () => {
    setAbout(editAbout);
    localStorage.setItem(ABOUT_KEY, editAbout);
    setEditMode(false);
  };

  const addPhoto = (file: File) => {
    const reader = new FileReader();
    reader.onload = ev => {
      setNewEvent(p => ({ ...p, photos: [...p.photos, ev.target!.result as string] }));
    };
    reader.readAsDataURL(file);
  };

  const addEventFn = () => {
    if (!newEvent.year || !newEvent.title) return;
    const updated = [{ ...newEvent, id: `ev-${Date.now()}` }, ...events];
    setEvents(updated);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(updated));
    setAddEventOpen(false);
    setNewEvent({ year: "", title: "", description: "", photos: [], winners: [] });
  };

  const deleteEvent = (id: string) => {
    const updated = events.filter(e => e.id !== id);
    setEvents(updated);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(updated));
  };

  const addWinnerToNew = () => {
    if (!newWinner.name || !newWinner.award) return;
    setNewEvent(p => ({ ...p, winners: [...p.winners, { ...newWinner }] }));
    setNewWinner({ name: "", award: "", committee: "" });
  };

  return (
    <div className="min-h-screen bg-background mesh-bg">
      <Navbar />
      <PageBackdrop pageKey="about" />

      {/* ── Hero ── */}
      <section className="pt-28 md:pt-32 pb-12 container text-center">
        <p className="section-label">Who We Are</p>
        <h1 className="font-display text-4xl md:text-6xl font-bold gradient-text-deep mb-4 leading-tight mt-2">
          About Us
        </h1>
      </section>

      {/* ── About section ── */}
      <section className="container pb-16 max-w-3xl">
        <div className="glass-strong rounded-3xl p-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="font-display text-2xl font-bold">Our Story</h2>
            </div>
            {isSecretariat && !editMode && (
              <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                <Pencil className="w-3.5 h-3.5" /> Edit
              </Button>
            )}
          </div>

          {editMode ? (
            <div className="space-y-3">
              <Textarea value={editAbout} onChange={e => setEditAbout(e.target.value)} rows={8}
                className="text-sm leading-relaxed" />
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setEditMode(false)}>Cancel</Button>
                <Button variant="hero" size="sm" onClick={saveAbout}><Save className="w-3.5 h-3.5" /> Save</Button>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{about}</p>
          )}
        </div>
      </section>

      {/* ── Past Events section ── */}
      <section className="container pb-24 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="section-label">Our History</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold gradient-text-deep mt-1">Past Editions</h2>
          </div>
          {isSecretariat && (
            <Button variant="hero" size="sm" onClick={() => setAddEventOpen(true)}>
              <Plus className="w-4 h-4" /> Add Edition
            </Button>
          )}
        </div>

        {events.length === 0 && (
          <div className="glass rounded-3xl p-16 text-center text-muted-foreground">
            <Image className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No past editions added yet.</p>
            {isSecretariat && <p className="text-xs mt-1">Click "Add Edition" to add your first one.</p>}
          </div>
        )}

        <div className="space-y-10">
          {events.map(ev => (
            <div key={ev.id} className="glass-strong rounded-3xl p-6 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-bold tracking-widest text-primary">{ev.year}</span>
                  <h3 className="font-display text-xl font-bold mt-0.5">{ev.title}</h3>
                  {ev.description && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{ev.description}</p>}
                </div>
                {isSecretariat && (
                  <Button variant="ghost" size="sm" className="text-destructive shrink-0" onClick={() => deleteEvent(ev.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Photo gallery */}
              {ev.photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {ev.photos.map((ph, i) => (
                    <div key={i} className="aspect-video rounded-xl overflow-hidden bg-secondary">
                      <img src={ph} alt={`${ev.title} photo ${i+1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    </div>
                  ))}
                </div>
              )}

              {/* Winners */}
              {ev.winners.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-4 h-4 text-warning" />
                    <h4 className="font-bold text-sm">Award Winners</h4>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {ev.winners.map((w, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl bg-warning/5 border border-warning/15 px-3 py-2">
                        <Trophy className="w-4 h-4 text-warning shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{w.name}</p>
                          <p className="text-[11px] text-muted-foreground">{w.award} · {w.committee}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Add Event Modal ── */}
      {addEventOpen && (
        <div className="fixed inset-0 z-50 bg-foreground/60 flex items-center justify-center p-4"
          onClick={() => setAddEventOpen(false)}>
          <div className="glass-strong rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-xl font-bold">Add Past Edition</h3>
              <button onClick={() => setAddEventOpen(false)} className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Year</Label>
                  <Input value={newEvent.year} onChange={e => setNewEvent(p => ({ ...p, year: e.target.value }))} placeholder="2024" /></div>
                <div className="space-y-1.5"><Label>Title</Label>
                  <Input value={newEvent.title} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))} placeholder="PRUMUN 2024" /></div>
              </div>
              <div className="space-y-1.5"><Label>Description</Label>
                <Textarea rows={3} value={newEvent.description}
                  onChange={e => setNewEvent(p => ({ ...p, description: e.target.value }))}
                  placeholder="Brief summary of the edition…" /></div>

              {/* Photo upload */}
              <div className="space-y-2">
                <Label>Photos</Label>
                <label className="flex items-center gap-2 glass rounded-xl px-4 py-3 cursor-pointer hover:bg-secondary transition">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">Upload photos (multiple)</span>
                  <input type="file" multiple accept="image/*" className="hidden"
                    onChange={e => Array.from(e.target.files ?? []).forEach(addPhoto)} />
                </label>
                {newEvent.photos.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {newEvent.photos.map((ph, i) => (
                      <div key={i} className="relative aspect-video rounded-lg overflow-hidden bg-secondary">
                        <img src={ph} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => setNewEvent(p => ({ ...p, photos: p.photos.filter((_, j) => j !== i) }))}
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
                  <Input placeholder="Delegate name" value={newWinner.name} onChange={e => setNewWinner(p => ({ ...p, name: e.target.value }))} />
                  <Input placeholder="Award (Best Del.)" value={newWinner.award} onChange={e => setNewWinner(p => ({ ...p, award: e.target.value }))} />
                  <Input placeholder="Committee" value={newWinner.committee} onChange={e => setNewWinner(p => ({ ...p, committee: e.target.value }))} />
                </div>
                <Button variant="outline" size="sm" onClick={addWinnerToNew}>
                  <Plus className="w-3 h-3" /> Add Winner
                </Button>
                {newEvent.winners.map((w, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs glass rounded-xl px-3 py-2">
                    <Trophy className="w-3.5 h-3.5 text-warning shrink-0" />
                    <span className="flex-1">{w.name} — {w.award} ({w.committee})</span>
                    <button onClick={() => setNewEvent(p => ({ ...p, winners: p.winners.filter((_, j) => j !== i) }))}>
                      <X className="w-3 h-3 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setAddEventOpen(false)}>Cancel</Button>
                <Button variant="hero" onClick={addEventFn}
                  disabled={!newEvent.year || !newEvent.title}>
                  <Save className="w-4 h-4" /> Save Edition
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
