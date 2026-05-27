import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, Lock, UserPlus, KeyRound, User, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PendingApprovalBanner } from "@/components/secretariat/PendingApprovalBanner";
import { upsertSecretariatProfile } from "@/lib/munApi";

type Mode = "signin" | "signup";

const SecretariatLogin = () => {
  const navigate = useNavigate();

  const [mode, setMode]           = useState<Mode>("signin");
  const [email, setEmail]         = useState("");
  const [pass, setPass]           = useState("");
  const [fullName, setFullName]   = useState("");
  const [busy, setBusy]           = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  // ── Check for existing session on mount ──────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const evaluate = async (uid: string | null, userEmail: string | null) => {
      if (!uid) {
        if (mounted) setSessionChecked(true);
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid)
        .eq("role", "secretariat")
        .maybeSingle();
      if (!mounted) return;
      if (data) {
        navigate("/secretariat", { replace: true });
      } else {
        setPendingEmail(userEmail);
        setSessionChecked(true);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      evaluate(session?.user?.id ?? null, session?.user?.email ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      evaluate(session?.user?.id ?? null, session?.user?.email ?? null);
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [navigate]);

  // ── Form submission ───────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Enter a valid email address.", variant: "destructive" });
      return;
    }
    if (pass.length < 8) {
      toast({ title: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }
    if (mode === "signup" && fullName.trim().length < 2) {
      toast({ title: "Full name is required.", variant: "destructive" });
      return;
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: pass,
          options: {
            emailRedirectTo: `${window.location.origin}/secretariat-login`,
            data: { full_name: fullName.trim() },
          },
        });
        if (error) throw error;
        if (!data.user) {
          toast({ title: "Check your inbox to confirm your email, then sign in." });
          setMode("signin");
          return;
        }

        await upsertSecretariatProfile(data.user.id, fullName.trim()).catch(() => {});

        // First-ever secretariat becomes the OWNER.
        const { count } = await supabase
          .from("user_roles")
          .select("id", { count: "exact", head: true })
          .eq("role", "secretariat");

        if ((count ?? 0) === 0) {
          await supabase.from("user_roles").insert({ user_id: data.user.id, role: "secretariat" });
          toast({ title: "You're the OWNER — full access granted." });
          navigate("/secretariat", { replace: true });
        } else {
          toast({ title: "Account created — waiting for the owner to approve you." });
          setPendingEmail(email);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
        // onAuthStateChange above handles routing.
      }
    } catch (err: any) {
      toast({ title: "Authentication failed", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (!sessionChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-36 pb-24 container max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-deep text-primary-foreground flex items-center justify-center shadow-glow">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h1 className="font-display text-3xl font-bold gradient-text-deep mb-2">Secretariat Console</h1>
          <p className="text-muted-foreground text-sm">Restricted · Core team only</p>
        </div>

        {/* Pending approval state */}
        {pendingEmail ? (
          <PendingApprovalBanner email={pendingEmail} />
        ) : (
          <>
            {/* Mode toggle */}
            <div className="glass rounded-2xl p-1 flex mb-5" role="tablist" aria-label="Auth mode">
              {(["signin", "signup"] as Mode[]).map(m => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    mode === m
                      ? "bg-gradient-primary text-primary-foreground shadow-soft"
                      : "hover:bg-secondary text-muted-foreground",
                  )}
                >
                  {m === "signin" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="glass-strong rounded-3xl p-8 space-y-5">
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Full name
                  </Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    autoComplete="name"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="sec-email">Email</Label>
                <Input
                  id="sec-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@school.edu"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sec-pass" className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" /> Password
                </Label>
                <Input
                  id="sec-pass"
                  type="password"
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                />
              </div>

              {mode === "signup" && (
                <p className="text-[11px] text-muted-foreground leading-snug rounded-xl bg-secondary/60 px-3 py-2">
                  The first account created automatically becomes the <span className="font-semibold text-foreground">Owner</span> with full access. All later accounts wait for the Owner to grant per-tab access in the Members tab.
                </p>
              )}

              <Button type="submit" variant="accent" size="lg" className="w-full" disabled={busy}>
                {busy ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Please wait…</>
                ) : mode === "signin" ? (
                  <><Lock className="w-4 h-4" /> Sign In</>
                ) : (
                  <><UserPlus className="w-4 h-4" /> Create Account</>
                )}
              </Button>
            </form>

            {/* Back link */}
            <div className="mt-6 text-center">
              <a
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Back to delegate login
              </a>
            </div>
          </>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default SecretariatLogin;
