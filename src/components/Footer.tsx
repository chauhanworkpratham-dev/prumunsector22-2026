import { Link } from "react-router-dom";
import { Instagram, Youtube, Facebook, Mail } from "lucide-react";
import { useActiveEdition } from "@/hooks/useActiveEdition";

export const Footer = () => {
  const { edition } = useActiveEdition();
  const year  = new Date().getFullYear();
  const name  = edition?.name ?? "PRUMUN 2026";
  const brand = name.split(" ")[0] ?? "PRUMUN";
  const sub   = name.split(" ").slice(1).join(" ") ?? "";

  const instagram = edition?.instagram_url ?? "https://www.instagram.com/prumun_2.0";
  const youtube   = edition?.youtube_url   ?? "https://www.youtube.com/@PrudenceSchools";
  const facebook  = edition?.facebook_url  ?? "https://www.facebook.com/prudenceschoolsdelhi/";
  const email     = (edition as any)?.footer_email ?? "secretariat@prumun.org";

  const dateLabel = edition
    ? new Date(edition.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <footer style={{ background: "#0B1F3A", color: "rgba(255,255,255,0.6)" }}>
      <div className="container py-16">
        <div className="grid md:grid-cols-4 gap-10 pb-10" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>

          {/* ── Brand col — matches screenshot exactly ── */}
          <div className="md:col-span-1">
            {/* Logo + wordmark */}
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
                style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <span className="font-display font-bold text-white text-sm leading-none">P</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-display font-bold text-white text-sm leading-none">{name}</span>
                <span className="text-[8px] font-semibold tracking-[0.22em] uppercase mt-1"
                  style={{ color: "rgba(255,255,255,0.30)" }}>
                  DIPLOMACY. DEBATE. DISTINCTION.
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.45)" }}>
              The Prudence Model United Nations conference. Hosted by Prudence International School — bringing together delegates, dialogue, and diplomacy.
            </p>

            {/* Social icons */}
            <div className="flex gap-2">
              {[
                { href: instagram, Icon: Instagram, label: "Instagram" },
                { href: facebook,  Icon: Facebook,  label: "Facebook"  },
                { href: youtube,   Icon: Youtube,   label: "YouTube"   },
                { href: `mailto:${email}`, Icon: Mail, label: "Email"  },
              ].map(({ href, Icon, label }) => (
                <a key={label} href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 rounded-md flex items-center justify-center transition-all"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.45)",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.color = "#C9973A";
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)";
                  }}>
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* ── Conference col ── */}
          <div>
            <p className="footer-col-head">Conference</p>
            <ul className="space-y-2.5">
              {[
                { to: "/about",        label: "About"       },
                { to: "/schedule",     label: "Schedule"    },
                { to: "/matrix",       label: "Allotments"  },
                { to: "/gallery",      label: "Gallery"     },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-sm transition-colors"
                    style={{ color: "rgba(255,255,255,0.55)" }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#C9973A")}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)")}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Support col ── */}
          <div>
            <p className="footer-col-head">Support</p>
            <ul className="space-y-2.5">
              {[
                { to: "/about",            label: "Help & Queries"  },
                { to: "/secretariats",     label: "Announcements"   },
                { to: "/venue",            label: "Venue"           },
                { to: "/register",         label: "Register"        },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-sm transition-colors"
                    style={{ color: "rgba(255,255,255,0.55)" }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#C9973A")}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)")}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Info col ── */}
          <div>
            <p className="footer-col-head">Conference Info</p>
            <div className="space-y-3 text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>
              {dateLabel && (
                <p className="font-semibold" style={{ color: "rgba(255,255,255,0.65)" }}>{dateLabel}</p>
              )}
              <p>{edition?.venue_name ?? "Prudence International School"}</p>
              <p>{edition?.venue_address ?? "Sector 22, Dwarka · New Delhi"}</p>
            </div>
          </div>
        </div>

        {/* ── Bottom row ── */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs"
          style={{ color: "rgba(255,255,255,0.28)" }}>
          <span>© {year} Prudence Model United Nations · Hosted by Prudence International School</span>
          {dateLabel && <span>{dateLabel}</span>}
        </div>
      </div>
    </footer>
  );
};
