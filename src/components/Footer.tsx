import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Instagram, Youtube, Facebook, MapPin, Phone, Mail,
  X, User, ArrowUpRight, ArrowRight, MessageCircle,
  Send, CheckCircle2, ChevronRight
} from "lucide-react";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import { cn } from "@/lib/utils";

type ContactPerson = {
  id: string; name: string; position: string;
  phone?: string; email?: string; photo?: string;
};

const NAV_COLS = [
  { label: "Conference", links: [
    { to: "/committees", label: "Committees" },
    { to: "/matrix",     label: "Matrix"     },
    { to: "/schedule",   label: "Schedule"   },
    { to: "/brochure",   label: "Brochure"   },
    { to: "/venue",      label: "Venue"      },
  ]},
  { label: "People", links: [
    { to: "/secretariats", label: "Secretariat" },
    { to: "/staff",        label: "Staff"       },
    { to: "/about",        label: "About Us"    },
    { to: "/gallery",      label: "Gallery"     },
  ]},
  { label: "Join", links: [
    { to: "/register",          label: "Register"       },
    { to: "/login",             label: "Delegate Login" },
    { to: "/secretariat-login", label: "Admin Login"    },
  ]},
];

export const Footer = () => {
  const { edition } = useActiveEdition();
  const [contactsOpen, setContactsOpen] = useState(false);
  const [contacts, setContacts] = useState<ContactPerson[]>([]);
  const [msgStep, setMsgStep] = useState<1 | 2 | 3>(1);
  const [selectedContact, setSelectedContact] = useState<ContactPerson | null>(null);
  const [senderInfo, setSenderInfo] = useState({ name: "", school: "", phone: "" });
  const [msgBody, setMsgBody] = useState("");
  const [msgSubject, setMsgSubject] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("mun_secretariats_list");
    if (stored) { try { setContacts(JSON.parse(stored)); } catch {} }
  }, []);

  const brand     = edition?.name?.split(" ")[0] ?? "PRUMUN";
  const year      = new Date().getFullYear();
  const tagline   = (edition as any)?.footer_tagline   ?? "Diplomacy · Debate · Destiny";
  const desc      = (edition as any)?.footer_desc      ?? "The premier Model United Nations conference at Prudence School, Dwarka — shaping the next generation of global leaders.";
  const ctaLabel  = (edition as any)?.footer_cta_label ?? "Get in touch";
  const copyright = (edition as any)?.footer_copyright ?? `© ${year} ${brand} Secretariat. All rights reserved.`;
  const footEmail = (edition as any)?.footer_email     ?? "";
  const footPhone = (edition as any)?.footer_phone     ?? "";
  const instagram = edition?.instagram_url ?? "https://www.instagram.com/prumun_2.0";
  const youtube   = edition?.youtube_url   ?? "https://www.youtube.com/@PrudenceSchools";
  const facebook  = edition?.facebook_url  ?? "https://www.facebook.com/prudenceschoolsdelhi/";

  const openModal = () => {
    setContactsOpen(true); setMsgStep(1); setSelectedContact(null);
    setSenderInfo({ name: "", school: "", phone: "" });
    setMsgBody(""); setMsgSubject("");
  };

  const sendMessage = () => {
    if (!selectedContact || !senderInfo.name || !msgBody || !msgSubject) return;
    const existing = JSON.parse(localStorage.getItem("mun_secretariat_messages") ?? "[]");
    localStorage.setItem("mun_secretariat_messages", JSON.stringify([...existing, {
      id: `msg-${Date.now()}`,
      secretariatId: selectedContact.id,
      recipientName: selectedContact.name,
      recipientRole: selectedContact.position,
      ...senderInfo,
      subject: msgSubject,
      message: msgBody,
      timestamp: new Date().toISOString(),
      read: false,
    }]));
    setMsgStep(3);
  };

  return (
    <>
      {/* ── Light footer ── */}
      <footer className="mt-20 bg-slate-50 border-t border-border/60">

        {/* CTA banner */}
        <div className="bg-gradient-to-r from-primary/5 via-blue-50 to-primary/5 border-b border-border/40">
          <div className="container py-10 flex flex-col sm:flex-row items-center justify-between gap-5">
            <div>
              <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-primary/60 mb-1">{tagline}</p>
              <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">Ready to make your mark?</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/register"
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary to-blue-500 text-white font-bold text-sm hover:opacity-90 transition-all shadow-md hover:scale-105">
                Register Now <ArrowRight className="w-4 h-4" />
              </Link>
              <button onClick={openModal}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-primary/30 text-primary font-semibold text-sm hover:bg-primary/5 transition-all">
                <MessageCircle className="w-4 h-4" /> {ctaLabel}
              </button>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="container py-12">
          <div className="grid md:grid-cols-5 gap-10 mb-10">
            {/* Brand */}
            <div className="md:col-span-2">
              <Link to="/" className="inline-flex flex-col mb-4">
                <span className="font-display font-black text-[20px] tracking-tight text-foreground leading-none">{brand}</span>
                <span className="text-[8px] tracking-[0.26em] font-bold uppercase text-primary/50 mt-0.5">Prudence Model United Nations</span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-[280px]">{desc}</p>
              <div className="space-y-2 mb-5">
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span>{edition?.venue_address ?? "Sector 22, Dwarka, New Delhi — 110077"}</span>
                </div>
                {footEmail && (
                  <a href={`mailto:${footEmail}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                    <Mail className="w-3.5 h-3.5 text-primary" /> {footEmail}
                  </a>
                )}
                {footPhone && (
                  <a href={`tel:${footPhone}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                    <Phone className="w-3.5 h-3.5 text-primary" /> {footPhone}
                  </a>
                )}
              </div>
              <div className="flex gap-2">
                {[
                  { href: instagram, Icon: Instagram, label: "Instagram" },
                  { href: youtube,   Icon: Youtube,   label: "YouTube"   },
                  { href: facebook,  Icon: Facebook,  label: "Facebook"  },
                ].map(({ href, Icon, label }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                    className="w-9 h-9 rounded-xl border border-border bg-white flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all shadow-sm">
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Nav cols */}
            {NAV_COLS.map(col => (
              <div key={col.label}>
                <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-primary/50 mb-4">{col.label}</p>
                <ul className="space-y-2.5">
                  {col.links.map(l => (
                    <li key={l.to}>
                      <Link to={l.to}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 group w-fit">
                        {l.label}
                        <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-border/60 pt-6 flex flex-col sm:flex-row justify-between gap-2 text-xs text-muted-foreground/60">
            <span>{copyright}</span>
            <span>Prudence School, Dwarka · New Delhi, India</span>
          </div>
        </div>
      </footer>

      {/* ── Get in Touch Modal ── */}
      {contactsOpen && (
        <div className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setContactsOpen(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col border border-border/30"
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border/50 bg-gradient-to-r from-primary/5 to-blue-50/50 shrink-0">
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">Get in touch</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Send a message to the Secretariat team</p>
              </div>
              <button onClick={() => setContactsOpen(false)}
                className="w-8 h-8 rounded-full bg-white border border-border hover:bg-secondary flex items-center justify-center transition-all">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Step indicator */}
            {msgStep !== 3 && (
              <div className="flex items-center gap-2 px-6 py-3 bg-secondary/30 border-b border-border/40 shrink-0">
                {(["Choose recipient", "Your details & message"] as const).map((label, i) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black",
                      msgStep > i + 1 ? "bg-success text-white" :
                      msgStep === i + 1 ? "bg-primary text-white" : "bg-border text-muted-foreground"
                    )}>{msgStep > i + 1 ? "✓" : i + 1}</div>
                    <span className={cn("text-[11px] font-semibold", msgStep === i + 1 ? "text-primary" : "text-muted-foreground")}>{label}</span>
                    {i === 0 && <ChevronRight className="w-3 h-3 text-border mx-1" />}
                  </div>
                ))}
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto">

              {/* Step 1 — pick recipient */}
              {msgStep === 1 && (
                <div className="p-5 space-y-3">
                  {contacts.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-14 h-14 rounded-2xl bg-secondary mx-auto mb-3 flex items-center justify-center">
                        <User className="w-7 h-7 text-muted-foreground/40" />
                      </div>
                      <p className="font-semibold text-sm text-muted-foreground">No contacts published yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Check back closer to the conference</p>
                      {footEmail && (
                        <a href={`mailto:${footEmail}`} className="inline-flex items-center gap-1.5 mt-4 text-sm text-primary font-semibold hover:underline">
                          <Mail className="w-4 h-4" /> Email us directly
                        </a>
                      )}
                    </div>
                  ) : (
                    contacts.map(c => (
                      <button key={c.id} onClick={() => { setSelectedContact(c); setMsgStep(2); }}
                        className="w-full flex items-center gap-4 rounded-2xl p-4 border-2 border-border/50 text-left transition-all hover:border-primary/40 hover:bg-primary/3 bg-white">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center shrink-0 shadow-sm">
                          {c.photo
                            ? <img src={c.photo} alt={c.name} className="w-full h-full object-cover" />
                            : <span className="text-white font-bold text-lg">{c.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}</span>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-foreground">{c.name}</p>
                          <p className="text-xs font-semibold text-primary mt-0.5">{c.position}</p>
                          <div className="flex flex-wrap gap-3 mt-1.5">
                            {c.phone && <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Phone className="w-3 h-3" /> {c.phone}</span>}
                            {c.email && <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Mail className="w-3 h-3" /> {c.email}</span>}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Step 2 — form */}
              {msgStep === 2 && selectedContact && (
                <div className="p-5 space-y-4">
                  {/* Recipient */}
                  <div className="flex items-center gap-3 rounded-2xl bg-primary/5 border border-primary/15 px-4 py-3">
                    <div className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center shrink-0">
                      {selectedContact.photo
                        ? <img src={selectedContact.photo} alt="" className="w-full h-full object-cover" />
                        : <span className="text-white text-xs font-bold">{selectedContact.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{selectedContact.name}</p>
                      <p className="text-[11px] text-primary font-semibold">{selectedContact.position}</p>
                    </div>
                    <button onClick={() => setMsgStep(1)} className="text-[11px] text-primary font-semibold hover:underline">Change</button>
                  </div>

                  {/* Sender */}
                  <div className="space-y-3">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Your details</p>
                    <input
                      className="w-full h-10 rounded-xl border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Your full name *"
                      value={senderInfo.name}
                      onChange={e => setSenderInfo(p => ({ ...p, name: e.target.value }))}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        className="h-10 rounded-xl border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="School / Institution"
                        value={senderInfo.school}
                        onChange={e => setSenderInfo(p => ({ ...p, school: e.target.value }))}
                      />
                      <input
                        className="h-10 rounded-xl border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="Phone / WhatsApp"
                        value={senderInfo.phone}
                        onChange={e => setSenderInfo(p => ({ ...p, phone: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-3">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Message</p>
                    <input
                      className="w-full h-10 rounded-xl border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Subject *"
                      value={msgSubject}
                      onChange={e => setMsgSubject(e.target.value)}
                    />
                    <textarea
                      rows={4}
                      className="w-full rounded-xl border border-input bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                      placeholder="Write your message here… *"
                      value={msgBody}
                      onChange={e => setMsgBody(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button onClick={() => setMsgStep(1)} className="text-sm text-muted-foreground hover:text-foreground font-medium">← Back</button>
                    <button onClick={sendMessage}
                      disabled={!senderInfo.name || !msgBody || !msgSubject}
                      className={cn(
                        "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                        (!senderInfo.name || !msgBody || !msgSubject)
                          ? "bg-muted text-muted-foreground cursor-not-allowed"
                          : "bg-gradient-to-r from-primary to-blue-500 text-white hover:opacity-90 shadow-md"
                      )}>
                      <Send className="w-4 h-4" /> Send message
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3 — success */}
              {msgStep === 3 && (
                <div className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-success/10 text-success flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-display text-xl font-bold mb-1">Message sent!</h4>
                    <p className="text-sm text-muted-foreground">
                      Sent to <span className="font-semibold text-foreground">{selectedContact?.name}</span>. We'll get back to you soon.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-secondary/50 border border-border p-4 text-left space-y-1.5 text-xs">
                    <p><span className="font-bold text-foreground">To:</span> <span className="text-muted-foreground">{selectedContact?.name} — {selectedContact?.position}</span></p>
                    <p><span className="font-bold text-foreground">From:</span> <span className="text-muted-foreground">{senderInfo.name}{senderInfo.school ? `, ${senderInfo.school}` : ""}{senderInfo.phone ? ` · ${senderInfo.phone}` : ""}</span></p>
                    <p><span className="font-bold text-foreground">Subject:</span> <span className="text-muted-foreground">{msgSubject}</span></p>
                    <p className="line-clamp-2"><span className="font-bold text-foreground">Message:</span> <span className="text-muted-foreground">{msgBody}</span></p>
                  </div>
                  <button onClick={() => setContactsOpen(false)}
                    className="w-full py-3 rounded-2xl border border-border text-sm font-semibold hover:bg-secondary transition-colors">
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
