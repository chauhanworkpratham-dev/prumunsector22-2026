import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Countdown } from "@/components/Countdown";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Users, Trophy, Globe2, MapPin, Calendar, Megaphone, Pin } from "lucide-react";
import { useEffect, useState } from "react";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import { getCommittees, getAnnouncements, type Committee, type Announcement } from "@/lib/munApi";
import { PageBackdrop } from "@/hooks/usePageBackground";
import crest from "@/assets/prumun-crest.png";
import { cn } from "@/lib/utils";

const Index = () => {
  const { edition } = useActiveEdition();
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    if (!edition) return;
    getCommittees(edition.id).then(setCommittees);
    getAnnouncements(edition.id).then(setAnnouncements);
  }, [edition]);

  const eventDate = edition ? new Date(edition.event_date) : new Date("2026-08-01");
  const eventEndDate = edition?.event_end_date ? new Date(edition.event_end_date) : null;
  const dateLabel = eventEndDate
    ? `${eventDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${eventEndDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
    : eventDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Navbar />
      <PageBackdrop pageKey="home" />

      <section className="relative min-h-screen flex items-center justify-center pt-28 pb-20 overflow-hidden">
        {/* Cinematic gradient overlay and readability filters */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/40 via-background/70 to-background backdrop-blur-[2px]" />
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-primary/10 blur-3xl animate-float -z-10" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-primary-glow/20 blur-3xl animate-float -z-10" style={{ animationDelay: "1.5s" }} />

        <div className="container relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 via-card/80 to-primary-glow/30 ring-4 ring-primary/30 shadow-elegant flex items-center justify-center animate-float backdrop-blur-sm overflow-hidden">
              <img src={edition?.logo_url || crest} alt={`${edition?.name ?? "PRUMUN"} crest`} width={120} height={120} className="w-28 h-28 object-contain drop-shadow-2xl" />
            </div>

            {((edition as any)?.hero_tagline ?? "REGISTRATIONS OPEN").trim() && (
              <div className="inline-flex items-center gap-2 glass rounded-full px-5 py-2 mb-6 animate-fade-in">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold tracking-[0.2em] text-primary-deep">{(edition as any)?.hero_tagline ?? "REGISTRATIONS OPEN"}</span>
              </div>
            )}

            <h1 className="font-display font-black text-5xl md:text-7xl lg:text-8xl mb-4 leading-[0.95] animate-slide-up">
              <span className="gradient-text-deep">{edition?.name?.split(" ")[0] ?? "PRUMUN"}</span>{" "}
              <span className="text-foreground">{edition?.name?.split(" ").slice(1).join(" ") ?? "2026"}</span>
            </h1>
            <p className="font-display text-2xl md:text-3xl text-foreground/80 italic mb-3 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              Diplomacy. Debate. Destiny.
            </p>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-12 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              The premier Model United Nations conference at Prudence School, hosting the next generation of global leaders.
            </p>

            <div className="mb-10 animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <Countdown target={eventDate} title={edition?.countdown_title ?? "CONFERENCE BEGINS"} />
            </div>

            <div className="flex flex-wrap justify-center gap-4 animate-slide-up" style={{ animationDelay: "0.4s" }}>
              <Button asChild variant="hero" size="lg">
                <Link to="/register">Secure Your Seat <ArrowRight className="w-5 h-5" /></Link>
              </Button>
              <Button asChild variant="glass" size="lg">
                <Link to="/committees">Explore Committees</Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-muted-foreground animate-fade-in">
              <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> {dateLabel}</span>
              <span className="hidden md:inline opacity-30">·</span>
              <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> {edition?.venue_name ?? "Prudence School"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Announcements section removed per request */}

      {/* Live announcements (replaces marquee ticker) */}
      <section className="border-y border-border bg-secondary/40 py-12">
        <div className="container">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary text-primary-foreground flex items-center justify-center">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs tracking-[0.3em] text-primary font-bold">LIVE</p>
                <h2 className="font-display text-2xl font-bold">Announcements</h2>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">Updated by the secretariat in real time.</span>
          </div>
          {announcements.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
              No announcements yet. Check back soon.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {announcements.slice(0, 6).map((a, i) => (
                <article
                  key={a.id}
                  className={cn(
                    "glass rounded-2xl p-5 hover-lift animate-fade-in",
                    a.pinned && "border-2 border-primary/40"
                  )}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold leading-tight">{a.title}</h3>
                    {a.pinned && (
                      <span className="text-[10px] font-bold tracking-widest text-primary flex items-center gap-1 shrink-0">
                        <Pin className="w-3 h-3" /> PINNED
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-line">{a.body}</p>
                  <p className="text-[10px] text-muted-foreground mt-3 tracking-wider">
                    {new Date(a.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-24">
        <div className="container">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users, value: edition?.stat_delegates ?? "500+", label: "Delegates" },
              { icon: Globe2, value: edition?.stat_committees ?? String(committees.length || 6), label: "Committees" },
              { icon: Trophy, value: edition?.stat_years ?? "10", label: "Years Legacy" },
              { icon: Sparkles, value: edition?.stat_portfolios ?? "100+", label: "Portfolios" },
            ].map((s, i) => (
              <div key={i} className="glass rounded-3xl p-8 text-center hover-lift">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-primary text-primary-foreground flex items-center justify-center mb-4">
                  <s.icon className="w-7 h-7" />
                </div>
                <div className="font-display text-4xl font-bold gradient-text-deep">{s.value}</div>
                <div className="text-sm text-muted-foreground mt-1 tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs tracking-[0.3em] text-primary font-bold mb-3">THE COUNCILS</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold gradient-text-deep mb-4">Choose Your Stage.</h2>
            <p className="text-muted-foreground">Each committee tackles a defining challenge of our time.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {committees.map((c, i) => (
              <Link key={c.id} to={`/matrix?c=${c.id}`}
                className="glass rounded-3xl p-6 hover-lift group block animate-fade-in"
                style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                    {c.short_name.slice(0, 4)}
                  </div>
                  <span className={`text-[10px] font-bold tracking-widest px-2 py-1 rounded-full ${
                    c.difficulty === "Beginner" ? "bg-success/15 text-success" :
                    c.difficulty === "Intermediate" ? "bg-warning/15 text-warning" :
                    "bg-destructive/15 text-destructive"
                  }`}>{c.difficulty.toUpperCase()}</span>
                </div>
                <h3 className="font-display text-xl font-bold mb-1 group-hover:text-primary transition-colors">{c.short_name}</h3>
                <p className="text-xs text-muted-foreground/80 mb-3">{c.name}</p>
                <p className="text-sm text-foreground/70 line-clamp-2 italic">"{c.agenda}"</p>
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{c.portfolios.length} portfolios</span>
                  <span className="text-primary font-semibold flex items-center gap-1">View Matrix <ArrowRight className="w-3 h-3" /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container">
          <div className="relative glass-strong rounded-[2.5rem] p-10 md:p-16 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-deep opacity-95 -z-10" />
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/10 blur-3xl -z-10" />
            <h2 className="font-display text-4xl md:text-6xl font-bold text-white mb-4">Ready to debate the world?</h2>
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
              Reserve your portfolio in seconds. The matrix updates live — your seat won't wait.
            </p>
            <Button asChild variant="glass" size="xl">
              <Link to="/register">Begin Registration <ArrowRight className="w-5 h-5" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
