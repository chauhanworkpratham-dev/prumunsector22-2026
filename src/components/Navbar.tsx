import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown, User, LogOut, LayoutDashboard, ShieldCheck } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import { useSession } from "@/hooks/useSession";
import { getRegistrationByEmail, getSignedIdUrl } from "@/lib/munApi";
import { cn, initials } from "@/lib/utils";

const NAV = [
  { to: "/",             label: "Home",        end: true },
  { to: "/secretariats", label: "Secretariats"           },
  { to: "/staff",        label: "Staff"                  },
  { to: "/committees",   label: "Committees"             },
  { to: "/matrix",       label: "Matrix"                 },
  { to: "/schedule",     label: "Schedule"               },
  { to: "/brochure",     label: "Brochure"               },
  { to: "/venue",        label: "Venue"                  },
  { to: "/about",        label: "About"                  },
  { to: "/gallery",      label: "Gallery"                },
] as const;

export const Navbar = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { edition } = useActiveEdition();
  const { delegateEmail, secUser, isDelegate, isSecretariat, logoutDelegate, logoutSec } = useSession();

  const [scrolled,    setScrolled]    = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [delegateName, setDelegateName] = useState<string | null>(null);
  const [avatarUrl,    setAvatarUrl]    = useState<string | null>(null);

  const profileRef = useRef<HTMLDivElement>(null);
  const brand = edition?.name?.split(" ")[0] ?? "PRUMUN";

  useEffect(() => {
    if (!isDelegate || !delegateEmail || !edition) return;
    getRegistrationByEmail(edition.id, delegateEmail).then(r => {
      if (!r) return;
      setDelegateName(r.full_name);
      if (r.id_image_path && !r.id_image_path.toLowerCase().endsWith(".pdf")) {
        getSignedIdUrl(r.id_image_path).then(url => { if (url) setAvatarUrl(url); });
      }
    });
  }, [isDelegate, delegateEmail, edition]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    if (menuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  useEffect(() => { setMenuOpen(false); setProfileOpen(false); }, [location.pathname]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const loggedIn    = isDelegate || isSecretariat;
  const displayName = isSecretariat
    ? (secUser?.email?.split("@")[0] ?? "Admin")
    : (delegateName ?? delegateEmail?.split("@")[0] ?? "Delegate");
  const avatarLetters = initials(displayName);
  const profileHref   = isSecretariat ? "/secretariat" : "/delegate";

  const handleLogout = async () => {
    setProfileOpen(false);
    if (isSecretariat) { await logoutSec(); navigate("/"); }
    else { logoutDelegate(); navigate("/"); }
  };

  return (
    <>
      {/* ── Diplomatic fixed navbar ── */}
      <header className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300 glass-nav py-3",
        scrolled && "py-2.5"
      )}>
        <div className="container flex items-center justify-between gap-4">

          {/* Brand wordmark */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <div className="flex flex-col leading-none">
              <span className="font-display font-bold text-[19px] tracking-tight text-foreground leading-none group-hover:text-primary transition-colors duration-200">
                {brand}
              </span>
              <span className="text-[7.5px] tracking-[0.28em] font-semibold uppercase mt-1 whitespace-nowrap"
                style={{ color: "oklch(0.78 0.13 80 / 0.70)" }}>
                Prudence Model United Nations
              </span>
            </div>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden lg:flex items-center gap-0.5 rounded-full px-2 py-1.5 border"
            style={{
              background: "oklch(0.20 0.09 263 / 0.70)",
              borderColor: "oklch(0.78 0.13 80 / 0.12)",
              backdropFilter: "blur(16px)",
            }}>
            {NAV.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                end={"end" in l ? (l as any).end : undefined}
                className="px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
                style={{ color: "oklch(0.75 0.03 263)", fontFamily: "'Inter', sans-serif" }}
                activeClassName="font-semibold"
                activeStyle={{
                  background: "oklch(0.78 0.13 80 / 0.15)",
                  color: "oklch(0.78 0.13 80)",
                }}
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop right side */}
          <div className="hidden lg:flex items-center gap-2">
            {loggedIn ? (
              <div ref={profileRef} className="relative">
                <button
                  onClick={() => setProfileOpen(v => !v)}
                  className="flex items-center gap-2 rounded-full pr-3 pl-1 py-1 transition-all"
                  style={{
                    border: "1px solid oklch(0.78 0.13 80 / 0.18)",
                    background: "oklch(0.24 0.08 263 / 0.80)",
                  }}
                >
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-gold flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ color: "oklch(0.18 0.04 263)" }}>
                    {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : avatarLetters}
                  </div>
                  <span className="text-sm font-medium max-w-[120px] truncate text-foreground">
                    {displayName}
                  </span>
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", profileOpen && "rotate-180")}
                    style={{ color: "oklch(0.78 0.13 80 / 0.70)" }} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 glass-strong rounded-2xl py-1.5 z-50 animate-slide-up"
                    style={{ border: "1px solid oklch(0.78 0.13 80 / 0.15)" }}>
                    <div className="px-4 py-3 flex items-center gap-3"
                      style={{ borderBottom: "1px solid oklch(0.78 0.13 80 / 0.10)" }}>
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-gold flex items-center justify-center text-sm font-bold shrink-0"
                        style={{ color: "oklch(0.18 0.04 263)" }}>
                        {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : avatarLetters}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate text-foreground">{displayName}</p>
                        <p className="text-[10px] text-muted-foreground">{isSecretariat ? "Secretariat" : "Delegate"}</p>
                      </div>
                    </div>
                    <div className="p-1.5 space-y-0.5">
                      <Link to={profileHref} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors w-full text-foreground hover:text-primary hover:bg-primary/10">
                        {isSecretariat ? <><ShieldCheck className="w-4 h-4" /> Admin Portal</> : <><User className="w-4 h-4" /> My Profile</>}
                      </Link>
                      {isDelegate && (
                        <Link to="/delegate" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors w-full text-foreground hover:text-primary hover:bg-primary/10">
                          <LayoutDashboard className="w-4 h-4" /> My Portfolio
                        </Link>
                      )}
                      <div className="h-px my-1" style={{ background: "oklch(0.78 0.13 80 / 0.10)" }} />
                      <button onClick={handleLogout} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors w-full text-left text-destructive hover:bg-destructive/10">
                        <LogOut className="w-4 h-4" /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login"
                  className="px-4 py-2 rounded-full text-sm font-medium transition-all text-muted-foreground hover:text-foreground hover:bg-muted">
                  Login
                </Link>
                {/* Gold CTA */}
                <Link to="/register"
                  className="px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 hover:scale-105"
                  style={{
                    background: "var(--gradient-gold)",
                    color: "oklch(0.18 0.04 263)",
                    boxShadow: "var(--shadow-gold)",
                  }}>
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile right */}
          <div className="flex lg:hidden items-center gap-2">
            {loggedIn && (
              <Link to={profileHref} className="w-8 h-8 rounded-full overflow-hidden bg-gradient-gold flex items-center justify-center text-xs font-bold"
                style={{ color: "oklch(0.18 0.04 263)" }}>
                {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : avatarLetters}
              </Link>
            )}
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="p-2 rounded-full transition-all text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-label="Toggle menu" aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile full-screen drawer ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex flex-col animate-fade-in">
          {/* Navy backdrop */}
          <div className="absolute inset-0" style={{ background: "oklch(0.20 0.09 263 / 0.97)", backdropFilter: "blur(24px)" }}
            onClick={() => setMenuOpen(false)} />
          <div className="relative flex flex-col h-full overflow-y-auto pt-20 pb-8 px-6">
            {/* Gold thin rule */}
            <div className="w-8 h-0.5 mb-6 rounded-full" style={{ background: "var(--gradient-gold)" }} />
            <nav className="flex flex-col gap-0.5 mb-6">
              {NAV.map(l => (
                <Link key={l.to} to={l.to}
                  className={cn(
                    "flex items-center px-4 py-3 rounded-2xl text-base font-medium transition-all",
                    location.pathname === l.to
                      ? "font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  style={location.pathname === l.to ? {
                    background: "oklch(0.78 0.13 80 / 0.12)",
                    color: "oklch(0.78 0.13 80)",
                  } : {}}>
                  {l.label}
                </Link>
              ))}
            </nav>

            <div className="pt-4" style={{ borderTop: "1px solid oklch(0.78 0.13 80 / 0.12)" }}>
              {loggedIn ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 px-4 py-3 glass rounded-2xl mb-2">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-gold flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ color: "oklch(0.18 0.04 263)" }}>
                      {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : avatarLetters}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">{displayName}</p>
                      <p className="text-xs text-muted-foreground">{isSecretariat ? "Secretariat" : "Delegate"}</p>
                    </div>
                  </div>
                  <Link to={profileHref} className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-muted">
                    {isSecretariat ? <ShieldCheck className="w-4 h-4 text-primary" /> : <User className="w-4 h-4 text-primary" />}
                    {isSecretariat ? "Admin Portal" : "My Profile"}
                  </Link>
                  <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full text-left">
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Link to="/login" className="flex-1 py-3 rounded-2xl text-sm font-semibold text-center border transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
                    style={{ borderColor: "oklch(0.78 0.13 80 / 0.18)" }}>
                    Login
                  </Link>
                  <Link to="/register" className="flex-1 py-3 rounded-2xl text-sm font-bold text-center transition-all"
                    style={{
                      background: "var(--gradient-gold)",
                      color: "oklch(0.18 0.04 263)",
                      boxShadow: "var(--shadow-gold)",
                    }}>
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
