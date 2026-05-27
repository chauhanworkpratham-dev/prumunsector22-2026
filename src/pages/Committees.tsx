import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import { getCommittees, type Committee } from "@/lib/munApi";
import { ArrowRight, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const DIFF_STYLE = {
  Beginner:     "bg-success/10 text-success",
  Intermediate: "bg-warning/10 text-warning",
  Advanced:     "bg-destructive/10 text-destructive",
} as const;

const Committees = () => {
  const { edition } = useActiveEdition();
  const [committees, setCommittees] = useState<Committee[]>([]);

  useEffect(() => {
    if (edition) getCommittees(edition.id).then(setCommittees);
  }, [edition]);

  return (
    <div className="min-h-screen bg-background mesh-bg">
      <Navbar />
      <section className="pt-36 pb-12 container">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="section-label">The Councils · {edition?.name ?? ""}</p>
          <h1 className="font-display text-5xl md:text-6xl font-bold gradient-text-deep mb-4">Committees</h1>
          <p className="text-muted-foreground text-sm">
            Each arena has its own agenda and portfolios. Study carefully, then claim your seat in the live matrix.
          </p>
        </div>
      </section>

      <section className="container pb-24">
        <div className="grid lg:grid-cols-2 gap-5">
          {committees.map((c, i) => (
            <div key={c.id} className="glass rounded-2xl p-7 hover-lift animate-fade-in" style={{ animationDelay: `${i * 70}ms` }}>
              <div className="flex items-start justify-between mb-4 gap-4">
                <div>
                  <div className="pill bg-primary/8 text-primary text-[10px] mb-2">{c.short_name}</div>
                  <h2 className="font-display text-xl md:text-2xl font-bold leading-tight">{c.name}</h2>
                </div>
                <span className={cn("pill text-[9px] shrink-0", DIFF_STYLE[c.difficulty as keyof typeof DIFF_STYLE])}>
                  {c.difficulty}
                </span>
              </div>

              {/* Agenda */}
              <div className="rounded-xl bg-primary/5 border-l-2 border-primary px-4 py-3 my-4">
                <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-1">Agenda</p>
                <p className="text-sm text-foreground/80 italic">"{c.agenda}"</p>
              </div>

              {c.description && <p className="text-xs text-muted-foreground mb-5 leading-relaxed">{c.description}</p>}

              <div className="divider pt-4 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="w-3.5 h-3.5" /> {c.portfolios.length} portfolios
                </span>
                <Link to={`/matrix?c=${c.id}`}
                  className="text-primary font-semibold text-xs flex items-center gap-1 hover:gap-1.5 transition-all group">
                  View Matrix <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Committees;
