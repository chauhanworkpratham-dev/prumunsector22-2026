import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import { getCommittees, getOccupiedPortfolios, type Committee } from "@/lib/munApi";
import { Lock, CheckCircle2, ArrowRight, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const Matrix = () => {
  const [params, setParams] = useSearchParams();
  const { edition } = useActiveEdition();
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [active, setActive] = useState("");
  const [locks, setLocks] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!edition) return;
    getCommittees(edition.id).then(cs => {
      setCommittees(cs);
      const initial = params.get("c") && cs.find(c => c.id === params.get("c")) ? params.get("c")! : cs[0]?.id || "";
      setActive(initial);
    });
  }, [edition, params]);

  useEffect(() => {
    if (!edition) return;
    const refresh = () => getOccupiedPortfolios(edition.id).then(setLocks);
    refresh();
    // Live updates: re-pull whenever a registration row changes for this edition
    const channel = supabase
      .channel(`matrix-${edition.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "registrations", filter: `edition_id=eq.${edition.id}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "committees", filter: `edition_id=eq.${edition.id}` }, () => {
        getCommittees(edition.id).then(setCommittees);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [edition]);

  const committee = committees.find(c => c.id === active);
  const taken = committee ? committee.portfolios.filter(p => locks[`${committee.id}::${p}`]).length : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-36 pb-10 container">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <p className="text-xs tracking-[0.3em] text-primary font-bold mb-3 inline-flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            LIVE · REAL-TIME SYNC
          </p>
          <h1 className="font-display text-5xl md:text-6xl font-bold gradient-text-deep mb-4">Role Matrix</h1>
          <p className="text-muted-foreground">
            Click any open portfolio to register. Locked portfolios update instantly the moment a delegate claims them.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {committees.map(c => (
            <button key={c.id} onClick={() => { setActive(c.id); setParams({ c: c.id }); }}
              className={cn("px-5 py-2.5 rounded-full text-sm font-semibold transition-all",
                active === c.id ? "bg-gradient-primary text-primary-foreground shadow-elegant" : "glass hover:bg-white/80")}>
              {c.short_name}
            </button>
          ))}
        </div>

        {committee && (
          <>
            <div className="glass-strong rounded-3xl p-6 md:p-8 mb-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="font-display text-2xl md:text-3xl font-bold mb-1">{committee.name}</h2>
                  <p className="text-sm italic text-muted-foreground">"{committee.agenda}"</p>
                </div>
                <div className="flex gap-3">
                  <div className="text-center px-4">
                    <div className="font-display text-2xl font-bold text-success">{committee.portfolios.length - taken}</div>
                    <div className="text-[10px] tracking-widest text-muted-foreground font-semibold">OPEN</div>
                  </div>
                  <div className="text-center px-4 border-l border-border">
                    <div className="font-display text-2xl font-bold text-destructive">{taken}</div>
                    <div className="text-[10px] tracking-widest text-muted-foreground font-semibold">LOCKED</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-12">
              {committee.portfolios.map((p, i) => {
                const isLocked = Boolean(locks[`${committee.id}::${p}`]);
                return (
                  <div key={p} className={cn("rounded-2xl p-4 border-2 transition-all animate-fade-in",
                    isLocked ? "bg-destructive/5 border-destructive/30 opacity-70" : "glass border-transparent hover-lift hover:border-primary")}
                    style={{ animationDelay: `${i * 30}ms` }}>
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-semibold leading-tight pr-2">{p}</span>
                      {isLocked ? <Lock className="w-4 h-4 text-destructive shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-success shrink-0" />}
                    </div>
                    <div className={cn("text-[10px] font-bold tracking-widest mt-2", isLocked ? "text-destructive" : "text-success")}>
                      {isLocked ? "● OCCUPIED" : "● AVAILABLE"}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center">
              <Button asChild variant="hero" size="lg">
                <Link to={`/register?c=${committee.id}`}>Claim Your Portfolio <ArrowRight className="w-5 h-5" /></Link>
              </Button>
            </div>
          </>
        )}
      </section>
      <Footer />
    </div>
  );
};

export default Matrix;
