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

/* Inline style helpers to keep JSX readable */
const goldBorder  = { borderColor: "oklch(0.78 0.13 80 / 0.15)" } as React.CSSProperties;
const goldRule    = { background: "var(--gradient-gold)" } as React.CSSProperties;
const navyBg      = { background: "oklch(0.22 0.09 263)" } as React.CSSProperties;
const navyDeeper  = { background: "oklch(0.19 0.09 263)" } as React.CSSProperties;
const goldGradCTA = { background: "var(--gradient-gold)", color: "oklch(0.18 0.04 263)", boxShadow: "var(--shadow-gold)" } as React.CSSProperties;

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
      {/* ── Diplomatic footer ── */}
      <footer className="mt-20" style={navyBg}>

        {/* CTA banner — thin gold top rule */}
        <div style={{ ...navyDeeper, borderBottom: "1px solid oklch(0.78 0.13 80 / 0.10)" }}>
          <div className="container py-10 flex flex-col sm:flex-row items-center justify-between gap-5">
            <div>
              {/* Gold eyebrow */}
              <span className="block text-[9px] font-semibold tracking-[0.35em] uppercase mb-1"
                style={{ color: "oklch(0.78 0.13 80 / 0.65)" }}>
                {tagline}
              </span>
              <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
                Ready to make your mark?
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/register"
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105"
                style={goldGradCTA}>
                Register Now <ArrowRight className="w-4 h-4" />
              </Link>
              <button onClick={openModal}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all text-muted-foreground hover:text-foreground"
                style={{ border: "1px solid oklch(0.78 0.13 80 / 0.20)", background: "oklch(0.24 0.08 263 / 0.60)" }}>
                <MessageCircle className="w-4 h-4" style={{ color: "oklch(0.78 0.13 80)" }} />
                {ctaLabel}
              </button>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="container py-14">
          <div className="grid md:grid-cols-5 gap-10 mb-10">

            {/* Brand col */}
            <div className="md:col-span-2">
              <Link to="/" className="inline-flex flex-col mb-5">
                <span className="font-display font-bold text-[20px] tracking-tight text-foreground leading-none">{brand}</span>
                <span className="text-[7.5px] tracking-[0.28em] font-semibold uppercase mt-1"
                  style={{ color: "oklch(0.78 0.13 80 / 0.60)" }}>
                  Prudence Model United Nations
                </span>
              </Link>

              {/* Gold rule accent */}
              <span className="gold-rule" />

              <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-[280px]">{desc}</p>

              <div className="space-y-2.5 mb-6">
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "oklch(0.78 0.13 80 / 0.70)" }} />
                  <span>{edition?.venue_address ?? "Sector 22, Dwarka, New Delhi — 110077"}</span>
                </div>
                {footEmail && (
                  <a href={`mailto:${footEmail}`}
                    className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-primary">
                    <Mail className="w-3.5 h-3.5" style={{ color: "oklch(0.78 0.13 80 / 0.70)" }} /> {footEmail}
                  </a>
                )}
                {footPhone && (
                  <a href={`tel:${footPhone}`}
                    className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-primary">
                    <Phone className="w-3.5 h-3.5" style={{ color: "oklch(0.78 0.13 80 / 0.70)" }} /> {footPhone}
                  </a>
                )}
              </div>

              {/* Social icons — square, gold on hover */}
              <div className="flex gap-2">
                {[
                  { href: instagram, Icon: Instagram, label: "Instagram" },
                  { href: youtube,   Icon: Youtube,   label: "YouTube"   },
                  { href: facebook,  Icon: Facebook,  label: "Facebook"  },
                ].map(({ href, Icon, label }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all text-muted-foreground hover:text-primary"
                    style={{ border: "1px solid oklch(0.78 0.13 80 / 0.12)", background: "oklch(0.26 0.08 263)" }}>
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Nav link columns */}
            {NAV_COLS.map(col => (
              <div key={col.label}>
                <p className="text-[9px] font-semibold tracking-[0.32em] uppercase mb-4"
                  style={{ color: "oklch(0.78 0.13 80 / 0.55)" }}>
                  {col.label}
                </p>
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

          {/* Bottom bar */}
          <div className="pt-6 flex flex-col sm:flex-row justify-between gap-2 text-xs text-muted-foreground"
            style={{ borderTop: "1px solid oklch(0.78 0.13 80 / 0.10)" }}>
            <span>{copyright}</span>
            <span style={{ color: "oklch(0.78 0.13 80 / 0.40)" }}>Prudence School, Dwarka · New Delhi, India</span>
          </div>
        </div>
      </footer>

      {/* ── Get in Touch Modal ── */}
      {contactsOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-fade-in"
          style={{ background: "oklch(0.10 0.06 263 / 0.75)", backdropFilter: "blur(8px)" }}
          onClick={() => setContactsOpen(false)}>
          <div className="rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
            style={{
              background: "oklch(0.24 0.08 263)",
              border: "1px solid oklch(0.78 0.13 80 / 0.15)",
              boxShadow: "var(--shadow-elegant)",
            }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 shrink-0"
              style={{ borderBottom: "1px solid oklch(0.78 0.13 80 / 0.12)", background: "oklch(0.22 0.09 263)" }}>
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">Get in touch</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Send a message to the Secretariat team</p>
              </div>
              <button onClick={() => setContactsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all text-muted-foreground hover:text-foreground hover:bg-muted"
                style={{ border: "1px solid oklch(0.78 0.13 80 / 0.15)" }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step indicator */}
            {msgStep !== 3 && (
              <div className="flex items-center gap-2 px-6 py-3 shrink-0"
                style={{ background: "oklch(0.20 0.09 263)", borderBottom: "1px solid oklch(0.78 0.13 80 / 0.10)" }}>
                {(["Choose recipient", "Your details & message"] as const).map((label, i) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                    )}
                    style={
                      msgStep > i + 1
                        ? { background: "var(--gradient-gold)", color: "oklch(0.18 0.04 263)" }
                        : msgStep === i + 1
                        ? { background: "oklch(0.78 0.13 80)", color: "oklch(0.18 0.04 263)" }
                        : { background: "oklch(0.30 0.07 263)", color: "oklch(0.60 0.03 263)" }
                    }>
                      {msgStep > i + 1 ? "✓" : i + 1}
                    </div>
                    <span className="text-[11px] font-medium"
                      style={{ color: msgStep === i + 1 ? "oklch(0.78 0.13 80)" : "oklch(0.55 0.03 263)" }}>
                      {label}
                    </span>
                    {i === 0 && <ChevronRight className="w-3 h-3 mx-1" style={{ color: "oklch(0.35 0.06 263)" }} />}
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
                      <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                        style={{ background: "oklch(0.28 0.07 263)" }}>
                        <User className="w-7 h-7 text-muted-foreground" />
                      </div>
                      <p className="font-semibold text-sm text-muted-foreground">No contacts published yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Check back closer to the conference</p>
                      {footEmail && (
                        <a href={`mailto:${footEmail}`} className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold hover:underline"
                          style={{ color: "oklch(0.78 0.13 80)" }}>
                          <Mail className="w-4 h-4" /> Email us directly
                        </a>
                      )}
                    </div>
                  ) : (
                    contacts.map(c => (
                      <button key={c.id} onClick={() => { setSelectedContact(c); setMsgStep(2); }}
                        className="w-full flex items-center gap-4 rounded-2xl p-4 text-left transition-all"
                        style={{
                          border: "1px solid oklch(0.78 0.13 80 / 0.12)",
                          background: "oklch(0.26 0.08 263)",
                        }}>
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center shrink-0"
                          style={{ background: "var(--gradient-gold)" }}>
                          {c.photo
                            ? <img src={c.photo} alt={c.name} className="w-full h-full object-cover" />
                            : <span className="font-bold text-lg" style={{ color: "oklch(0.18 0.04 263)" }}>
                                {c.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                              </span>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground">{c.name}</p>
                          <p className="text-xs font-medium mt-0.5" style={{ color: "oklch(0.78 0.13 80)" }}>{c.position}</p>
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
                  <div className="flex items-center gap-3 rounded-2xl px-4 py-3"
                    style={{ background: "oklch(0.78 0.13 80 / 0.08)", border: "1px solid oklch(0.78 0.13 80 / 0.15)" }}>
                    <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shrink-0"
                      style={{ background: "var(--gradient-gold)" }}>
                      {selectedContact.photo
                        ? <img src={selectedContact.photo} alt="" className="w-full h-full object-cover" />
                        : <span className="text-xs font-bold" style={{ color: "oklch(0.18 0.04 263)" }}>
                            {selectedContact.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                          </span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{selectedContact.name}</p>
                      <p className="text-[11px] font-medium" style={{ color: "oklch(0.78 0.13 80)" }}>{selectedContact.position}</p>
                    </div>
                    <button onClick={() => setMsgStep(1)} className="text-[11px] font-semibold hover:underline"
                      style={{ color: "oklch(0.78 0.13 80)" }}>Change</button>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Your details</p>
                    <input
                      className="input-diplomatic w-full h-10 px-3 text-sm"
                      placeholder="Your full name *"
                      value={senderInfo.name}
                      onChange={e => setSenderInfo(p => ({ ...p, name: e.target.value }))}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        className="input-diplomatic h-10 px-3 text-sm w-full"
                        placeholder="School / Institution"
                        value={senderInfo.school}
                        onChange={e => setSenderInfo(p => ({ ...p, school: e.target.value }))}
                      />
                      <input
                        className="input-diplomatic h-10 px-3 text-sm w-full"
                        placeholder="Phone / WhatsApp"
                        value={senderInfo.phone}
                        onChange={e => setSenderInfo(p => ({ ...p, phone: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Message</p>
                    <input
                      className="input-diplomatic w-full h-10 px-3 text-sm"
                      placeholder="Subject *"
                      value={msgSubject}
                      onChange={e => setMsgSubject(e.target.value)}
                    />
                    <textarea
                      rows={4}
                      className="input-diplomatic w-full px-3 py-2.5 text-sm resize-none"
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
                        "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all",
                        (!senderInfo.name || !msgBody || !msgSubject)
                          ? "opacity-40 cursor-not-allowed bg-muted text-muted-foreground"
                          : ""
                      )}
                      style={(!senderInfo.name || !msgBody || !msgSubject) ? {} : goldGradCTA}>
                      <Send className="w-4 h-4" /> Send message
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3 — success */}
              {msgStep === 3 && (
                <div className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
                    style={{ background: "oklch(0.78 0.13 80 / 0.12)", border: "1px solid oklch(0.78 0.13 80 / 0.25)" }}>
                    <CheckCircle2 className="w-8 h-8" style={{ color: "oklch(0.78 0.13 80)" }} />
                  </div>
                  <div>
                    <h4 className="font-display text-xl font-bold text-foreground mb-1">Message sent</h4>
                    <p className="text-sm text-muted-foreground">
                      Sent to <span className="font-semibold text-foreground">{selectedContact?.name}</span>. We'll be in touch shortly.
                    </p>
                  </div>
                  <div className="rounded-2xl p-4 text-left space-y-1.5 text-xs"
                    style={{ background: "oklch(0.20 0.09 263)", border: "1px solid oklch(0.78 0.13 80 / 0.10)" }}>
                    <p><span className="font-semibold text-foreground">To:</span> <span className="text-muted-foreground">{selectedContact?.name} — {selectedContact?.position}</span></p>
                    <p><span className="font-semibold text-foreground">From:</span> <span className="text-muted-foreground">{senderInfo.name}{senderInfo.school ? `, ${senderInfo.school}` : ""}{senderInfo.phone ? ` · ${senderInfo.phone}` : ""}</span></p>
                    <p><span className="font-semibold text-foreground">Subject:</span> <span className="text-muted-foreground">{msgSubject}</span></p>
                    <p className="line-clamp-2"><span className="font-semibold text-foreground">Message:</span> <span className="text-muted-foreground">{msgBody}</span></p>
                  </div>
                  <button onClick={() => setContactsOpen(false)}
                    className="w-full py-3 rounded-2xl text-sm font-semibold transition-all text-muted-foreground hover:text-foreground"
                    style={{ border: "1px solid oklch(0.78 0.13 80 / 0.18)", background: "oklch(0.26 0.08 263)" }}>
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
