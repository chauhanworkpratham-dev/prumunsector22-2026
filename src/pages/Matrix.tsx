import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import { getCommittees, getOccupiedPortfolios, type Committee } from "@/lib/munApi";
import { Lock, CheckCircle2, ArrowRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const Matrix = () => {
  const [params, setParams] = useSearchParams();
  const { edition } = useActiveEdition();
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [active, setActive] = useState("");
  const [locks, setLocks] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!edition) return;
    getCommittees(edition.id).then(cs => {
      setCommittees(cs);
      const initial = params.get("c") && cs.find(c => c.id === params.get("c"))
        ? params.get("c")! : cs[0]?.id || "";
      setActive(initial);
    });
  }, [edition]);

  useEffect(() => {
    if (!edition) return;
    const refresh = () => getOccupiedPortfolios(edition.id).then(setLocks);
    refresh();
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
  const filteredPortfolios = committee
    ? committee.portfolios.filter(p => !search || p.toLowerCase().includes(search.toLowerCase()))
    : [];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Dark header */}
      <div className="page-hero">
        <div className="container max-w-5xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
            </span>
            <span className="text-[9px] font-bold tracking-[0.28em] text-white/45 uppercase">Live Allotment Matrix</span>
          </div>
          <h1 className="font-display font-bold text-white leading-tight" style={{ fontSize: "clamp(1.75rem, 5vw, 2.75rem)" }}>
            Every delegate. Every country. Real-time.
          </h1>
          <p className="text-white/50 text-sm mt-3 max-w-lg">
            Updates from the Secretariat appear here instantly. Sign in to see your own assignment in your dashboard.
          </p>
        </div>
      </div>

      <section className="py-12 bg-white">
        <div className="container max-w-5xl">

          {/* Search */}
          <div className="relative max-w-sm mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/30" />
            <input
              type="text"
              placeholder="Search committee, country, delegate…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-input pl-9 w-full h-10"
            />
          </div>

          {/* Committee tabs */}
          <div className="flex flex-wrap gap-1.5 mb-8">
            {committees.map(c => (
              <button key={c.id}
                onClick={() => { setActive(c.id); setParams({ c: c.id }); setSearch(""); }}
                className={cn(
                  "px-4 py-1.5 rounded-sm text-sm font-semibold transition-all border",
                  active === c.id
                    ? "bg-navy text-white border-navy"
                    : "bg-white text-navy/60 border-navy/15 hover:border-navy/40 hover:text-navy"
                )}>
                {c.short_name}
              </button>
            ))}
          </div>

          {/* Committee header */}
          {committee && (
            <>
              <div className="border border-navy/8 rounded-sm p-6 mb-6 bg-white shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="font-display font-bold text-navy text-2xl mb-1">{committee.name}</h2>
                    <p className="text-navy/45 text-sm italic">"{committee.agenda}"</p>
                  </div>
                  <div className="flex gap-6">
                    <div className="text-center">
                      <div className="font-display font-bold text-2xl text-green-600 leading-none">
                        {committee.portfolios.length - taken}
                      </div>
                      <div className="text-[9px] tracking-widest text-navy/35 font-bold uppercase mt-1">Open</div>
                    </div>
                    <div className="text-center border-l border-navy/8 pl-6">
                      <div className="font-display font-bold text-2xl text-red-500 leading-none">{taken}</div>
                      <div className="text-[9px] tracking-widest text-navy/35 font-bold uppercase mt-1">Locked</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Portfolio grid */}
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-10">
                {filteredPortfolios.map((p, i) => {
                  const isLocked = Boolean(locks[`${committee.id}::${p}`]);
                  return (
                    <div key={p}
                      className={cn(
                        "rounded-sm p-4 border transition-all animate-fade-in",
                        isLocked
                          ? "bg-red-50/50 border-red-100 opacity-70"
                          : "bg-white border-navy/8 hover:border-gold/50 hover:shadow-card cursor-pointer"
                      )}
                      style={{ animationDelay: `${i * 20}ms` }}>
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-semibold text-navy leading-tight pr-2">{p}</span>
                        {isLocked
                          ? <Lock className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          : <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                        }
                      </div>
                      <div className={cn(
                        "text-[9px] font-bold tracking-widest",
                        isLocked ? "text-red-400" : "text-green-600"
                      )}>
                        {isLocked ? "● OCCUPIED" : "● AVAILABLE"}
                      </div>
                    </div>
                  );
                })}
                {filteredPortfolios.length === 0 && search && (
                  <div className="col-span-full py-8 text-center text-navy/35 text-sm">
                    No portfolios match "{search}"
                  </div>
                )}
              </div>

              {/* CTA */}
              <div className="text-center">
                <Link to={`/register?c=${committee.id}`} className="btn-gold">
                  Claim Your Portfolio <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </>
          )}

          {committees.length === 0 && (
            <div className="border border-navy/8 rounded-sm py-16 text-center">
              <p className="text-navy/40 text-sm font-medium">No allotments yet.</p>
              <p className="text-navy/30 text-xs mt-1">Staff can add them from the admin panel.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Matrix;
