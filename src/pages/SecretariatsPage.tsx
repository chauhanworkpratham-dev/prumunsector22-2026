import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import { PageBackdrop } from "@/hooks/usePageBackground";
import { 
  Users, Mail, Phone, MessageSquare, CheckCircle, 
  ChevronRight, CalendarDays, MapPin, Sparkles, Orbit, Network 
} from "lucide-react";
import { cn } from "@/lib/utils";
import crest from "@/assets/prumun-crest.png";

type SecMember = {
  id: string;
  name: string;
  role: "secretariat" | "staff";
  position: string;
  phone: string;
  email: string;
  photo: string;
  rank: number;
};

const DEFAULT_MEMBERS: SecMember[] = [
  {
    id: "sec-1",
    name: "Aarav Sharma",
    role: "secretariat",
    position: "Secretary General",
    phone: "+91 98765 43210",
    email: "secgen@prumun.org",
    photo: "https://api.dicebear.com/7.x/adventurer/svg?seed=Aarav",
    rank: 1
  },
  {
    id: "sec-2",
    name: "Diya Kaplan",
    role: "secretariat",
    position: "Director General",
    phone: "+91 98765 43211",
    email: "directorgent@prumun.org",
    photo: "https://api.dicebear.com/7.x/adventurer/svg?seed=Diya",
    rank: 2
  },
  {
    id: "staff-1",
    name: "Rohan Verma",
    role: "staff",
    position: "Chief of Staff",
    phone: "+91 98765 43212",
    email: "rohan@prumun.org",
    photo: "https://api.dicebear.com/7.x/adventurer/svg?seed=Rohan",
    rank: 3
  }
];

export const SecretariatsPage = ({ type }: { type: "secretariat" | "staff" }) => {
  const { edition } = useActiveEdition();
  const [members, setMembers] = useState<SecMember[]>([]);
  const [displayLayout, setDisplayLayout] = useState<"circular" | "tree">("circular");

  // Messaging Modal Stepper
  const [targetMember, setTargetMember] = useState<SecMember | null>(null);
  const [msgPhase, setMsgPhase] = useState<1 | 2 | 3>(1);
  const [delegateInfo, setDelegateInfo] = useState({
    name: "",
    school: "",
    grade: "",
    role: "Delegate",
    contact: ""
  });
  const [messageForm, setMessageForm] = useState({
    recipientId: "",
    title: "",
    body: ""
  });

  useEffect(() => {
    const stored = localStorage.getItem("mun_secretariats_list");
    if (stored) {
      setMembers(JSON.parse(stored));
    } else {
      setMembers(DEFAULT_MEMBERS);
      localStorage.setItem("mun_secretariats_list", JSON.stringify(DEFAULT_MEMBERS));
    }
  }, []);

  // Filter and sort members
  const filtered = members
    .filter(m => m.role === type)
    .sort((a, b) => a.rank - b.rank);

  const openMessageModal = (m: SecMember) => {
    setTargetMember(m);
    setMessageForm({
      recipientId: m.id,
      title: "",
      body: ""
    });
    setMsgPhase(1);
  };

  const handleSendMessage = () => {
    if (!messageForm.title || !messageForm.body) {
      return;
    }
    
    // Save to local storage inbox
    const stored = localStorage.getItem("mun_secretariat_messages");
    const msgs = stored ? JSON.parse(stored) : [];
    
    const newMsg = {
      id: `msg-${Date.now()}`,
      secretariatId: messageForm.recipientId,
      delegateName: delegateInfo.name,
      delegateSchool: delegateInfo.school,
      delegateClass: delegateInfo.grade,
      delegateRole: delegateInfo.role,
      delegateContact: delegateInfo.contact,
      title: messageForm.title,
      message: messageForm.body,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem("mun_secretariat_messages", JSON.stringify([...msgs, newMsg]));
    setMsgPhase(3);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Navbar />
      <PageBackdrop pageKey="venue" />

      {/* Cinematic Header */}
      <section className="pt-36 pb-12 container text-center relative z-10">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 glass rounded-full px-5 py-2 mb-2 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold tracking-[0.2em] text-primary-deep uppercase">
              Meet Our Leaders
            </span>
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-bold gradient-text-deep leading-none">
            {type === "secretariat" ? "The Secretariat Board" : "The Officers & Staff"}
          </h1>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            Diplomats coordinating the conference behind the scenes. Personally message any team member using the interactive channels below.
          </p>

          {/* Layout switches */}
          <div className="flex justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDisplayLayout("circular")}
              className={cn("rounded-xl font-semibold", displayLayout === "circular" && "bg-primary/10 text-primary border-primary/20")}
            >
              <Orbit className="w-4 h-4 mr-1.5" /> Circular Board
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDisplayLayout("tree")}
              className={cn("rounded-xl font-semibold", displayLayout === "tree" && "bg-primary/10 text-primary border-primary/20")}
            >
              <Network className="w-4 h-4 mr-1.5" /> Organizational Tree
            </Button>
          </div>
        </div>
      </section>

      {/* Main interactive layouts container */}
      <section className="container pb-24 relative z-10">
        {filtered.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center text-muted-foreground">
            No profiles listed yet. Profiles will appear once added in the Secretariat console.
          </div>
        ) : displayLayout === "circular" ? (
          /* ================= Orbit Boardroom Layout ================= */
          <div className="relative min-h-[500px] flex items-center justify-center py-12">
            {/* Center Core */}
            <div className="w-32 h-32 rounded-full glass border border-primary/20 flex flex-col items-center justify-center shadow-elegant z-20 animate-glow-pulse relative">
              <img src={edition?.logo_url || crest} alt="" className="w-20 h-20 object-contain drop-shadow-md" />
              <span className="text-[8px] font-bold tracking-[0.2em] text-primary mt-1">PRUMUN</span>
            </div>

            {/* Orbit rings */}
            <div className="absolute w-[360px] h-[360px] sm:w-[480px] sm:h-[480px] rounded-full border border-dashed border-primary/20 animate-spin -z-10 pointer-events-none" style={{ animationDuration: "120s" }} />
            <div className="absolute w-[500px] h-[500px] sm:w-[680px] sm:h-[680px] rounded-full border border-dashed border-primary/10 animate-spin -z-10 pointer-events-none" style={{ animationDuration: "180s", animationDirection: "reverse" }} />

            {/* Orbiting Profile Cards */}
            <div className="w-full max-w-5xl grid sm:grid-cols-2 md:grid-cols-3 gap-6 pt-12">
              {filtered.map((m, i) => (
                <div 
                  key={m.id}
                  className="glass hover-lift rounded-3xl p-5 border border-border/50 shadow-glass flex flex-col justify-between items-center text-center animate-fade-in relative overflow-hidden"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                  
                  <div className="w-20 h-20 rounded-full border-2 border-primary/40 overflow-hidden bg-secondary relative z-10 shrink-0 mb-4 shadow-soft">
                    <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
                  </div>

                  <div className="space-y-1 relative z-10 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-display text-lg font-bold tracking-tight text-foreground">{m.name}</h3>
                      <p className="text-xs text-primary font-bold tracking-wider">{m.position}</p>
                    </div>

                    <div className="flex justify-center gap-4 text-muted-foreground text-[11px] pt-3">
                      {m.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-primary/75" /> {m.phone}</span>}
                    </div>

                    <Button 
                      onClick={() => openMessageModal(m)} 
                      variant="hero" 
                      size="sm" 
                      className="w-full mt-4 text-xs font-bold rounded-xl"
                    >
                      <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Message Us
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ================= Organizational Tree Layout ================= */
          <div className="max-w-4xl mx-auto space-y-12 py-12 relative">
            {filtered.map((m, i) => {
              const isEven = i % 2 === 0;
              return (
                <div 
                  key={m.id}
                  className={cn(
                    "flex flex-col md:flex-row items-center gap-6 md:gap-12 relative animate-fade-in",
                    !isEven && "md:flex-row-reverse"
                  )}
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  {/* Vertical connector line */}
                  {i < filtered.length - 1 && (
                    <div className="hidden md:block absolute left-1/2 -bottom-16 w-0.5 h-16 bg-gradient-to-b from-primary/20 to-primary/40" />
                  )}

                  {/* Profile Card */}
                  <div className="w-full md:w-[60%] glass rounded-3xl p-6 border border-border/50 shadow-glass flex flex-col sm:flex-row items-center gap-5 hover-lift relative overflow-hidden">
                    <div className="w-20 h-20 rounded-full border-2 border-primary/40 overflow-hidden bg-secondary shadow-soft shrink-0">
                      <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-1 min-w-0 text-center sm:text-left space-y-1.5">
                      <div>
                        <span className="text-[9px] font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full uppercase tracking-wider">RANK {m.rank}</span>
                        <h3 className="font-display text-xl font-bold tracking-tight mt-1">{m.name}</h3>
                        <p className="text-xs text-primary font-bold">{m.position}</p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-[10px] text-muted-foreground pt-1 justify-center sm:justify-start">
                        {m.phone && <span className="flex items-center gap-1 justify-center"><Phone className="w-3 h-3 text-primary/75" /> {m.phone}</span>}
                        {m.email && <span className="flex items-center gap-1 justify-center"><Mail className="w-3 h-3 text-primary/75" /> {m.email}</span>}
                      </div>
                    </div>

                    <div className="shrink-0 w-full sm:w-auto pt-3 sm:pt-0">
                      <Button 
                        onClick={() => openMessageModal(m)} 
                        variant="hero" 
                        size="sm"
                        className="w-full sm:w-auto rounded-xl text-xs font-bold"
                      >
                        <MessageSquare className="w-3.5 h-3.5 mr-1" /> Message
                      </Button>
                    </div>
                  </div>

                  {/* Visual spacer on side */}
                  <div className="hidden md:block w-[40%] text-center text-muted-foreground italic text-xs">
                    Representing the leadership core of PRUMUN conference at position {m.rank}.
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Stepper Message Us Modal Popup */}
      {targetMember && (
        <div className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setTargetMember(null)}>
          <div className="glass-strong rounded-3xl p-6 md:p-8 max-w-lg w-full animate-fade-in relative" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start gap-4 border-b border-border/40 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary">
                  <img src={targetMember.photo} alt={targetMember.name} />
                </div>
                <div>
                  <h3 className="font-display font-bold">Contact {targetMember.name}</h3>
                  <p className="text-xs text-primary font-semibold">{targetMember.position}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setTargetMember(null)}>Close</Button>
            </div>

            {/* Steps Stepper Indicator */}
            <div className="flex justify-center gap-8 mb-6 text-[10px] font-bold text-muted-foreground">
              <span className={cn(msgPhase === 1 ? "text-primary" : "text-muted-foreground")}>1. PORTFOLIO DETAILS</span>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
              <span className={cn(msgPhase === 2 ? "text-primary" : "text-muted-foreground")}>2. ENTER MESSAGE</span>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
              <span className={cn(msgPhase === 3 ? "text-primary" : "text-muted-foreground")}>3. COMPLETE</span>
            </div>

            {/* Step 1: Delegate Portfolio Info */}
            {msgPhase === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1.5">
                  <Label>Delegate Full Name</Label>
                  <Input 
                    value={delegateInfo.name} 
                    onChange={e => setDelegateInfo({ ...delegateInfo, name: e.target.value })}
                    placeholder="e.g. Aarav Gupta" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>School / Institution</Label>
                    <Input 
                      value={delegateInfo.school} 
                      onChange={e => setDelegateInfo({ ...delegateInfo, school: e.target.value })}
                      placeholder="e.g. Prudence School" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Class / Grade</Label>
                    <Input 
                      value={delegateInfo.grade} 
                      onChange={e => setDelegateInfo({ ...delegateInfo, grade: e.target.value })}
                      placeholder="e.g. Class 11-A" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Role in Matrix</Label>
                    <select 
                      value={delegateInfo.role}
                      onChange={e => setDelegateInfo({ ...delegateInfo, role: e.target.value })}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="Delegate">Delegate</option>
                      <option value="Executive Board">Executive Board (EB)</option>
                      <option value="Organising Committee">Organising Committee (OC)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Contact Phone/Email</Label>
                    <Input 
                      value={delegateInfo.contact} 
                      onChange={e => setDelegateInfo({ ...delegateInfo, contact: e.target.value })}
                      placeholder="Phone or Email" 
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-border/40 mt-6">
                  <Button 
                    variant="hero"
                    onClick={() => setMsgPhase(2)}
                    disabled={!delegateInfo.name || !delegateInfo.school || !delegateInfo.contact}
                  >
                    Next Step <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Message inputs */}
            {msgPhase === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1.5">
                  <Label>Recipient Profile</Label>
                  <select 
                    value={messageForm.recipientId}
                    onChange={e => setMessageForm({ ...messageForm, recipientId: e.target.value })}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.position})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label>Message Title / Topic</Label>
                  <Input 
                    value={messageForm.title} 
                    onChange={e => setMessageForm({ ...messageForm, title: e.target.value })}
                    placeholder="e.g. Clarification regarding Background Guides" 
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Message Content</Label>
                  <Textarea 
                    rows={4} 
                    value={messageForm.body} 
                    onChange={e => setMessageForm({ ...messageForm, body: e.target.value })}
                    placeholder="Write your message details here..." 
                  />
                </div>

                <div className="flex justify-between pt-4 border-t border-border/40 mt-6">
                  <Button variant="ghost" onClick={() => setMsgPhase(1)}>Back</Button>
                  <Button 
                    variant="hero"
                    onClick={handleSendMessage}
                    disabled={!messageForm.title || !messageForm.body}
                  >
                    Send Message
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Success message */}
            {msgPhase === 3 && (
              <div className="text-center py-8 space-y-4 animate-fade-in">
                <div className="w-16 h-16 mx-auto rounded-full bg-success/15 text-success flex items-center justify-center">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-display text-xl font-bold">Message Transmitted!</h4>
                  <p className="text-xs text-muted-foreground">Address: {targetMember.name}</p>
                </div>
                <p className="text-sm text-foreground/80 max-w-sm mx-auto">
                  Thank you for reaching out. You will be contacted shortly by the staff/secretariat itself regarding your inquiry.
                </p>
                <div className="pt-4">
                  <Button variant="outline" className="rounded-xl px-8" onClick={() => setTargetMember(null)}>
                    Dismiss
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
