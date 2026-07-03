import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
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
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Dark page hero */}
      <div className="page-hero text-center">
        <div className="container max-w-2xl">
          <span className="eyebrow" style={{ color: "rgba(201,151,58,0.85)" }}>Official Document</span>
          <h1 className="font-display font-bold text-white leading-tight"
            style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)" }}>
            Conference Brochure
          </h1>
          <p className="text-white/50 text-sm mt-3">
            Everything about {edition?.name ?? "the conference"} — committees, fees, rules, and timelines.
          </p>
        </div>
      </div>

      <section className="py-16 bg-white">
        <div className="container max-w-2xl">
          {loading ? (
            <div className="border border-navy/8 rounded-sm p-16 text-center bg-white shadow-card">
              <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto" />
            </div>
          ) : brochure ? (
            <div className="border border-navy/8 rounded-sm bg-white shadow-elegant p-10 text-center hover:-translate-y-0.5 transition-all">
              <div className="w-16 h-16 mx-auto rounded-sm bg-navy flex items-center justify-center mb-6 shadow-card">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h2 className="font-display text-2xl font-bold text-navy mb-2">{brochure.title}</h2>
              <p className="text-xs text-navy/40 flex items-center justify-center gap-1.5 mb-1">
                <Calendar className="w-3 h-3" /> Published {formatDate(brochure.created_at)}
              </p>
              <p className="text-[11px] text-navy/30 mb-8">Version {brochure.version}</p>
              <a href={brochure.file_url} target="_blank" rel="noreferrer" download
                className="btn-gold text-sm px-8 py-3">
                <Download className="w-4 h-4" /> Download PDF
              </a>
            </div>
          ) : (
            <div className="border border-navy/8 rounded-sm bg-white shadow-card p-16 text-center">
              <div className="w-16 h-16 mx-auto rounded-sm bg-navy/5 flex items-center justify-center mb-5">
                <FileText className="w-8 h-8 text-navy/25" />
              </div>
              <p className="font-display font-bold text-navy text-xl mb-2">Brochure coming soon</p>
              <p className="text-sm text-navy/45 mb-8 leading-relaxed">
                The Secretariat is finalising the official document. Check back shortly.
              </p>
              <Link to="/committees" className="btn-ghost">Browse committees instead</Link>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BrochurePage;
