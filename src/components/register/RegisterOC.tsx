// Organising Committee registration: just basic info + photo. No committee/portfolio.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import { uploadIdImage } from "@/lib/munApi";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ArrowRight, ArrowLeft, Check, Sparkles } from "lucide-react";
import { Stepper, BasicInfoFields, validateBasicInfo, IdUploader } from "./_shared";

const RegisterOC = () => {
  const navigate = useNavigate();
  const { edition } = useActiveEdition();
  const [phase, setPhase] = useState<0 | 1>(0);
  const [submitting, setSubmitting] = useState(false);

  const [basic, setBasic] = useState({ fullName: "", email: "", school: "", grade: "", phone: "" });
  const [idFile, setIdFile] = useState<File | null>(null);

  const phase0Valid = validateBasicInfo(basic);
  const phase1Valid = Boolean(idFile);

  const submit = async () => {
    if (!edition || !idFile) return;
    setSubmitting(true);
    try {
      const idPath = await uploadIdImage(idFile);
      const { data, error } = await supabase.from("registrations").insert({
        edition_id: edition.id,
        full_name: basic.fullName.trim(),
        email: basic.email.trim().toLowerCase(),
        school: basic.school.trim(),
        grade: basic.grade.trim(),
        phone: basic.phone.trim(),
        id_image_path: idPath,
        role: "organising_committee",
        committee_id: null,
        portfolio: null,
        payment_verified: false,
      } as any).select().single();
      if (error) throw error;
      toast({ title: "🎉 Welcome to the OC!", description: "We'll be in touch with your assignments." });
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
          <p className="text-xs tracking-[0.3em] text-primary font-bold mb-3 inline-flex items-center gap-2"><Sparkles className="w-3 h-3" /> ORGANISING COMMITTEE</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold gradient-text-deep mb-3">Run the Show</h1>
          <p className="text-muted-foreground">Logistics, hospitality, social media, design — pick your poison later.</p>
        </div>

        <Stepper steps={["Basic Info", "Photo / ID"]} current={phase} />

        <div className="glass-strong rounded-3xl p-6 md:p-10">
          {phase === 0 && (
            <div className="animate-fade-in space-y-5">
              <BasicInfoFields values={basic} onChange={setBasic} />
              <div className="flex justify-end pt-4">
                <Button variant="hero" onClick={() => setPhase(1)} disabled={!phase0Valid}>Continue <ArrowRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
          {phase === 1 && (
            <div className="animate-fade-in space-y-5">
              <IdUploader idFile={idFile} setIdFile={setIdFile} />
              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setPhase(0)}><ArrowLeft className="w-4 h-4" /> Back</Button>
                <Button variant="hero" size="lg" onClick={submit} disabled={!phase1Valid || submitting}>
                  {submitting ? "Submitting…" : <>Join the OC <Check className="w-4 h-4" /></>}
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

export default RegisterOC;
