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
import { ArrowRight, ArrowLeft, Check, Lock, Plus, Trash2, Sparkles } from "lucide-react";
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

  // Invite mode: arrives with ?invite=<id>&email=<>
  const inviteIdParam = params.get("invite");
  const emailParam = params.get("email") ?? "";
  const [invite, setInvite] = useState<TeamInvite | null>(null);

  const [basic, setBasic] = useState({ fullName: "", email: emailParam, school: "", grade: "", phone: "" });
  const [idFile, setIdFile] = useState<File | null>(null);

  // Solo prefs (used when not invite & not team committee)
  const [pref1, setPref1] = useState({ committee_id: "", portfolio: "" });
  const [pref2, setPref2] = useState({ committee_id: "", portfolio: "" });

  // Team mode: lead picks team committee + 4 portfolios, invites 3 teammates by email.
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

  // Load invite on mount
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

  // Phase 2 validity depends on which sub-flow
  const phase2Valid = (() => {
    if (invite) return true; // pre-assigned
    // Team flow — shared portfolio: lead picks ONE portfolio, all teammates inherit it.
    if (teamCommitteeId) {
      const need = (teamCommittee?.team_size ?? 4) - 1;
      const allFilled = teammates.length === need
        && teammates.every(t => t.name.trim() && /\S+@\S+\.\S+/.test(t.email))
        && Boolean(teamLeadPortfolio);
      return Boolean(allFilled);
    }
    // Solo flow: at least pref1 valid
    return Boolean(pref1.committee_id && pref1.portfolio);
  })();

  // When user picks a team committee, auto-fill teammate slots.
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

      // ---- Invite-claim flow ----
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

      // ---- Team-lead flow (shared portfolio for the whole team) ----
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
        // All teammates share the SAME portfolio.
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
          toast({ title: "🎉 Team locked in!", description: `Your team owns "${teamLeadPortfolio}". Teammates can now sign in with their emails.` });
        }
        localStorage.setItem("prumun_delegate_email", basic.email.trim().toLowerCase());
        navigate("/delegate", { state: { newId: leadId } });
        return;
      }

      // ---- Solo preference flow ----
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
      const gotPref = chosen.committee_id === pref1.committee_id && chosen.portfolio === pref1.portfolio ? "1st" : "2nd";
      toast({ title: "🎉 Registered!", description: `You got your ${gotPref} preference. Pay at the venue to unlock your QR.` });
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
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-36 pb-24 container max-w-3xl">
        <div className="text-center mb-10">
          <p className="text-xs tracking-[0.3em] text-primary font-bold mb-3">DELEGATE REGISTRATION</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold gradient-text-deep mb-3">
            {invite ? "Claim Your Pre-Assigned Seat" : "Begin Your Journey"}
          </h1>
          <p className="text-muted-foreground">
            {invite
              ? `You were invited as "${invite.assigned_portfolio}" in ${inviteCommittee?.short_name ?? "—"}. Just upload ID and you're in.`
              : "Three short steps. Less than two minutes."}
          </p>
        </div>

        <Stepper steps={["Basic Info", "Identity Upload", invite ? "Confirm" : "Choose Role"]} current={phase} />

        <div className="glass-strong rounded-3xl p-6 md:p-10">
          {phase === 0 && (
            <div className="animate-fade-in space-y-5">
              <h2 className="font-display text-2xl font-bold mb-1">Tell us about you</h2>
              <BasicInfoFields values={basic} onChange={setBasic} />
              <div className="flex justify-end pt-4">
                <Button variant="hero" onClick={() => setPhase(1)} disabled={!phase0Valid}>Continue <ArrowRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}

          {phase === 1 && (
            <div className="animate-fade-in space-y-5">
              <h2 className="font-display text-2xl font-bold">Identity Verification</h2>
              <p className="text-sm text-muted-foreground -mt-2">Upload a clear passport-size photo or your school ID.</p>
              <IdUploader idFile={idFile} setIdFile={setIdFile} />
              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setPhase(0)}><ArrowLeft className="w-4 h-4" /> Back</Button>
                <Button variant="hero" onClick={() => setPhase(2)} disabled={!phase1Valid}>Continue <ArrowRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}

          {phase === 2 && invite && (
            <div className="animate-fade-in space-y-5">
              <div className="glass rounded-2xl p-5 border-2 border-primary/40">
                <div className="text-xs tracking-widest text-primary font-bold mb-1">PRE-ASSIGNED</div>
                <div className="font-display text-xl font-bold">{inviteCommittee?.name}</div>
                <div className="text-sm text-muted-foreground">{inviteCommittee?.short_name} · {invite.assigned_portfolio}</div>
              </div>
              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setPhase(1)}><ArrowLeft className="w-4 h-4" /> Back</Button>
                <Button variant="hero" size="lg" onClick={submit} disabled={!phase2Valid || submitting}>
                  {submitting ? "Submitting…" : <>Claim my seat <Check className="w-4 h-4" /></>}
                </Button>
              </div>
            </div>
          )}

          {phase === 2 && !invite && (
            <div className="animate-fade-in space-y-6">
              {/* Solo preferences */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-2xl font-bold">Pick 2 preferences</h2>
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-bold">SOLO</span>
                </div>
                <p className="text-sm text-muted-foreground -mt-1">You'll be auto-assigned to your 1st pick if free, otherwise your 2nd.</p>

                <PreferenceSelector label="1st preference (required)" required committees={soloCommittees} locks={locks} value={pref1} onChange={setPref1} />
                <PreferenceSelector label="2nd preference (recommended backup)" committees={soloCommittees} locks={locks} value={pref2} onChange={setPref2} avoid={pref1} />
              </div>

              {teamCommittees.length > 0 && (
                <div className="border-t border-border pt-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h2 className="font-display text-xl font-bold">Or register as a TEAM</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    These committees run as teams of {teamCommittees[0]?.team_size}. The whole team <strong>shares one portfolio</strong> —
                    pick it once, and the matrix locks it for every other team.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {teamCommittees.map(c => (
                      <button key={c.id} type="button" onClick={() => { setTeamCommitteeId(c.id === teamCommitteeId ? "" : c.id); setTeamLeadPortfolio(""); }}
                        className={cn("p-4 rounded-2xl border-2 text-left transition-all",
                          teamCommitteeId === c.id ? "border-primary bg-primary/5 shadow-soft" : "border-border hover:border-primary/50")}>
                        <div className="text-xs font-bold text-primary tracking-widest">{c.short_name} · TEAM OF {c.team_size}</div>
                        <div className="text-sm font-semibold mt-1 leading-tight">{c.name}</div>
                      </button>
                    ))}
                  </div>

                  {teamCommittee && (
                    <div className="space-y-4 mt-3">
                      <div className="space-y-2">
                        <Label>Shared team portfolio</Label>
                        <p className="text-xs text-muted-foreground -mt-1">Everyone on your team will represent this portfolio.</p>
                        <PortfolioPicker committee={teamCommittee} locks={locks} taken={[]} value={teamLeadPortfolio} onChange={setTeamLeadPortfolio} />
                      </div>

                      {teammates.map((t, i) => (
                        <div key={i} className="glass rounded-2xl p-4 space-y-3">
                          <div className="text-xs font-bold tracking-widest text-primary">TEAMMATE {i + 1}</div>
                          <div className="grid md:grid-cols-3 gap-2">
                            <Input placeholder="Full name" value={t.name} onChange={e => updateTeammate(setTeammates, teammates, i, { name: e.target.value })} />
                            <Input type="email" placeholder="Email" value={t.email} onChange={e => updateTeammate(setTeammates, teammates, i, { email: e.target.value })} />
                            <Input placeholder="Grade / Class" value={t.grade} onChange={e => updateTeammate(setTeammates, teammates, i, { grade: e.target.value })} />
                          </div>
                          {teamLeadPortfolio && (
                            <div className="text-[11px] text-muted-foreground">
                              Will be assigned to <span className="font-bold text-primary">{teamLeadPortfolio}</span> (shared with the team).
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setPhase(1)}><ArrowLeft className="w-4 h-4" /> Back</Button>
                <Button variant="hero" size="lg" onClick={submit} disabled={!phase2Valid || submitting}>
                  {submitting ? "Submitting…" : <>Confirm & Lock Portfolio <Check className="w-4 h-4" /></>}
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

const updateTeammate = (
  setter: React.Dispatch<React.SetStateAction<TeammateRow[]>>,
  list: TeammateRow[], i: number, patch: Partial<TeammateRow>,
) => setter(list.map((t, j) => (j === i ? { ...t, ...patch } : t)));

const PreferenceSelector = ({ label, required, committees, locks, value, onChange, avoid }: {
  label: string; required?: boolean;
  committees: Committee[]; locks: Record<string, string>;
  value: { committee_id: string; portfolio: string };
  onChange: (v: { committee_id: string; portfolio: string }) => void;
  avoid?: { committee_id: string; portfolio: string };
}) => {
  const c = committees.find(x => x.id === value.committee_id);
  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm">{label}{required && <span className="text-destructive ml-1">*</span>}</Label>
        {value.committee_id && <button type="button" onClick={() => onChange({ committee_id: "", portfolio: "" })} className="text-xs text-muted-foreground hover:text-destructive">Clear</button>}
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        {committees.map(c => (
          <button key={c.id} type="button" onClick={() => onChange({ committee_id: c.id, portfolio: "" })}
            className={cn("p-3 rounded-xl border-2 text-left transition-all",
              value.committee_id === c.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")}>
            <div className="text-[10px] font-bold text-primary tracking-widest">{c.short_name}</div>
            <div className="text-xs font-semibold mt-0.5 leading-tight">{c.name}</div>
          </button>
        ))}
      </div>
      {c && (
        <div>
          <Label className="text-xs text-muted-foreground">Portfolio</Label>
          <PortfolioPicker committee={c} locks={locks} taken={avoid && avoid.committee_id === c.id ? [avoid.portfolio] : []} value={value.portfolio} onChange={p => onChange({ ...value, portfolio: p })} />
        </div>
      )}
    </div>
  );
};

const PortfolioPicker = ({ committee, locks, taken, value, onChange }: {
  committee: Committee; locks: Record<string, string>; taken: string[];
  value: string; onChange: (p: string) => void;
}) => (
  <div className="grid sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1 mt-1">
    {committee.portfolios.map(p => {
      const dbLocked = Boolean(locks[`${committee.id}::${p}`]);
      const localTaken = taken.includes(p) && p !== value;
      const locked = dbLocked || localTaken;
      return (
        <button type="button" key={p} onClick={() => !locked && onChange(p)} disabled={locked}
          className={cn("p-3 rounded-xl border-2 text-left text-sm font-medium transition-all flex items-center justify-between gap-2",
            locked && "opacity-50 cursor-not-allowed bg-destructive/5 border-destructive/20",
            !locked && value === p && "border-primary bg-gradient-primary text-primary-foreground shadow-glow",
            !locked && value !== p && "border-border hover:border-primary/50")}>
          <span className="truncate">{p}</span>
          {locked && <Lock className="w-3 h-3 shrink-0" />}
        </button>
      );
    })}
  </div>
);

export default RegisterDelegate;
