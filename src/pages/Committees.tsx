import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import { getCommittees, type Committee } from "@/lib/munApi";
import { ArrowRight, Users, Globe2 } from "lucide-react";
import { cn } from "@/lib/utils";

const DIFF_STYLE: Record<string, string> = {
  Beginner:     "bg-green-50 text-green-700 border-green-200",
  Intermediate: "bg-amber-50 text-amber-700 border-amber-200",
  Advanced:     "bg-red-50   text-red-700   border-red-200",
};

const Committees = () => {
  const { edition } = useActiveEdition();
  const [committees, setCommittees] = useState<Committee[]>([]);

  useEffect(() => {
    if (edition) getCommittees(edition.id).then(setCommittees);
  }, [edition]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Dark page hero — matches screenshot */}
      <div className="page-hero">
        <div className="container max-w-4xl">
          <span className="eyebrow" style={{ color: "rgba(201,151,58,0.85)" }}>
            The Councils · {edition?.name ?? ""}
          </span>
          <h1 className="font-display font-bold text-white leading-tight"
            style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)" }}>
            Committees
          </h1>
          <p className="text-white/50 text-sm mt-3 max-w-md">
            Each arena has its own agenda and portfolios. Study carefully, then claim your seat in the live matrix.
          </p>
        </div>
      </div>

      <section className="py-16 bg-white">
        <div className="container max-w-5xl">
          <div className="grid lg:grid-cols-2 gap-4">
            {committees.map((c, i) => (
              <div key={c.id}
                className="card-committee animate-fade-in"
                style={{ animationDelay: `${i * 70}ms` }}>

                {/* Header */}
                <div className="flex items-start justify-between mb-4 gap-4">
                  <div>
                    <div className="inline-flex items-center gap-1 text-[9px] font-bold tracking-widest text-gold uppercase mb-2">
                      {c.short_name}
                    </div>
                    <h2 className="font-display text-xl md:text-2xl font-bold text-navy leading-tight">{c.name}</h2>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn(
                      "text-[9px] font-bold px-2 py-1 rounded-sm border tracking-wide uppercase",
                      DIFF_STYLE[c.difficulty] ?? "bg-navy/5 text-navy/60 border-navy/12"
                    )}>
                      {c.difficulty}
                    </span>
                    <div className="w-7 h-7 rounded-sm border border-gold/25 flex items-center justify-center text-gold shrink-0">
                      <Globe2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                {/* Agenda pill — matches screenshot "Agenda · Crisis in the Sahel Region" */}
                <div className="inline-flex items-center gap-1.5 bg-navy/5 border border-navy/8 rounded-sm px-3 py-1.5 text-[11px] font-semibold text-navy/65 mb-4">
                  Agenda · {c.agenda}
                </div>

                {c.description && (
                  <p className="text-xs text-navy/50 mb-5 leading-relaxed">{c.description}</p>
                )}

                {/* Footer row */}
                <div className="pt-4 flex items-center justify-between border-t border-navy/6">
                  <span className="flex items-center gap-1.5 text-xs text-navy/40">
                    <Users className="w-3.5 h-3.5" /> {c.portfolios.length} portfolios
                  </span>
                  <Link to={`/matrix?c=${c.id}`}
                    className="text-gold font-semibold text-xs flex items-center gap-1 hover:gap-2 transition-all group">
                    View Matrix <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}

            {committees.length === 0 && (
              <div className="lg:col-span-2 border border-navy/8 rounded-sm py-16 text-center text-navy/40 text-sm bg-white">
                Committees will appear here once published.
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Committees;
