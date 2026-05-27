// Multi-track registration entry. Choose Delegate / Executive Board / Organising Committee.
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import { getTeamInviteForEmail } from "@/lib/munApi";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Gavel, Sparkles, ArrowRight, Mail } from "lucide-react";
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

  // If user arrives with ?as=, jump straight in.
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

  if (loading) return <div className="min-h-screen bg-background"><Navbar /><div className="pt-36 text-center text-muted-foreground">Loading…</div></div>;

  if (track === "delegate") return <RegisterDelegate />;
  if (track === "eb") return <RegisterEB />;
  if (track === "oc") return <RegisterOC />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-36 pb-24 container max-w-4xl">
        <div className="text-center mb-10">
          <p className="text-xs tracking-[0.3em] text-primary font-bold mb-3">JOIN THE CONFERENCE</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold gradient-text-deep mb-3">How will you participate?</h1>
          <p className="text-muted-foreground">Choose your track to get started.</p>
        </div>

        <div className="glass-strong rounded-3xl p-5 mb-8 max-w-xl mx-auto">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">Already invited as a teammate?</Label>
          <div className="flex gap-2 mt-2">
            <Input type="email" value={emailCheck} onChange={e => setEmailCheck(e.target.value)} placeholder="your.email@example.com" />
            <Button variant="hero" onClick={checkInvite} disabled={checkingEmail || !/\S+@\S+\.\S+/.test(emailCheck)}>
              <Mail className="w-4 h-4" /> {checkingEmail ? "Checking…" : "Check invite"}
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <TrackCard
            icon={Users}
            title="Delegate"
            description="Represent a country / portfolio in a committee. Pick two preferences, debate, draft resolutions."
            cta="Register as Delegate"
            onClick={() => setTrack("delegate")}
          />
          <TrackCard
            icon={Gavel}
            title="Executive Board"
            description="Chair / Vice Chair / Rapporteur. One of each per committee — earn the gavel."
            cta="Apply for the Board"
            onClick={() => setTrack("eb")}
          />
          <TrackCard
            icon={Sparkles}
            title="Organising Committee"
            description="Run the conference: logistics, hospitality, social media, design. No portfolio needed."
            cta="Join the OC"
            onClick={() => setTrack("oc")}
          />
        </div>

        <div className="text-center mt-10 text-sm text-muted-foreground">
          Already registered? <Link to="/login" className="text-primary font-semibold hover:underline">Sign in to your portfolio</Link>
        </div>
      </section>
      <Footer />
    </div>
  );
};

const TrackCard = ({ icon: Icon, title, description, cta, onClick }: {
  icon: any; title: string; description: string; cta: string; onClick: () => void;
}) => (
  <button onClick={onClick} className="glass-strong rounded-3xl p-7 text-left hover-lift group transition-all">
    <div className="w-14 h-14 rounded-2xl bg-gradient-primary text-primary-foreground flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
      <Icon className="w-7 h-7" />
    </div>
    <h3 className="font-display text-2xl font-bold mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground mb-5">{description}</p>
    <span className="text-primary font-semibold text-sm flex items-center gap-1">{cta} <ArrowRight className="w-4 h-4" /></span>
  </button>
);

export default Register;
