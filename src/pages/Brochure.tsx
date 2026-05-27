import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import { getCurrentBrochure, type Brochure } from "@/lib/munApi";
import { FileText, Download, Calendar } from "lucide-react";

const BrochurePage = () => {
  const { edition } = useActiveEdition();
  const [brochure, setBrochure] = useState<Brochure | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!edition) return;
    getCurrentBrochure(edition.id).then(b => { setBrochure(b); setLoading(false); });
  }, [edition]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-36 pb-24 container max-w-3xl">
        <div className="text-center mb-10">
          <p className="text-xs tracking-[0.3em] text-primary font-bold mb-3">OFFICIAL DOCUMENT</p>
          <h1 className="font-display text-5xl md:text-6xl font-bold gradient-text-deep mb-4">Brochure</h1>
          <p className="text-muted-foreground">Everything you need to know about {edition?.name ?? "the conference"} — committees, fees, rules, and more.</p>
        </div>

        {loading ? (
          <div className="glass rounded-3xl p-16 text-center text-muted-foreground">Loading…</div>
        ) : brochure ? (
          <div className="glass-strong rounded-3xl p-8 text-center">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-primary text-primary-foreground flex items-center justify-center mb-5 shadow-glow">
              <FileText className="w-10 h-10" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-2">{brochure.title}</h2>
            <p className="text-sm text-muted-foreground mb-1 flex items-center justify-center gap-2">
              <Calendar className="w-3 h-3" /> Published {new Date(brochure.created_at).toLocaleDateString()}
            </p>
            <p className="text-xs text-muted-foreground mb-6">Version {brochure.version}</p>
            <Button asChild variant="hero" size="lg">
              <a href={brochure.file_url} target="_blank" rel="noreferrer" download>
                <Download className="w-4 h-4" /> Download PDF
              </a>
            </Button>
          </div>
        ) : (
          <div className="glass rounded-3xl p-16 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold">Brochure coming soon</p>
            <p className="text-sm text-muted-foreground mb-6">The secretariat is finalising the official document.</p>
            <Button asChild variant="outline">
              <Link to="/committees">Browse committees instead</Link>
            </Button>
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
};

export default BrochurePage;
