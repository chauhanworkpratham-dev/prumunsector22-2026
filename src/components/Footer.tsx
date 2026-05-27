import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Instagram, Youtube, Facebook, MapPin, Phone, Mail, X, User, ArrowUpRight } from "lucide-react";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import { getContactPersons, type ContactPerson } from "@/lib/munApi";
import crest from "@/assets/prumun-crest.png";
import { cn } from "@/lib/utils";

const SOCIAL = {
  instagram: "https://www.instagram.com/prumun_2.0?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
  facebook:  "https://www.facebook.com/prudenceschoolsdelhi/",
  youtube:   "https://www.youtube.com/@PrudenceSchools",
};

const NAV_COLS = [
  {
    label: "Conference",
    links: [
      { to: "/committees", label: "Committees" },
      { to: "/matrix",     label: "Matrix"     },
      { to: "/schedule",   label: "Schedule"   },
      { to: "/brochure",   label: "Brochure"   },
    ],
  },
  {
    label: "People",
    links: [
      { to: "/secretariats", label: "Secretariats" },
      { to: "/staff",        label: "Staff"        },
      { to: "/venue",        label: "Venue"        },
    ],
  },
  {
    label: "Participate",
    links: [
      { to: "/register", label: "Register" },
      { to: "/login",    label: "Delegate Login" },
    ],
  },
];

export const Footer = () => {
  const { edition } = useActiveEdition();
  const [contactsOpen, setContactsOpen] = useState(false);
  const [contacts, setContacts]         = useState<ContactPerson[]>([]);

  useEffect(() => {
    if (!edition) return;
    getContactPersons(edition.id).then(setContacts);
  }, [edition]);

  const brand = edition?.name?.split(" ")[0] ?? "PRUMUN";
  const year  = new Date().getFullYear();

  return (
    <>
      <footer className="mt-24 border-t border-border/50 bg-gradient-surface">
        <div className="container py-16">
          <div className="grid md:grid-cols-4 gap-10 mb-12">

            {/* Brand col */}
            <div className="md:col-span-1">
              <Link to="/" className="flex items-center gap-3 mb-5 group w-fit">
                <div className="w-10 h-10 rounded-xl overflow-hidden ring-1 ring-primary/20">
                  <img src={crest} alt={brand} className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="font-display font-bold text-lg text-foreground">{brand}</div>
                  <div className="text-[9px] tracking-[0.25em] text-primary/60 uppercase">
                    {edition?.name?.split(" ").slice(1).join(" ") ?? "2026"}
                  </div>
                </div>
              </Link>
              <p className="text-xs text-muted-foreground leading-relaxed mb-5 max-w-[200px]">
                Diplomacy · Debate · Destiny.<br />
                The premier MUN at Prudence School, New Delhi.
              </p>
              {/* Socials */}
              <div className="flex gap-2">
                {[
                  { href: SOCIAL.instagram, Icon: Instagram, label: "Instagram" },
                  { href: SOCIAL.youtube,   Icon: Youtube,   label: "YouTube"   },
                  { href: SOCIAL.facebook,  Icon: Facebook,  label: "Facebook"  },
                ].map(({ href, Icon, label }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                    className="w-9 h-9 rounded-xl glass flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all">
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Nav cols */}
            {NAV_COLS.map(col => (
              <div key={col.label}>
                <p className="section-label">{col.label}</p>
                <ul className="space-y-2.5">
                  {col.links.map(l => (
                    <li key={l.to}>
                      <Link to={l.to}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 group">
                        {l.label}
                        <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Contact col */}
            <div>
              <p className="section-label">Contact</p>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2 items-start">
                  <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-xs leading-relaxed">
                    {edition?.venue_address ?? "Sector 22, Dwarka, New Delhi — 110077"}
                  </span>
                </li>
                <li>
                  <button onClick={() => setContactsOpen(true)}
                    className="pill bg-primary/8 text-primary hover:bg-primary hover:text-white transition-all cursor-pointer">
                    <Phone className="w-3 h-3" /> Get in touch
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="divider pt-6 flex flex-col sm:flex-row justify-between gap-2 text-xs text-muted-foreground/70">
            <span>© {year} {brand} Secretariat. All rights reserved.</span>
            <span>Built with purpose · New Delhi, India</span>
          </div>
        </div>
      </footer>

      {/* Contact modal */}
      {contactsOpen && (
        <div className="fixed inset-0 z-[60] bg-foreground/40 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setContactsOpen(false)}>
          <div className="glass-strong rounded-3xl p-6 max-w-sm w-full animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-bold">Get in touch</h3>
              <button onClick={() => setContactsOpen(false)} aria-label="Close"
                className="w-8 h-8 rounded-xl glass flex items-center justify-center hover:bg-destructive/10 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            {contacts.length === 0
              ? <p className="text-sm text-muted-foreground text-center py-8">No contacts published yet.</p>
              : (
                <ul className="space-y-2">
                  {contacts.map(c => (
                    <li key={c.id} className="glass rounded-2xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-primary text-white flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{c.name}</div>
                          {c.role && <div className="text-xs text-muted-foreground">{c.role}</div>}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <a href={`tel:${c.phone}`}
                          className="pill bg-primary/8 text-primary hover:bg-primary hover:text-white transition-all text-[11px]">
                          <Phone className="w-3 h-3" /> {c.phone}
                        </a>
                        {c.email && (
                          <a href={`mailto:${c.email}`}
                            className="pill bg-secondary text-foreground hover:bg-primary hover:text-white transition-all text-[11px]">
                            <Mail className="w-3 h-3" /> {c.email}
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
          </div>
        </div>
      )}
    </>
  );
};
