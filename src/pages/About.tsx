import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Users, Trophy, Globe2, Heart, Plus, X, Upload, Trash2, Pencil, Save, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useSession } from "@/hooks/useSession";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import { getCommittees, type Committee } from "@/lib/munApi";

type PastEvent = {
  id: string;
  year: string;
  title: string;
  description: string;
  photos: string[];
  winners: { name: string; award: string; committee: string }[];
};

const ABOUT_KEY  = "mun_about_content";
const EVENTS_KEY = "mun_past_events";

export default function AboutPage() {
  const { isSecretariat } = useSession();
  const { edition } = useActiveEdition();
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [about, setAbout] = useState(
    "PRUMUN is the flagship Model United Nations conference of Prudence International School. Now in its third edition, it convenes student delegates from across the region for two days of structured debate, careful diplomacy, and unforgettable encounters."
  );
  const [editAbout, setEditAbout] = useState(about);
  const [events, setEvents] = useState<PastEvent[]>([]);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [newEvent, setNewEvent] = useState<Omit<PastEvent, "id">>({
    year: "", title: "", description: "", photos: [], winners: [],
  });
  const [newWinner, setNewWinner] = useState({ name: "", award: "", committee: "" });

  useEffect(() => {
    if (edition) getCommittees(edition.id).then(setCommittees);
    const a = localStorage.getItem(ABOUT_KEY);
    if (a) { setAbout(a); setEditAbout(a); }
    const e = localStorage.getItem(EVENTS_KEY);
    if (e) setEvents(JSON.parse(e));
  }, [edition]);

  const saveAbout = () => {
    setAbout(editAbout);
    localStorage.setItem(ABOUT_KEY, editAbout);
    setEditMode(false);
  };

  const addPhoto = (file: File) => {
    const r = new FileReader();
    r.onload = ev => setNewEvent(p => ({ ...p, photos: [...p.photos, ev.target!.result as string] }));
    r.readAsDataURL(file);
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

  const STATS = [
    { Icon: Users,  value: (edition as any)?.stat_delegates  ?? "150+", label: "Delegates"   },
    { Icon: Globe2, value: (edition as any)?.stat_committees ?? String(committees.length || 6), label: "Committees" },
    { Icon: Trophy, value: (edition as any)?.stat_awards     ?? "12+",  label: "Awards"      },
    { Icon: Heart,  value: "2",                                          label: "Days"        },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── Dark hero header ── */}
      <div className="page-hero">
        <div className="container max-w-4xl">
          <span className="eyebrow" style={{ color: "rgba(201,151,58,0.85)" }}>About the Conference</span>
          <h1 className="font-display font-bold text-white leading-tight"
            style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)" }}>
            Three editions. One<br />
            unwavering belief — that<br />
            <span className="gold-text">dialogue</span> changes everything.
          </h1>
          <p className="text-white/55 text-sm mt-5 max-w-lg leading-relaxed">{about}</p>
          {isSecretariat && !editMode && (
            <button onClick={() => setEditMode(true)}
              className="mt-4 text-xs text-white/40 hover:text-white/70 flex items-center gap-1.5 transition-colors">
              <Pencil className="w-3 h-3" /> Edit about text
            </button>
          )}
          {editMode && (
            <div className="mt-4 space-y-3 max-w-lg">
              <Textarea value={editAbout} onChange={e => setEditAbout(e.target.value)} rows={5}
                className="text-sm bg-white/10 border-white/20 text-white placeholder:text-white/30" />
              <div className="flex gap-2">
                <button onClick={() => setEditMode(false)} className="text-xs text-white/40 hover:text-white/70">Cancel</button>
                <button onClick={saveAbout} className="btn-gold text-xs px-3 py-1.5"><Save className="w-3 h-3" /> Save</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="bg-white border-b border-navy/8">
        <div className="container max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-navy/8">
            {STATS.map(({ Icon, value, label }) => (
              <div key={label} className="flex flex-col items-center justify-center py-10 gap-2">
                <Icon className="w-5 h-5 text-gold" />
                <span className="font-display font-bold text-navy text-3xl leading-none">{value}</span>
                <span className="text-[11px] text-navy/40 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Our Committees ── */}
      <section className="py-20 bg-white">
        <div className="container max-w-4xl">
          <div className="mb-8">
            <span className="eyebrow">Our Committees</span>
            <h2 className="font-display font-bold text-navy text-3xl md:text-4xl">Six rooms. Six worlds.</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {(committees.length ? committees : [
              { id:"1", short_name:"UNSC",  name:"United Nations Security Council",       agenda:"Crisis in the Sahel Region",         description:"A high-stakes crisis committee where delegates handle real-time international peace and security challenges.", portfolios:[], difficulty:"Advanced",     edition_id:"" },
              { id:"2", short_name:"UNHRC", name:"United Nations Human Rights Council",   agenda:"Digital Rights & Mass Surveillance", description:"Debating the balance between national security and personal liberty in the age of pervasive surveillance.", portfolios:[], difficulty:"Intermediate", edition_id:"" },
              { id:"3", short_name:"DISEC", name:"Disarmament & International Security",  agenda:"Autonomous Weapons Systems",         description:"Confronting the militarization of artificial intelligence and the regulation of lethal autonomous weapons.", portfolios:[], difficulty:"Advanced",     edition_id:"" },
              { id:"4", short_name:"WHO",   name:"World Health Organization",              agenda:"Pandemic Preparedness & Response",   description:"Building global health resilience for the outbreaks of the next decade.",                                      portfolios:[], difficulty:"Beginner",     edition_id:"" },
              { id:"5", short_name:"AIPPM", name:"All India Political Parties Meet",       agenda:"Uniform Civil Code",                 description:"An Indian political simulation where party representatives debate one of the country's most contentious questions.", portfolios:[], difficulty:"Intermediate", edition_id:"" },
              { id:"6", short_name:"IP",    name:"International Press",                    agenda:"Reporting Live from PRUMUN",         description:"Journalists, photographers, and caricaturists chronicling the conference as it unfolds.",                       portfolios:[], difficulty:"Beginner",     edition_id:"" },
            ] as Committee[]).map(c => (
              <div key={c.id} className="card-committee">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-display font-bold text-navy text-xl">{c.short_name}</h3>
                    <p className="text-navy/55 text-xs mt-0.5">{c.name}</p>
                  </div>
                  <div className="w-7 h-7 rounded-full border border-gold/30 flex items-center justify-center text-gold shrink-0">
                    <Globe2 className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-navy/5 rounded px-2 py-1 text-[11px] font-semibold text-navy/60 mb-3">
                  Agenda · {c.agenda}
                </div>
                <p className="text-navy/50 text-xs leading-relaxed">{(c as any).description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Past editions ── */}
      <section className="py-20 bg-navy/2 border-t border-navy/8">
        <div className="container max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="eyebrow">Our History</span>
              <h2 className="font-display font-bold text-navy text-3xl md:text-4xl">Past Editions</h2>
            </div>
            {isSecretariat && (
              <button onClick={() => setAddEventOpen(true)} className="btn-gold text-xs px-3 py-1.5">
                <Plus className="w-3.5 h-3.5" /> Add Edition
              </button>
            )}
          </div>

          {events.length === 0 ? (
            <div className="border border-navy/8 rounded-sm py-16 text-center">
              <Image className="w-10 h-10 mx-auto mb-3 text-navy/20" />
              <p className="text-navy/40 text-sm">No past editions added yet.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {events.map(ev => (
                <div key={ev.id} className="border border-navy/8 rounded-sm p-7 bg-white">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <span className="eyebrow">{ev.year}</span>
                      <h3 className="font-display font-bold text-navy text-xl">{ev.title}</h3>
                      {ev.description && <p className="text-navy/50 text-sm mt-2 leading-relaxed">{ev.description}</p>}
                    </div>
                    {isSecretariat && (
                      <button onClick={() => deleteEvent(ev.id)} className="text-red-400 hover:text-red-600 transition-colors shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {ev.photos.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                      {ev.photos.map((ph, i) => (
                        <div key={i} className="aspect-video rounded-sm overflow-hidden bg-navy/5">
                          <img src={ph} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                        </div>
                      ))}
                    </div>
                  )}
                  {ev.winners.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold tracking-widest text-navy/35 uppercase mb-2">Award Winners</p>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {ev.winners.map((w, i) => (
                          <div key={i} className="flex items-center gap-3 bg-gold/5 border border-gold/15 rounded-sm px-3 py-2">
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
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Add Edition Modal */}
      {addEventOpen && (
        <div className="fixed inset-0 z-50 bg-navy/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setAddEventOpen(false)}>
          <div className="bg-white rounded-sm p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up shadow-elegant"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-xl font-bold text-navy">Add Past Edition</h3>
              <button onClick={() => setAddEventOpen(false)} className="text-navy/40 hover:text-navy"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs text-navy/55 mb-1.5 block">Year</Label>
                  <Input value={newEvent.year} onChange={e => setNewEvent(p => ({ ...p, year: e.target.value }))} placeholder="2024" className="form-input h-9 border-navy/15" /></div>
                <div><Label className="text-xs text-navy/55 mb-1.5 block">Title</Label>
                  <Input value={newEvent.title} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))} placeholder="PRUMUN 2024" className="form-input h-9 border-navy/15" /></div>
              </div>
              <div><Label className="text-xs text-navy/55 mb-1.5 block">Description</Label>
                <Textarea rows={3} value={newEvent.description}
                  onChange={e => setNewEvent(p => ({ ...p, description: e.target.value }))}
                  className="text-sm border-navy/15" /></div>
              <div>
                <Label className="text-xs text-navy/55 mb-1.5 block">Photos</Label>
                <label className="flex items-center gap-2 border border-navy/12 rounded-sm px-4 py-3 cursor-pointer hover:bg-navy/3 transition text-sm text-navy/60">
                  <Upload className="w-4 h-4" /> Upload photos
                  <input type="file" multiple accept="image/*" className="hidden"
                    onChange={e => Array.from(e.target.files ?? []).forEach(addPhoto)} />
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setAddEventOpen(false)}>Cancel</Button>
                <button className="btn-gold text-xs" onClick={addEventFn} disabled={!newEvent.year || !newEvent.title}>
                  <Save className="w-3.5 h-3.5" /> Save Edition
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
