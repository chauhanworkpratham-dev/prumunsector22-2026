import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Globe2, Users, Trophy, Sparkles, Calendar, MapPin, Pin, Megaphone } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Countdown } from "@/components/Countdown";
import { Button } from "@/components/ui/button";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import { getCommittees, getAnnouncements, type Committee, type Announcement } from "@/lib/munApi";
import { PageBackdrop } from "@/hooks/usePageBackground";
import { cn, formatDate } from "@/lib/utils";
import crest from "@/assets/prumun-crest.png";

/* ── Token shorthands ─────────────────────────────── */
const navyDeep     = { background: "oklch(0.18 0.09 263)" }            as React.CSSProperties;
const navyHero     = { background: "var(--gradient-hero)" }            as React.CSSProperties;
const goldGrad     = { background: "var(--gradient-gold)", color: "oklch(0.18 0.04 263)", boxShadow: "var(--shadow-gold)" } as React.CSSProperties;
const goldBorder   = { border: "1px solid oklch(0.78 0.13 80 / 0.14)" } as React.CSSProperties;
const goldText     = { color: "oklch(0.78 0.13 80)" }                  as React.CSSProperties;
const goldTextMid  = { color: "oklch(0.78 0.13 80 / 0.70)" }           as React.CSSProperties;
const dimText      = { color: "oklch(0.65 0.03 263)" }                 as React.CSSProperties;

const Index = () => {
  const { edition } = useActiveEdition();
  const [committees,    setCommittees]    = useState<Committee[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    if (!edition) return;
    getCommittees(edition.id).then(setCommittees);
    getAnnouncements(edition.id).then(setAnnouncements);
  }, [edition]);

  const eventDate    = edition ? new Date(edition.event_date) : new Date("2026-08-01");
  const eventEndDate = edition?.event_end_date ? new Date(edition.event_end_date) : null;
  const dateLabel    = eventEndDate
    ? `${formatDate(eventDate, { day: "numeric", month: "short" })} – ${formatDate(eventEndDate, { day: "numeric", month: "short", year: "numeric" })}`
    : formatDate(eventDate);

  const brand = edition?.name?.split(" ")[0] ?? "PRUMUN";
  const tag   = edition?.name?.split(" ").slice(1).join(" ") ?? "2026";

  const STATS = [
    { Icon: Users,    value: edition?.stat_delegates  ?? "500+", label: "Delegates"    },
    { Icon: Globe2,   value: edition?.stat_committees ?? String(committees.length || "6"), label: "Committees" },
    { Icon: Trophy,   value: edition?.stat_years      ?? "10",   label: "Years Legacy" },
    { Icon: Sparkles, value: edition?.stat_portfolios ?? "100+", label: "Portfolios"   },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PageBackdrop pageKey="home" />

      {/* ══════════════════════════════════════════════
          HERO — full-bleed navy immersive
      ══════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">

        {/* Deep navy triple-stop gradient */}
        <div className="absolute inset-0" style={navyHero} />

        {/* Ambient gold glow orbs — very subtle */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-8%] left-[-8%] w-[55vw] h-[55vw] rounded-full blur-[130px] animate-float"
            style={{ background: "oklch(0.78 0.13 80 / 0.05)" }} />
          <div className="absolute bottom-[-12%] right-[-8%] w-[45vw] h-[45vw] rounded-full blur-[110px] animate-float"
            style={{ background: "oklch(0.78 0.13 80 / 0.04)", animationDelay: "2s" }} />
          <div className="absolute top-[45%] left-[52%] w-[28vw] h-[28vw] rounded-full blur-[90px] animate-float"
            style={{ background: "oklch(0.30 0.09 263 / 0.50)", animationDelay: "1s" }} />
        </div>

        {/* Extremely faint geometric grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{ backgroundImage: "linear-gradient(oklch(0.78 0.13 80) 1px,transparent 1px),linear-gradient(90deg,oklch(0.78 0.13 80) 1px,transparent 1px)", backgroundSize: "70px 70px" }} />

        {/* Fade to body bg at bottom */}
        <div className="absolute bottom-0 inset-x-0 h-40 pointer-events-none"
          style={{ background: "linear-gradient(to top, hsl(var(--background)), transparent)" }} />

        <div className="relative z-10 container max-w-4xl mx-auto text-center pt-28 pb-24">

          {/* Crest — navy glass + gold ring */}
          <div className="w-24 h-24 mx-auto mb-8 rounded-2xl flex items-center justify-center animate-float"
            style={{
              background: "oklch(0.24 0.08 263 / 0.70)",
              backdropFilter: "blur(16px)",
              border: "1px solid oklch(0.78 0.13 80 / 0.22)",
              boxShadow: "var(--shadow-gold)",
            }}>
            <img src={edition?.logo_url ?? crest} alt={brand} width={72} height={72}
              className="w-16 h-16 object-contain drop-shadow-2xl" />
          </div>

          {/* Optional hero tagline pill */}
          {(edition as any)?.hero_tagline && (
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 animate-fade-in"
              style={{
                background: "oklch(0.78 0.13 80 / 0.10)",
                border: "1px solid oklch(0.78 0.13 80 / 0.22)",
              }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse-soft" style={{ background: "oklch(0.78 0.13 80)" }} />
              <span className="text-[11px] font-semibold tracking-[0.22em] uppercase"
                style={goldTextMid}>
                {(edition as any).hero_tagline}
              </span>
            </div>
          )}

          {/* Title — Playfair Display bold */}
          <h1 className="font-display font-bold text-5xl sm:text-7xl lg:text-[5.5rem] leading-[0.92] tracking-tight mb-4 animate-slide-up text-foreground">
            {brand}{" "}
            <span className="gradient-text">{tag}</span>
          </h1>

          {/* Subtitle italic */}
          <p className="font-display text-xl sm:text-2xl italic mb-3 animate-slide-up"
            style={{ color: "oklch(0.65 0.03 263)", animationDelay: "80ms" }}>
            {(edition as any)?.hero_subtitle_accent ?? "Diplomacy · Debate · Destiny"}
          </p>

          <p className="text-sm max-w-xl mx-auto mb-12 leading-relaxed animate-slide-up"
            style={{ color: "oklch(0.60 0.03 263)", animationDelay: "140ms" }}>
            {(edition as any)?.hero_subtitle ?? "The premier Model United Nations conference at Prudence School, Dwarka — where the next generation of global leaders finds its voice."}
          </p>

          {/* Countdown */}
          <div className="mb-12 animate-slide-up" style={{ animationDelay: "200ms" }}>
            <CountdownHero target={eventDate} title={edition?.countdown_title ?? "Conference Begins In"} />
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap justify-center gap-3 animate-slide-up" style={{ animationDelay: "260ms" }}>
            {/* Gold primary CTA */}
            <Link to="/register"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm font-bold transition-all hover:scale-105"
              style={goldGrad}>
              Secure Your Seat <ArrowRight className="w-4 h-4" />
            </Link>
            {/* Ghost outline secondary */}
            <Link to="/committees"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-semibold transition-all"
              style={{
                border: "1px solid oklch(0.78 0.13 80 / 0.25)",
                color: "oklch(0.85 0.03 263)",
                background: "oklch(0.24 0.08 263 / 0.50)",
                backdropFilter: "blur(8px)",
              }}>
              Explore Committees
            </Link>
          </div>

          {/* Date + venue strip */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-10 text-xs animate-fade-in"
            style={{ color: "oklch(0.50 0.03 263)", animationDelay: "340ms" }}>
            <a
              href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(edition?.name ?? "PRUMUN Conference")}&dates=${eventDate.toISOString().replace(/[-:]/g,"").slice(0,8)}T090000Z/${eventDate.toISOString().replace(/[-:]/g,"").slice(0,8)}T180000Z&location=${encodeURIComponent(edition?.venue_address ?? "Prudence School, Dwarka, New Delhi")}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 transition-colors group"
              style={{ "--hover-color": "oklch(0.78 0.13 80)" } as any}>
              <Calendar className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" style={goldTextMid} />
              <span className="group-hover:underline underline-offset-2">{dateLabel}</span>
            </a>
            <span className="w-px h-3 hidden sm:block" style={{ background: "oklch(0.78 0.13 80 / 0.20)" }} />
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(edition?.venue_address ?? "Prudence School Dwarka New Delhi")}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 transition-colors group">
              <MapPin className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" style={goldTextMid} />
              <span className="group-hover:underline underline-offset-2">{edition?.venue_name ?? "Prudence School, Dwarka"}</span>
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          STATS ROW
      ══════════════════════════════════════════════ */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map(({ Icon, value, label }, i) => (
              <div key={label}
                className="rounded-2xl p-6 text-center animate-fade-in hover-lift"
                style={{
                  background: "oklch(0.26 0.08 263)",
                  border: "1px solid oklch(0.78 0.13 80 / 0.10)",
                  boxShadow: "var(--shadow-card)",
                  animationDelay: `${i * 60}ms`,
                }}>
                <Icon className="w-5 h-5 mx-auto mb-3" style={goldText} />
                <p className="font-display font-bold text-3xl text-foreground mb-1">{value}</p>
                <p className="text-xs font-medium tracking-wide text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          ANNOUNCEMENTS
      ══════════════════════════════════════════════ */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "oklch(0.78 0.13 80 / 0.12)", border: "1px solid oklch(0.78 0.13 80 / 0.20)" }}>
                <Megaphone className="w-5 h-5" style={goldText} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-2xl font-bold text-foreground">Announcements</h2>
                  <span className="pill text-[9px] font-semibold"
                    style={{ background: "oklch(0.78 0.13 80 / 0.12)", ...goldText }}>
                    LIVE
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Updated by the Secretariat in real time</p>
              </div>
            </div>
          </div>

          {announcements.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center text-sm text-muted-foreground">
              No announcements yet — check back soon.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {announcements.slice(0, 6).map((a, i) => (
                <article key={a.id}
                  className={cn("rounded-2xl p-5 hover-lift animate-fade-in")}
                  style={{
                    background: "oklch(0.26 0.08 263)",
                    border: a.pinned
                      ? "1px solid oklch(0.78 0.13 80 / 0.25)"
                      : "1px solid oklch(0.78 0.13 80 / 0.08)",
                    boxShadow: "var(--shadow-card)",
                    animationDelay: `${i * 50}ms`,
                  }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-sm leading-snug text-foreground">{a.title}</h3>
                    {a.pinned && (
                      <span className="pill text-[9px] shrink-0"
                        style={{ background: "oklch(0.78 0.13 80 / 0.12)", ...goldText }}>
                        <Pin className="w-2.5 h-2.5" /> Pinned
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-line">{a.body}</p>
                  <p className="text-[10px] text-muted-foreground mt-3"
                    style={{ color: "oklch(0.45 0.03 263)" }}>
                    {formatDate(a.created_at, { day: "numeric", month: "short" })}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          COMMITTEES PREVIEW
      ══════════════════════════════════════════════ */}
      <section className="py-20" style={{ background: "oklch(0.22 0.09 263)", borderTop: "1px solid oklch(0.78 0.13 80 / 0.08)", borderBottom: "1px solid oklch(0.78 0.13 80 / 0.08)" }}>
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="section-label">The Councils</span>
            <span className="gold-rule mx-auto" />
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-3">
              Choose Your <span className="gradient-text">Stage</span>
            </h2>
            <p className="text-muted-foreground text-sm">Each committee tackles a defining challenge of our time.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {committees.map((c, i) => (
              <Link key={c.id} to={`/matrix?c=${c.id}`}
                className="rounded-2xl p-6 hover-lift block group animate-fade-in transition-all"
                style={{
                  background: "oklch(0.24 0.08 263)",
                  border: "1px solid oklch(0.78 0.13 80 / 0.08)",
                  boxShadow: "var(--shadow-card)",
                  animationDelay: `${i * 55}ms`,
                }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide font-display"
                    style={{ background: "oklch(0.78 0.13 80 / 0.10)", ...goldText }}>
                    {c.short_name}
                  </div>
                  <span className={cn("pill text-[9px]",
                    c.difficulty === "Beginner"
                      ? "bg-success/10 text-success"
                      : c.difficulty === "Intermediate"
                      ? "bg-warning/10 text-warning"
                      : "bg-destructive/10 text-destructive"
                  )}>{c.difficulty}</span>
                </div>
                <h3 className="font-display font-bold text-base leading-snug mb-1 text-foreground group-hover:text-primary transition-colors">{c.short_name}</h3>
                <p className="text-[11px] text-muted-foreground mb-3">{c.name}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 italic">"{c.agenda}"</p>
                <div className="divider mt-4 pt-3 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{c.portfolios.length} portfolios</span>
                  <span className="font-semibold flex items-center gap-1" style={goldText}>
                    View <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════════════ */}
      <section className="py-20 bg-background">
        <div className="container max-w-4xl">
          <div className="relative rounded-3xl overflow-hidden p-10 md:p-16 text-center"
            style={navyHero}>
            {/* Ambient gold corner glows */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-[80px]"
                style={{ background: "oklch(0.78 0.13 80 / 0.06)" }} />
              <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full blur-[60px]"
                style={{ background: "oklch(0.78 0.13 80 / 0.04)" }} />
            </div>
            {/* Gold thin rule top */}
            <div className="w-10 h-0.5 mx-auto mb-6 rounded-full" style={{ background: "var(--gradient-gold)" }} />
            <div className="relative z-10">
              <p className="text-[10px] tracking-[0.35em] font-semibold uppercase mb-3"
                style={goldTextMid}>Limited seats</p>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
                Ready to debate <br className="hidden sm:block" />
                <span className="gradient-text">the world?</span>
              </h2>
              <p className="mb-8 max-w-md mx-auto text-sm" style={{ color: "oklch(0.58 0.03 263)" }}>
                Portfolio seats fill in real time. Reserve yours before the matrix closes.
              </p>
              <Link to="/register"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm font-bold transition-all hover:scale-105"
                style={goldGrad}>
                Begin Registration <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

/* ── Hero Countdown: gold-accented on navy ── */
const calcTick = (t: Date) => {
  const diff = Math.max(0, t.getTime() - Date.now());
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff / 3600000) % 24),
    m: Math.floor((diff / 60000) % 60),
    s: Math.floor((diff / 1000) % 60),
  };
};

const CountdownHero = ({ target, title }: { target: Date; title?: string }) => {
  const [tick, setTick] = useState(calcTick(target));
  useEffect(() => {
    const id = setInterval(() => setTick(calcTick(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const Unit = ({ v, l }: { v: number; l: string }) => (
    <div className="rounded-2xl px-4 py-4 md:px-6 md:py-5 text-center min-w-[72px] md:min-w-[96px]"
      style={{
        background: "oklch(0.24 0.08 263 / 0.80)",
        backdropFilter: "blur(16px)",
        border: "1px solid oklch(0.78 0.13 80 / 0.18)",
      }}>
      <div className="font-display font-bold text-3xl md:text-4xl tabular-nums leading-none text-foreground">
        {String(v).padStart(2, "0")}
      </div>
      <div className="text-[9px] tracking-[0.22em] font-semibold mt-2 uppercase"
        style={{ color: "oklch(0.78 0.13 80 / 0.60)" }}>
        {l}
      </div>
    </div>
  );

  return (
    <div className="text-center" aria-live="polite">
      {title && (
        <p className="text-[10px] tracking-[0.35em] font-semibold mb-4 uppercase"
          style={{ color: "oklch(0.78 0.13 80 / 0.45)" }}>
          {title}
        </p>
      )}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <Unit v={tick.d} l="Days" />
        <span className="font-display text-2xl font-bold pb-2" style={{ color: "oklch(0.78 0.13 80 / 0.25)" }}>:</span>
        <Unit v={tick.h} l="Hours" />
        <span className="font-display text-2xl font-bold pb-2" style={{ color: "oklch(0.78 0.13 80 / 0.25)" }}>:</span>
        <Unit v={tick.m} l="Min" />
        <span className="font-display text-2xl font-bold pb-2" style={{ color: "oklch(0.78 0.13 80 / 0.25)" }}>:</span>
        <Unit v={tick.s} l="Sec" />
      </div>
    </div>
  );
};

export default Index;
