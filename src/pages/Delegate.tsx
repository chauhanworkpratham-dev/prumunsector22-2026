import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import { useSession } from "@/hooks/useSession";
import {
  getRegistrationByEmail, getCommittees, getTrainingResources, getTrainingSessions,
  getOccupiedPortfolios, changeDelegatePortfolio, updateRegistration,
  uploadPaymentReceipt, submitReceipt, autoLockIfNoPayment,
  type Registration, type Committee, type TrainingResource, type TrainingSession,
} from "@/lib/munApi";
import { getSignedIdUrl } from "@/lib/munApi";
import { QRCodeCanvas } from "qrcode.react";
import {
  QrCode, BookOpen, Video, Lock, CheckCircle2, LogOut, FileText,
  ExternalLink, CalendarClock, Gavel, Sparkles,
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

type MainTab = "profile" | "portfolio" | "training" | "chat" | "grading";

const Delegate = () => {
  const navigate = useNavigate();
  const { edition } = useActiveEdition();
  const { delegateEmail, logoutDelegate } = useSession();

  const [tab,        setTab]      = useState<MainTab>("profile");
  const [reg,        setReg]      = useState<Registration | null>(null);
  const [committees, setComm]     = useState<Committee[]>([]);
  const [resources,  setRes]      = useState<TrainingResource[]>([]);
  const [sessions,   setSess]     = useState<TrainingSession[]>([]);
  const [loading,    setLoading]  = useState(true);
  const [occupied,   setOccupied] = useState<Record<string, string>>({});
  const [now,        setNow]      = useState(Date.now());
  const [avatarUrl,  setAvatarUrl]= useState<string | null>(null);

  const [swapOpen,        setSwapOpen]      = useState(false);
  const [swapCommitteeId, setSwapCommittee] = useState("");
  const [swapPortfolio,   setSwapPortfolio] = useState("");
  const [swapBusy,        setSwapBusy]      = useState(false);

  const [payOpen,     setPayOpen]    = useState(false);
  const [payStep,     setPayStep]    = useState<1 | 2>(1);
  const [payerName,   setPayerName]  = useState("");
  const [payerPhone,  setPayerPhone] = useState("");
  const [receiptFile, setReceiptFile]= useState<File | null>(null);
  const [receiptBusy, setReceiptBusy]= useState(false);
  const [payTimerRemaining, setPayTimer] = useState(0);

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  useEffect(() => {
    if (!reg || reg.payment_status === "approved" || reg.payment_status === "pending") return;
    if (!reg.portfolio || !reg.committee_id) return;
    const duration = 900;
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
      if (r?.id_image_path && !r.id_image_path.toLowerCase().endsWith(".pdf")) {
        getSignedIdUrl(r.id_image_path).then(url => { if (url) setAvatarUrl(url); });
      }
      setLoading(false);
    })();
  }, [edition, delegateEmail, navigate]);

  const isEB         = reg?.role === "executive_board";
  const isOC         = reg?.role === "organising_committee";
  const isDelegate   = !!reg && !isEB && !isOC;
  const COOLDOWN     = 60_000;
  const createdAt    = reg?.created_at ? new Date(reg.created_at).getTime() : 0;
  const elapsed      = now - createdAt;
  const lockedByTimer  = createdAt > 0 && elapsed >= COOLDOWN;
  const lockedByServer = !!reg?.portfolio_locked_at || (reg?.portfolio_changes_used ?? 0) >= 1;

  useEffect(() => {
    if (reg && isDelegate && !reg.portfolio_locked_at && lockedByTimer) {
      autoLockIfNoPayment(reg.id).then(() => {
        if (edition && delegateEmail) getRegistrationByEmail(edition.id, delegateEmail).then(setReg);
      });
    }
  }, [lockedByTimer, reg?.id]);

  const committee  = committees.find(c => c.id === reg?.committee_id);
  const roleLabel  = isEB ? "Executive Board Member" : isOC ? "Organising Committee Member" : "Delegate";
  const handleLogout = () => { logoutDelegate(); navigate("/"); };

  const doSwap = async () => {
    if (!reg || !swapCommitteeId || !swapPortfolio) {
      toast({ title: "Select a committee and portfolio", variant: "destructive" }); return;
    }
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

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gold/20 animate-pulse" />
        <p className="text-sm text-navy/45">Loading your profile…</p>
      </div>
    </div>
  );

  /* ── No registration found ── */
  if (!reg) return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-36 pb-24 container max-w-lg text-center">
        <div className="border border-navy/8 rounded-sm p-10 bg-white shadow-card">
          <AlertTriangle className="w-10 h-10 text-gold mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold text-navy mb-2">No registration found</h2>
          <p className="text-sm text-navy/50 mb-6">
            No registration found for <span className="font-semibold text-navy">{delegateEmail}</span> in the active edition.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={handleLogout} className="btn-ghost">Sign out</button>
            <button onClick={() => navigate("/register")} className="btn-gold">Register now</button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );

  const TABS: { id: MainTab; label: string; Icon: any }[] = [
    { id: "profile",   label: "Profile",                      Icon: User          },
    { id: "portfolio", label: isEB ? "My Role" : "Portfolio", Icon: LayoutDashboard },
    { id: "training",  label: "Training",                     Icon: BookOpen      },
    { id: "chat",      label: "AI Prep",                      Icon: MessageCircle },
    ...(isEB ? [{ id: "grading" as MainTab, label: "Grading", Icon: Gavel }] : []),
  ];

  /* ── Payment status badge ── */
  const payBadge = () => {
    if (reg.payment_status === "approved")  return { text: "✓ Verified",       cls: "bg-green-50 text-green-700 border-green-200" };
    if (reg.payment_status === "pending")   return { text: "Awaiting review",  cls: "bg-amber-50 text-amber-700 border-amber-200" };
    if (reg.payment_status === "rejected")  return { text: "Payment rejected", cls: "bg-red-50   text-red-700   border-red-200"   };
    return                                         { text: "Payment pending",  cls: "bg-navy/5   text-navy/60   border-navy/12"   };
  };
  const badge = payBadge();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="container max-w-4xl pt-24 pb-24">

        {/* ── Profile header ── */}
        <div className="border border-navy/8 rounded-sm bg-white shadow-card p-6 md:p-8 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-sm overflow-hidden bg-navy flex items-center justify-center font-display text-2xl font-bold text-white shrink-0">
            {avatarUrl
              ? <img src={avatarUrl} alt={reg.full_name} className="w-full h-full object-cover" />
              : initials(reg.full_name)
            }
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl font-bold text-navy leading-tight">{reg.full_name}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              {/* Role badge */}
              <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-sm border",
                isEB ? "bg-purple-50 text-purple-700 border-purple-200" :
                isOC ? "bg-amber-50 text-amber-700 border-amber-200" :
                "bg-navy/5 text-navy border-navy/15")}>
                {isEB ? <Gavel className="w-3 h-3" /> : isOC ? <Sparkles className="w-3 h-3" /> : <User className="w-3 h-3" />}
                {roleLabel}
              </span>
              {committee && (
                <span className="inline-flex items-center text-[10px] font-bold px-2 py-1 rounded-sm border bg-navy/5 text-navy border-navy/15">
                  {committee.short_name}
                </span>
              )}
              <span className={cn("inline-flex items-center text-[10px] font-bold px-2 py-1 rounded-sm border", badge.cls)}>
                {badge.text}
              </span>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-ghost text-xs shrink-0">
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>

        {/* ── Tab bar — matches screenshot exactly ── */}
        <div className="flex border-b border-navy/10 mb-6">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all",
                tab === id
                  ? "border-navy text-navy font-semibold"
                  : "border-transparent text-navy/45 hover:text-navy hover:border-navy/30"
              )}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* ════ PROFILE TAB ════ */}
        {tab === "profile" && (
          <div className="grid md:grid-cols-2 gap-5 animate-fade-in">
            {/* Personal info */}
            <div className="border border-navy/8 rounded-sm bg-white shadow-card p-6 space-y-4">
              <p className="text-[9px] font-bold tracking-[0.28em] text-navy/40 uppercase">Personal Information</p>
              {[
                { Icon: User,          label: "Full Name",     value: reg.full_name },
                { Icon: Mail,          label: "Email",         value: reg.email     },
                { Icon: Phone,         label: "Phone",         value: reg.phone     },
                { Icon: School,        label: "School",        value: reg.school    },
                { Icon: GraduationCap, label: "Grade / Class", value: reg.grade     },
              ].map(({ Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-sm bg-gold/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-gold" />
                  </div>
                  <div>
                    <p className="text-[9px] text-navy/35 uppercase tracking-wide font-semibold">{label}</p>
                    <p className="text-sm font-semibold text-navy">{value || "—"}</p>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-navy/6 text-[10px] text-navy/35">
                Registered: {formatDate(reg.created_at)}
              </div>
            </div>

            {/* Entry pass / QR */}
            <div className="border border-navy/8 rounded-sm bg-white shadow-card p-6 space-y-4">
              <p className="text-[9px] font-bold tracking-[0.28em] text-navy/40 uppercase">Entry Pass</p>
              {reg.payment_status === "approved" ? (
                <div className="text-center space-y-3">
                  <div className="inline-block p-3 bg-white border border-navy/10 rounded-sm shadow-card">
                    <QRCodeCanvas value={`prumun-entry:${reg.id}`} size={150} />
                  </div>
                  <p className="text-xs font-semibold text-green-600 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Show this QR at the entry gate
                  </p>
                  <p className="text-[11px] text-navy/40">{committee?.short_name} · {reg.portfolio ?? reg.eb_role ?? "—"}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <div className="w-16 h-16 rounded-sm bg-navy/5 flex items-center justify-center">
                    <QrCode className="w-8 h-8 text-navy/20" />
                  </div>
                  <p className="text-sm font-semibold text-navy/50">QR unlocks after payment verification</p>
                  <p className="text-xs text-navy/40">Status:{" "}
                    <span className={cn("font-bold",
                      reg.payment_status === "pending"  && "text-amber-600",
                      reg.payment_status === "rejected" && "text-red-600"
                    )}>
                      {reg.payment_status === "pending" ? "Under review" : reg.payment_status === "rejected" ? "Rejected — re-upload" : "Awaiting payment"}
                    </span>
                  </p>
                  {(reg.payment_status === "none" || reg.payment_status === "rejected") && reg.portfolio && (
                    <button className="btn-gold w-full justify-center mt-2"
                      onClick={() => { setPayOpen(true); setPayStep(1); }}>
                      <CreditCard className="w-4 h-4" />
                      {reg.payment_status === "rejected" ? "Re-upload Receipt" : "Complete Payment"}
                    </button>
                  )}
                </div>
              )}

              {/* Portfolio change window */}
              {isDelegate && reg.payment_status !== "approved" && (
                <div className="pt-3 border-t border-navy/6">
                  {reg.needs_reselection ? (
                    <button className="btn-ghost w-full justify-center text-xs"
                      onClick={() => { setSwapOpen(true); setSwapCommittee(""); setSwapPortfolio(""); }}>
                      <RefreshCw className="w-3.5 h-3.5" /> Change Portfolio
                    </button>
                  ) : !lockedByServer && !lockedByTimer ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-navy/40">Change window</span>
                        <span className="font-bold text-amber-600 flex items-center gap-1">
                          <Timer className="w-3 h-3" />
                          {Math.floor((COOLDOWN - elapsed) / 1000 / 60)}:{String(Math.floor(((COOLDOWN - elapsed) / 1000) % 60)).padStart(2, "0")} remaining
                        </span>
                      </div>
                      <button className="btn-ghost w-full justify-center text-xs"
                        onClick={() => { setSwapOpen(true); setSwapCommittee(""); setSwapPortfolio(""); }}>
                        <RefreshCw className="w-3.5 h-3.5" /> Change Portfolio
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-navy/35 text-center">Portfolio change window closed</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════ PORTFOLIO TAB ════ */}
        {tab === "portfolio" && (
          <div className="space-y-5 animate-fade-in">
            <div className="border border-navy/8 rounded-sm bg-white shadow-card p-6 space-y-4">
              <p className="text-[9px] font-bold tracking-[0.28em] text-navy/40 uppercase">
                {isEB ? "Your Role" : isOC ? "Your Assignment" : "Your Portfolio"}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Committee",  value: committee?.name ?? "Not assigned",                                    icon: Building2 },
                  { label: "Short name", value: committee?.short_name ?? "—",                                         icon: Globe     },
                  { label: isEB ? "Role" : "Portfolio",
                    value: (isEB ? reg.eb_role?.replace(/_/g, " ") : reg.portfolio) ?? "Not selected",                icon: Shield    },
                  { label: "Your role",  value: roleLabel,                                                             icon: User      },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="border border-navy/8 rounded-sm p-3 bg-white">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className="w-3 h-3 text-gold" />
                      <p className="text-[9px] uppercase tracking-wide text-navy/40 font-bold">{label}</p>
                    </div>
                    <p className="text-sm font-semibold text-navy capitalize">{value}</p>
                  </div>
                ))}
              </div>
              {committee?.agenda && (
                <div className="border border-navy/6 rounded-sm p-3 bg-navy/2">
                  <p className="text-[9px] uppercase tracking-wide text-navy/40 font-bold mb-1">Agenda</p>
                  <p className="text-sm text-navy/70 leading-relaxed">{committee.agenda}</p>
                </div>
              )}
              {!reg.portfolio && isDelegate && (
                <button className="btn-gold w-full justify-center" onClick={() => setSwapOpen(true)}>
                  Select Portfolio
                </button>
              )}
            </div>

            {reg.portfolio && reg.payment_status === "none" && payTimerRemaining > 0 && (
              <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-sm px-4 py-3">
                <Clock className="w-4 h-4 shrink-0" />
                Portfolio reserved for{" "}
                <span className="font-bold">{Math.floor(payTimerRemaining / 60)}:{String(payTimerRemaining % 60).padStart(2, "0")}</span>
              </div>
            )}
            {reg.portfolio && reg.payment_status === "pending" && (
              <div className="flex items-center gap-3 border border-amber-200 bg-amber-50 rounded-sm px-4 py-3 text-amber-700">
                <Hourglass className="w-4 h-4 shrink-0" />
                <p className="text-sm font-semibold">Receipt uploaded — awaiting Secretariat review</p>
              </div>
            )}
            {reg.portfolio && reg.payment_status === "rejected" && (
              <div className="border border-red-200 bg-red-50 rounded-sm px-4 py-3 space-y-3">
                <div className="flex items-center gap-3 text-red-700">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <p className="text-sm font-semibold">Payment rejected — {reg.payment_rejection_reason ?? "re-upload required"}</p>
                </div>
              </div>
            )}
            {reg.payment_status === "approved" && (
              <div className="flex items-center gap-3 border border-green-200 bg-green-50 rounded-sm px-4 py-3 text-green-700">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <p className="text-sm font-semibold">Payment verified ✓</p>
              </div>
            )}

            {/* Preferences */}
            {isDelegate && (reg.pref1_committee_id || reg.pref2_committee_id) && (
              <div className="border border-navy/8 rounded-sm bg-white shadow-card p-4 space-y-2">
                <p className="text-[9px] uppercase tracking-widest text-navy/40 font-bold">Your Preferences</p>
                {[
                  { n: 1, cId: reg.pref1_committee_id, portfolio: reg.pref1_portfolio },
                  { n: 2, cId: reg.pref2_committee_id, portfolio: reg.pref2_portfolio },
                ].map(({ n, cId, portfolio }) => {
                  const c = committees.find(x => x.id === cId);
                  const chosen = reg.committee_id === cId && reg.portfolio === portfolio;
                  return (
                    <div key={n} className={cn("flex items-center gap-3 rounded-sm px-3 py-2 text-xs border",
                      chosen ? "bg-green-50 border-green-200 text-green-700" : "bg-navy/3 border-navy/8 text-navy/60")}>
                      <span className={cn("font-bold", chosen && "text-green-700")}>P{n}</span>
                      <span className="font-semibold text-navy">{c?.short_name ?? "—"}</span>
                      <span>{portfolio ?? "—"}</span>
                      {chosen && <span className="ml-auto font-bold text-green-700">✓ Assigned</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ════ TRAINING TAB ════ */}
        {tab === "training" && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-[9px] font-bold tracking-[0.28em] text-navy/40 uppercase">Training Library</p>
            {resources.length === 0 && sessions.length === 0 ? (
              <div className="border border-navy/8 rounded-sm p-12 text-center text-sm text-navy/40 bg-white">
                Training resources will appear here once published.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {resources.map(r => (
                  <a key={r.id} href={r.url} target="_blank" rel="noreferrer"
                    className="border border-navy/8 rounded-sm bg-white shadow-card p-5 hover:border-gold/40 hover:shadow-elegant transition-all block group">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-sm bg-gold/10 flex items-center justify-center shrink-0">
                        {r.type === "video" ? <Video className="w-4 h-4 text-gold" /> : <FileText className="w-4 h-4 text-gold" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-navy group-hover:text-gold transition-colors">{r.title}</p>
                        {r.description && <p className="text-xs text-navy/45 mt-0.5 line-clamp-2">{r.description}</p>}
                        <p className="text-[10px] text-gold mt-1.5 uppercase tracking-wide font-bold">{r.type}</p>
                      </div>
                    </div>
                  </a>
                ))}
                {sessions.map(s => (
                  <div key={s.id} className="border border-navy/8 rounded-sm bg-white shadow-card p-5 hover:border-gold/40 transition-all">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-sm bg-gold/10 flex items-center justify-center shrink-0">
                        <CalendarClock className="w-4 h-4 text-gold" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-navy">{s.topic}</p>
                        {s.description && <p className="text-xs text-navy/45 mt-0.5">{s.description}</p>}
                        <p className="text-[10px] text-navy/40 mt-1">{new Date(s.scheduled_at).toLocaleString("en-IN")}</p>
                        {s.zoom_link && (
                          <a href={s.zoom_link} target="_blank" rel="noreferrer"
                            className="text-[11px] text-gold font-semibold flex items-center gap-1 mt-1 hover:underline">
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

        {/* ════ AI CHAT TAB ════ */}
        {tab === "chat" && (
          <div className="animate-fade-in">
            <AIAssistant registration={reg} edition={edition!} />
          </div>
        )}

        {/* ════ EB GRADING TAB ════ */}
        {tab === "grading" && isEB && reg.committee_id && (
          <div className="animate-fade-in">
            <EBGradingTab editionId={edition!.id} committeeId={reg.committee_id} />
          </div>
        )}
        {tab === "grading" && isEB && !reg.committee_id && (
          <div className="border border-navy/8 rounded-sm p-16 text-center text-navy/35 animate-fade-in">
            <Gavel className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>You must be assigned to a committee before grading.</p>
          </div>
        )}
      </div>

      {/* ── Portfolio swap modal ── */}
      {swapOpen && (
        <div className="fixed inset-0 z-50 bg-navy/30 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSwapOpen(false)}>
          <div className="border border-navy/8 rounded-sm bg-white shadow-elegant p-6 max-w-md w-full animate-slide-up"
            onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-bold text-xl text-navy mb-5">
              {reg.portfolio ? "Change Portfolio" : "Select Portfolio"}
            </h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-navy/55">Committee</Label>
                <select value={swapCommitteeId}
                  onChange={e => { setSwapCommittee(e.target.value); setSwapPortfolio(""); }}
                  className="form-input h-10 w-full">
                  <option value="">Select committee…</option>
                  {committees.map(c => <option key={c.id} value={c.id}>{c.short_name} — {c.name}</option>)}
                </select>
              </div>
              {swapCommitteeId && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-navy/55">Portfolio</Label>
                  <select value={swapPortfolio} onChange={e => setSwapPortfolio(e.target.value)}
                    className="form-input h-10 w-full">
                    <option value="">Select portfolio…</option>
                    {committees.find(c => c.id === swapCommitteeId)
                      ?.portfolios.filter(p => !occupied[p] || occupied[p] === reg.id)
                      .map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              )}
              <div className="flex gap-2 justify-end pt-2 border-t border-navy/6">
                <button onClick={() => setSwapOpen(false)} className="btn-ghost text-xs">Cancel</button>
                <button onClick={doSwap} disabled={!swapCommitteeId || !swapPortfolio || swapBusy}
                  className="btn-gold text-xs disabled:opacity-40 disabled:cursor-not-allowed">
                  {swapBusy ? "Updating…" : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment modal ── */}
      {payOpen && (
        <div className="fixed inset-0 z-50 bg-navy/30 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPayOpen(false)}>
          <div className="border border-navy/8 rounded-sm bg-white shadow-elegant p-6 max-w-md w-full animate-slide-up"
            onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-bold text-xl text-navy mb-1">Complete Payment</h3>
            <p className="text-xs text-navy/45 mb-5">{committee?.short_name} · {reg.portfolio}</p>

            <div className="flex items-center gap-2 mb-6">
              {[1, 2].map(s => (
                <div key={s} className="flex items-center gap-2">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                    payStep === s ? "bg-navy text-white" :
                    payStep > s  ? "bg-gold text-white"  : "bg-navy/10 text-navy/40"
                  )}>
                    {payStep > s ? "✓" : s}
                  </div>
                  {s === 1 && <ChevronRight className="w-3 h-3 text-navy/30" />}
                </div>
              ))}
              <span className="text-xs text-navy/45 ml-1">
                {payStep === 1 ? "Your details" : "Upload receipt"}
              </span>
            </div>

            {payStep === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-navy/55">Payer full name</Label>
                  <Input value={payerName} onChange={e => setPayerName(e.target.value)}
                    placeholder="Name on payment" className="border-navy/15" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-navy/55">Payer phone</Label>
                  <Input value={payerPhone} onChange={e => setPayerPhone(e.target.value)}
                    placeholder="+91 XXXXX XXXXX" className="border-navy/15" />
                </div>
                <div className="flex justify-end">
                  <button disabled={!payerName || !payerPhone} onClick={() => setPayStep(2)}
                    className="btn-gold disabled:opacity-40 disabled:cursor-not-allowed">
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            {payStep === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div className="border border-navy/8 rounded-sm p-4 text-xs text-navy/55 leading-relaxed bg-navy/2">
                  {edition?.payment_instructions ?? "Pay via UPI, then upload your screenshot."}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-navy/55">Payment receipt screenshot</Label>
                  <input type="file" accept="image/*" onChange={e => setReceiptFile(e.target.files?.[0] ?? null)}
                    className="block w-full text-sm text-navy/50 file:mr-3 file:py-1.5 file:px-4 file:rounded-sm file:border-0 file:text-xs file:font-semibold file:bg-navy file:text-white cursor-pointer" />
                </div>
                <div className="flex justify-between pt-2 border-t border-navy/6">
                  <button onClick={() => setPayStep(1)} className="btn-ghost text-xs">Back</button>
                  <button disabled={!receiptFile || receiptBusy} onClick={submitReceiptFn}
                    className="btn-gold text-xs disabled:opacity-40 disabled:cursor-not-allowed">
                    {receiptBusy ? "Uploading…" : <><Upload className="w-4 h-4" /> Submit Receipt</>}
                  </button>
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
