import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import {
  Users, Mail, Phone, MessageSquare, CheckCircle2,
  ChevronRight, LayoutGrid, List, X, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Member = {
  id: string; name: string; role: "secretariat" | "staff";
  position: string; phone: string; email: string; photo: string;
};

const DEFAULTS: Member[] = [
  { id: "s1", role: "secretariat", name: "Aarav Sharma",  position: "Secretary General",   phone: "+91 98765 43210", email: "secgen@prumun.org",   photo: "https://api.dicebear.com/7.x/adventurer/svg?seed=Aarav"  },
  { id: "s2", role: "secretariat", name: "Diya Kapoor",   position: "Director General",     phone: "+91 98765 43211", email: "dg@prumun.org",        photo: "https://api.dicebear.com/7.x/adventurer/svg?seed=Diya"   },
  { id: "s3", role: "secretariat", name: "Rohan Mehra",   position: "Deputy Secretary",     phone: "+91 98765 43213", email: "dep@prumun.org",       photo: "https://api.dicebear.com/7.x/adventurer/svg?seed=Rohan"  },
  { id: "f1", role: "staff",       name: "Priya Nair",    position: "Chief of Staff",       phone: "+91 98765 43214", email: "cos@prumun.org",       photo: "https://api.dicebear.com/7.x/adventurer/svg?seed=Priya"  },
  { id: "f2", role: "staff",       name: "Karan Bhatia",  position: "Head of Logistics",    phone: "+91 98765 43215", email: "logistics@prumun.org", photo: "https://api.dicebear.com/7.x/adventurer/svg?seed=Karan"  },
  { id: "f3", role: "staff",       name: "Ananya Gupta",  position: "Head of Publications", phone: "+91 98765 43216", email: "pub@prumun.org",       photo: "https://api.dicebear.com/7.x/adventurer/svg?seed=Ananya" },
];

type Phase = 1 | 2 | 3;

export const SecretariatsPage = ({ type }: { type: "secretariat" | "staff" }) => {
  const { edition } = useActiveEdition();
  const [members,  setMembers] = useState<Member[]>([]);
  const [layout,   setLayout]  = useState<"grid" | "list">("grid");
  const [target,   setTarget]  = useState<Member | null>(null);
  const [phase,    setPhase]   = useState<Phase>(1);
  const [sending,  setSending] = useState(false);
  const [delegateInfo, setDInfo] = useState({ name: "", school: "", grade: "", role: "Delegate", contact: "" });
  const [msgForm,  setMsgForm] = useState({ recipientId: "", title: "", body: "" });

  useEffect(() => {
    const stored = localStorage.getItem("mun_secretariats_list");
    setMembers(stored ? JSON.parse(stored) : DEFAULTS);
  }, []);

  const filtered = members.filter(m => m.role === type);

  const openModal = (m: Member) => {
    setTarget(m);
    setMsgForm({ recipientId: m.id, title: "", body: "" });
    setDInfo({ name: "", school: "", grade: "", role: "Delegate", contact: "" });
    setPhase(1);
  };

  const sendMessage = async () => {
    setSending(true);
    await new Promise(r => setTimeout(r, 600));
    const stored = localStorage.getItem("mun_secretariat_messages");
    const msgs = stored ? JSON.parse(stored) : [];
    localStorage.setItem("mun_secretariat_messages", JSON.stringify([...msgs, {
      id: `msg-${Date.now()}`,
      secretariatId: msgForm.recipientId,
      ...delegateInfo,
      title: msgForm.title,
      message: msgForm.body,
      timestamp: new Date().toISOString(),
    }]));
    setSending(false);
    setPhase(3);
  };

  const isSecretariat = type === "secretariat";

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── Dark page hero — matches reference screenshots ── */}
      <div className="page-hero">
        <div className="container max-w-4xl">
          <span className="eyebrow" style={{ color: "rgba(201,151,58,0.85)" }}>
            {isSecretariat ? "Leadership Board" : "Officers & Staff"}
          </span>
          <h1 className="font-display font-bold text-white leading-tight"
            style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)" }}>
            {isSecretariat ? "The Secretariat" : "Our Staff"}
          </h1>
          <p className="text-white/50 text-sm mt-3 max-w-md">
            Meet the team coordinating {edition?.name ?? "the conference"} behind the scenes.
            Reach out directly through the message channel below.
          </p>
        </div>
      </div>

      {/* Layout toggle + grid */}
      <section className="py-12 bg-white">
        <div className="container max-w-5xl">

          {/* Toggle */}
          <div className="flex items-center justify-end gap-1 mb-8">
            {(["grid", "list"] as const).map(v => (
              <button key={v} onClick={() => setLayout(v)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-semibold border transition-all",
                  layout === v
                    ? "bg-navy text-white border-navy"
                    : "bg-white text-navy/50 border-navy/12 hover:border-navy/30 hover:text-navy"
                )}>
                {v === "grid" ? <LayoutGrid className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="border border-navy/8 rounded-sm py-16 text-center text-sm text-navy/40 bg-white">
              Profiles will appear once added in the Secretariat console.
            </div>
          ) : layout === "grid" ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((m, i) => (
                <div key={m.id}
                  className="border border-navy/8 rounded-sm bg-white shadow-card p-6 flex flex-col items-center text-center gap-4 hover:shadow-elegant hover:-translate-y-0.5 transition-all animate-fade-in"
                  style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="w-20 h-20 rounded-sm overflow-hidden border border-navy/10 bg-navy/5 shrink-0">
                    <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-bold text-navy text-lg leading-tight">{m.name}</h3>
                    <p className="text-xs font-semibold text-gold mt-0.5">{m.position}</p>
                    {m.phone && (
                      <p className="text-[11px] text-navy/40 mt-2 flex items-center justify-center gap-1">
                        <Phone className="w-3 h-3" /> {m.phone}
                      </p>
                    )}
                  </div>
                  <button onClick={() => openModal(m)}
                    className="btn-gold w-full justify-center text-xs">
                    <MessageSquare className="w-3.5 h-3.5" /> Message
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-w-3xl mx-auto">
              {filtered.map((m, i) => (
                <div key={m.id}
                  className="border border-navy/8 rounded-sm bg-white shadow-card p-4 flex items-center gap-4 hover:shadow-elegant transition-all animate-fade-in"
                  style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="w-12 h-12 rounded-sm overflow-hidden border border-navy/10 bg-navy/5 shrink-0">
                    <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-navy truncate">{m.name}</h3>
                    <p className="text-xs font-semibold text-gold">{m.position}</p>
                    <div className="flex flex-wrap gap-3 mt-1">
                      {m.phone && (
                        <span className="text-[11px] text-navy/40 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {m.phone}
                        </span>
                      )}
                      {m.email && (
                        <span className="text-[11px] text-navy/40 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {m.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => openModal(m)} className="btn-ghost text-xs shrink-0">
                    <MessageSquare className="w-3.5 h-3.5" /> Message
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Message Modal ── */}
      {target && (
        <div className="fixed inset-0 z-50 bg-navy/30 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => { if (phase !== 3) setTarget(null); }}>
          <div className="border border-navy/8 rounded-sm bg-white shadow-elegant p-6 md:p-8 max-w-lg w-full animate-slide-up"
            onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="flex items-center justify-between gap-4 mb-6 pb-5 border-b border-navy/8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-sm overflow-hidden border border-navy/10 bg-navy/5 shrink-0">
                  <img src={target.photo} alt={target.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-display font-bold text-navy text-sm leading-tight">{target.name}</p>
                  <p className="text-[11px] font-semibold text-gold">{target.position}</p>
                </div>
              </div>
              {phase !== 3 && (
                <button onClick={() => setTarget(null)} aria-label="Close"
                  className="w-7 h-7 rounded-sm flex items-center justify-center text-navy/35 hover:text-navy hover:bg-navy/5 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Step indicator */}
            {phase !== 3 && (
              <div className="flex items-center gap-1 mb-6 text-[10px] font-bold tracking-widest text-navy/40">
                {(["YOUR DETAILS", "MESSAGE"] as const).map((label, idx) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <span className={cn(
                      "w-5 h-5 rounded-sm flex items-center justify-center text-[9px] font-bold",
                      phase === idx + 1 ? "bg-navy text-white" :
                      phase > idx + 1  ? "bg-gold text-white"  : "bg-navy/8 text-navy/40"
                    )}>{idx + 1}</span>
                    <span className={phase === idx + 1 ? "text-navy" : ""}>{label}</span>
                    {idx === 0 && <ChevronRight className="w-3 h-3 text-navy/20" />}
                  </div>
                ))}
              </div>
            )}

            {/* Phase 1 — Delegate info */}
            {phase === 1 && (
              <div className="space-y-3 animate-fade-in">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-navy/55">Full Name</Label>
                  <input className="form-input" value={delegateInfo.name}
                    onChange={e => setDInfo(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Aarav Gupta" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-navy/55">School</Label>
                    <input className="form-input" value={delegateInfo.school}
                      onChange={e => setDInfo(p => ({ ...p, school: e.target.value }))} placeholder="Prudence School" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-navy/55">Class</Label>
                    <input className="form-input" value={delegateInfo.grade}
                      onChange={e => setDInfo(p => ({ ...p, grade: e.target.value }))} placeholder="e.g. 11-A" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-navy/55">Role</Label>
                    <select value={delegateInfo.role} onChange={e => setDInfo(p => ({ ...p, role: e.target.value }))}
                      className="form-input h-10">
                      <option>Delegate</option>
                      <option>Executive Board</option>
                      <option>Organising Committee</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-navy/55">Contact</Label>
                    <input className="form-input" value={delegateInfo.contact}
                      onChange={e => setDInfo(p => ({ ...p, contact: e.target.value }))} placeholder="Phone or email" />
                  </div>
                </div>
                <div className="flex justify-end pt-2 border-t border-navy/6">
                  <button onClick={() => setPhase(2)}
                    disabled={!delegateInfo.name || !delegateInfo.school || !delegateInfo.contact}
                    className="btn-gold disabled:opacity-40 disabled:cursor-not-allowed">
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Phase 2 — Message form */}
            {phase === 2 && (
              <div className="space-y-3 animate-fade-in">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-navy/55">Send to</Label>
                  <select value={msgForm.recipientId}
                    onChange={e => setMsgForm(p => ({ ...p, recipientId: e.target.value }))}
                    className="form-input h-10">
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name} — {m.position}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-navy/55">Subject</Label>
                  <input className="form-input" value={msgForm.title}
                    onChange={e => setMsgForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Background Guide clarification" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-navy/55">Message</Label>
                  <Textarea rows={4} value={msgForm.body}
                    onChange={e => setMsgForm(p => ({ ...p, body: e.target.value }))}
                    placeholder="Write your message here…"
                    className="border-navy/15 text-navy placeholder:text-navy/30 focus:border-gold focus:ring-gold/20 text-sm" />
                </div>
                <div className="flex justify-between pt-2 border-t border-navy/6">
                  <button onClick={() => setPhase(1)} className="btn-ghost text-xs">Back</button>
                  <button onClick={sendMessage} disabled={!msgForm.title || !msgForm.body || sending}
                    className="btn-gold text-xs disabled:opacity-40 disabled:cursor-not-allowed">
                    {sending
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending…</>
                      : "Send Message"}
                  </button>
                </div>
              </div>
            )}

            {/* Phase 3 — Success */}
            {phase === 3 && (
              <div className="text-center py-6 space-y-4 animate-fade-in">
                <div className="w-14 h-14 mx-auto rounded-sm bg-green-50 border border-green-200 text-green-600 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-display text-xl font-bold text-navy mb-1">Message Sent!</h4>
                  <p className="text-xs text-navy/40">To: {target.name} · {target.position}</p>
                </div>
                <p className="text-sm text-navy/50 max-w-xs mx-auto">
                  The team will get back to you via the contact you provided.
                </p>
                <button onClick={() => setTarget(null)} className="btn-ghost px-8">Done</button>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
