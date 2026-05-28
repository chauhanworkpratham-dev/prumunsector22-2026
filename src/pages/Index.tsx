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
          HERO — full-bleed deep blue immersive section
      ══════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">

        {/* Deep blue layered background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#03082e] via-[#0a1854] to-[#0f3591]" />

        {/* Animated mesh orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#1a6ef0]/20 blur-[120px] animate-float" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#60a5fa]/15 blur-[100px] animate-float" style={{ animationDelay: "2s" }} />
          <div className="absolute top-[40%] left-[55%] w-[30vw] h-[30vw] rounded-full bg-[#3b82f6]/10 blur-[80px] animate-float" style={{ animationDelay: "1s" }} />
        </div>

        {/* Subtle grid texture overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

        {/* Radial vignette at bottom for smooth transition to next section */}
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-background to-transparent pointer-events-none" />

        <div className="relative z-10 container max-w-4xl mx-auto text-center pt-28 pb-24">
          {/* Crest */}
          <div className="w-32 h-32 mx-auto mb-8 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/30 flex items-center justify-center animate-float shadow-[0_8px_40px_rgba(26,110,240,0.5)]">
            <img src={edition?.logo_url ?? crest} alt={brand} width={96} height={96} className="w-20 h-20 object-contain drop-shadow-2xl" />
          </div>

          {/* Eyebrow pill */}
          {((edition as any)?.hero_tagline ?? "Registrations Open").trim() && (
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-4 py-1.5 mb-6 animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-[#60a5fa] animate-pulse" />
              <span className="text-[11px] font-semibold tracking-[0.22em] text-white/90 uppercase">
                {(edition as any)?.hero_tagline ?? "Registrations Open"}
              </span>
            </div>
          )}

          {/* Title */}
          <h1 className="font-display font-bold text-5xl sm:text-7xl lg:text-[5.5rem] leading-[0.9] tracking-tight mb-4 animate-slide-up text-white">
            {brand}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#93c5fd] to-[#60a5fa]">
              {tag}
            </span>
          </h1>

          <p className="font-display text-xl sm:text-2xl text-white/50 italic mb-3 animate-slide-up" style={{ animationDelay: "80ms" }}>
            Diplomacy · Debate · Destiny
          </p>

          <p className="text-sm text-white/60 max-w-xl mx-auto mb-12 leading-relaxed animate-slide-up" style={{ animationDelay: "140ms" }}>
            The premier Model United Nations conference at Prudence School, Dwarka —
            where the next generation of global leaders finds its voice.
          </p>

          {/* Countdown */}
          <div className="mb-12 animate-slide-up" style={{ animationDelay: "200ms" }}>
            <CountdownHero target={eventDate} title={edition?.countdown_title ?? "Conference Begins In"} />
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap justify-center gap-3 animate-slide-up" style={{ animationDelay: "260ms" }}>
            <Button asChild size="lg"
              className="bg-white text-[#0a1854] font-bold hover:bg-white/90 border-0 shadow-[0_4px_24px_rgba(255,255,255,0.25)] hover:shadow-[0_8px_32px_rgba(255,255,255,0.35)] transition-all px-8">
              <Link to="/register">Secure Your Seat <ArrowRight className="w-4 h-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline"
              className="border-white/25 text-white bg-white/8 backdrop-blur-sm hover:bg-white/15 hover:border-white/40 transition-all font-semibold">
              <Link to="/committees">Explore Committees</Link>
            </Button>
          </div>

          {/* Meta strip */}
          <div className="flex flex-wrap items-center justify-center gap-5 mt-10 text-xs text-white/80 animate-fade-in backdrop-blur-sm bg-white/5 px-6 py-3 rounded-full inline-flex mx-auto" style={{ animationDelay: "340ms" }}>
            <span className="flex items-center gap-1.5 font-semibold"><Calendar className="w-3.5 h-3.5 text-[#93c5fd]" /> {dateLabel}</span>
            <span className="w-px h-3 bg-white/30 hidden sm:block" />
            <span className="flex items-center gap-1.5 font-semibold"><MapPin className="w-3.5 h-3.5 text-[#93c5fd]" /> {edition?.venue_name ?? "Prudence School, Dwarka"}</span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          STATS
      ══════════════════════════════════════════════ */}
      <section className="py-20 border-b border-border/50 bg-background">
        <div className="container grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map(({ Icon, value, label }, i) => (
            <div key={label} className="glass rounded-2xl p-6 text-center hover-lift animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="w-11 h-11 mx-auto rounded-xl bg-primary/8 text-primary flex items-center justify-center mb-3">
                <Icon className="w-5 h-5" />
              </div>
              <div className="font-display text-3xl font-bold gradient-text-deep">{value}</div>
              <div className="text-xs text-muted-foreground mt-1 tracking-wide">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          ANNOUNCEMENTS
      ══════════════════════════════════════════════ */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary text-white flex items-center justify-center">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-2xl font-bold">Announcements</h2>
                  <span className="pill bg-primary/10 text-primary text-[9px]">LIVE</span>
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
                <article key={a.id} className={cn(
                  "glass rounded-2xl p-5 hover-lift animate-fade-in",
                  a.pinned && "ring-1 ring-primary/30",
                )} style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-sm leading-snug">{a.title}</h3>
                    {a.pinned && <span className="pill bg-primary/10 text-primary text-[9px] shrink-0"><Pin className="w-2.5 h-2.5" /> Pinned</span>}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-line">{a.body}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-3">{formatDate(a.created_at, { day: "numeric", month: "short" })}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          COMMITTEES PREVIEW
      ══════════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-surface border-y border-border/50">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="section-label">The Councils</p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold gradient-text-deep mb-3">Choose Your Stage</h2>
            <p className="text-muted-foreground text-sm">Each committee tackles a defining challenge of our time.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {committees.map((c, i) => (
              <Link key={c.id} to={`/matrix?c=${c.id}`}
                className="glass rounded-2xl p-6 hover-lift block group animate-fade-in"
                style={{ animationDelay: `${i * 55}ms` }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="px-3 py-1.5 rounded-xl bg-primary/8 text-primary font-display font-bold text-xs tracking-wide">{c.short_name}</div>
                  <span className={cn("pill text-[9px]",
                    c.difficulty === "Beginner"     ? "bg-success/10 text-success"         :
                    c.difficulty === "Intermediate" ? "bg-warning/10 text-warning"          :
                                                      "bg-destructive/10 text-destructive"
                  )}>{c.difficulty}</span>
                </div>
                <h3 className="font-display font-bold text-base leading-snug mb-1 group-hover:text-primary transition-colors">{c.short_name}</h3>
                <p className="text-[11px] text-muted-foreground mb-3">{c.name}</p>
                <p className="text-xs text-foreground/65 line-clamp-2 italic">"{c.agenda}"</p>
                <div className="divider mt-4 pt-3 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{c.portfolios.length} portfolios</span>
                  <span className="text-primary font-semibold flex items-center gap-1">View <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          CTA BANNER — mirrors hero deep blue
      ══════════════════════════════════════════════ */}
      <section className="py-20 bg-background">
        <div className="container max-w-4xl">
          <div className="relative rounded-3xl overflow-hidden p-10 md:p-16 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-[#03082e] via-[#0a1854] to-[#0f3591]" />
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#1a6ef0]/20 blur-[60px]" />
              <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-[#60a5fa]/15 blur-[60px]" />
            </div>
            <div className="relative z-10">
              <p className="text-white/50 text-[10px] tracking-[0.35em] font-semibold uppercase mb-3">Limited seats</p>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                Ready to debate the world?
              </h2>
              <p className="text-white/60 mb-8 max-w-md mx-auto text-sm">
                Portfolio seats fill in real time. Reserve yours before the matrix closes.
              </p>
              <Button asChild size="lg"
                className="bg-white text-[#0a1854] font-bold hover:bg-white/90 border-0 shadow-[0_4px_24px_rgba(255,255,255,0.2)] transition-all">
                <Link to="/register">Begin Registration <ArrowRight className="w-4 h-4" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

/* ── Hero Countdown: white-on-dark variant ── */
const calcTick = (t: Date) => {
  const diff = Math.max(0, t.getTime() - Date.now());
  return { d: Math.floor(diff / 86400000), h: Math.floor((diff / 3600000) % 24), m: Math.floor((diff / 60000) % 60), s: Math.floor((diff / 1000) % 60) };
};
const CountdownHero = ({ target, title }: { target: Date; title?: string }) => {
  const [tick, setTick] = useState(calcTick(target));
  useEffect(() => { const id = setInterval(() => setTick(calcTick(target)), 1000); return () => clearInterval(id); }, [target]);
  const Unit = ({ v, l }: { v: number; l: string }) => (
    <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl px-4 py-4 md:px-6 md:py-5 text-center min-w-[72px] md:min-w-[96px]">
      <div className="font-display font-bold text-3xl md:text-4xl text-white tabular-nums leading-none">{String(v).padStart(2, "0")}</div>
      <div className="text-[9px] tracking-[0.22em] text-white/50 font-semibold mt-2 uppercase">{l}</div>
    </div>
  );
  return (
    <div className="text-center" aria-live="polite">
      {title && <p className="text-[10px] tracking-[0.35em] text-white/40 font-semibold mb-4 uppercase">{title}</p>}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <Unit v={tick.d} l="Days" />
        <span className="font-display text-2xl text-white/20 font-bold pb-2">:</span>
        <Unit v={tick.h} l="Hours" />
        <span className="font-display text-2xl text-white/20 font-bold pb-2">:</span>
        <Unit v={tick.m} l="Min" />
        <span className="font-display text-2xl text-white/20 font-bold pb-2">:</span>
        <Unit v={tick.s} l="Sec" />
      </div>
    </div>
  );
};

export default Index;
