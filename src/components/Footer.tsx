import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Instagram, Youtube, Facebook, MapPin, Phone, Mail, X, User, ArrowUpRight, ArrowRight, MessageCircle } from "lucide-react";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import { getContactPersons, type ContactPerson } from "@/lib/munApi";
import { cn } from "@/lib/utils";

const NAV_COLS = [
  {
    label: "Conference",
    links: [
      { to: "/committees", label: "Committees"  },
      { to: "/matrix",     label: "Matrix"      },
      { to: "/schedule",   label: "Schedule"    },
      { to: "/brochure",   label: "Brochure"    },
    ],
  },
  {
    label: "People",
    links: [
      { to: "/secretariats", label: "Secretariat" },
      { to: "/staff",        label: "Staff"       },
      { to: "/venue",        label: "Venue"       },
      { to: "/about",        label: "About Us"    },
      { to: "/gallery",      label: "Gallery"     },
    ],
  },
  {
    label: "Join",
    links: [
      { to: "/register", label: "Register"      },
      { to: "/login",    label: "Delegate Login" },
      { to: "/secretariat-login", label: "Admin Login" },
    ],
  },
];

export const Footer = () => {
  const { edition } = useActiveEdition();
  const [contactsOpen, setContactsOpen] = useState(false);
  const [contacts, setContacts] = useState<ContactPerson[]>([]);

  useEffect(() => {
    if (!edition) return;
    getContactPersons(edition.id).then(setContacts);
  }, [edition]);

  const brand    = edition?.name?.split(" ")[0] ?? "PRUMUN";
  const year     = new Date().getFullYear();

  // CMS-editable fields (with fallbacks)
  const tagline   = (edition as any)?.footer_tagline  ?? "Diplomacy · Debate · Destiny";
  const desc      = (edition as any)?.footer_desc     ?? "The premier Model United Nations conference at Prudence School, Dwarka — shaping the next generation of global leaders.";
  const ctaLabel  = (edition as any)?.footer_cta_label ?? "Get in touch";
  const copyright = (edition as any)?.footer_copyright ?? `© ${year} ${brand} Secretariat. All rights reserved.`;
  const footEmail = (edition as any)?.footer_email     ?? "";
  const footPhone = (edition as any)?.footer_phone     ?? "";

  const instagram = edition?.instagram_url ?? "https://www.instagram.com/prumun_2.0";
  const youtube   = edition?.youtube_url   ?? "https://www.youtube.com/@PrudenceSchools";
  const facebook  = edition?.facebook_url  ?? "https://www.facebook.com/prudenceschoolsdelhi/";

  return (
    <>
      <footer className="mt-24 bg-[#03082e] text-white">
        {/* Top CTA strip */}
        <div className="border-b border-white/10">
          <div className="container py-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="font-display text-[11px] tracking-[0.3em] uppercase text-blue-300/70 mb-1">{tagline}</p>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-white">
                Ready to make your mark?
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/register"
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-[#03082e] font-bold text-sm hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:scale-105">
                Register Now <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setContactsOpen(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-full border border-white/25 text-white font-semibold text-sm hover:bg-white/10 transition-all">
                <MessageCircle className="w-4 h-4" /> {ctaLabel}
              </button>
            </div>
          </div>
        </div>

        {/* Main footer grid */}
        <div className="container py-14">
          <div className="grid md:grid-cols-5 gap-10 mb-12">

            {/* Brand column */}
            <div className="md:col-span-2">
              <Link to="/" className="inline-flex flex-col mb-5 group">
                <span className="font-display font-black text-[22px] tracking-tight text-white leading-none">{brand}</span>
                <span className="text-[8px] tracking-[0.28em] font-bold uppercase text-blue-300/60 mt-0.5">
                  Prudence Model United Nations
                </span>
              </Link>
              <p className="text-sm text-white/50 leading-relaxed mb-6 max-w-[280px]">{desc}</p>

              {/* Contact info */}
              <div className="space-y-2 mb-6">
                <div className="flex items-start gap-2 text-xs text-white/50">
                  <MapPin className="w-3.5 h-3.5 text-blue-300 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{edition?.venue_address ?? "Sector 22, Dwarka, New Delhi — 110077"}</span>
                </div>
                {footEmail && (
                  <a href={`mailto:${footEmail}`} className="flex items-center gap-2 text-xs text-white/50 hover:text-blue-300 transition-colors">
                    <Mail className="w-3.5 h-3.5 text-blue-300 shrink-0" />{footEmail}
                  </a>
                )}
                {footPhone && (
                  <a href={`tel:${footPhone}`} className="flex items-center gap-2 text-xs text-white/50 hover:text-blue-300 transition-colors">
                    <Phone className="w-3.5 h-3.5 text-blue-300 shrink-0" />{footPhone}
                  </a>
                )}
              </div>

              {/* Social icons */}
              <div className="flex gap-2">
                {[
                  { href: instagram, Icon: Instagram, label: "Instagram" },
                  { href: youtube,   Icon: Youtube,   label: "YouTube"   },
                  { href: facebook,  Icon: Facebook,  label: "Facebook"  },
                ].map(({ href, Icon, label }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                    className="w-9 h-9 rounded-xl bg-white/8 border border-white/12 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/18 hover:border-white/25 transition-all">
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Nav columns */}
            {NAV_COLS.map(col => (
              <div key={col.label}>
                <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-blue-300/60 mb-4">{col.label}</p>
                <ul className="space-y-2.5">
                  {col.links.map(l => (
                    <li key={l.to}>
                      <Link to={l.to}
                        className="text-sm text-white/50 hover:text-white transition-colors flex items-center gap-1 group w-fit">
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
          <div className="border-t border-white/8 pt-6 flex flex-col sm:flex-row justify-between gap-2 text-xs text-white/30">
            <span>{copyright}</span>
            <span>Built with purpose · New Delhi, India</span>
          </div>
        </div>
      </footer>

      {/* ── "Get in touch" modal ── */}
      {contactsOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setContactsOpen(false)}>
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-slide-up border border-border/40"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-bold text-foreground">Get in touch</h3>
              <button onClick={() => setContactsOpen(false)} aria-label="Close"
                className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center hover:bg-destructive/10 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No contacts published yet.</p>
            ) : (
              <ul className="space-y-3">
                {contacts.map(c => (
                  <li key={c.id} className="rounded-2xl border border-border/50 bg-secondary/30 p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-blue-400 text-white flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-foreground">{c.name}</p>
                        <p className="text-xs text-primary font-semibold">{c.position}</p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {c.phone && (
                        <a href={`tel:${c.phone}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                          <Phone className="w-3 h-3 text-primary" /> {c.phone}
                        </a>
                      )}
                      {c.email && (
                        <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                          <Mail className="w-3 h-3 text-primary" /> {c.email}
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-5 pt-4 border-t border-border/40 text-center">
              <p className="text-xs text-muted-foreground">Or email us at</p>
              {footEmail ? (
                <a href={`mailto:${footEmail}`} className="text-sm font-semibold text-primary hover:underline">{footEmail}</a>
              ) : (
                <p className="text-xs text-muted-foreground italic">Email not configured in CMS</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
