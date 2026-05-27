import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import { getCommittees, type Committee } from "@/lib/munApi";
import { Link } from "react-router-dom";
import { ArrowRight, Users } from "lucide-react";

const Committees = () => {
  const { edition } = useActiveEdition();
  const [committees, setCommittees] = useState<Committee[]>([]);

  useEffect(() => {
    if (edition) getCommittees(edition.id).then(setCommittees);
  }, [edition]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-36 pb-12 container">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <p className="text-xs tracking-[0.3em] text-primary font-bold mb-3">THE COUNCILS · {edition?.name ?? ""}</p>
          <h1 className="font-display text-5xl md:text-6xl font-bold gradient-text-deep mb-4">Committees</h1>
          <p className="text-muted-foreground text-lg">
            Each arena of debate has its own agenda and portfolios. Read carefully, then claim your seat in the live matrix.
          </p>
        </div>
      </section>

      <section className="container pb-24">
        <div className="grid lg:grid-cols-2 gap-6">
          {committees.map((c, i) => (
            <div key={c.id} className="glass-strong rounded-3xl p-8 hover-lift animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex items-start justify-between mb-4 gap-4">
                <div>
                  <div className="text-xs tracking-widest text-primary font-bold mb-1">{c.short_name}</div>
                  <h2 className="font-display text-2xl md:text-3xl font-bold leading-tight">{c.name}</h2>
                </div>
                <span className={`shrink-0 text-[10px] font-bold tracking-widest px-3 py-1.5 rounded-full ${
                  c.difficulty === "Beginner" ? "bg-success/15 text-success" :
                  c.difficulty === "Intermediate" ? "bg-warning/15 text-warning" :
                  "bg-destructive/15 text-destructive"
                }`}>{c.difficulty.toUpperCase()}</span>
              </div>
              <div className="bg-primary/5 border-l-4 border-primary rounded-r-xl p-4 my-5">
                <p className="text-xs uppercase tracking-widest text-primary font-bold mb-1">Agenda</p>
                <p className="text-foreground/85 italic">"{c.agenda}"</p>
              </div>
              {c.description && <p className="text-sm text-muted-foreground mb-6">{c.description}</p>}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" /> {c.portfolios.length} portfolios available
                </span>
                <Link to={`/matrix?c=${c.id}`} className="text-primary font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all">
                  View matrix <ArrowRight className="w-4 h-4" />
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
