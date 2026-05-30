import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import { useSession } from "@/hooks/useSession";
import {
  getRegistrationByEmail, getCommittees, getTrainingResources, getTrainingSessions,
  getOccupiedPortfolios, changeDelegatePortfolio, lockDelegatePortfolio, updateRegistration,
  uploadPaymentReceipt, submitReceipt, reselectPortfolioAfterBump, autoLockIfNoPayment, paymentModeFor,
  type Registration, type Committee, type TrainingResource, type TrainingSession,
} from "@/lib/munApi";
import { QRCodeCanvas } from "qrcode.react";
import {
  QrCode, BookOpen, Video, Lock, CheckCircle2, LogOut, FileText,
  ExternalLink, CalendarClock, LinkIcon, StickyNote, Gavel, Sparkles,
  RefreshCw, Timer, Hourglass, Upload, CreditCard, AlertTriangle,
  Clock, ChevronRight, User, Phone, Mail, School, GraduationCap,
  Building2, Globe, Shield, LayoutDashboard, MessageCircle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn, initials, formatDate } from "@/lib/utils";
import { AIAssistant } from "@/components/delegate/AIAssistant";
import { EBGradingTab } from "@/components/delegate/EBGradingTab";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSignedIdUrl } from "@/lib/munApi";

type MainTab = "profile" | "portfolio" | "training" | "chat" | "grading";

const Delegate = () => {
  const navigate = useNavigate();
  const { edition } = useActiveEdition();
  const { delegateEmail, logoutDelegate } = useSession();

  const [tab,        setTab]       = useState<MainTab>("profile");
  const [reg,        setReg]       = useState<Registration | null>(null);
  const [committees, setComm]      = useState<Committee[]>([]);
  const [resources,  setRes]       = useState<TrainingResource[]>([]);
  const [sessions,   setSess]      = useState<TrainingSession[]>([]);
  const [loading,    setLoading]   = useState(true);
  const [occupied,   setOccupied]  = useState<Record<string, string>>({});
  const [now,        setNow]       = useState(Date.now());
  const [avatarUrl,  setAvatarUrl] = useState<string | null>(null);

  // Portfolio swap
  const [swapOpen,        setSwapOpen]       = useState(false);
  const [swapCommitteeId, setSwapCommittee]  = useState("");
  const [swapPortfolio,   setSwapPortfolio]  = useState("");
  const [swapBusy,        setSwapBusy]       = useState(false);

  // Payment modal
  const [payOpen,    setPayOpen]   = useState(false);
  const [payStep,    setPayStep]   = useState<1 | 2>(1);
  const [payerName,  setPayerName] = useState("");
  const [payerPhone, setPayerPhone]= useState("");
  const [receiptFile,setReceiptFile]=useState<File|null>(null);
  const [receiptBusy,setReceiptBusy]=useState(false);
  const [payTimerRemaining, setPayTimer] = useState(0);

  // Tick
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  // Payment reservation expiry
  useEffect(() => {
    if (!reg || reg.payment_status === "approved" || reg.payment_status === "pending") return;
    if (!reg.portfolio || !reg.committee_id) return;
    const roleKey = reg.role === "executive_board" ? "eb" : reg.role === "organising_committee" ? "oc" : "delegate";
    const duration = Number(localStorage.getItem(`mun_payment_timer_${roleKey}`) || (reg.role === "executive_board" ? 1200 : 900));
    const key = `mun_timer_start_${reg.id}`;
    let start = localStorage.getItem(key);
    if (!start) { start = String(Date.now()); localStorage.setItem(key, start); }
    const left = Math.max(0, duration - Math.floor((now - Number(start)) / 1000));
    setPayTimer(left);
    if (left === 0) {
      localStorage.removeItem(key);
      updateRegistration(reg.id, { portfolio: null, committee_id: null }).then(() => {
        toast({ title: "Portfolio reservation expired", description: "Portfolio returned to the matrix.", variant: "destructive" });
        if (edition && delegateEmail) getRegistrationByEmail(edition.id, delegateEmail).then(setReg);
      });
    }
  }, [reg?.id, reg?.portfolio, reg?.payment_status, now]);

  useEffect(() => {
    if (!delegateEmail) { navigate("/login"); return; }
    if (!edition) return;
    (async () => {
      const r = await getRegistrationByEmail(edition.id, delegateEmail);
      setReg(r);
      const [cs, rs, ss, occ] = await Promise.all([
        getCommittees(edition.id), getTrainingResources(edition.id),
        getTrainingSessions(edition.id), getOccupiedPortfolios(edition.id),
      ]);
      setComm(cs); setRes(rs); setSess(ss); setOccupied(occ);
      // Load photo if available
      if (r?.id_image_path && !r.id_image_path.toLowerCase().endsWith(".pdf")) {
        getSignedIdUrl(r.id_image_path).then(url => { if (url) setAvatarUrl(url); });
      }
      setLoading(false);
    })();
  }, [edition, delegateEmail, navigate]);

  const isEB       = reg?.role === "executive_board";
  const isOC       = reg?.role === "organising_committee";
  const isDelegate = !!reg && !isEB && !isOC;
  const COOLDOWN   = 60_000;
  const createdAt  = reg?.created_at ? new Date(reg.created_at).getTime() : 0;
  const elapsed    = now - createdAt;
  const lockedByTimer  = createdAt > 0 && elapsed >= COOLDOWN;
  const lockedByServer = !!reg?.portfolio_locked_at || (reg?.portfolio_changes_used ?? 0) >= 1;

  useEffect(() => {
    if (reg && isDelegate && !reg.portfolio_locked_at && lockedByTimer) {
      autoLockIfNoPayment(reg.id).then(() => {
        if (edition && delegateEmail) getRegistrationByEmail(edition.id, delegateEmail).then(setReg);
      });
    }
  }, [lockedByTimer, reg?.id]);

  const committee = committees.find(c => c.id === reg?.committee_id);
  const roleLabel = isEB ? "Executive Board Member" : isOC ? "Organising Committee Member" : "Delegate";
  const roleBadgeColor = isEB ? "bg-purple-100 text-purple-700" : isOC ? "bg-amber-100 text-amber-700" : "bg-primary/10 text-primary";

  const handleLogout = () => { logoutDelegate(); navigate("/"); };

  const doSwap = async () => {
    if (!reg || !swapCommitteeId || !swapPortfolio) { toast({ title: "Select a committee and portfolio", variant: "destructive" }); return; }
    setSwapBusy(true);
    const { error } = await changeDelegatePortfolio(edition!.id, reg.id, swapCommitteeId, swapPortfolio, occupied);
    setSwapBusy(false);
    if (error) { toast({ title: "Could not change portfolio", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Portfolio updated!" });
    setSwapOpen(false);
    const r = await getRegistrationByEmail(edition!.id, delegateEmail!);
    setReg(r);
    setOccupied(await getOccupiedPortfolios(edition!.id));
  };

  const submitReceiptFn = async () => {
    if (!reg || !receiptFile) return;
    setReceiptBusy(true);
    try {
      const path = await uploadPaymentReceipt(reg.id, receiptFile);
      await updateRegistration(reg.id, { payer_name: payerName.trim(), payer_phone: payerPhone.trim() } as any);
      const { error } = await submitReceipt(reg.id, path);
      if (error) throw error;
      toast({ title: "Receipt uploaded — awaiting review." });
      setPayOpen(false);
      const r = await getRegistrationByEmail(edition!.id, delegateEmail!);
      setReg(r);
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally { setReceiptBusy(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-primary animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading your profile…</p>
        </div>
      </div>
    );
  }

  if (!reg) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-36 pb-24 container max-w-lg text-center">
          <div className="glass-strong rounded-2xl p-10">
            <AlertTriangle className="w-10 h-10 text-warning mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold mb-2">No registration found</h2>
            <p className="text-sm text-muted-foreground mb-6">No registration for <span className="font-semibold">{delegateEmail}</span> in the active edition.</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={handleLogout}>Sign out</Button>
              <Button className="bg-gradient-primary text-white border-0" onClick={() => navigate("/register")}>Register now</Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const TABS: { id: MainTab; label: string; Icon: any }[] = [
    { id: "profile",   label: "Profile",    Icon: User           },
    { id: "portfolio", label: isEB ? "My Role" : "Portfolio", Icon: LayoutDashboard },
    { id: "training",  label: "Training",   Icon: BookOpen       },
    { id: "chat",      label: "AI Prep",    Icon: MessageCircle  },
    ...(isEB ? [{ id: "grading" as MainTab, label: "Grading", Icon: Gavel }] : []),
  ];

  return (
    <div className="min-h-screen bg-background mesh-bg">
      <Navbar />

      <div className="container max-w-5xl pt-28 pb-24">
        {/* ── Profile header card ── */}
        <div className="glass-strong rounded-3xl p-6 md:p-8 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar — shows photo if uploaded */}
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-primary text-white flex items-center justify-center font-display text-3xl font-bold shrink-0 shadow-elegant animate-glow-pulse">
            {avatarUrl
              ? <img src={avatarUrl} alt={reg.full_name} className="w-full h-full object-cover" />
              : initials(reg.full_name)
            }
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl md:text-3xl font-bold mb-0.5">{reg.full_name}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={cn("pill text-[10px]", roleBadgeColor)}>{roleLabel}</span>
              {committee && <span className="pill bg-secondary text-foreground text-[10px]">{committee.short_name}</span>}
              <span className={cn("pill text-[10px]",
                reg.payment_status === "approved"  ? "bg-success/10 text-success"         :
                reg.payment_status === "pending"   ? "bg-warning/10 text-warning"         :
                reg.payment_status === "rejected"  ? "bg-destructive/10 text-destructive" :
                "bg-muted text-muted-foreground")}>
                {reg.payment_status === "approved" ? "✓ Verified" :
                 reg.payment_status === "pending"  ? "Awaiting review" :
                 reg.payment_status === "rejected" ? "Payment rejected" : "Payment pending"}
              </span>
            </div>
          </div>

          <Button variant="outline" size="sm" className="shrink-0 font-semibold" onClick={handleLogout}>
            <LogOut className="w-4 h-4" /> Sign out
          </Button>
        </div>

        {/* ── Tab bar ── */}
        <div className="tab-bar mb-6 w-full max-w-md">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} className="tab-item flex-1" aria-selected={tab === id} onClick={() => setTab(id)}>
              <Icon className="w-3.5 h-3.5 inline mr-1.5" />{label}
            </button>
          ))}
        </div>

        {/* ════════════ PROFILE TAB ════════════ */}
        {tab === "profile" && (
          <div className="grid md:grid-cols-2 gap-5 animate-fade-in">
            {/* Personal info */}
            <div className="glass rounded-2xl p-6 space-y-4">
              <p className="section-label">Personal Information</p>
              {[
                { Icon: User,          label: "Full Name",    value: reg.full_name },
                { Icon: Mail,          label: "Email",        value: reg.email     },
                { Icon: Phone,         label: "Phone",        value: reg.phone     },
                { Icon: School,        label: "School",       value: reg.school    },
                { Icon: GraduationCap, label: "Grade / Class",value: reg.grade     },
              ].map(({ Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary/8 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
                    <p className="text-sm font-semibold">{value || "—"}</p>
                  </div>
                </div>
              ))}
              <div className="pt-1 text-[10px] text-muted-foreground border-t border-border/50">
                Registered: {formatDate(reg.created_at)}
              </div>
            </div>

            {/* QR Entry Pass */}
            <div className="glass rounded-2xl p-6 space-y-4">
              <p className="section-label">Entry Pass</p>
              {reg.payment_status === "approved" ? (
                <div className="text-center space-y-3">
                  <div className="inline-block p-3 bg-white rounded-xl shadow-card">
                    <QRCodeCanvas value={`prumun-entry:${reg.id}`} size={150} />
                  </div>
                  <p className="text-xs font-semibold text-success flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Show this QR at the entry gate
                  </p>
                  <p className="text-[11px] text-muted-foreground">{committee?.short_name} · {reg.portfolio ?? reg.eb_role ?? "—"}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                    <QrCode className="w-8 h-8 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground">QR unlocks after payment verification</p>
                  <p className="text-xs text-muted-foreground">Current status: <span className={cn("font-bold",
                    reg.payment_status === "pending"  && "text-warning",
                    reg.payment_status === "rejected" && "text-destructive"
                  )}>{reg.payment_status === "pending" ? "Under review" : reg.payment_status === "rejected" ? "Rejected — re-upload" : "Awaiting payment"}</span></p>
                  {/* Pay button shown here below entry pass, only if unpaid */}
                  {(reg.payment_status === "none" || reg.payment_status === "rejected") && reg.portfolio && (
                    <Button className="w-full bg-gradient-primary text-white border-0 font-semibold mt-2" onClick={() => { setPayOpen(true); setPayStep(1); }}>
                      <CreditCard className="w-4 h-4" /> {reg.payment_status === "rejected" ? "Re-upload Receipt" : "Complete Payment"}
                    </Button>
                  )}
                </div>
              )}

              {/* 1-min change window or infinite if both prefs reserved */}
              {isDelegate && reg.payment_status !== "approved" && (
                <div className="pt-3 border-t border-border/50">
                  {reg.needs_reselection ? (
                    <Button variant="outline" size="sm" className="w-full font-semibold border-primary/30 text-primary"
                      onClick={() => { setSwapOpen(true); setSwapCommittee(""); setSwapPortfolio(""); }}>
                      <RefreshCw className="w-3.5 h-3.5" /> Change Portfolio (Both prefs reserved)
                    </Button>
                  ) : !lockedByServer && !lockedByTimer ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Change window</span>
                        <span className="font-bold text-warning flex items-center gap-1">
                          <Timer className="w-3 h-3" />
                          {Math.floor((COOLDOWN - elapsed) / 1000 / 60)}:{String(Math.floor(((COOLDOWN - elapsed) / 1000) % 60)).padStart(2, "0")} remaining
                        </span>
                      </div>
                      <Button variant="outline" size="sm" className="w-full font-semibold border-primary/30 text-primary"
                        onClick={() => { setSwapOpen(true); setSwapCommittee(""); setSwapPortfolio(""); }}>
                        <RefreshCw className="w-3.5 h-3.5" /> Change Portfolio
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center">Portfolio change window closed</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════ PORTFOLIO TAB ════════════ */}
        {tab === "portfolio" && (
          <div className="space-y-5 animate-fade-in">
            {/* Committee / role info card */}
            <div className="glass-strong rounded-2xl p-6 space-y-4">
              <p className="section-label">{isEB ? "Your Role" : isOC ? "Your Assignment" : "Your Portfolio"}</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Committee",   value: committee?.name ?? "Not assigned",                                   icon: Building2 },
                  { label: "Short name",  value: committee?.short_name ?? "—",                                        icon: Globe     },
                  { label: isEB ? "Role" : "Portfolio", value: (isEB ? reg.eb_role?.replace(/_/g," ") : reg.portfolio) ?? "Not selected", icon: Shield },
                  { label: "Your role",   value: roleLabel,                                                            icon: User      },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="glass rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-3.5 h-3.5 text-primary" />
                      <p className="text-[9px] uppercase tracking-wide text-muted-foreground font-bold">{label}</p>
                    </div>
                    <p className="text-sm font-semibold capitalize">{value}</p>
                  </div>
                ))}
              </div>
              {committee?.agenda && (
                <div className="glass rounded-xl p-3">
                  <p className="text-[9px] uppercase tracking-wide text-muted-foreground font-bold mb-1">Agenda</p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{committee.agenda}</p>
                </div>
              )}
              {/* If no portfolio selected yet */}
              {!reg.portfolio && isDelegate && (
                <Button className="w-full bg-gradient-primary text-white border-0 font-semibold" onClick={() => setSwapOpen(true)}>
                  Select Portfolio
                </Button>
              )}
            </div>

            {/* Payment timer */}
            {reg.portfolio && reg.payment_status === "none" && payTimerRemaining > 0 && (
              <div className="flex items-center gap-2 text-sm text-warning bg-warning/10 border border-warning/20 rounded-2xl px-4 py-3">
                <Clock className="w-4 h-4 shrink-0" />
                Portfolio reserved for <span className="font-bold ml-1">{Math.floor(payTimerRemaining / 60)}:{String(payTimerRemaining % 60).padStart(2, "0")}</span>
              </div>
            )}

            {/* Payment status */}
            {reg.portfolio && reg.payment_status === "pending" && (
              <div className="flex items-center gap-3 glass rounded-2xl px-4 py-3 text-warning">
                <Hourglass className="w-4 h-4 shrink-0" />
                <p className="text-sm font-semibold">Receipt uploaded — awaiting Secretariat review</p>
              </div>
            )}
            {reg.portfolio && reg.payment_status === "rejected" && (
              <div className="glass rounded-2xl px-4 py-3 space-y-3">
                <div className="flex items-center gap-3 text-destructive">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <p className="text-sm font-semibold">Payment rejected — {reg.payment_rejection_reason ?? "re-upload required"}</p>
                </div>
              </div>
            )}
            {reg.payment_status === "approved" && (
              <div className="flex items-center gap-3 glass rounded-2xl px-4 py-3 text-success">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <p className="text-sm font-semibold">Payment verified ✓</p>
              </div>
            )}

            {/* Preferences info */}
            {isDelegate && (reg.pref1_committee_id || reg.pref2_committee_id) && (
              <div className="glass rounded-2xl p-4 space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Your Preferences</p>
                {[
                  { n: 1, cId: reg.pref1_committee_id, portfolio: reg.pref1_portfolio },
                  { n: 2, cId: reg.pref2_committee_id, portfolio: reg.pref2_portfolio },
                ].map(({ n, cId, portfolio }) => {
                  const c = committees.find(x => x.id === cId);
                  const chosen = reg.committee_id === cId && reg.portfolio === portfolio;
                  return (
                    <div key={n} className={cn("flex items-center gap-3 rounded-xl px-3 py-2 text-xs",
                      chosen ? "bg-success/10 border border-success/20" : "bg-secondary/30")}>
                      <span className={cn("font-bold", chosen && "text-success")}>P{n}</span>
                      <span className="font-semibold">{c?.short_name ?? "—"}</span>
                      <span className="text-muted-foreground">{portfolio ?? "—"}</span>
                      {chosen && <span className="ml-auto text-success font-bold">✓ Assigned</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ════════════ TRAINING TAB ════════════ */}
        {tab === "training" && (
          <div className="space-y-4 animate-fade-in">
            <p className="section-label">Training Library</p>
            {resources.length === 0 && sessions.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center text-sm text-muted-foreground">
                Training resources will appear here once published.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {resources.map(r => (
                  <a key={r.id} href={r.url} target="_blank" rel="noreferrer"
                    className="glass rounded-2xl p-5 hover-lift block group">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/8 text-primary flex items-center justify-center shrink-0">
                        {r.type === "video" ? <Video className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm group-hover:text-primary transition-colors">{r.title}</p>
                        {r.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.description}</p>}
                        <p className="text-[10px] text-primary mt-1.5 uppercase tracking-wide font-bold">{r.type}</p>
                      </div>
                    </div>
                  </a>
                ))}
                {sessions.map(s => (
                  <div key={s.id} className="glass rounded-2xl p-5 hover-lift">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/8 text-primary flex items-center justify-center shrink-0">
                        <CalendarClock className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">{s.topic}</p>
                        {s.description && <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>}
                        <p className="text-[10px] text-muted-foreground mt-1">{new Date(s.scheduled_at).toLocaleString("en-IN")}</p>
                        {s.zoom_link && (
                          <a href={s.zoom_link} target="_blank" rel="noreferrer"
                            className="text-[11px] text-primary font-semibold flex items-center gap-1 mt-1 hover:underline">
                            <ExternalLink className="w-3 h-3" /> Join session
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════ AI CHAT TAB ════════════ */}
        {tab === "chat" && (
          <div className="animate-fade-in">
            <AIAssistant registration={reg} edition={edition!} />
          </div>
        )}

        {/* ════════════ EB GRADING TAB ════════════ */}
        {tab === "grading" && isEB && reg.committee_id && (
          <div className="animate-fade-in">
            <EBGradingTab editionId={edition!.id} committeeId={reg.committee_id} />
          </div>
        )}
        {tab === "grading" && isEB && !reg.committee_id && (
          <div className="glass rounded-3xl p-16 text-center text-muted-foreground animate-fade-in">
            <Gavel className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>You must be assigned to a committee before grading.</p>
          </div>
        )}
      </div>

      {/* ── Portfolio swap modal ── */}
      {swapOpen && (
        <div className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSwapOpen(false)}>
          <div className="glass-strong rounded-2xl p-6 max-w-md w-full animate-slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-bold text-xl mb-5">{reg.portfolio ? "Change Portfolio" : "Select Portfolio"}</h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Committee</Label>
                <select value={swapCommitteeId} onChange={e => { setSwapCommittee(e.target.value); setSwapPortfolio(""); }}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Select committee…</option>
                  {committees.map(c => <option key={c.id} value={c.id}>{c.short_name} — {c.name}</option>)}
                </select>
              </div>
              {swapCommitteeId && (
                <div className="space-y-1.5">
                  <Label>Portfolio</Label>
                  <select value={swapPortfolio} onChange={e => setSwapPortfolio(e.target.value)}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Select portfolio…</option>
                    {committees.find(c => c.id === swapCommitteeId)?.portfolios.filter(p => !occupied[p] || occupied[p] === reg.id).map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="ghost" onClick={() => setSwapOpen(false)}>Cancel</Button>
                <Button className="bg-gradient-primary text-white border-0 font-semibold hover:opacity-90"
                  disabled={!swapCommitteeId || !swapPortfolio || swapBusy} onClick={doSwap}>
                  {swapBusy ? "Updating…" : "Confirm"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment modal ── */}
      {payOpen && (
        <div className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPayOpen(false)}>
          <div className="glass-strong rounded-2xl p-6 max-w-md w-full animate-slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-bold text-xl mb-2">Complete Payment</h3>
            <p className="text-xs text-muted-foreground mb-5">
              {committee?.short_name} · {reg.portfolio}
            </p>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6">
              {[1, 2].map(s => (
                <div key={s} className="flex items-center gap-2">
                  <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                    payStep === s ? "bg-primary text-white" : payStep > s ? "bg-success text-white" : "bg-muted text-muted-foreground")}>
                    {payStep > s ? "✓" : s}
                  </div>
                  {s === 1 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                </div>
              ))}
              <span className="text-xs text-muted-foreground ml-1">{payStep === 1 ? "Your details" : "Upload receipt"}</span>
            </div>

            {payStep === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1.5">
                  <Label>Payer full name</Label>
                  <Input value={payerName} onChange={e => setPayerName(e.target.value)} placeholder="Name on payment" />
                </div>
                <div className="space-y-1.5">
                  <Label>Payer phone number</Label>
                  <Input value={payerPhone} onChange={e => setPayerPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" />
                </div>
                <div className="flex justify-end">
                  <Button disabled={!payerName || !payerPhone} className="bg-gradient-primary text-white border-0 font-semibold hover:opacity-90"
                    onClick={() => setPayStep(2)}>
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {payStep === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div className="glass rounded-xl p-4 text-xs text-muted-foreground leading-relaxed">
                  {edition?.payment_instructions ?? "Pay via UPI to the ID shown in the brochure, then upload your screenshot."}
                </div>
                <div className="space-y-1.5">
                  <Label>Payment receipt screenshot</Label>
                  <input type="file" accept="image/*" onChange={e => setReceiptFile(e.target.files?.[0] ?? null)}
                    className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white" />
                </div>
                <div className="flex justify-between">
                  <Button variant="ghost" size="sm" onClick={() => setPayStep(1)}>Back</Button>
                  <Button disabled={!receiptFile || receiptBusy} className="bg-gradient-primary text-white border-0 font-semibold hover:opacity-90"
                    onClick={submitReceiptFn}>
                    {receiptBusy ? "Uploading…" : <><Upload className="w-4 h-4" /> Submit Receipt</>}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Delegate;
