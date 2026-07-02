import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import { getTeamInviteForEmail } from "@/lib/munApi";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Gavel, Sparkles, ArrowRight, Mail, Loader2 } from "lucide-react";
import RegisterDelegate from "@/components/register/RegisterDelegate";
import RegisterEB from "@/components/register/RegisterEB";
import RegisterOC from "@/components/register/RegisterOC";

type Track = "delegate" | "eb" | "oc" | null;

const Register = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { edition, loading } = useActiveEdition();
  const [track, setTrack] = useState<Track>((params.get("as") as Track) ?? null);
  const [emailCheck, setEmailCheck] = useState("");
  const [checkingEmail, setCheckingEmail] = useState(false);

  useEffect(() => {
    const as = params.get("as");
    if (as === "delegate" || as === "eb" || as === "oc") setTrack(as);
  }, [params]);

  const checkInvite = async () => {
    if (!edition || !/\S+@\S+\.\S+/.test(emailCheck)) return;
    setCheckingEmail(true);
    const invite = await getTeamInviteForEmail(edition.id, emailCheck);
    setCheckingEmail(false);
    if (invite) {
      navigate(`/register?as=delegate&invite=${invite.id}&email=${encodeURIComponent(emailCheck)}`);
    } else {
      setTrack("delegate");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="flex items-center justify-center pt-48">
        <Loader2 className="w-5 h-5 animate-spin text-navy/30" />
      </div>
    </div>
  );

  if (track === "delegate") return <RegisterDelegate />;
  if (track === "eb")       return <RegisterEB />;
  if (track === "oc")       return <RegisterOC />;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Dark header */}
      <div className="page-hero">
        <div className="container max-w-3xl text-center">
          <span className="eyebrow" style={{ color: "rgba(201,151,58,0.85)" }}>Delegate Registration</span>
          <h1 className="font-display font-bold text-white leading-tight" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>
            Take your seat at {edition?.name?.split(" ")[0] ?? "PRUMUN"}
          </h1>
          <p className="text-white/50 text-sm mt-3">
            Already registered?{" "}
            <Link to="/login" className="text-gold hover:text-gold-light font-semibold underline-offset-2 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Track selection */}
      <section className="py-16 bg-white">
        <div className="container max-w-3xl">
          {/* Invite checker */}
          <div className="border border-navy/8 rounded-sm p-5 mb-10 max-w-lg mx-auto shadow-card">
            <Label className="text-[10px] font-bold tracking-widest text-navy/40 uppercase block mb-2">
              Already invited as a teammate?
            </Label>
            <div className="flex gap-2">
              <Input
                type="email"
                value={emailCheck}
                onChange={e => setEmailCheck(e.target.value)}
                placeholder="your.email@example.com"
                className="flex-1 form-input h-9 text-sm"
                style={{ border: "1px solid rgba(11,31,58,0.15)" }}
              />
              <button
                onClick={checkInvite}
                disabled={checkingEmail || !/\S+@\S+\.\S+/.test(emailCheck)}
                className="btn-gold text-xs px-4 disabled:opacity-40 disabled:cursor-not-allowed">
                {checkingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Mail className="w-3.5 h-3.5" /> Check</>}
              </button>
            </div>
          </div>

          {/* Three track cards */}
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                icon: Users, id: "delegate",
                title: "Delegate",
                desc: "Represent a country or portfolio in a committee. Pick two preferences, debate, draft resolutions.",
                cta: "Register as Delegate",
              },
              {
                icon: Gavel, id: "eb",
                title: "Executive Board",
                desc: "Chair, Vice Chair, or Rapporteur. One of each per committee — earn the gavel.",
                cta: "Apply for the Board",
              },
              {
                icon: Sparkles, id: "oc",
                title: "Organising Committee",
                desc: "Run the conference: logistics, hospitality, social media, design. No portfolio needed.",
                cta: "Join the OC",
              },
            ].map(({ icon: Icon, id, title, desc, cta }) => (
              <button
                key={id}
                onClick={() => setTrack(id as Track)}
                className="border border-navy/8 rounded-sm p-6 text-left hover:border-gold/40 hover:shadow-card transition-all group bg-white"
              >
                <div className="w-11 h-11 rounded-sm bg-navy/5 flex items-center justify-center mb-5 group-hover:bg-gold/10 transition-colors">
                  <Icon className="w-5 h-5 text-navy/60 group-hover:text-gold transition-colors" />
                </div>
                <h3 className="font-display font-bold text-navy text-xl mb-2">{title}</h3>
                <p className="text-navy/50 text-xs leading-relaxed mb-5">{desc}</p>
                <span className="text-gold text-xs font-semibold flex items-center gap-1">
                  {cta} <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>
            ))}
          </div>

          <p className="text-center mt-8 text-xs text-navy/40">
            Already registered?{" "}
            <Link to="/login" className="text-navy font-semibold hover:text-gold transition-colors">
              Sign in to your portfolio
            </Link>
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Register;
