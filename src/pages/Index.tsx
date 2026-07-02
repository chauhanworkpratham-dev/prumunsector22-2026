import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Globe2, Calendar, MapPin, Users } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import { getCommittees, type Committee } from "@/lib/munApi";
import { cn, formatDate } from "@/lib/utils";

/* ── Countdown hook ────────────────────────────────── */
const calcTick = (t: Date) => {
  const diff = Math.max(0, t.getTime() - Date.now());
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff / 3600000)  % 24),
    m: Math.floor((diff / 60000)    % 60),
    s: Math.floor((diff / 1000)     % 60),
  };
};

const CountdownHero = ({ target }: { target: Date }) => {
  const [tick, setTick] = useState(calcTick(target));
  useEffect(() => {
    const id = setInterval(() => setTick(calcTick(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const units = [
    { v: tick.d, l: "DAYS"  },
    { v: tick.h, l: "HOURS" },
    { v: tick.m, l: "MIN"   },
    { v: tick.s, l: "SEC"   },
  ];

  return (
    <div>
      <p className="text-[9px] font-bold tracking-[0.28em] text-white/40 uppercase mb-3">Conference Begins In</p>
      <div className="flex items-center gap-2 flex-wrap">
        {units.map(({ v, l }) => (
          <div key={l} className="countdown-box">
            <span className="countdown-num">{String(v).padStart(2, "0")}</span>
            <span className="countdown-lbl">{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Main page ─────────────────────────────────────── */
const Index = () => {
  const { edition } = useActiveEdition();
  const [committees, setCommittees] = useState<Committee[]>([]);

  useEffect(() => {
    if (edition) getCommittees(edition.id).then(setCommittees);
  }, [edition]);

  const eventDate    = edition ? new Date(edition.event_date) : new Date("2026-08-29");
  const eventEndDate = edition?.event_end_date ? new Date(edition.event_end_date) : null;
  const dateLabel    = eventEndDate
    ? `${formatDate(eventDate, { day: "numeric", month: "long" })} – ${formatDate(eventEndDate, { day: "numeric", month: "long", year: "numeric" })}`
    : formatDate(eventDate, { day: "numeric", month: "long", year: "numeric" });
  const brand = edition?.name?.split(" ")[0] ?? "PRUMUN";
  const tag   = edition?.name?.split(" ").slice(1).join(" ") ?? "2026";

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ═══════════════════════════════════════════
          HERO — full-bleed dark navy, left-aligned
      ═══════════════════════════════════════════ */}
      <section
        className="relative min-h-screen flex flex-col justify-end"
        style={{
          backgroundImage: [
            "linear-gradient(to bottom, rgba(8,24,45,0.75) 0%, rgba(11,31,58,0.88) 60%, rgba(11,31,58,0.96) 100%)",
            "url('https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=2000&q=80')",
          ].join(", "),
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      >
        {/* Content anchored bottom-left */}
        <div className="container pb-0">
          <div className="max-w-2xl pt-36 pb-16">
            {/* Edition pill */}
            <div className="edition-pill mb-7">
              <span>✦</span>
              {tag} · {brand}
            </div>

            {/* Main headline */}
            <h1 className="font-display font-bold text-white leading-[0.95] tracking-tight mb-5"
              style={{ fontSize: "clamp(2.5rem, 6vw, 4.25rem)" }}>
              Where the next<br />
              generation of{" "}
              <span className="gold-text">diplomats</span><br />
              takes the floor.
            </h1>

            <p className="text-white/60 text-sm leading-relaxed mb-8 max-w-sm">
              {edition
                ? `${brand} returns ${dateLabel}. ${committees.length || "Six"} committees. ${(edition as any)?.stat_delegates ?? "150"}+ delegates. Two days of dialogue, debate, and distinction.`
                : `The Prudence Model United Nations conference returns. Six committees. One hundred and fifty delegates. Two days of dialogue, debate, and distinction.`
              }
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 mb-12">
              <Link to="/register" className="btn-gold">
                Register as delegate <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/matrix" className="btn-ghost-hero">
                Explore committees
              </Link>
            </div>

            {/* Countdown */}
            <CountdownHero target={eventDate} />
          </div>
        </div>

        {/* Info strip */}
        <div className="info-strip">
          <div className="container">
            <div className="grid grid-cols-3 divide-x divide-navy/8 py-4">
              <div className="flex items-center gap-2.5 px-4 first:pl-0">
                <Calendar className="w-3.5 h-3.5 text-gold shrink-0" />
                <div>
                  <span className="text-[9px] text-navy/35 font-semibold tracking-wider uppercase block">Dates</span>
                  <span className="text-xs font-bold text-navy">{dateLabel}</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 px-4">
                <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
                <div>
                  <span className="text-[9px] text-navy/35 font-semibold tracking-wider uppercase block">Venue</span>
                  <span className="text-xs font-bold text-navy">{edition?.venue_name ?? "Prudence International School"}</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 px-4">
                <Users className="w-3.5 h-3.5 text-gold shrink-0" />
                <div>
                  <span className="text-[9px] text-navy/35 font-semibold tracking-wider uppercase block">Delegates</span>
                  <span className="text-xs font-bold text-navy">
                    {(edition as any)?.stat_delegates ?? "150"}+ across {committees.length || 6} committees
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          COMMITTEES SECTION — white bg
      ═══════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="mb-10">
            <span className="eyebrow">Six Committees</span>
            <h2 className="font-display font-bold text-navy text-4xl md:text-5xl leading-tight max-w-xl">
              A floor for every voice. An agenda for every passion.
            </h2>
            <p className="text-navy/50 text-sm mt-3 max-w-md leading-relaxed">
              From high-stakes crisis simulations to political and humanitarian discourse — choose the committee that calls you to the podium.
            </p>
          </div>

          {committees.length === 0 ? (
            /* Placeholder cards matching the screenshot */
            <div className="grid md:grid-cols-3 gap-px bg-navy/8 border border-navy/8 rounded-sm overflow-hidden">
              {[
                { short: "UNSC",  name: "Security Council",             agenda: "Crisis in the Sahel Region"      },
                { short: "UNHRC", name: "Human Rights Council",         agenda: "Digital Rights & Surveillance"   },
                { short: "DISEC", name: "Disarmament Committee",        agenda: "Autonomous Weapons Systems"      },
                { short: "WHO",   name: "World Health Organization",     agenda: "Pandemic Preparedness"           },
                { short: "AIPPM", name: "All India Political Parties Meet", agenda: "Uniform Civil Code"          },
                { short: "IP",    name: "International Press",           agenda: "Reporting Live from PRUMUN"     },
              ].map((c, i) => (
                <div key={c.short} className="bg-white p-6 hover:bg-gold/3 transition-colors group">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-display font-bold text-navy text-2xl">{c.short}</h3>
                      <p className="text-navy/55 text-xs font-medium mt-0.5">{c.name}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full border border-gold/30 flex items-center justify-center text-gold">
                      <Globe2 className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-navy/40 text-xs">{c.agenda}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-px bg-navy/8 border border-navy/8 rounded-sm overflow-hidden">
              {committees.map(c => (
                <Link key={c.id} to={`/matrix?c=${c.id}`}
                  className="bg-white p-6 hover:bg-gold/3 transition-colors group block">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-display font-bold text-navy text-2xl">{c.short_name}</h3>
                      <p className="text-navy/55 text-xs font-medium mt-0.5">{c.name}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full border border-gold/30 flex items-center justify-center text-gold group-hover:bg-gold/10 transition-colors">
                      <Globe2 className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-navy/40 text-xs">{c.agenda}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
