import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import {
  getRegistrationByEmail, getCommittees, getTrainingResources, getTrainingSessions,
  getOccupiedPortfolios, changeDelegatePortfolio, lockDelegatePortfolio, updateRegistration,
  uploadPaymentReceipt, submitReceipt, reselectPortfolioAfterBump, autoLockIfNoPayment, paymentModeFor,
  type Registration, type Committee, type TrainingResource, type TrainingSession,
} from "@/lib/munApi";
import { QRCodeCanvas } from "qrcode.react";
import { QrCode, BookOpen, Video, MessageCircle, Lock, CheckCircle2, LogOut, FileText, ExternalLink, CalendarClock, Link as LinkIcon, StickyNote, Gavel, Sparkles, RefreshCw, Timer, Hourglass, Upload, CreditCard, AlertTriangle, Clock, ChevronRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AIAssistant } from "@/components/delegate/AIAssistant";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Delegate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { edition } = useActiveEdition();
  const newId = (location.state as { newId?: string } | null)?.newId;
  const email = localStorage.getItem("prumun_delegate_email");
  const [tab, setTab] = useState<"portfolio" | "training" | "chat">("portfolio");
  const [reg, setReg] = useState<Registration | null>(null);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [resources, setResources] = useState<TrainingResource[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [occupied, setOccupied] = useState<Record<string, string>>({});
  const [swapOpen, setSwapOpen] = useState(false);
  const [swapCommitteeId, setSwapCommitteeId] = useState("");
  const [swapPortfolio, setSwapPortfolio] = useState("");
  const [swapBusy, setSwapBusy] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Stepper Payment Modal & Expiry timer states:
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payStep, setPayStep] = useState<1 | 2>(1);
  const [payerName, setPayerName] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [payTimerRemaining, setPayTimerRemaining] = useState<number>(0);

  // Tick every second so the cooldown countdown and payment reservation update live.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Expiration logic: if timer runs out before verification, release portfolio.
  useEffect(() => {
    if (!reg || reg.payment_status === "approved" || reg.payment_status === "pending") return;
    if (!reg.portfolio || !reg.committee_id) return;
    
    const roleKey = reg.role === "executive_board" ? "eb" : reg.role === "organising_committee" ? "oc" : "delegate";
    const duration = Number(localStorage.getItem(`mun_payment_timer_${roleKey}`) || (reg.role === "executive_board" ? 1200 : reg.role === "organising_committee" ? 1800 : 900));
    
    const timerStartKey = `mun_timer_start_${reg.id}`;
    let start = localStorage.getItem(timerStartKey);
    if (!start) {
      start = String(Date.now());
      localStorage.setItem(timerStartKey, start);
    }
    
    const elapsed = Math.floor((now - Number(start)) / 1000);
    const left = Math.max(0, duration - elapsed);
    setPayTimerRemaining(left);
    
    if (left === 0) {
      // EXPIRED! Clear locally and release portfolio on server
      localStorage.removeItem(timerStartKey);
      updateRegistration(reg.id, { portfolio: null, committee_id: null })
        .then(() => {
          toast({
            title: "⚠️ Portfolio Reservation Expired!",
            description: "The countdown timer ran out. The selected portfolio has been returned to the public matrix.",
            variant: "destructive"
          });
          if (edition && email) getRegistrationByEmail(edition.id, email).then(setReg);
        });
    }
  }, [reg?.id, reg?.portfolio, reg?.committee_id, reg?.payment_status, now]);

  useEffect(() => {
    if (!email && !newId) { navigate("/login"); return; }
    if (!edition) return;
    (async () => {
      let r: Registration | null = null;
      if (email) r = await getRegistrationByEmail(edition.id, email);
      setReg(r);
      const [cs, rs, ss, occ] = await Promise.all([
        getCommittees(edition.id),
        getTrainingResources(edition.id),
        getTrainingSessions(edition.id),
        getOccupiedPortfolios(edition.id),
      ]);
      setCommittees(cs); setResources(rs); setSessions(ss); setOccupied(occ);
      setLoading(false);
    })();
  }, [edition, email, newId, navigate]);

  // ⚠️ All hooks (incl. the auto-lock effect below) must run on every render —
  // never put `useEffect` after a conditional `return`, or React will crash and
  // the page goes blank on next render. We therefore compute lock state first,
  // then run the auto-lock effect, then do early returns.
  const isEB = reg?.role === "executive_board";
  const isOC = reg?.role === "organising_committee";
  const isDelegate = !!reg && !isEB && !isOC;
  const COOLDOWN_MS = 60_000;
  const createdAt = reg?.created_at ? new Date(reg.created_at).getTime() : 0;
  const elapsed = now - createdAt;
  const lockedByTimer = createdAt > 0 && elapsed >= COOLDOWN_MS;
  const lockedByServer = !!reg?.portfolio_locked_at || (reg?.portfolio_changes_used ?? 0) >= 1;

  // Auto-lock on the server once the 60s window expires (best-effort).
  useEffect(() => {
    if (reg && isDelegate && !reg.portfolio_locked_at && lockedByTimer) {
      lockDelegatePortfolio(reg.id).catch(() => {});
    }
  }, [reg, isDelegate, lockedByTimer]);

  // Auto-lock when payment mode is "none" for this role
  useEffect(() => {
    if (reg && edition && reg.payment_status !== "approved" && paymentModeFor(edition, reg.role) === "none") {
      autoLockIfNoPayment(reg, edition).then(() => {
        if (email) getRegistrationByEmail(edition.id, email).then(setReg);
      });
    }
  }, [reg, edition, email]);

  // Receipt upload state
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptBusy, setReceiptBusy] = useState(false);
  const [reselOpen, setReselOpen] = useState(false);
  const [reselCommitteeId, setReselCommitteeId] = useState("");
  const [reselPortfolio, setReselPortfolio] = useState("");

  const submitReceiptUpload = async () => {
    if (!reg || !receiptFile) return;
    setReceiptBusy(true);
    try {
      const path = await uploadPaymentReceipt(reg.id, receiptFile);
      const { error } = await submitReceipt(reg.id, path);
      if (error) throw error;
      toast({ title: "📤 Receipt uploaded", description: edition?.txt_receipt_uploaded || "Awaiting Secretariat approval." });
      setReceiptFile(null);
      if (edition && email) setReg(await getRegistrationByEmail(edition.id, email));
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally { setReceiptBusy(false); }
  };

  const doReselect = async () => {
    if (!reg || !reselCommitteeId || !reselPortfolio) return;
    const { error } = await reselectPortfolioAfterBump(reg.id, reselCommitteeId, reselPortfolio);
    if (error) return toast({ title: "Failed", description: (error as any).message, variant: "destructive" });
    toast({ title: "🔁 Portfolio updated" });
    setReselOpen(false);
    if (edition && email) {
      setReg(await getRegistrationByEmail(edition.id, email));
      setOccupied(await getOccupiedPortfolios(edition.id));
    }
  };

  if (loading) return <div className="min-h-screen bg-background"><Navbar /><div className="pt-36 text-center text-muted-foreground">Loading…</div></div>;

  if (!reg) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <section className="pt-36 pb-24 container max-w-2xl text-center">
          <h1 className="font-display text-3xl font-bold mb-4">No registration found</h1>
          <p className="text-muted-foreground mb-6">We couldn't find a registration with this email.</p>
          <Button asChild variant="hero"><Link to="/register">Register now</Link></Button>
        </section>
        <Footer />
      </div>
    );
  }

  const committee = committees.find(c => c.id === reg.committee_id);
  const pref1Committee = committees.find(c => c.id === reg.pref1_committee_id);
  const pref2Committee = committees.find(c => c.id === reg.pref2_committee_id);
  const logout = () => { localStorage.removeItem("prumun_delegate_email"); navigate("/"); };

  const upcoming = sessions.filter(s => new Date(s.scheduled_at) >= new Date());
  const past = sessions.filter(s => s.recording_url && new Date(s.scheduled_at) < new Date());

  const portalLabel = isEB ? "EXECUTIVE BOARD PORTAL" : isOC ? "ORGANISING COMMITTEE PORTAL" : "DELEGATE PORTAL";
  const RoleIcon = isEB ? Gavel : isOC ? Sparkles : QrCode;

  // chosen preference (only relevant for delegates)
  const chosenPref: 1 | 2 | null = !isEB && !isOC && reg.committee_id && reg.portfolio
    ? (reg.pref1_committee_id === reg.committee_id && reg.pref1_portfolio === reg.portfolio
        ? 1
        : reg.pref2_committee_id === reg.committee_id && reg.pref2_portfolio === reg.portfolio
          ? 2
          : null)
    : null;

  const canSwap = isDelegate && !lockedByServer && !lockedByTimer;
  const remaining = Math.max(0, COOLDOWN_MS - elapsed);
  const remainingSec = Math.ceil(remaining / 1000);

  const swapCommittee = committees.find(c => c.id === swapCommitteeId);
  const isFreePortfolio = (cId: string, p: string) => {
    if (!cId || !p) return false;
    if (cId === reg.committee_id && p === reg.portfolio) return true;
    return !occupied[`${cId}::${p}`];
  };

  const doSwap = async () => {
    if (!swapCommitteeId || !swapPortfolio) {
      toast({ title: "Pick a committee and portfolio", variant: "destructive" });
      return;
    }
    setSwapBusy(true);
    const { error } = await changeDelegatePortfolio(reg.id, swapCommitteeId, swapPortfolio);
    setSwapBusy(false);
    if (error) {
      toast({ title: "Swap failed", description: (error as any).message, variant: "destructive" });
      return;
    }
    toast({ title: "🔁 Portfolio updated", description: `${swapCommittee?.short_name} · ${swapPortfolio}` });
    setSwapOpen(false);
    // Re-fetch the registration so the UI shows the new assignment + locked state.
    if (edition && email) {
      const fresh = await getRegistrationByEmail(edition.id, email);
      setReg(fresh);
      setOccupied(await getOccupiedPortfolios(edition.id));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-36 pb-24 container max-w-5xl">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div>
            <p className="text-xs tracking-[0.3em] text-primary font-bold mb-1 flex items-center gap-2">
              <RoleIcon className="w-3 h-3" /> {portalLabel}
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-bold gradient-text-deep">Welcome, {reg.full_name.split(" ")[0]}</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}><LogOut className="w-4 h-4" /> Sign out</Button>
        </div>

        <div className="glass rounded-2xl p-2 flex gap-1 mb-6 w-fit">
          {[
            { id: "portfolio", label: isOC ? "My Profile" : isEB ? "My Board Role" : "My Portfolio", icon: QrCode },
            { id: "training", label: "Training Vault", icon: Video },
            { id: "chat", label: "AI Assistant", icon: MessageCircle },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
              className={cn("px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all",
                tab === t.id ? "bg-gradient-primary text-primary-foreground shadow-soft" : "hover:bg-secondary")}>
              <t.icon className="w-4 h-4" /> <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {tab === "portfolio" && (
          <div className="grid lg:grid-cols-3 gap-6 animate-fade-in">
            <div className="glass-strong rounded-3xl p-6 lg:col-span-2">
              <h2 className="font-display text-2xl font-bold mb-4">
                {isEB ? "Board Card" : isOC ? "OC Card" : "Portfolio Card"}
              </h2>
              <div className="space-y-2.5">
                <Row k="Full Name" v={reg.full_name} />
                <Row k="School" v={reg.school} />
                <Row k="Grade" v={reg.grade} />
                <Row k="Email" v={reg.email} />
                {isEB && (
                  <>
                    <Row k="Committee" v={committee?.name || "—"} />
                    <Row k="Board role" v={reg.eb_role ? reg.eb_role.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase()) : "—"} highlight />
                  </>
                )}
                {isOC && (
                  <Row k="Track" v="Organising Committee" highlight />
                )}
                {!isEB && !isOC && (
                  <>
                    <Row k="Committee" v={committee?.name || "—"} />
                    <Row k="Portfolio" v={reg.portfolio || "—"} highlight />
                    <Row k="Room" v={committee?.room_number ? `Room ${committee.room_number}` : "TBA"} highlight={!!committee?.room_number} />
                  </>
                )}
              </div>

              {/* Preference summary for delegates */}
              {!isEB && !isOC && (reg.pref1_committee_id || reg.pref2_committee_id) && (
                <div className="mt-5 pt-5 border-t border-border space-y-2">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-2">Your preferences</div>
                  <PrefRow
                    n={1}
                    committeeName={pref1Committee?.short_name}
                    portfolio={reg.pref1_portfolio}
                    chosen={chosenPref === 1}
                  />
                  <PrefRow
                    n={2}
                    committeeName={pref2Committee?.short_name}
                    portfolio={reg.pref2_portfolio}
                    chosen={chosenPref === 2}
                  />
                  {chosenPref === null && reg.committee_id && (
                    <div className="text-[11px] text-muted-foreground italic mt-1">
                      Assigned manually by the secretariat (outside both preferences).
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-4">Your ID document is securely stored and visible only to the secretariat.</p>

              {/* 60-second portfolio swap window for delegates */}
              {isDelegate && (
                <div className="mt-5 pt-5 border-t border-border">
                  {canSwap ? (
                    <div className="glass rounded-xl p-3 flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Timer className="w-4 h-4 text-warning animate-pulse" />
                        <span>Change portfolio · <span className="font-mono text-warning">{remainingSec}s</span> left</span>
                      </div>
                      <Button size="sm" variant="hero" className="ml-auto" onClick={() => {
                        setSwapCommitteeId(reg.committee_id ?? "");
                        setSwapPortfolio(reg.portfolio ?? "");
                        setSwapOpen(true);
                      }}>
                        <RefreshCw className="w-3 h-3" /> Swap now
                      </Button>
                    </div>
                  ) : (
                    <div className="glass rounded-xl p-3 text-xs text-muted-foreground flex items-center gap-2">
                      <Lock className="w-3 h-3" />
                      {lockedByServer
                        ? "Your portfolio has been locked. Contact the secretariat to make changes."
                        : "60-second swap window expired — your portfolio is now locked."}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="glass-strong rounded-3xl p-6 text-center">
              <h2 className="font-display text-xl font-bold mb-3">Entry Ticket</h2>
              {(() => {
                const mode = edition ? paymentModeFor(edition, reg.role) : "none";
                const status = reg.payment_status;

                // Stage 2 complete → show QR
                if (reg.entry_verified_at) {
                  return (
                    <>
                      <div className="bg-white p-4 rounded-2xl inline-block">
                        <QRCodeCanvas value={reg.id} size={192} level="M" includeMargin={false} />
                      </div>
                      <div className="flex items-center justify-center gap-2 text-success font-semibold mt-3">
                        <CheckCircle2 className="w-4 h-4" /> {edition?.qr_message_approved || "Approved — use this QR to enter"}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-2 break-all">ID: {reg.id.slice(0, 8)}…</p>
                    </>
                  );
                }

                // Stage 1 complete (locked) but Stage 2 pending
                if (status === "approved") {
                  if (reg.needs_reselection) {
                    return (
                      <div className="py-8 text-left space-y-3">
                        <div className="flex items-center gap-2 text-warning font-semibold">
                          <AlertTriangle className="w-4 h-4" /> {edition?.txt_needs_reselection}
                        </div>
                        <Button variant="hero" className="w-full" onClick={() => setReselOpen(true)}>
                          <RefreshCw className="w-4 h-4" /> {edition?.txt_change_portfolio_btn || "Change Portfolio"}
                        </Button>
                      </div>
                    );
                  }
                  return (
                    <div className="py-10">
                      <div className="w-20 h-20 mx-auto rounded-2xl bg-success/15 text-success flex items-center justify-center mb-3">
                        <Lock className="w-10 h-10" />
                      </div>
                      <p className="font-semibold">{edition?.txt_locked_awaiting_entry}</p>
                    </div>
                  );
                }

                // Stage 1 not done — payment flow
                if (mode === "none") {
                  return <p className="py-10 text-sm text-muted-foreground">{edition?.txt_auto_lock_notice}</p>;
                }
                if (mode === "cash") {
                  return (
                    <div className="py-10">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-warning/15 text-warning flex items-center justify-center mb-3">
                        <Hourglass className="w-8 h-8" />
                      </div>
                      <p className="font-semibold">{edition?.txt_pay_cash_notice}</p>
                    </div>
                  );
                }
                
                // mode === "upi"
                const formatTime = (secs: number) => {
                  const m = Math.floor(secs / 60);
                  const s = secs % 60;
                  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
                };

                return (
                  <div className="text-left space-y-4">
                    <div className="glass rounded-2xl p-4 border border-warning/30 bg-warning/[0.02] flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-warning/15 text-warning flex items-center justify-center shrink-0 animate-glow-pulse">
                        <Timer className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-warning tracking-widest uppercase">TEMPORARY RESERVATION</div>
                        <div className="text-lg font-mono font-bold text-foreground">
                          {payTimerRemaining > 0 ? formatTime(payTimerRemaining) : "00:00"}
                        </div>
                      </div>
                    </div>

                    {status === "rejected" && (
                      <p className="text-xs text-destructive font-semibold border-l-2 border-destructive pl-2">
                        {edition?.txt_payment_rejected}
                        {reg.payment_rejection_reason ? ` — ${reg.payment_rejection_reason}` : ""}
                      </p>
                    )}

                    {status === "pending" ? (
                      <div className="glass rounded-2xl p-4 text-center border border-primary/20 bg-primary/[0.02]">
                        <Clock className="w-8 h-8 mx-auto text-primary mb-2 animate-pulse" />
                        <p className="text-xs text-primary font-bold tracking-wide uppercase">Verification Pending</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{edition?.txt_receipt_uploaded}</p>
                      </div>
                    ) : (
                      <Button 
                        variant="hero" 
                        className="w-full h-12 rounded-xl text-sm font-bold shadow-elegant hover-lift" 
                        onClick={() => {
                          setPayStep(1);
                          setPayModalOpen(true);
                        }}
                      >
                        <CreditCard className="w-4 h-4 mr-2" /> Complete Payment & Lock Role
                      </Button>
                    )}
                  </div>
                );
              })()}
              {edition?.disclaimer_qr && (
                <div className="mt-4 pt-3 border-t border-border/50 flex items-start gap-2 text-left">
                  <Lock className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
                  <p className="text-[11px] text-foreground/80 dark:text-foreground/90 leading-relaxed">{edition.disclaimer_qr}</p>
                </div>
              )}
            </div>

            {/* Stepper Payment Modal Popup */}
            {payModalOpen && (
              <div className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPayModalOpen(false)}>
                <div className="glass-strong rounded-3xl p-6 md:p-8 max-w-md w-full animate-fade-in relative" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-start gap-4 border-b border-border/40 pb-4 mb-4">
                    <h3 className="font-display text-xl font-bold flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-primary" /> Complete Payment
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => setPayModalOpen(false)}>Close</Button>
                  </div>

                  {/* Stepper Indicator */}
                  <div className="flex justify-center gap-6 mb-6 text-[10px] font-bold text-muted-foreground">
                    <span className={cn(payStep === 1 ? "text-primary" : "text-muted-foreground")}>1. DETAILS</span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/35" />
                    <span className={cn(payStep === 2 ? "text-primary" : "text-muted-foreground")}>2. UPLOAD PROOF</span>
                  </div>

                  {/* Step 1: Details */}
                  {payStep === 1 && (
                    <div className="space-y-4 animate-fade-in">
                      {edition?.payment_qr_url && (
                        <div className="bg-white p-3 rounded-2xl max-w-[180px] mx-auto border border-border/50 shadow-soft">
                          <img src={edition.payment_qr_url} alt="Pay QR" className="w-full object-contain" />
                        </div>
                      )}
                      <div className="space-y-2 text-left text-xs bg-secondary/50 p-4 rounded-2xl">
                        {edition?.upi_id && (
                          <div className="flex justify-between items-center py-1 border-b border-border/40">
                            <span className="font-bold text-muted-foreground">UPI ID:</span>
                            <span className="font-mono text-foreground font-semibold">{edition.upi_id}</span>
                          </div>
                        )}
                        {edition?.bank_details && (
                          <div className="py-2 border-b border-border/40">
                            <span className="font-bold text-muted-foreground block mb-1">Bank details:</span>
                            <span className="font-mono text-foreground leading-normal block whitespace-pre-line">{edition.bank_details}</span>
                          </div>
                        )}
                        {edition?.payment_instructions && (
                          <p className="text-[10px] text-muted-foreground pt-1 italic">{edition.payment_instructions}</p>
                        )}
                      </div>

                      <div className="flex justify-end pt-4 border-t border-border/40">
                        <Button variant="hero" className="w-full" onClick={() => setPayStep(2)}>
                          Next: Submit Proof <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Proof Submission */}
                  {payStep === 2 && (
                    <div className="space-y-4 animate-fade-in text-left">
                      <div className="space-y-1.5">
                        <Label>Name of Payer (Delegate/Guardian)</Label>
                        <Input 
                          value={payerName} 
                          onChange={e => setPayerName(e.target.value)} 
                          placeholder="e.g. Raj Sharma" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Payer Contact Phone Number</Label>
                        <Input 
                          value={payerPhone} 
                          onChange={e => setPayerPhone(e.target.value)} 
                          placeholder="e.g. 9876543210" 
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label>Upload Payment Screenshot Proof</Label>
                        <Input 
                          type="file" 
                          accept="image/*,application/pdf" 
                          onChange={e => setReceiptFile(e.target.files?.[0] ?? null)} 
                        />
                      </div>

                      <div className="flex justify-between pt-4 border-t border-border/40 mt-6">
                        <Button variant="ghost" onClick={() => setPayStep(1)} disabled={receiptBusy}>Back</Button>
                        <Button 
                          variant="hero" 
                          onClick={async () => {
                            if (!receiptFile || !payerName || !payerPhone) {
                              toast({ title: "Incomplete details", description: "Please upload screenshot and fill contact details.", variant: "destructive" });
                              return;
                            }
                            setReceiptBusy(true);
                            try {
                              const path = await uploadPaymentReceipt(reg.id, receiptFile);
                              // Save payer details to DB alongside the receipt path.
                              await updateRegistration(reg.id, {
                                payer_name: payerName.trim(),
                                payer_phone: payerPhone.trim(),
                              } as any);
                              const { error } = await submitReceipt(reg.id, path);
                              if (error) throw error;
                              
                              toast({ title: "📤 Receipt uploaded!", description: "Awaiting Secretariat approval verification." });
                              setReceiptFile(null);
                              setPayModalOpen(false);
                              if (edition && email) setReg(await getRegistrationByEmail(edition.id, email));
                            } catch (e: any) {
                              toast({ title: "Upload failed", description: e.message, variant: "destructive" });
                            } finally { setReceiptBusy(false); }
                          }}
                          disabled={!receiptFile || !payerName || !payerPhone || receiptBusy}
                        >
                          {receiptBusy ? "Submitting..." : "Submit Proof"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reselect portfolio dialog */}
            {reselOpen && (
              <div className="fixed inset-0 z-50 bg-foreground/70 flex items-center justify-center p-4" onClick={() => setReselOpen(false)}>
                <div className="glass-strong rounded-3xl p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
                  <h3 className="font-display text-xl font-bold mb-3">Pick a remaining portfolio</h3>
                  <div className="space-y-3">
                    <select value={reselCommitteeId} onChange={e => { setReselCommitteeId(e.target.value); setReselPortfolio(""); }}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                      <option value="">— Committee —</option>
                      {committees.filter(c => !c.is_team_committee).map(c => <option key={c.id} value={c.id}>{c.short_name}</option>)}
                    </select>
                    <select value={reselPortfolio} onChange={e => setReselPortfolio(e.target.value)}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" disabled={!reselCommitteeId}>
                      <option value="">— Portfolio —</option>
                      {committees.find(c => c.id === reselCommitteeId)?.portfolios.filter(p => !occupied[`${reselCommitteeId}::${p}`]).map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => setReselOpen(false)}>Cancel</Button>
                      <Button variant="hero" onClick={doReselect}>Confirm</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Portfolio swap dialog */}
        {swapOpen && (
          <div className="fixed inset-0 z-50 bg-foreground/70 flex items-center justify-center p-4" onClick={() => setSwapOpen(false)}>
            <div className="glass-strong rounded-3xl p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
              <h3 className="font-display text-xl font-bold mb-1 flex items-center gap-2"><RefreshCw className="w-5 h-5 text-primary" /> Swap portfolio</h3>
              <p className="text-xs text-muted-foreground mb-4">You can change your portfolio once, within 60 seconds of registering. <span className="font-mono text-warning">{remainingSec}s</span> remaining.</p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Committee</label>
                  <select value={swapCommitteeId} onChange={e => { setSwapCommitteeId(e.target.value); setSwapPortfolio(""); }}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">— Select —</option>
                    {committees.filter(c => !c.is_team_committee).map(c => (
                      <option key={c.id} value={c.id}>{c.short_name} — {c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Portfolio</label>
                  <select value={swapPortfolio} onChange={e => setSwapPortfolio(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" disabled={!swapCommittee}>
                    <option value="">— Select —</option>
                    {swapCommittee?.portfolios.map(p => {
                      const taken = !isFreePortfolio(swapCommitteeId, p);
                      return <option key={p} value={p} disabled={taken}>{p}{taken ? " (taken)" : ""}</option>;
                    })}
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" onClick={() => setSwapOpen(false)}>Cancel</Button>
                  <Button variant="hero" onClick={doSwap} disabled={swapBusy}>
                    {swapBusy ? "Swapping…" : "Confirm swap"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "training" && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <CalendarClock className="w-5 h-5 text-primary" />
                <h2 className="font-display text-xl font-bold">Upcoming Live Sessions</h2>
              </div>
              {upcoming.length === 0 ? (
                <div className="glass rounded-2xl p-6 text-sm text-muted-foreground text-center">No live sessions scheduled yet.</div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {upcoming.map(s => (
                    <div key={s.id} className="glass-strong rounded-2xl p-5">
                      <div className="text-xs text-primary font-bold tracking-wider mb-1">{new Date(s.scheduled_at).toLocaleString()}</div>
                      <h3 className="font-bold mb-1">{s.topic}</h3>
                      {s.description && <p className="text-sm text-muted-foreground mb-3">{s.description}</p>}
                      {s.zoom_link && (
                        <Button asChild variant="hero" size="sm">
                          <a href={s.zoom_link} target="_blank" rel="noreferrer">Join Live <ExternalLink className="w-3 h-3" /></a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="w-5 h-5 text-primary" />
                <h2 className="font-display text-xl font-bold">Resource Library</h2>
              </div>
              {resources.length === 0 && past.length === 0 ? (
                <div className="glass rounded-2xl p-6 text-sm text-muted-foreground text-center">Resources will appear here once the secretariat adds them.</div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {past.map(s => (
                    <a key={s.id} href={s.recording_url!} target="_blank" rel="noreferrer" className="glass rounded-2xl p-5 hover-lift block">
                      <div className="aspect-video rounded-xl bg-gradient-deep flex items-center justify-center mb-3">
                        <Video className="w-10 h-10 text-white/80" />
                      </div>
                      <h3 className="font-semibold">{s.topic}</h3>
                      <p className="text-xs text-muted-foreground mt-1">Recording · {new Date(s.scheduled_at).toLocaleDateString()}</p>
                    </a>
                  ))}
                  {resources.map(r => {
                    const Icon = r.type === "video" ? Video : r.type === "pdf" ? FileText : r.type === "note" ? StickyNote : LinkIcon;
                    return (
                      <a key={r.id} href={r.url} target="_blank" rel="noreferrer" className="glass rounded-2xl p-5 hover-lift block">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold truncate">{r.title}</h3>
                            {r.description && <p className="text-sm text-muted-foreground line-clamp-2">{r.description}</p>}
                            <span className="text-[10px] uppercase tracking-widest text-primary font-bold mt-1 inline-block">{r.type}</span>
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "chat" && (
          <AIAssistant
            registrationId={reg.id}
            editionId={edition?.id}
            disclaimer={edition?.disclaimer_ai}
            context={[
              `Name: ${reg.full_name}`,
              `Role: ${isEB ? "Executive Board" : isOC ? "Organising Committee" : "Delegate"}`,
              committee && `Committee: ${committee.name} (${committee.short_name})`,
              committee?.agenda && `Agenda: ${committee.agenda}`,
              reg.portfolio && `Portfolio: ${reg.portfolio}`,
              reg.eb_role && `Board role: ${reg.eb_role}`,
            ].filter(Boolean).join("\n")}
          />
        )}
      </section>
      <Footer />
    </div>
  );
};

const Row = ({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) => (
  <div className="flex justify-between items-center gap-3 py-1.5 border-b border-border/50 last:border-0">
    <span className="text-xs uppercase tracking-wider text-muted-foreground">{k}</span>
    <span className={cn("text-sm font-semibold text-right", highlight && "text-primary")}>{v}</span>
  </div>
);

const PrefRow = ({ n, committeeName, portfolio, chosen }: {
  n: 1 | 2; committeeName?: string; portfolio?: string | null; chosen: boolean;
}) => (
  <div className={cn(
    "flex items-center justify-between rounded-xl px-3 py-2 border",
    chosen ? "border-success/40 bg-success/5" : "border-border/60 bg-background/40 opacity-80"
  )}>
    <div className="flex items-center gap-2 min-w-0">
      <span className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
        chosen ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
      )}>{n}</span>
      <div className="min-w-0">
        <div className="text-sm font-semibold truncate">{committeeName || "—"}</div>
        <div className="text-xs text-muted-foreground truncate">{portfolio || "—"}</div>
      </div>
    </div>
    {chosen && <span className="text-[10px] font-bold tracking-widest text-success shrink-0">✓ ASSIGNED</span>}
  </div>
);

export default Delegate;
