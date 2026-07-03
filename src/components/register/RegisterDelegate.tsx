// Delegate registration: 2 preferences for solo committees, OR team-mode for 4-in-1 committees.
// Also handles "claiming" a pre-issued team invite.
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import {
  getCommittees, getOccupiedPortfolios, createRegistration, uploadIdImage,
  getTeamInviteForEmail, createTeamInvites, markTeamInviteClaimed,
  type Committee, type TeamInvite,
} from "@/lib/munApi";
import { toast } from "@/hooks/use-toast";
import { ArrowRight, ArrowLeft, Check, Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Stepper, BasicInfoFields, validateBasicInfo, IdUploader } from "./_shared";

type Phase = 0 | 1 | 2;
type TeammateRow = { name: string; email: string; grade: string; portfolio: string };

const RegisterDelegate = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { edition } = useActiveEdition();
  const [phase, setPhase] = useState<Phase>(0);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [locks, setLocks] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const inviteIdParam = params.get("invite");
  const emailParam = params.get("email") ?? "";
  const [invite, setInvite] = useState<TeamInvite | null>(null);

  const [basic, setBasic] = useState({ fullName: "", email: emailParam, school: "", grade: "", phone: "" });
  const [idFile, setIdFile] = useState<File | null>(null);

  const [pref1, setPref1] = useState({ committee_id: "", portfolio: "" });
  const [pref2, setPref2] = useState({ committee_id: "", portfolio: "" });

  const [teamCommitteeId, setTeamCommitteeId] = useState("");
  const [teamLeadPortfolio, setTeamLeadPortfolio] = useState("");
  const [teammates, setTeammates] = useState<TeammateRow[]>([]);

  useEffect(() => {
    if (!edition) return;
    Promise.all([getCommittees(edition.id), getOccupiedPortfolios(edition.id)]).then(([cs, ls]) => {
      setCommittees(cs);
      setLocks(ls);
    });
  }, [edition]);

  useEffect(() => {
    if (!edition || !inviteIdParam || !emailParam) return;
    getTeamInviteForEmail(edition.id, emailParam).then(inv => {
      if (inv && inv.id === inviteIdParam) setInvite(inv);
    });
  }, [edition, inviteIdParam, emailParam]);

  const teamCommittee = committees.find(c => c.id === teamCommitteeId);
  const inviteCommittee = committees.find(c => c.id === invite?.committee_id);

  const phase0Valid = validateBasicInfo(basic);
  const phase1Valid = Boolean(idFile);

  const phase2Valid = (() => {
    if (invite) return true;
    if (teamCommitteeId) {
      const need = (teamCommittee?.team_size ?? 4) - 1;
      const allFilled = teammates.length === need
        && teammates.every(t => t.name.trim() && /\S+@\S+\.\S+/.test(t.email))
        && Boolean(teamLeadPortfolio);
      return Boolean(allFilled);
    }
    return Boolean(pref1.committee_id && pref1.portfolio);
  })();

  useEffect(() => {
    if (!teamCommittee?.is_team_committee) { setTeammates([]); return; }
    const need = teamCommittee.team_size - 1;
    setTeammates(prev => {
      const copy = [...prev];
      while (copy.length < need) copy.push({ name: "", email: "", grade: "", portfolio: "" });
      return copy.slice(0, need);
    });
  }, [teamCommittee?.id, teamCommittee?.team_size]);

  const submit = async () => {
    if (!edition || !idFile) return;
    setSubmitting(true);
    try {
      const idPath = await uploadIdImage(idFile);

      if (invite) {
        const { data, error } = await createRegistration({
          edition_id: edition.id,
          committee_id: invite.committee_id,
          portfolio: invite.assigned_portfolio,
          full_name: basic.fullName.trim(),
          email: basic.email.trim().toLowerCase(),
          school: basic.school.trim(),
          grade: basic.grade.trim(),
          phone: basic.phone.trim(),
          id_image_path: idPath,
          team_lead_id: invite.team_lead_registration_id,
        } as any);
        if (error) throw error;
        await markTeamInviteClaimed(invite.id, (data as any).id);
        toast({ title: "🎉 Seat claimed!", description: `Welcome to ${inviteCommittee?.short_name} as ${invite.assigned_portfolio}.` });
        localStorage.setItem("prumun_delegate_email", basic.email.trim().toLowerCase());
        navigate("/delegate", { state: { newId: (data as any).id } });
        return;
      }

      if (teamCommitteeId && teamCommittee?.is_team_committee) {
        const occ = await getOccupiedPortfolios(edition.id);
        if (occ[`${teamCommitteeId}::${teamLeadPortfolio}`]) {
          toast({ title: `Portfolio "${teamLeadPortfolio}" was just taken`, description: "Pick another for your team.", variant: "destructive" });
          setSubmitting(false); return;
        }
        const { data: leadData, error: leadErr } = await createRegistration({
          edition_id: edition.id,
          committee_id: teamCommitteeId,
          portfolio: teamLeadPortfolio,
          full_name: basic.fullName.trim(),
          email: basic.email.trim().toLowerCase(),
          school: basic.school.trim(),
          grade: basic.grade.trim(),
          phone: basic.phone.trim(),
          id_image_path: idPath,
        });
        if (leadErr) throw leadErr;
        const leadId = (leadData as any).id;
        const { error: invErr } = await createTeamInvites(teammates.map(t => ({
          edition_id: edition.id,
          committee_id: teamCommitteeId,
          team_lead_registration_id: leadId,
          invitee_email: t.email.trim().toLowerCase(),
          invitee_name: t.name.trim(),
          invitee_grade: t.grade.trim() || null,
          assigned_portfolio: teamLeadPortfolio,
        })));
        if (invErr) {
          toast({ title: "Team saved with warnings", description: invErr.message, variant: "destructive" });
        } else {
          toast({ title: "🎉 Team locked in!", description: `Your team owns "${teamLeadPortfolio}".` });
        }
        localStorage.setItem("prumun_delegate_email", basic.email.trim().toLowerCase());
        navigate("/delegate", { state: { newId: leadId } });
        return;
      }

      const occ = await getOccupiedPortfolios(edition.id);
      let chosen: { committee_id: string; portfolio: string } | null = null;
      if (pref1.committee_id && pref1.portfolio && !occ[`${pref1.committee_id}::${pref1.portfolio}`]) chosen = pref1;
      else if (pref2.committee_id && pref2.portfolio && !occ[`${pref2.committee_id}::${pref2.portfolio}`]) chosen = pref2;
      if (!chosen) {
        toast({ title: "Both preferences taken", description: "Please pick fresh choices from the matrix.", variant: "destructive" });
        setSubmitting(false); return;
      }

      const { data, error } = await createRegistration({
        edition_id: edition.id,
        committee_id: chosen.committee_id,
        portfolio: chosen.portfolio,
        full_name: basic.fullName.trim(),
        email: basic.email.trim().toLowerCase(),
        school: basic.school.trim(),
        grade: basic.grade.trim(),
        phone: basic.phone.trim(),
        id_image_path: idPath,
        pref1_committee_id: pref1.committee_id || null,
        pref1_portfolio: pref1.portfolio || null,
        pref2_committee_id: pref2.committee_id || null,
        pref2_portfolio: pref2.portfolio || null,
      });
      if (error) throw error;
      const gotPref = chosen.committee_id === pref1.committee_id ? "1st" : "2nd";
      toast({ title: "🎉 Registered!", description: `You got your ${gotPref} preference.` });
      localStorage.setItem("prumun_delegate_email", basic.email.trim().toLowerCase());
      navigate("/delegate", { state: { newId: (data as any).id } });
    } catch (err: any) {
      toast({ title: "Registration failed", description: err.message ?? "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const soloCommittees = useMemo(() => committees.filter(c => !c.is_team_committee), [committees]);
  const teamCommittees = useMemo(() => committees.filter(c => c.is_team_committee), [committees]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Dark page hero */}
      <div className="page-hero text-center">
        <div className="container max-w-3xl">
          <span className="eyebrow" style={{ color: "rgba(201,151,58,0.85)" }}>Delegate Registration</span>
          <h1 className="font-display font-bold text-white leading-tight" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>
            {invite ? "Claim Your Pre-Assigned Seat" : "Take your seat at PRUMUN"}
          </h1>
          <p className="text-white/50 text-sm mt-3">
            {invite
              ? `You were invited as "${invite.assigned_portfolio}" in ${inviteCommittee?.short_name ?? "—"}. Upload ID and you're in.`
              : "Three short steps. Less than two minutes."}
          </p>
        </div>
      </div>

      <section className="py-12 bg-white">
        <div className="container max-w-3xl">
          <Stepper steps={["Basic Info", "Identity Upload", invite ? "Confirm" : "Choose Role"]} current={phase} />

          {/* Form card */}
          <div className="border border-navy/8 rounded-sm bg-white shadow-card p-6 md:p-8">

            {/* Phase 0 — Basic Info */}
            {phase === 0 && (
              <div className="animate-fade-in space-y-5">
                <div className="mb-6">
                  <h2 className="font-display text-2xl font-bold text-navy">Tell us about you</h2>
                  <p className="text-navy/45 text-sm mt-1">Your details as they appear on official records.</p>
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

            {/* Phase 1 — ID Upload */}
            {phase === 1 && (
              <div className="animate-fade-in space-y-5">
                <div className="mb-6">
                  <h2 className="font-display text-2xl font-bold text-navy">Identity Verification</h2>
                  <p className="text-navy/45 text-sm mt-1">Upload a clear passport-size photo or your school ID.</p>
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

            {/* Phase 2 — Invite claim */}
            {phase === 2 && invite && (
              <div className="animate-fade-in space-y-5">
                <div className="mb-6">
                  <h2 className="font-display text-2xl font-bold text-navy">Pre-Assigned Seat</h2>
                </div>
                <div className="border-2 border-gold/40 rounded-sm p-5 bg-gold/3">
                  <div className="text-[9px] tracking-widest text-gold font-bold mb-1 uppercase">Pre-Assigned</div>
                  <div className="font-display text-xl font-bold text-navy">{inviteCommittee?.name}</div>
                  <div className="text-sm text-navy/55 mt-0.5">{inviteCommittee?.short_name} · {invite.assigned_portfolio}</div>
                </div>
                <div className="flex justify-between pt-4 border-t border-navy/6">
                  <button onClick={() => setPhase(1)} className="btn-ghost">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button onClick={submit} disabled={!phase2Valid || submitting}
                    className="btn-gold disabled:opacity-40 disabled:cursor-not-allowed">
                    {submitting ? "Submitting…" : <><Check className="w-4 h-4" /> Claim my seat</>}
                  </button>
                </div>
              </div>
            )}

            {/* Phase 2 — Solo/Team selection */}
            {phase === 2 && !invite && (
              <div className="animate-fade-in space-y-6">
                {/* Solo preferences */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-display text-2xl font-bold text-navy">Pick 2 preferences</h2>
                    <span className="text-[9px] px-2 py-1 rounded-sm bg-navy/8 text-navy font-bold tracking-widest uppercase">SOLO</span>
                  </div>
                  <p className="text-navy/45 text-sm">You'll be auto-assigned to your 1st pick if free, otherwise your 2nd.</p>
                  <PreferenceSelector label="1st preference (required)" required committees={soloCommittees} locks={locks} value={pref1} onChange={setPref1} />
                  <PreferenceSelector label="2nd preference (recommended backup)" committees={soloCommittees} locks={locks} value={pref2} onChange={setPref2} avoid={pref1} />
                </div>

                {teamCommittees.length > 0 && (
                  <div className="border-t border-navy/8 pt-6 space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-gold" />
                      <h2 className="font-display text-xl font-bold text-navy">Or register as a TEAM</h2>
                    </div>
                    <p className="text-navy/45 text-sm">
                      These committees run as teams of {teamCommittees[0]?.team_size}. The whole team shares one portfolio.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {teamCommittees.map(c => (
                        <button key={c.id} type="button"
                          onClick={() => { setTeamCommitteeId(c.id === teamCommitteeId ? "" : c.id); setTeamLeadPortfolio(""); }}
                          className={cn(
                            "p-4 rounded-sm border-2 text-left transition-all",
                            teamCommitteeId === c.id
                              ? "border-navy bg-navy/4 shadow-card"
                              : "border-navy/12 hover:border-navy/30 bg-white"
                          )}>
                          <div className="text-[9px] font-bold text-gold tracking-widest uppercase">{c.short_name} · TEAM OF {c.team_size}</div>
                          <div className="text-sm font-semibold text-navy mt-1 leading-tight">{c.name}</div>
                        </button>
                      ))}
                    </div>

                    {teamCommittee && (
                      <div className="space-y-4 mt-3">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-navy/60">Shared team portfolio</Label>
                          <p className="text-xs text-navy/40">Everyone on your team will represent this portfolio.</p>
                          <PortfolioPicker committee={teamCommittee} locks={locks} taken={[]} value={teamLeadPortfolio} onChange={setTeamLeadPortfolio} />
                        </div>
                        {teammates.map((t, i) => (
                          <div key={i} className="border border-navy/8 rounded-sm p-4 space-y-3 bg-white">
                            <div className="text-[9px] font-bold tracking-widest text-gold uppercase">Teammate {i + 1}</div>
                            <div className="grid md:grid-cols-3 gap-2">
                              <Input placeholder="Full name" value={t.name}
                                onChange={e => updateTeammate(setTeammates, teammates, i, { name: e.target.value })}
                                className="border-navy/15 text-navy placeholder:text-navy/30" />
                              <Input type="email" placeholder="Email" value={t.email}
                                onChange={e => updateTeammate(setTeammates, teammates, i, { email: e.target.value })}
                                className="border-navy/15 text-navy placeholder:text-navy/30" />
                              <Input placeholder="Grade / Class" value={t.grade}
                                onChange={e => updateTeammate(setTeammates, teammates, i, { grade: e.target.value })}
                                className="border-navy/15 text-navy placeholder:text-navy/30" />
                            </div>
                            {teamLeadPortfolio && (
                              <p className="text-[11px] text-navy/40">
                                Will be assigned to <span className="font-bold text-gold">{teamLeadPortfolio}</span> (shared with the team).
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t border-navy/6">
                  <button onClick={() => setPhase(1)} className="btn-ghost">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button onClick={submit} disabled={!phase2Valid || submitting}
                    className="btn-gold disabled:opacity-40 disabled:cursor-not-allowed">
                    {submitting ? "Submitting…" : <><Check className="w-4 h-4" /> Confirm & Lock Portfolio</>}
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

const updateTeammate = (
  setter: React.Dispatch<React.SetStateAction<TeammateRow[]>>,
  list: TeammateRow[], i: number, patch: Partial<TeammateRow>,
) => setter(list.map((t, j) => (j === i ? { ...t, ...patch } : t)));

/* ── Preference selector ── */
const PreferenceSelector = ({ label, required, committees, locks, value, onChange, avoid }: {
  label: string; required?: boolean;
  committees: Committee[]; locks: Record<string, string>;
  value: { committee_id: string; portfolio: string };
  onChange: (v: { committee_id: string; portfolio: string }) => void;
  avoid?: { committee_id: string; portfolio: string };
}) => {
  const c = committees.find(x => x.id === value.committee_id);
  return (
    <div className="border border-navy/8 rounded-sm p-4 space-y-3 bg-white">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-navy/60">
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {value.committee_id && (
          <button type="button" onClick={() => onChange({ committee_id: "", portfolio: "" })}
            className="text-xs text-navy/40 hover:text-red-500 transition-colors">Clear</button>
        )}
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        {committees.map(c => (
          <button key={c.id} type="button"
            onClick={() => onChange({ committee_id: c.id, portfolio: "" })}
            className={cn(
              "p-3 rounded-sm border-2 text-left transition-all",
              value.committee_id === c.id
                ? "border-navy bg-navy/4"
                : "border-navy/10 hover:border-navy/30 bg-white"
            )}>
            <div className="text-[9px] font-bold text-gold tracking-widest uppercase">{c.short_name}</div>
            <div className="text-xs font-semibold text-navy mt-0.5 leading-tight">{c.name}</div>
          </button>
        ))}
      </div>
      {c && (
        <div>
          <Label className="text-xs text-navy/45 mb-1.5 block">Portfolio</Label>
          <PortfolioPicker
            committee={c} locks={locks}
            taken={avoid && avoid.committee_id === c.id ? [avoid.portfolio] : []}
            value={value.portfolio}
            onChange={p => onChange({ ...value, portfolio: p })}
          />
        </div>
      )}
    </div>
  );
};

/* ── Portfolio picker grid ── */
const PortfolioPicker = ({ committee, locks, taken, value, onChange }: {
  committee: Committee; locks: Record<string, string>; taken: string[];
  value: string; onChange: (p: string) => void;
}) => (
  <div className="grid sm:grid-cols-2 gap-1.5 max-h-52 overflow-y-auto pr-1 mt-1">
    {committee.portfolios.map(p => {
      const dbLocked = Boolean(locks[`${committee.id}::${p}`]);
      const localTaken = taken.includes(p) && p !== value;
      const locked = dbLocked || localTaken;
      return (
        <button type="button" key={p}
          onClick={() => !locked && onChange(p)} disabled={locked}
          className={cn(
            "p-2.5 rounded-sm border text-left text-xs font-semibold transition-all flex items-center justify-between gap-2",
            locked && "opacity-45 cursor-not-allowed bg-red-50/50 border-red-100 text-red-400",
            !locked && value === p && "border-navy bg-navy text-white",
            !locked && value !== p && "border-navy/12 hover:border-navy/35 text-navy bg-white"
          )}>
          <span className="truncate">{p}</span>
          {locked && <Lock className="w-3 h-3 shrink-0" />}
        </button>
      );
    })}
  </div>
);

export default RegisterDelegate;
