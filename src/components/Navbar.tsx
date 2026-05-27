import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import crest from "@/assets/prumun-crest.png";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/",            label: "Home",         end: true },
  { to: "/secretariats",label: "Secretariats"            },
  { to: "/staff",       label: "Staff"                   },
  { to: "/committees",  label: "Committees"              },
  { to: "/matrix",      label: "Matrix"                  },
  { to: "/schedule",    label: "Schedule"                },
  { to: "/brochure",    label: "Brochure"                },
  { to: "/venue",       label: "Venue"                   },
] as const;

export const Navbar = () => {
  const { edition } = useActiveEdition();
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);

  const brand = edition?.name?.split(" ")[0] ?? "PRUMUN";
  const tag   = edition?.name?.split(" ").slice(1).join(" ") ?? "2026";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setMenuOpen(false); };
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header className={cn(
      "fixed top-0 inset-x-0 z-50 transition-all duration-400",
      scrolled ? "glass-nav py-2.5" : "bg-transparent py-5",
    )}>
      <div className="container flex items-center justify-between">

        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group shrink-0">
          <div className="w-9 h-9 rounded-xl overflow-hidden ring-1 ring-primary/20 transition-transform group-hover:scale-105">
            <img src={edition?.header_logo_url ?? edition?.logo_url ?? crest}
              alt={brand} width={36} height={36} className="w-full h-full object-contain" />
          </div>
          <div className="leading-none">
            <div className="font-display font-bold text-[17px] tracking-tight text-foreground">{brand}</div>
            <div className="text-[8px] tracking-[0.28em] text-primary/70 font-semibold uppercase mt-0.5">{tag}</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-0.5" aria-label="Main">
          {NAV.map(l => (
            <NavLink key={l.to} to={l.to} end={"end" in l ? l.end : undefined}>{l.label}</NavLink>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden lg:flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm" className="font-semibold">
            <Link to="/login">Login</Link>
          </Button>
          <Button asChild size="sm" className="font-semibold bg-gradient-primary text-white shadow-sm hover:shadow-md hover:opacity-90 transition-all border-0">
            <Link to="/register">Register</Link>
          </Button>
        </div>

        {/* Mobile row */}
        <div className="flex lg:hidden items-center gap-1.5">
          <ThemeToggle />
          <button onClick={() => setMenuOpen(v => !v)}
            className="p-2 rounded-xl hover:bg-primary/8 transition-colors"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen} aria-controls="mobile-nav">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div id="mobile-nav" className="lg:hidden mt-2 mx-4 glass-strong rounded-2xl p-3 animate-slide-up border border-border/50">
          <nav className="flex flex-col gap-0.5" aria-label="Mobile">
            {NAV.map(l => (
              <NavLink key={l.to} to={l.to} end={"end" in l ? l.end : undefined}
                className="w-full text-left px-4 py-2.5"
                onClick={() => setMenuOpen(false)}>{l.label}</NavLink>
            ))}
          </nav>
          <div className="divider my-2.5" />
          <div className="flex gap-2 px-1">
            <Link to="/login" onClick={() => setMenuOpen(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-border text-center hover:bg-secondary transition-colors">Login</Link>
            <Link to="/register" onClick={() => setMenuOpen(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-primary text-white text-center shadow-sm">Register</Link>
          </div>
        </div>
      )}
    </header>
  );
};
