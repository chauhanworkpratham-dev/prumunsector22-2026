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
  { to: "/about",        label: "About"              },
  { to: "/schedule",     label: "Schedule"           },
  { to: "/matrix",       label: "Allotments"         },
  { to: "/secretariats", label: "Updates"            },
  { to: "/gallery",      label: "Gallery"            },
  { to: "/venue",        label: "Venue"              },
] as const;

export const Navbar = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { edition } = useActiveEdition();
  const { delegateEmail, secUser, isDelegate, isSecretariat, logoutDelegate, logoutSec } = useSession();

  const [scrolled,     setScrolled]     = useState(false);
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [profileOpen,  setProfileOpen]  = useState(false);
  const [delegateName, setDelegateName] = useState<string | null>(null);
  const [avatarUrl,    setAvatarUrl]    = useState<string | null>(null);

  const profileRef = useRef<HTMLDivElement>(null);
  const brand      = edition?.name?.split(" ")[0] ?? "PRUMUN";
  const sub        = edition?.name?.split(" ").slice(1).join(" ") ?? "";

  /* load delegate name */
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
    const fn = () => setScrolled(window.scrollY > 8);
    fn(); window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
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

  const loggedIn      = isDelegate || isSecretariat;
  const displayName   = isSecretariat
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
      {/* ── Fixed white navbar ── */}
      <header className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "navbar-light"
          : "bg-transparent border-b border-white/10"
      )}>
        <div className="container flex items-center justify-between h-14 gap-4">

          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="flex flex-col leading-none">
              <span className={cn(
                "font-display font-bold text-[17px] leading-none tracking-tight transition-colors",
                scrolled ? "text-navy" : "text-white"
              )}>
                {brand}
              </span>
              {sub && (
                <span className={cn(
                  "text-[8px] tracking-[0.22em] font-semibold uppercase mt-0.5 transition-colors",
                  scrolled ? "text-navy/40" : "text-white/40"
                )}>
                  {sub}
                </span>
              )}
            </div>
          </Link>

          {/* Desktop nav — center */}
          <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
            {NAV.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                end={"end" in l ? (l as any).end : undefined}
                className={cn(
                  "px-3.5 py-1.5 rounded-md text-sm font-medium transition-all duration-150",
                  scrolled ? "text-navy/65 hover:text-navy hover:bg-navy/5" : "text-white/65 hover:text-white hover:bg-white/8"
                )}
                activeClassName={scrolled
                  ? "text-navy font-semibold bg-navy/8"
                  : "text-white font-semibold bg-white/12"
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop right */}
          <div className="hidden lg:flex items-center gap-2">
            {loggedIn ? (
              <div ref={profileRef} className="relative">
                <button
                  onClick={() => setProfileOpen(v => !v)}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all border",
                    scrolled
                      ? "border-navy/12 text-navy hover:bg-navy/5"
                      : "border-white/20 text-white hover:bg-white/8"
                  )}
                >
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-gold flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : avatarLetters}
                  </div>
                  <span className="max-w-[110px] truncate">{displayName}</span>
                  <ChevronDown className={cn("w-3.5 h-3.5 opacity-50 transition-transform", profileOpen && "rotate-180")} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-lg shadow-elegant border border-navy/8 py-1.5 z-50 animate-fade-in">
                    <div className="px-4 py-3 border-b border-navy/6">
                      <p className="text-xs font-semibold text-navy truncate">{displayName}</p>
                      <p className="text-[10px] text-navy/45">{isSecretariat ? "Secretariat" : "Delegate"}</p>
                    </div>
                    <div className="p-1">
                      <Link to={profileHref} className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-navy hover:bg-navy/5 transition-colors w-full">
                        {isSecretariat ? <ShieldCheck className="w-4 h-4 text-gold" /> : <User className="w-4 h-4 text-gold" />}
                        {isSecretariat ? "Admin Portal" : "My Profile"}
                      </Link>
                      {isDelegate && (
                        <Link to="/delegate" className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-navy hover:bg-navy/5 transition-colors w-full">
                          <LayoutDashboard className="w-4 h-4 text-gold" /> My Portfolio
                        </Link>
                      )}
                      <div className="h-px bg-navy/6 my-1" />
                      <button onClick={handleLogout} className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left">
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
                    "px-3.5 py-1.5 rounded-md text-sm font-medium transition-all",
                    scrolled ? "text-navy hover:bg-navy/5" : "text-white/80 hover:text-white hover:bg-white/8"
                  )}>
                  Sign in
                </Link>
                <Link to="/register"
                  className="px-4 py-1.5 rounded-md text-sm font-semibold bg-navy text-white hover:bg-navy-mid transition-all">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(v => !v)}
            className={cn("lg:hidden p-2 rounded-md transition-all", scrolled ? "text-navy" : "text-white")}
            aria-label="Menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-navy/30 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="absolute top-14 inset-x-0 bg-white border-b border-navy/8 shadow-elegant animate-fade-in">
            <nav className="container py-3 space-y-0.5">
              {NAV.map(l => (
                <Link key={l.to} to={l.to}
                  className={cn(
                    "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all",
                    location.pathname === l.to
                      ? "bg-navy/8 text-navy font-semibold"
                      : "text-navy/65 hover:text-navy hover:bg-navy/5"
                  )}>
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="container pb-5 pt-2 border-t border-navy/8">
              {loggedIn ? (
                <div className="space-y-1">
                  <Link to={profileHref} className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-navy hover:bg-navy/5">
                    {isSecretariat ? <ShieldCheck className="w-4 h-4 text-gold" /> : <User className="w-4 h-4 text-gold" />}
                    {displayName}
                  </Link>
                  <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-red-600 hover:bg-red-50 w-full text-left">
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 pt-2">
                  <Link to="/login" className="flex-1 py-2.5 text-center text-sm font-semibold rounded-md border border-navy/15 text-navy hover:bg-navy/5">
                    Sign in
                  </Link>
                  <Link to="/register" className="flex-1 py-2.5 text-center text-sm font-semibold rounded-md bg-navy text-white">
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
