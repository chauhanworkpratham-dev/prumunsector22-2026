import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown, User, LogOut, LayoutDashboard, ShieldCheck } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import { useSession } from "@/hooks/useSession";
import { getRegistrationByEmail, getSignedIdUrl } from "@/lib/munApi";
import crest from "@/assets/prumun-crest.png";
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
] as const;

export const Navbar = () => {
  const navigate = useNavigate();
  const { edition } = useActiveEdition();
  const { delegateEmail, secUser, isDelegate, isSecretariat, logoutDelegate, logoutSec } = useSession();

  const [scrolled,    setScrolled]    = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [delegateName, setDelegateName] = useState<string | null>(null);
  const [avatarUrl,   setAvatarUrl]   = useState<string | null>(null);

  const profileRef = useRef<HTMLDivElement>(null);

  const brand = edition?.name?.split(" ")[0] ?? "PRUMUN";
  const tag   = edition?.name?.split(" ").slice(1).join(" ") ?? "2026";

  // Load delegate's full name + photo for the avatar
  useEffect(() => {
    if (!isDelegate || !delegateEmail || !edition) return;
    getRegistrationByEmail(edition.id, delegateEmail).then(r => {
      if (r) {
        setDelegateName(r.full_name);
        // load profile photo if any
        if (r.id_image_path) {
          getSignedIdUrl(r.id_image_path).then(url => {
            // only use if it's an image (not PDF)
            if (url && !r.id_image_path.toLowerCase().endsWith(".pdf")) setAvatarUrl(url);
          });
        }
      }
    });
  }, [isDelegate, delegateEmail, edition]);

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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const loggedIn = isDelegate || isSecretariat;
  const displayName = isSecretariat
    ? (secUser?.email ?? "Secretariat")
    : (delegateName ?? delegateEmail ?? "Delegate");
  const avatarLetters = initials(displayName.includes("@") ? displayName.split("@")[0] : displayName);

  const handleLogout = async () => {
    setProfileOpen(false);
    if (isSecretariat) { await logoutSec(); navigate("/"); }
    else { logoutDelegate(); navigate("/"); }
  };

  const profileHref = isSecretariat ? "/secretariat" : "/delegate";

  /* ── Whether the page hero is dark (needs white nav text when unscrolled) ── */
  const isAtTop = !scrolled;
  const isHomePage = typeof window !== "undefined" && window.location.pathname === "/";
  const heroDark = isHomePage && isAtTop; // hero has hardcoded dark bg

  return (
    <header className={cn(
      "fixed top-0 inset-x-0 z-50 transition-all duration-300",
      scrolled
        ? "glass-nav py-2.5"
        : heroDark
          ? "bg-transparent py-5"
          : "bg-white/90 dark:bg-background/90 backdrop-blur-md border-b border-border/40 py-3 shadow-sm",
    )}>
      <div className="container flex items-center justify-between">

        {/* Brand — bigger logo */}
        <Link to="/" className="flex items-center gap-3 group shrink-0">
          <div className="w-11 h-11 rounded-xl overflow-hidden ring-2 ring-primary/30 transition-transform group-hover:scale-105 shadow-md bg-white flex items-center justify-center">
            <img
              src={edition?.header_logo_url ?? edition?.logo_url ?? crest}
              alt={brand}
              width={44}
              height={44}
              className="w-10 h-10 object-contain"
            />
          </div>
          <div className="leading-none">
            <div className={cn(
              "font-display font-bold text-[18px] tracking-tight transition-colors",
              heroDark ? "text-white" : "text-foreground"
            )}>{brand}</div>
            <div className={cn(
              "text-[8px] tracking-[0.28em] font-semibold uppercase mt-0.5 transition-colors",
              heroDark ? "text-white/70" : "text-primary/70"
            )}>{tag}</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-0.5" aria-label="Main">
          {NAV.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              end={"end" in l ? (l as any).end : undefined}
              className={heroDark ? "text-white/80 hover:text-white hover:bg-white/10" : ""}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop right */}
        <div className="hidden lg:flex items-center gap-2">
          <ThemeToggle />

          {loggedIn ? (
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setProfileOpen(v => !v)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 transition-all",
                  heroDark
                    ? "bg-white/10 border border-white/20 hover:bg-white/20"
                    : "glass hover:border-primary/40"
                )}
                aria-haspopup="true"
                aria-expanded={profileOpen}
              >
                {/* Avatar circle — show photo if available */}
                <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {avatarUrl
                    ? <img src={avatarUrl} alt={avatarLetters} className="w-full h-full object-cover" />
                    : avatarLetters
                  }
                </div>
                <span className={cn(
                  "text-sm font-semibold max-w-[140px] truncate",
                  heroDark ? "text-white" : "text-foreground"
                )}>
                  {displayName.includes("@") ? displayName.split("@")[0] : displayName.split(" ")[0]}
                </span>
                <ChevronDown className={cn(
                  "w-3.5 h-3.5 transition-transform",
                  profileOpen && "rotate-180",
                  heroDark ? "text-white/70" : "text-muted-foreground"
                )} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 glass-strong rounded-2xl py-1.5 shadow-elegant animate-fade-in border border-border/60 z-50">
                  <div className="px-4 py-3 border-b border-border/50">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-primary text-white flex items-center justify-center text-sm font-bold mx-auto mb-2">
                      {avatarUrl
                        ? <img src={avatarUrl} alt={avatarLetters} className="w-full h-full object-cover" />
                        : avatarLetters
                      }
                    </div>
                    <p className="text-xs font-semibold text-center truncate">{displayName}</p>
                    <p className="text-[10px] text-muted-foreground text-center mt-0.5">
                      {isSecretariat ? "Secretariat" : "Delegate"}
                    </p>
                  </div>
                  <div className="p-1.5 space-y-0.5">
                    <Link to={profileHref} onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm hover:bg-primary/8 hover:text-primary transition-colors w-full">
                      {isSecretariat ? <><ShieldCheck className="w-4 h-4" /> Admin Portal</> : <><User className="w-4 h-4" /> My Profile</>}
                    </Link>
                    {isDelegate && (
                      <Link to="/delegate" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm hover:bg-primary/8 hover:text-primary transition-colors w-full">
                        <LayoutDashboard className="w-4 h-4" /> My Portfolio
                      </Link>
                    )}
                    <div className="h-px bg-border/50 my-1" />
                    <button onClick={handleLogout}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm hover:bg-destructive/8 hover:text-destructive transition-colors w-full text-left">
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login"
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                  heroDark
                    ? "text-white/80 hover:text-white hover:bg-white/10"
                    : "text-foreground/70 hover:text-foreground hover:bg-secondary/60"
                )}>
                Login
              </Link>
              <Link to="/register"
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-primary text-white shadow-sm hover:opacity-90 transition-all">
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile row */}
        <div className="flex lg:hidden items-center gap-1.5">
          <ThemeToggle />
          {loggedIn && (
            <Link to={profileHref}
              className="w-8 h-8 rounded-full overflow-hidden bg-gradient-primary text-white flex items-center justify-center text-xs font-bold">
              {avatarUrl
                ? <img src={avatarUrl} alt={avatarLetters} className="w-full h-full object-cover" />
                : avatarLetters
              }
            </Link>
          )}
          <button
            onClick={() => setMenuOpen(v => !v)}
            className={cn(
              "p-2 rounded-xl transition-colors",
              heroDark ? "text-white hover:bg-white/10" : "hover:bg-secondary/60"
            )}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div id="mobile-nav" className="lg:hidden mt-2 mx-4 glass-strong rounded-2xl p-3 animate-slide-up border border-border/50">
          <nav className="flex flex-col gap-0.5" aria-label="Mobile">
            {NAV.map(l => (
              <NavLink key={l.to} to={l.to} end={"end" in l ? (l as any).end : undefined}
                className="w-full text-left px-4 py-2.5"
                onClick={() => setMenuOpen(false)}>{l.label}</NavLink>
            ))}
          </nav>
          <div className="divider my-2.5" />
          {loggedIn ? (
            <div className="flex flex-col gap-1 px-1">
              <Link to={profileHref} onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-secondary/60 transition-colors">
                <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-primary text-white flex items-center justify-center text-[10px] font-bold">
                  {avatarUrl ? <img src={avatarUrl} alt={avatarLetters} className="w-full h-full object-cover" /> : avatarLetters}
                </div>
                {isSecretariat ? "Admin Portal" : "My Profile"}
              </Link>
              <button onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-destructive hover:bg-destructive/8 transition-colors w-full text-left">
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          ) : (
            <div className="flex gap-2 px-1">
              <Link to="/login" onClick={() => setMenuOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-border text-center hover:bg-secondary transition-colors">Login</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-primary text-white text-center shadow-sm">Register</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
