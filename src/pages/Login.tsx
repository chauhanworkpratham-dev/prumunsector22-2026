import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Mail, Users, Gavel, Sparkles, ShieldAlert, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import { getRegistrationByEmail } from "@/lib/munApi";

type Track = "delegate" | "eb" | "oc";

const TRACKS: { id: Track; label: string; Icon: React.ElementType; tagline: string }[] = [
  { id: "delegate",  label: "Delegate",            Icon: Users,    tagline: "Your portfolio · QR ticket" },
  { id: "eb",        label: "Executive Board",      Icon: Gavel,    tagline: "Chair / VC / Rapporteur" },
  { id: "oc",        label: "Organising Committee", Icon: Sparkles, tagline: "OC schedule & tools" },
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

    if (!validateEmail(email)) {
      setFieldError("Enter a valid email address.");
      return;
    }
    if (!edition) {
      toast({ title: "Conference not loaded yet — try again.", variant: "destructive" });
      return;
    }

    setBusy(true);
    try {
      const reg = await getRegistrationByEmail(edition.id, email.trim().toLowerCase());
      if (!reg) {
        setFieldError("No registration found with this email. Check the address or register first.");
        return;
      }

      // Persist session token — the email is the identifier, kept intentionally
      // simple since the portal is informational (no sensitive writes without
      // server-side auth checks). See MIGRATIONS.md for a Supabase Auth upgrade path.
      localStorage.setItem("prumun_delegate_email", email.trim().toLowerCase());
      navigate("/delegate");
    } catch {
      toast({ title: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-36 pb-24 container max-w-lg">
        <div className="text-center mb-10">
          <p className="text-xs tracking-[0.35em] text-primary font-bold mb-3">DELEGATE PORTAL</p>
          <h1 className="font-display text-4xl font-bold gradient-text-deep mb-2">Welcome Back</h1>
          <p className="text-muted-foreground text-sm">
            Sign in with your registered email to access your portal.
          </p>
        </div>

        {/* Track selector */}
        <fieldset className="mb-6">
          <legend className="sr-only">Select your participation track</legend>
          <div className="grid grid-cols-3 gap-2">
            {TRACKS.map(({ id, label, Icon, tagline }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTrack(id)}
                aria-pressed={track === id}
                className={cn(
                  "rounded-2xl p-4 text-left transition-all border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  track === id
                    ? "border-primary bg-primary/5 shadow-soft"
                    : "border-border glass hover:border-primary/40",
                )}
              >
                <Icon className={cn("w-5 h-5 mb-2", track === id ? "text-primary" : "text-muted-foreground")} />
                <div className="font-bold text-sm leading-tight">{label}</div>
                <div className="text-[10px] text-muted-foreground mt-1 leading-snug">{tagline}</div>
              </button>
            ))}
          </div>
        </fieldset>

        {/* Login form */}
        <form onSubmit={handleSubmit} noValidate className="glass-strong rounded-3xl p-8 space-y-5 mb-6">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Registered email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={e => { setEmail(e.target.value); setFieldError(""); }}
              placeholder="you@example.com"
              aria-describedby={fieldError ? "email-error" : undefined}
              aria-invalid={!!fieldError}
              className={cn(fieldError && "border-destructive focus-visible:ring-destructive")}
            />
            {fieldError && (
              <p id="email-error" role="alert" className="text-xs text-destructive font-medium pt-0.5">
                {fieldError}
              </p>
            )}
          </div>

          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>
            {busy
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking…</>
              : <><ArrowRight className="w-4 h-4" /> Continue to Portal</>
            }
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Use the same email you registered with.
          </p>
        </form>

        {/* Register link */}
        <p className="text-center text-sm text-muted-foreground mb-4">
          New here?{" "}
          <Link to={`/register?as=${track}`} className="text-primary font-semibold hover:underline underline-offset-2">
            Register as {TRACKS.find(t => t.id === track)?.label}
          </Link>
        </p>

        {/* Secretariat link */}
        <Link
          to="/secretariat-login"
          className="glass rounded-2xl p-4 flex items-center gap-3 hover-lift block group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-deep text-primary-foreground flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm">Secretariat Console</div>
            <div className="text-xs text-muted-foreground">Admin access · Core team only</div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>
      </section>

      <Footer />
    </div>
  );
};

export default Login;
