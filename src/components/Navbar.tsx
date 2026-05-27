import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import crest from "@/assets/prumun-crest.png";
import { cn } from "@/lib/utils";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import { ThemeToggle } from "@/components/ThemeToggle";

const NAV_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/secretariats", label: "Secretariats" },
  { to: "/staff", label: "Staff" },
  { to: "/committees", label: "Committees" },
  { to: "/matrix", label: "Matrix" },
  { to: "/schedule", label: "Schedule" },
  { to: "/brochure", label: "Brochure" },
  { to: "/venue", label: "Venue" },
] as const;

export const Navbar = () => {
  const { edition } = useActiveEdition();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const brandTitle = edition?.name?.split(" ")[0] ?? "PRUMUN";
  const brandTag   = edition?.name?.split(" ").slice(1).join(" ") ?? "2026";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setMenuOpen(false); };
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-500",
        scrolled
          ? "py-2 glass dark:glass-dark border-b border-border/40 shadow-glass"
          : "py-5 bg-transparent",
      )}
    >
      <div className="container">
        <nav className="flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-110">
              <img
                src={edition?.header_logo_url ?? edition?.logo_url ?? crest}
                alt={`${brandTitle} crest`}
                width={36}
                height={36}
                className="w-9 h-9 object-contain drop-shadow-md"
              />
            </div>
            <div className="leading-tight">
              <div className="font-display font-black text-lg tracking-tight text-foreground">{brandTitle}</div>
              <div className="text-[9px] tracking-[0.25em] text-muted-foreground font-semibold uppercase">{brandTag}</div>
            </div>
          </Link>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-0.5" role="navigation" aria-label="Main navigation">
            {NAV_LINKS.map(l => (
              <NavLink key={l.to} to={l.to} end={"end" in l ? l.end : undefined}>
                {l.label}
              </NavLink>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm" className="font-semibold text-foreground/80 hover:text-foreground">
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild variant="hero" size="sm" className="font-semibold shadow-elegant">
              <Link to="/register">Register</Link>
            </Button>
          </div>

          {/* Mobile controls */}
          <div className="flex lg:hidden items-center gap-1">
            <ThemeToggle />
            <button
              onClick={() => setMenuOpen(prev => !prev)}
              className="p-2 rounded-lg hover:bg-secondary/60 transition-colors"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        {menuOpen && (
          <div
            id="mobile-nav"
            role="navigation"
            aria-label="Mobile navigation"
            className="lg:hidden mt-3 glass-strong rounded-2xl p-4 animate-fade-in border border-border/50 shadow-elegant"
          >
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map(l => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={"end" in l ? l.end : undefined}
                  className="w-full px-4 py-2.5 rounded-lg"
                  onClick={() => setMenuOpen(false)}
                >
                  {l.label}
                </NavLink>
              ))}
              <div className="border-t border-border/40 my-2" />
              <div className="flex gap-2">
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border border-border text-center hover:bg-secondary/60 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-primary text-primary-foreground text-center shadow-elegant"
                >
                  Register
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
