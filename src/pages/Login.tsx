import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { toast } from "@/hooks/use-toast";
import { Users, Gavel, Sparkles, ShieldAlert, ArrowRight, Loader2, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import { getRegistrationByEmail } from "@/lib/munApi";

type Track = "delegate" | "eb" | "oc";

const TRACKS: { id: Track; label: string; Icon: React.ElementType; tagline: string }[] = [
  { id: "delegate", label: "Delegate",            Icon: Users,    tagline: "Your portfolio · QR ticket"  },
  { id: "eb",       label: "Executive Board",      Icon: Gavel,    tagline: "Chair / VC / Rapporteur"     },
  { id: "oc",       label: "Organising Committee", Icon: Sparkles, tagline: "OC schedule & tools"         },
];

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { edition } = useActiveEdition();

  const defaultTrack = (searchParams.get("as") as Track | null) ?? "delegate";
  const [track, setTrack] = useState<Track>(
    TRACKS.some(t => t.id === defaultTrack) ? defaultTrack : "delegate",
  );
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [fieldError, setFieldError] = useState("");

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError("");
    if (!validateEmail(email)) { setFieldError("Enter a valid email address."); return; }
    if (!edition) { toast({ title: "Conference not loaded yet — try again.", variant: "destructive" }); return; }

    setBusy(true);
    try {
      const reg = await getRegistrationByEmail(edition.id, email.trim().toLowerCase());
      if (!reg) { setFieldError("No registration found. Check your email or register first."); return; }
      localStorage.setItem("prumun_delegate_email", email.trim().toLowerCase());
      navigate("/delegate");
    } catch {
      toast({ title: "Something went wrong. Please try again.", variant: "destructive" });
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Dark header */}
      <div className="page-hero text-center">
        <div className="container max-w-lg">
          <span className="eyebrow" style={{ color: "rgba(201,151,58,0.85)" }}>Delegate Sign In</span>
          <h1 className="font-display font-bold text-white leading-tight" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>
            Welcome back
          </h1>
          <p className="text-white/50 text-sm mt-3">
            New here?{" "}
            <Link to="/register" className="text-gold hover:text-gold-light font-semibold underline-offset-2 hover:underline">Register</Link>
          </p>
        </div>
      </div>

      <section className="py-16 bg-white">
        <div className="container max-w-lg">
          {/* Track selector */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {TRACKS.map(({ id, label, Icon, tagline }) => (
              <button key={id} type="button" onClick={() => setTrack(id)}
                className={cn(
                  "rounded-sm p-4 text-left transition-all border",
                  track === id
                    ? "border-navy bg-navy/3 shadow-sm"
                    : "border-navy/10 hover:border-navy/25 bg-white"
                )}>
                <Icon className={cn("w-4 h-4 mb-2", track === id ? "text-gold" : "text-navy/35")} />
                <div className={cn("font-semibold text-xs leading-tight", track === id ? "text-navy" : "text-navy/60")}>{label}</div>
                <div className="text-[9px] text-navy/35 mt-0.5 leading-snug">{tagline}</div>
              </button>
            ))}
          </div>

          {/* Form card */}
          <form onSubmit={handleSubmit} noValidate
            className="border border-navy/8 rounded-sm p-7 shadow-card bg-white mb-5">
            <div className="space-y-1.5 mb-5">
              <label htmlFor="email" className="text-xs font-semibold text-navy/55 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Registered email
              </label>
              <input
                id="email" type="email" autoComplete="email" autoFocus
                value={email}
                onChange={e => { setEmail(e.target.value); setFieldError(""); }}
                placeholder="you@example.com"
                className={cn(
                  "form-input",
                  fieldError && "border-red-400 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]"
                )}
              />
              {fieldError && (
                <p className="text-xs text-red-500 font-medium pt-0.5">{fieldError}</p>
              )}
            </div>

            <button type="submit" disabled={busy}
              className="btn-gold w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed">
              {busy
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking…</>
                : <><ArrowRight className="w-4 h-4" /> Continue to Portal</>
              }
            </button>

            <p className="text-[10px] text-center text-navy/35 mt-4">
              Use the same email you registered with.
            </p>
          </form>

          {/* Register link */}
          <p className="text-center text-xs text-navy/40 mb-5">
            New here?{" "}
            <Link to={`/register?as=${track}`} className="text-navy font-semibold hover:text-gold transition-colors">
              Register as {TRACKS.find(t => t.id === track)?.label}
            </Link>
          </p>

          {/* Secretariat link */}
          <Link to="/secretariat-login"
            className="flex items-center gap-3 border border-navy/10 rounded-sm p-4 hover:border-navy/25 hover:shadow-card transition-all group bg-white">
            <div className="w-9 h-9 rounded-sm bg-navy flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-navy text-sm">Secretariat Console</div>
              <div className="text-[11px] text-navy/40">Admin access · Core team only</div>
            </div>
            <ArrowRight className="w-4 h-4 text-navy/25 group-hover:text-navy/60 transition-colors" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Login;
