import { Link } from "react-router-dom";
import { Instagram, Youtube, Facebook, Mail } from "lucide-react";
import { useActiveEdition } from "@/hooks/useActiveEdition";

export const Footer = () => {
  const { edition } = useActiveEdition();
  const brand   = edition?.name ?? "PRUMUN 2026";
  const year    = new Date().getFullYear();
  const venue   = edition?.venue_address ?? "Sector 22, Dwarka · New Delhi";

  return (
    <footer className="footer-navy mt-24">
      <div className="container py-16">
        <div className="grid md:grid-cols-4 gap-10 pb-12 border-b border-white/8">

          {/* Brand col */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center">
                <span className="font-display font-bold text-sm text-white">P</span>
              </div>
              <div>
                <div className="font-display font-bold text-white text-sm leading-none">{brand.split(" ")[0]}</div>
                <div className="text-[8px] tracking-[0.22em] text-white/30 uppercase font-semibold mt-0.5">{brand.split(" ").slice(1).join(" ")}</div>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-white/50 mb-5">
              DIPLOMACY. DEBATE. DISTINCTION.
            </p>
            <p className="text-xs text-white/40 leading-relaxed mb-5">
              The Prudence Model United Nations conference. Hosted by Prudence International School — bringing together delegates, dialogue, and diplomacy.
            </p>
            <div className="flex gap-2">
              {[
                { href: edition?.instagram_url ?? "#", Icon: Instagram },
                { href: edition?.facebook_url  ?? "#", Icon: Facebook  },
                { href: edition?.youtube_url   ?? "#", Icon: Youtube   },
                { href: `mailto:${(edition as any)?.footer_email ?? "secretariat@prumun.org"}`, Icon: Mail },
              ].map(({ href, Icon }, i) => (
                <a key={i} href={href} target={href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-md bg-white/8 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/15 transition-all">
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Conference col */}
          <div>
            <p className="footer-col-head">Conference</p>
            <ul className="space-y-2.5">
              {[
                { to: "/about",    label: "About"       },
                { to: "/schedule", label: "Schedule"    },
                { to: "/matrix",   label: "Allotments"  },
                { to: "/gallery",  label: "Gallery"     },
              ].map(({ to, label }) => (
                <li key={to}><Link to={to} className="text-sm">{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Support col */}
          <div>
            <p className="footer-col-head">Support</p>
            <ul className="space-y-2.5">
              {[
                { to: "/about",        label: "Help & Queries"  },
                { to: "/secretariats", label: "Announcements"   },
                { to: "/venue",        label: "Venue"           },
                { to: "/register",     label: "Register"        },
              ].map(({ to, label }) => (
                <li key={to}><Link to={to} className="text-sm">{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Quick info col */}
          <div>
            <p className="footer-col-head">Conference Info</p>
            <div className="space-y-3 text-xs text-white/45">
              {edition && (
                <p className="font-semibold text-white/70">
                  {new Date(edition.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              )}
              <p>{venue}</p>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/30">
          <span>© {year} Prudence Model United Nations · Hosted by Prudence International School</span>
          {edition && (
            <span className="text-white/20">
              {new Date(edition.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          )}
        </div>
      </div>
    </footer>
  );
};
