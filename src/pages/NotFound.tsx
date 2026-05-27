import { Link, useLocation } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Compass } from "lucide-react";

const NotFound = () => {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center pt-28 pb-20 px-4">
        <div className="text-center max-w-lg">
          {/* Decorative rings */}
          <div className="relative w-40 h-40 mx-auto mb-10">
            <span className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
            <span className="absolute inset-4 rounded-full border border-primary/30 animate-ping"
              style={{ animationDelay: "200ms", animationDuration: "1.6s" }} />
            <div className="absolute inset-0 rounded-full bg-primary/5 flex items-center justify-center">
              <Compass className="w-16 h-16 text-primary/60" strokeWidth={1.5} />
            </div>
          </div>

          <p className="text-xs tracking-[0.4em] text-primary font-bold mb-3 uppercase">404 — Not Found</p>
          <h1 className="font-display text-5xl md:text-6xl font-black gradient-text-deep mb-4 leading-tight">
            Lost in the chamber?
          </h1>
          <p className="text-muted-foreground text-lg mb-2">
            The route{" "}
            <code className="font-mono text-sm bg-secondary px-2 py-0.5 rounded-md text-foreground">
              {pathname}
            </code>{" "}
            doesn't exist.
          </p>
          <p className="text-muted-foreground text-sm mb-10">
            Maybe the session moved rooms, or the link is outdated.
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            <Button asChild variant="hero" size="lg">
              <Link to="/">
                <ArrowLeft className="w-4 h-4" /> Back to Home
              </Link>
            </Button>
            <Button asChild variant="glass" size="lg">
              <Link to="/committees">Explore Committees</Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;
