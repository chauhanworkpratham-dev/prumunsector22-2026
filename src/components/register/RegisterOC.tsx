// Organising Committee registration — all logic preserved, light design system
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import { uploadIdImage } from "@/lib/munApi";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ArrowRight, ArrowLeft, Check, Sparkles } from "lucide-react";
import { Stepper, BasicInfoFields, validateBasicInfo, IdUploader } from "./_shared";

const RegisterOC = () => {
  const navigate    = useNavigate();
  const { edition } = useActiveEdition();
  const [phase, setPhase]       = useState<0 | 1>(0);
  const [submitting, setSubmitting] = useState(false);
  const [basic, setBasic]       = useState({ fullName: "", email: "", school: "", grade: "", phone: "" });
  const [idFile, setIdFile]     = useState<File | null>(null);

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
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="page-hero text-center">
        <div className="container max-w-3xl">
          <span className="eyebrow" style={{ color: "rgba(201,151,58,0.85)" }}>
            <span className="inline-flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Organising Committee</span>
          </span>
          <h1 className="font-display font-bold text-white leading-tight" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>
            Run the Show
          </h1>
          <p className="text-white/50 text-sm mt-3">
            Logistics, hospitality, social media, design — pick your domain later.
          </p>
        </div>
      </div>

      <section className="py-12 bg-white">
        <div className="container max-w-3xl">
          <Stepper steps={["Basic Info", "Photo / ID"]} current={phase} />

          <div className="border border-navy/8 rounded-sm bg-white shadow-card p-6 md:p-8">

            {phase === 0 && (
              <div className="animate-fade-in space-y-5">
                <div className="mb-6">
                  <h2 className="font-display text-2xl font-bold text-navy">Tell us about you</h2>
                  <p className="text-navy/45 text-sm mt-1">No committee or portfolio needed — just your details.</p>
                </div>
                <BasicInfoFields values={basic} onChange={setBasic} />
                <div className="flex justify-end pt-4 border-t border-navy/6">
                  <button onClick={() => setPhase(1)} disabled={!phase0Valid}
                    className="btn-gold disabled:opacity-40 disabled:cursor-not-allowed">
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {phase === 1 && (
              <div className="animate-fade-in space-y-5">
                <div className="mb-6">
                  <h2 className="font-display text-2xl font-bold text-navy">Photo / ID</h2>
                  <p className="text-navy/45 text-sm mt-1">Upload a clear passport-size photo or school ID.</p>
                </div>
                <IdUploader idFile={idFile} setIdFile={setIdFile} />
                <div className="flex justify-between pt-4 border-t border-navy/6">
                  <button onClick={() => setPhase(0)} className="btn-ghost">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button onClick={submit} disabled={!phase1Valid || submitting}
                    className="btn-gold disabled:opacity-40 disabled:cursor-not-allowed">
                    {submitting ? "Submitting…" : <><Check className="w-4 h-4" /> Join the OC</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default RegisterOC;
