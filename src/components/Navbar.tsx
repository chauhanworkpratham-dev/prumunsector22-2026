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

  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const loggedIn   = isDelegate || isSecretariat;
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
      <header className="fixed top-0 inset-x-0 z-50 transition-all duration-200 bg-[#03082e]/95 backdrop-blur-2xl border-b border-white/10 shadow-[0_2px_24px_rgba(3,8,46,0.55)] py-3">
        <div className="container flex items-center justify-between gap-4">

          {/* Brand — always white on dark navbar */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <div className="flex flex-col leading-none">
              <span className="font-display font-black text-[20px] tracking-tight text-white drop-shadow-sm leading-none">
                {brand}
              </span>
              <span className="text-[8px] tracking-[0.22em] font-bold uppercase text-white/55 mt-0.5 whitespace-nowrap">
                Prudence Model United Nations
              </span>
            </div>
          </Link>

          {/* Desktop pill nav — always white on dark */}
          <nav className="hidden lg:flex items-center gap-0.5 bg-white/8 backdrop-blur-md border border-white/15 rounded-full px-2 py-1.5">
            {NAV.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                end={"end" in l ? (l as any).end : undefined}
                className="px-3.5 py-1.5 rounded-full text-sm font-medium text-white/70 hover:text-white hover:bg-white/15 transition-all duration-200"
                activeClassName="text-white bg-white/20 font-semibold"
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
                  className="flex items-center gap-2 rounded-full pr-3 pl-1 py-1 border border-white/20 bg-white/10 hover:bg-white/20 transition-all"
                >
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-primary flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : avatarLetters}
                  </div>
                  <span className="text-sm font-semibold max-w-[120px] truncate text-white">
                    {displayName}
                  </span>
                  <ChevronDown className={cn("w-3.5 h-3.5 text-white/60 transition-transform", profileOpen && "rotate-180")} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 glass-strong rounded-2xl py-1.5 shadow-elegant border border-border/50 z-50 animate-slide-up">
                    <div className="px-4 py-3 border-b border-border/40 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-primary flex items-center justify-center text-sm font-bold text-white shrink-0">
                        {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : avatarLetters}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{displayName}</p>
                        <p className="text-[10px] text-muted-foreground">{isSecretariat ? "Secretariat" : "Delegate"}</p>
                      </div>
                    </div>
                    <div className="p-1.5 space-y-0.5">
                      <Link to={profileHref} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm hover:bg-primary/8 hover:text-primary transition-colors w-full">
                        {isSecretariat ? <><ShieldCheck className="w-4 h-4" /> Admin Portal</> : <><User className="w-4 h-4" /> My Profile</>}
                      </Link>
                      {isDelegate && (
                        <Link to="/delegate" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm hover:bg-primary/8 hover:text-primary transition-colors w-full">
                          <LayoutDashboard className="w-4 h-4" /> My Portfolio
                        </Link>
                      )}
                      <div className="h-px bg-border/50 my-1" />
                      <button onClick={handleLogout} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm hover:bg-destructive/8 hover:text-destructive transition-colors w-full text-left">
                        <LogOut className="w-4 h-4" /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login"
                  className="px-4 py-2 rounded-full text-sm font-semibold text-white/75 hover:text-white hover:bg-white/15 transition-all">
                  Login
                </Link>
                <Link to="/register"
                  className="px-5 py-2 rounded-full text-sm font-bold bg-white text-[#03082e] shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200">
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile right */}
          <div className="flex lg:hidden items-center gap-2">
            {loggedIn && (
              <Link to={profileHref} className="w-8 h-8 rounded-full overflow-hidden bg-gradient-primary flex items-center justify-center text-xs font-bold text-white">
                {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : avatarLetters}
              </Link>
            )}
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="p-2 rounded-full text-white hover:bg-white/15 transition-all"
              aria-label="Toggle menu" aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile full-screen drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex flex-col animate-fade-in">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-white/95 backdrop-blur-xl" onClick={() => setMenuOpen(false)} />
          <div className="relative flex flex-col h-full overflow-y-auto pt-20 pb-8 px-6">
            <nav className="flex flex-col gap-1 mb-6">
              {NAV.map(l => (
                <Link key={l.to} to={l.to}
                  className={cn(
                    "flex items-center px-4 py-3.5 rounded-2xl text-base font-semibold transition-all",
                    location.pathname === l.to
                      ? "bg-primary/8 text-primary"
                      : "text-foreground/70 hover:bg-secondary hover:text-foreground"
                  )}>
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-border/50 pt-4">
              {loggedIn ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 px-4 py-3 glass rounded-2xl mb-2">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-primary flex items-center justify-center text-sm font-bold text-white shrink-0">
                      {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : avatarLetters}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{displayName}</p>
                      <p className="text-xs text-muted-foreground">{isSecretariat ? "Secretariat" : "Delegate"}</p>
                    </div>
                  </div>
                  <Link to={profileHref} className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold hover:bg-secondary transition-colors">
                    {isSecretariat ? <ShieldCheck className="w-4 h-4 text-primary" /> : <User className="w-4 h-4 text-primary" />}
                    {isSecretariat ? "Admin Portal" : "My Profile"}
                  </Link>
                  <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-destructive hover:bg-destructive/8 transition-colors w-full text-left">
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Link to="/login" className="flex-1 py-3 rounded-2xl text-sm font-bold border border-border text-center hover:bg-secondary transition-colors">Login</Link>
                  <Link to="/register" className="flex-1 py-3 rounded-2xl text-sm font-bold bg-gradient-primary text-white text-center">Register</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
