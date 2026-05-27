// Executive Board registration: pick committee + role (chair/VC/rapporteur).
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import {
  getCommittees, getOccupiedEBRoles, uploadIdImage,
  type Committee, type EBRole,
} from "@/lib/munApi";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ArrowRight, ArrowLeft, Check, Lock, Gavel } from "lucide-react";
import { cn } from "@/lib/utils";
import { Stepper, BasicInfoFields, validateBasicInfo, IdUploader } from "./_shared";

const ROLES: { id: EBRole; label: string }[] = [
  { id: "chairperson", label: "Chairperson" },
  { id: "vice_chairperson", label: "Vice Chairperson" },
  { id: "rapporteur", label: "Rapporteur" },
];

const RegisterEB = () => {
  const navigate = useNavigate();
  const { edition } = useActiveEdition();
  const [phase, setPhase] = useState<0 | 1 | 2>(0);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [occRoles, setOccRoles] = useState<Record<string, true>>({});
  const [submitting, setSubmitting] = useState(false);

  const [basic, setBasic] = useState({ fullName: "", email: "", school: "", grade: "", phone: "" });
  const [idFile, setIdFile] = useState<File | null>(null);
  const [committeeId, setCommitteeId] = useState("");
  const [ebRole, setEbRole] = useState<EBRole | "">("");

  useEffect(() => {
    if (!edition) return;
    Promise.all([getCommittees(edition.id), getOccupiedEBRoles(edition.id)]).then(([cs, rs]) => {
      setCommittees(cs); setOccRoles(rs);
    });
  }, [edition]);

  const phase0Valid = validateBasicInfo(basic);
  const phase1Valid = Boolean(idFile);
  const phase2Valid = Boolean(committeeId && ebRole);

  const submit = async () => {
    if (!edition || !idFile || !committeeId || !ebRole) return;
    setSubmitting(true);
    try {
      const idPath = await uploadIdImage(idFile);
      const { data, error } = await supabase.from("registrations").insert({
        edition_id: edition.id,
        committee_id: committeeId,
        full_name: basic.fullName.trim(),
        email: basic.email.trim().toLowerCase(),
        school: basic.school.trim(),
        grade: basic.grade.trim(),
        phone: basic.phone.trim(),
        id_image_path: idPath,
        role: "executive_board",
        eb_role: ebRole,
        payment_verified: false,
      } as any).select().single();
      if (error) throw error;
      toast({ title: "🎉 Application submitted!", description: "The Secretariat will review and confirm shortly." });
      localStorage.setItem("prumun_delegate_email", basic.email.trim().toLowerCase());
      navigate("/delegate", { state: { newId: (data as any).id } });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message ?? "Please try again.", variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-36 pb-24 container max-w-3xl">
        <div className="text-center mb-10">
          <p className="text-xs tracking-[0.3em] text-primary font-bold mb-3 inline-flex items-center gap-2"><Gavel className="w-3 h-3" /> EXECUTIVE BOARD</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold gradient-text-deep mb-3">Apply for the Gavel</h1>
          <p className="text-muted-foreground">Each committee has one Chair, one Vice Chair, one Rapporteur.</p>
        </div>

        <Stepper steps={["Basic Info", "Photo / ID", "Choose Role"]} current={phase} />

        <div className="glass-strong rounded-3xl p-6 md:p-10">
          {phase === 0 && (
            <div className="animate-fade-in space-y-5">
              <h2 className="font-display text-2xl font-bold">Tell us about you</h2>
              <BasicInfoFields values={basic} onChange={setBasic} />
              <div className="flex justify-end pt-4">
                <Button variant="hero" onClick={() => setPhase(1)} disabled={!phase0Valid}>Continue <ArrowRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}

          {phase === 1 && (
            <div className="animate-fade-in space-y-5">
              <h2 className="font-display text-2xl font-bold">Photo / ID</h2>
              <IdUploader idFile={idFile} setIdFile={setIdFile} />
              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setPhase(0)}><ArrowLeft className="w-4 h-4" /> Back</Button>
                <Button variant="hero" onClick={() => setPhase(2)} disabled={!phase1Valid}>Continue <ArrowRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}

          {phase === 2 && (
            <div className="animate-fade-in space-y-5">
              <h2 className="font-display text-2xl font-bold">Pick committee & role</h2>
              <div className="space-y-2">
                <Label>Committee</Label>
                <div className="grid sm:grid-cols-2 gap-2">
                  {committees.map(c => (
                    <button key={c.id} type="button" onClick={() => { setCommitteeId(c.id); setEbRole(""); }}
                      className={cn("p-4 rounded-2xl border-2 text-left transition-all",
                        committeeId === c.id ? "border-primary bg-primary/5 shadow-soft" : "border-border hover:border-primary/50")}>
                      <div className="text-xs font-bold text-primary tracking-widest">{c.short_name}</div>
                      <div className="text-sm font-semibold mt-1 leading-tight">{c.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {committeeId && (
                <div className="space-y-2 animate-fade-in">
                  <Label>Role</Label>
                  <div className="grid sm:grid-cols-3 gap-2">
                    {ROLES.map(r => {
                      const taken = occRoles[`${committeeId}::${r.id}`];
                      return (
                        <button type="button" key={r.id} disabled={taken} onClick={() => setEbRole(r.id)}
                          className={cn("p-4 rounded-2xl border-2 text-sm font-semibold transition-all flex items-center justify-between",
                            taken && "opacity-50 cursor-not-allowed bg-destructive/5 border-destructive/20",
                            !taken && ebRole === r.id && "border-primary bg-gradient-primary text-primary-foreground shadow-glow",
                            !taken && ebRole !== r.id && "border-border hover:border-primary/50")}>
                          <span>{r.label}</span>
                          {taken && <Lock className="w-3 h-3" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setPhase(1)}><ArrowLeft className="w-4 h-4" /> Back</Button>
                <Button variant="hero" size="lg" onClick={submit} disabled={!phase2Valid || submitting}>
                  {submitting ? "Submitting…" : <>Submit application <Check className="w-4 h-4" /></>}
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default RegisterEB;
