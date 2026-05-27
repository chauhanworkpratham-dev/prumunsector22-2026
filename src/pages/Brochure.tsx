import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import { getCurrentBrochure, type Brochure } from "@/lib/munApi";
import { FileText, Download, Calendar, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

const BrochurePage = () => {
  const { edition } = useActiveEdition();
  const [brochure, setBrochure] = useState<Brochure | null>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!edition) return;
    getCurrentBrochure(edition.id).then(b => { setBrochure(b); setLoading(false); });
  }, [edition]);

  return (
    <div className="min-h-screen bg-background mesh-bg">
      <Navbar />
      <section className="pt-36 pb-24 container max-w-2xl">
        <div className="text-center mb-12">
          <p className="section-label">Official Document</p>
          <h1 className="font-display text-5xl md:text-6xl font-bold gradient-text-deep mb-3">Brochure</h1>
          <p className="text-muted-foreground text-sm">
            Everything about {edition?.name ?? "the conference"} — committees, fees, rules, and timelines.
          </p>
        </div>

        {loading ? (
          <div className="glass rounded-2xl p-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          </div>
        ) : brochure ? (
          <div className="glass-strong rounded-2xl p-10 text-center hover-lift">
            <div className="w-18 h-18 mx-auto rounded-2xl bg-gradient-primary text-white flex items-center justify-center mb-6 shadow-elegant" style={{ width: 72, height: 72 }}>
              <FileText className="w-9 h-9" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-2">{brochure.title}</h2>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5 mb-1">
              <Calendar className="w-3 h-3" /> Published {formatDate(brochure.created_at)}
            </p>
            <p className="text-[11px] text-muted-foreground mb-8">Version {brochure.version}</p>
            <Button asChild size="lg" className="bg-gradient-primary text-white border-0 font-semibold hover:opacity-90 shadow-md">
              <a href={brochure.file_url} target="_blank" rel="noreferrer" download>
                <Download className="w-4 h-4" /> Download PDF
              </a>
            </Button>
          </div>
        ) : (
          <div className="glass rounded-2xl p-16 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/8 text-primary flex items-center justify-center mb-5">
              <FileText className="w-8 h-8" />
            </div>
            <p className="font-display font-bold text-xl mb-2">Brochure coming soon</p>
            <p className="text-sm text-muted-foreground mb-8">
              The Secretariat is finalising the official document. Check back shortly.
            </p>
            <Button asChild variant="outline" className="font-semibold border-primary/30 text-primary hover:bg-primary hover:text-white transition-all">
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
