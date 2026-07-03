import { Link, useLocation } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Compass } from "lucide-react";

const NotFound = () => {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center pt-28 pb-20 px-4">
        <div className="text-center max-w-lg">

          {/* Icon */}
          <div className="relative w-32 h-32 mx-auto mb-10">
            <span className="absolute inset-0 rounded-full border-2 border-gold/20 animate-ping" />
            <span className="absolute inset-4 rounded-full border border-gold/15 animate-ping"
              style={{ animationDelay: "200ms", animationDuration: "1.6s" }} />
            <div className="absolute inset-0 rounded-sm bg-navy flex items-center justify-center">
              <Compass className="w-14 h-14 text-white/70" strokeWidth={1.5} />
            </div>
          </div>

          <p className="text-[9px] tracking-[0.38em] text-gold font-bold uppercase mb-3">
            404 — Not Found
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-navy mb-4 leading-tight">
            Lost in the chamber?
          </h1>
          <p className="text-navy/55 text-base mb-2">
            The route{" "}
            <code className="font-mono text-sm bg-navy/5 border border-navy/10 px-2 py-0.5 rounded-sm text-navy">
              {pathname}
            </code>{" "}
            doesn't exist.
          </p>
          <p className="text-navy/40 text-sm mb-10">
            Maybe the session moved rooms, or the link is outdated.
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/" className="btn-gold">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
            <Link to="/committees" className="btn-ghost">
              Explore Committees
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;
