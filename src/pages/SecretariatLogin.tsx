import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, Lock, UserPlus, KeyRound, User, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PendingApprovalBanner } from "@/components/secretariat/PendingApprovalBanner";

type Mode = "signin" | "signup";

/* helper kept from original */
async function upsertSecretariatProfile(userId: string, fullName: string) {
  await supabase.from("secretariat_profiles" as any).upsert({ user_id: userId, full_name: fullName });
}

const SecretariatLogin = () => {
  const navigate = useNavigate();

  const [mode,           setMode]           = useState<Mode>("signin");
  const [email,          setEmail]          = useState("");
  const [pass,           setPass]           = useState("");
  const [fullName,       setFullName]       = useState("");
  const [busy,           setBusy]           = useState(false);
  const [pendingEmail,   setPendingEmail]   = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    let mounted = true;

    const evaluate = async (uid: string | null, userEmail: string | null) => {
      if (!uid) { if (mounted) setSessionChecked(true); return; }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Enter a valid email address.", variant: "destructive" }); return;
    }
    if (pass.length < 8) {
      toast({ title: "Password must be at least 8 characters.", variant: "destructive" }); return;
    }
    if (mode === "signup" && fullName.trim().length < 2) {
      toast({ title: "Full name is required.", variant: "destructive" }); return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email, password: pass,
          options: {
            emailRedirectTo: `${window.location.origin}/secretariat-login`,
            data: { full_name: fullName.trim() },
          },
        });
        if (error) throw error;
        if (!data.user) {
          toast({ title: "Check your inbox to confirm your email, then sign in." });
          setMode("signin"); return;
        }
        await upsertSecretariatProfile(data.user.id, fullName.trim()).catch(() => {});
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
      }
    } catch (err: any) {
      toast({ title: "Authentication failed", description: err.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  /* ── Session check loading ── */
  if (!sessionChecked) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-navy/30" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="pt-32 pb-24 container max-w-md">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-5 rounded-sm bg-navy flex items-center justify-center shadow-elegant">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-navy mb-1">Secretariat Console</h1>
          <p className="text-navy/45 text-sm">Restricted · Core team only</p>
        </div>

        {pendingEmail ? (
          <PendingApprovalBanner email={pendingEmail} />
        ) : (
          <>
            {/* Mode toggle — exact style from screenshot */}
            <div className="flex border border-navy/12 rounded-sm mb-6 overflow-hidden">
              {(["signin", "signup"] as Mode[]).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className={cn(
                    "flex-1 py-2.5 text-sm font-semibold transition-all",
                    mode === m
                      ? "bg-navy text-white"
                      : "bg-white text-navy/55 hover:bg-navy/5"
                  )}>
                  {m === "signin" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>

            {/* Form card */}
            <form onSubmit={handleSubmit} noValidate
              className="border border-navy/8 rounded-sm bg-white shadow-card p-7 space-y-5">

              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-xs font-semibold text-navy/55 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Full name
                  </Label>
                  <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder="Jane Doe" autoComplete="name"
                    className="border-navy/15 focus:border-gold focus:ring-gold/20" />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="sec-email" className="text-xs font-semibold text-navy/55">Email</Label>
                <Input id="sec-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@school.edu" autoComplete="email"
                  className="border-navy/15 focus:border-gold focus:ring-gold/20" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sec-pass" className="text-xs font-semibold text-navy/55 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" /> Password
                </Label>
                <Input id="sec-pass" type="password" value={pass} onChange={e => setPass(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  className="border-navy/15 focus:border-gold focus:ring-gold/20" />
              </div>

              {mode === "signup" && (
                <div className="text-[11px] text-navy/45 leading-snug rounded-sm bg-navy/4 border border-navy/8 px-3 py-2.5">
                  The first account created automatically becomes the{" "}
                  <span className="font-semibold text-navy">Owner</span> with full access. All later accounts wait for the Owner to grant per-tab access in the Members tab.
                </div>
              )}

              <button type="submit" disabled={busy}
                className="btn-gold w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                {busy ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Please wait…</>
                ) : mode === "signin" ? (
                  <><Lock className="w-4 h-4" /> Sign In</>
                ) : (
                  <><UserPlus className="w-4 h-4" /> Create Account</>
                )}
              </button>
            </form>

            {/* Back link */}
            <div className="mt-6 text-center">
              <a href="/login"
                className="inline-flex items-center gap-1.5 text-sm text-navy/40 hover:text-navy transition-colors">
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
