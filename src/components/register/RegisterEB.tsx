// Executive Board registration — all logic preserved, light design system
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Label } from "@/components/ui/label";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import { getCommittees, getOccupiedEBRoles, uploadIdImage, type Committee, type EBRole } from "@/lib/munApi";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ArrowRight, ArrowLeft, Check, Lock, Gavel } from "lucide-react";
import { cn } from "@/lib/utils";
import { Stepper, BasicInfoFields, validateBasicInfo, IdUploader } from "./_shared";

const ROLES: { id: EBRole; label: string }[] = [
  { id: "chairperson",      label: "Chairperson"       },
  { id: "vice_chairperson", label: "Vice Chairperson"  },
  { id: "rapporteur",       label: "Rapporteur"         },
];

const RegisterEB = () => {
  const navigate   = useNavigate();
  const { edition } = useActiveEdition();
  const [phase, setPhase] = useState<0 | 1 | 2>(0);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [occRoles,   setOccRoles]   = useState<Record<string, true>>({});
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
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="page-hero text-center">
        <div className="container max-w-3xl">
          <span className="eyebrow" style={{ color: "rgba(201,151,58,0.85)" }}>
            <span className="inline-flex items-center gap-1.5"><Gavel className="w-3 h-3" /> Executive Board</span>
          </span>
          <h1 className="font-display font-bold text-white leading-tight" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>
            Apply for the Gavel
          </h1>
          <p className="text-white/50 text-sm mt-3">
            Each committee has one Chair, one Vice Chair, one Rapporteur.
          </p>
        </div>
      </div>

      <section className="py-12 bg-white">
        <div className="container max-w-3xl">
          <Stepper steps={["Basic Info", "Photo / ID", "Choose Role"]} current={phase} />

          <div className="border border-navy/8 rounded-sm bg-white shadow-card p-6 md:p-8">

            {phase === 0 && (
              <div className="animate-fade-in space-y-5">
                <div className="mb-6">
                  <h2 className="font-display text-2xl font-bold text-navy">Tell us about you</h2>
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
                </div>
                <IdUploader idFile={idFile} setIdFile={setIdFile} />
                <div className="flex justify-between pt-4 border-t border-navy/6">
                  <button onClick={() => setPhase(0)} className="btn-ghost">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button onClick={() => setPhase(2)} disabled={!phase1Valid}
                    className="btn-gold disabled:opacity-40 disabled:cursor-not-allowed">
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {phase === 2 && (
              <div className="animate-fade-in space-y-5">
                <div className="mb-2">
                  <h2 className="font-display text-2xl font-bold text-navy">Pick committee & role</h2>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-navy/60">Committee</Label>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {committees.map(c => (
                      <button key={c.id} type="button"
                        onClick={() => { setCommitteeId(c.id); setEbRole(""); }}
                        className={cn(
                          "p-4 rounded-sm border-2 text-left transition-all",
                          committeeId === c.id
                            ? "border-navy bg-navy/4"
                            : "border-navy/10 hover:border-navy/30 bg-white"
                        )}>
                        <div className="text-[9px] font-bold text-gold tracking-widest uppercase">{c.short_name}</div>
                        <div className="text-sm font-semibold text-navy mt-1 leading-tight">{c.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {committeeId && (
                  <div className="space-y-2 animate-fade-in">
                    <Label className="text-xs font-semibold text-navy/60">Role</Label>
                    <div className="grid sm:grid-cols-3 gap-2">
                      {ROLES.map(r => {
                        const taken = occRoles[`${committeeId}::${r.id}`];
                        return (
                          <button type="button" key={r.id} disabled={taken}
                            onClick={() => setEbRole(r.id)}
                            className={cn(
                              "p-4 rounded-sm border-2 text-sm font-semibold transition-all flex items-center justify-between",
                              taken && "opacity-45 cursor-not-allowed bg-red-50/50 border-red-100 text-red-400",
                              !taken && ebRole === r.id && "border-navy bg-navy text-white",
                              !taken && ebRole !== r.id && "border-navy/10 hover:border-navy/30 text-navy bg-white"
                            )}>
                            <span>{r.label}</span>
                            {taken && <Lock className="w-3.5 h-3.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t border-navy/6">
                  <button onClick={() => setPhase(1)} className="btn-ghost">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button onClick={submit} disabled={!phase2Valid || submitting}
                    className="btn-gold disabled:opacity-40 disabled:cursor-not-allowed">
                    {submitting ? "Submitting…" : <><Check className="w-4 h-4" /> Submit application</>}
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

export default RegisterEB;
