import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import { PageBackdrop } from "@/hooks/usePageBackground";
import { Users, Mail, Phone, MessageSquare, CheckCircle2, ChevronRight, LayoutGrid, List, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import crest from "@/assets/prumun-crest.png";

type Member = {
  id: string;
  name: string;
  role: "secretariat" | "staff";
  position: string;
  phone: string;
  email: string;
  photo: string;
};

const DEFAULTS: Member[] = [
  { id: "s1", role: "secretariat", name: "Aarav Sharma",   position: "Secretary General",    phone: "+91 98765 43210", email: "secgen@prumun.org",   photo: "https://api.dicebear.com/7.x/adventurer/svg?seed=Aarav"  },
  { id: "s2", role: "secretariat", name: "Diya Kapoor",    position: "Director General",      phone: "+91 98765 43211", email: "dg@prumun.org",        photo: "https://api.dicebear.com/7.x/adventurer/svg?seed=Diya"   },
  { id: "s3", role: "secretariat", name: "Rohan Mehra",    position: "Deputy Secretary",      phone: "+91 98765 43213", email: "dep@prumun.org",       photo: "https://api.dicebear.com/7.x/adventurer/svg?seed=Rohan"  },
  { id: "f1", role: "staff",       name: "Priya Nair",     position: "Chief of Staff",        phone: "+91 98765 43214", email: "cos@prumun.org",       photo: "https://api.dicebear.com/7.x/adventurer/svg?seed=Priya"  },
  { id: "f2", role: "staff",       name: "Karan Bhatia",   position: "Head of Logistics",     phone: "+91 98765 43215", email: "logistics@prumun.org", photo: "https://api.dicebear.com/7.x/adventurer/svg?seed=Karan"  },
  { id: "f3", role: "staff",       name: "Ananya Gupta",   position: "Head of Publications",  phone: "+91 98765 43216", email: "pub@prumun.org",       photo: "https://api.dicebear.com/7.x/adventurer/svg?seed=Ananya" },
];

type Phase = 1 | 2 | 3;

export const SecretariatsPage = ({ type }: { type: "secretariat" | "staff" }) => {
  const { edition } = useActiveEdition();
  const [members, setMembers] = useState<Member[]>([]);
  const [layout,  setLayout]  = useState<"grid" | "list">("grid");

  const [target,   setTarget]   = useState<Member | null>(null);
  const [phase,    setPhase]    = useState<Phase>(1);
  const [sending,  setSending]  = useState(false);
  const [delegateInfo, setDInfo] = useState({ name: "", school: "", grade: "", role: "Delegate", contact: "" });
  const [msgForm, setMsgForm]   = useState({ recipientId: "", title: "", body: "" });

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

  return (
    <div className="min-h-screen bg-background mesh-bg">
      <Navbar />
      <PageBackdrop pageKey="venue" />

      {/* ── Header — increased top padding to avoid navbar clip ── */}
      <section className="pt-28 md:pt-32 pb-10 container text-center">
        <p className="section-label">{type === "secretariat" ? "Leadership Board" : "Officers & Staff"}</p>
        <h1 className="font-display text-4xl md:text-6xl font-bold gradient-text-deep mb-4 leading-tight mt-2">
          {type === "secretariat" ? "The Secretariat" : "Our Staff"}
        </h1>
        <p className="text-muted-foreground text-sm max-w-xl mx-auto mb-8">
          Meet the team coordinating {edition?.name ?? "the conference"} behind the scenes.
          Reach out directly through the message channel below.
        </p>

        <div className="inline-flex tab-bar">
          <button className="tab-item" aria-selected={layout === "grid"} onClick={() => setLayout("grid")}>
            <LayoutGrid className="w-3.5 h-3.5 inline mr-1.5" />Grid
          </button>
          <button className="tab-item" aria-selected={layout === "list"} onClick={() => setLayout("list")}>
            <List className="w-3.5 h-3.5 inline mr-1.5" />List
          </button>
        </div>
      </section>

      {/* ── Members ── */}
      <section className="container pb-24">
        {filtered.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center text-muted-foreground text-sm">
            Profiles will appear once added in the Secretariat console.
          </div>
        ) : layout === "grid" ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((m, i) => (
              <div key={m.id} className="glass rounded-2xl p-6 hover-lift flex flex-col items-center text-center gap-4 animate-fade-in"
                style={{ animationDelay: `${i * 60}ms` }}>
                <div className="w-24 h-24 rounded-2xl overflow-hidden ring-2 ring-primary/20 shadow-card bg-secondary shrink-0">
                  <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-bold text-lg leading-tight">{m.name}</h3>
                  <p className="text-xs font-semibold text-primary mt-0.5 tracking-wide">{m.position}</p>
                  {m.phone && (
                    <p className="text-[11px] text-muted-foreground mt-2 flex items-center justify-center gap-1">
                      <Phone className="w-3 h-3" /> {m.phone}
                    </p>
                  )}
                </div>
                <Button onClick={() => openModal(m)} size="sm"
                  className="w-full bg-gradient-primary text-white border-0 font-semibold hover:opacity-90 transition-opacity">
                  <MessageSquare className="w-3.5 h-3.5" /> Message
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3 max-w-3xl mx-auto">
            {filtered.map((m, i) => (
              <div key={m.id} className="glass rounded-2xl p-4 hover-lift flex items-center gap-4 animate-slide-in"
                style={{ animationDelay: `${i * 50}ms` }}>
                <div className="w-14 h-14 rounded-xl overflow-hidden ring-1 ring-primary/20 bg-secondary shrink-0">
                  <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold truncate">{m.name}</h3>
                  <p className="text-xs text-primary font-semibold">{m.position}</p>
                  <div className="flex flex-wrap gap-3 mt-1">
                    {m.phone && <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {m.phone}</span>}
                    {m.email && <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> {m.email}</span>}
                  </div>
                </div>
                <Button onClick={() => openModal(m)} size="sm" variant="outline"
                  className="shrink-0 font-semibold border-primary/30 text-primary hover:bg-primary hover:text-white transition-all">
                  <MessageSquare className="w-3.5 h-3.5" /> Message
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Message Modal ── */}
      {target && (
        <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => { if (phase !== 3) setTarget(null); }}>
          <div className="glass-strong rounded-3xl p-6 md:p-8 max-w-lg w-full animate-slide-up"
            onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between gap-4 mb-5 pb-4 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden ring-1 ring-primary/20 bg-secondary">
                  <img src={target.photo} alt={target.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-display font-bold text-sm">{target.name}</p>
                  <p className="text-xs text-primary font-semibold">{target.position}</p>
                </div>
              </div>
              {phase !== 3 && (
                <button onClick={() => setTarget(null)} aria-label="Close"
                  className="w-8 h-8 rounded-xl glass flex items-center justify-center hover:bg-destructive/10 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {phase !== 3 && (
              <div className="flex items-center gap-1 mb-6 text-[10px] font-bold tracking-widest text-muted-foreground">
                {(["YOUR DETAILS", "MESSAGE"] as const).map((label, idx) => (
                  <div key={label} className="flex items-center gap-1">
                    <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold",
                      phase === idx + 1 ? "bg-primary text-white" : phase > idx + 1 ? "bg-success/20 text-success" : "bg-secondary text-muted-foreground"
                    )}>{idx + 1}</span>
                    <span className={phase === idx + 1 ? "text-primary" : ""}>{label}</span>
                    {idx === 0 && <ChevronRight className="w-3 h-3 text-border" />}
                  </div>
                ))}
              </div>
            )}

            {phase === 1 && (
              <div className="space-y-3 animate-fade-in">
                <div className="space-y-1.5">
                  <Label htmlFor="d-name">Full Name</Label>
                  <Input id="d-name" value={delegateInfo.name} onChange={e => setDInfo(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Aarav Gupta" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="d-school">School</Label>
                    <Input id="d-school" value={delegateInfo.school} onChange={e => setDInfo(p => ({ ...p, school: e.target.value }))} placeholder="Prudence School" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="d-grade">Class</Label>
                    <Input id="d-grade" value={delegateInfo.grade} onChange={e => setDInfo(p => ({ ...p, grade: e.target.value }))} placeholder="e.g. 11-A" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="d-role">Role</Label>
                    <select id="d-role" value={delegateInfo.role} onChange={e => setDInfo(p => ({ ...p, role: e.target.value }))}
                      className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                      <option>Delegate</option>
                      <option>Executive Board</option>
                      <option>Organising Committee</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="d-contact">Contact</Label>
                    <Input id="d-contact" value={delegateInfo.contact} onChange={e => setDInfo(p => ({ ...p, contact: e.target.value }))} placeholder="Phone or email" />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button onClick={() => setPhase(2)}
                    disabled={!delegateInfo.name || !delegateInfo.school || !delegateInfo.contact}
                    className="bg-gradient-primary text-white border-0 font-semibold">
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {phase === 2 && (
              <div className="space-y-3 animate-fade-in">
                <div className="space-y-1.5">
                  <Label htmlFor="msg-to">Send to</Label>
                  <select id="msg-to" value={msgForm.recipientId} onChange={e => setMsgForm(p => ({ ...p, recipientId: e.target.value }))}
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    {members.map(m => <option key={m.id} value={m.id}>{m.name} — {m.position}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="msg-title">Subject</Label>
                  <Input id="msg-title" value={msgForm.title} onChange={e => setMsgForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Background Guide clarification" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="msg-body">Message</Label>
                  <Textarea id="msg-body" rows={4} value={msgForm.body} onChange={e => setMsgForm(p => ({ ...p, body: e.target.value }))} placeholder="Write your message here…" />
                </div>
                <div className="flex justify-between pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setPhase(1)}>Back</Button>
                  <Button onClick={sendMessage} disabled={!msgForm.title || !msgForm.body || sending}
                    className="bg-gradient-primary text-white border-0 font-semibold">
                    {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : "Send Message"}
                  </Button>
                </div>
              </div>
            )}

            {phase === 3 && (
              <div className="text-center py-6 space-y-4 animate-fade-in">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-success/10 text-success flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-display text-xl font-bold mb-1">Message Sent!</h4>
                  <p className="text-xs text-muted-foreground">To: {target.name} · {target.position}</p>
                </div>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  The team will get back to you via the contact you provided. Thank you!
                </p>
                <Button variant="outline" className="rounded-xl px-8 font-semibold" onClick={() => setTarget(null)}>
                  Done
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
