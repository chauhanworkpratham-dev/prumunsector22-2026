// Payment configuration + approval queue. Auto-approves when mode is "none".
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  getRegistrations, getCommittees, updateEdition, approvePayment, rejectPayment,
  uploadPaymentQRImage, getReceiptSignedUrl,
  type Registration, type Committee, type Edition, type PaymentMode, type PaymentStatus,
} from "@/lib/munApi";
import {
  CreditCard, Save, CheckCircle2, XCircle, Search, Download,
  QrCode, Eye, Banknote, Ban, Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

type RoleKey   = "all" | "delegate" | "executive_board" | "organising_committee";
type StatusKey = "all" | PaymentStatus;

const MODES: { v: PaymentMode; label: string; icon: any; desc: string }[] = [
  { v: "upi",  label: "UPI / Online",  icon: QrCode,   desc: "QR code or bank transfer" },
  { v: "cash", label: "Cash on-site",  icon: Banknote, desc: "Pay in-person at venue"   },
  { v: "none", label: "Free / None",   icon: Ban,      desc: "Auto-approve everyone"    },
];

export const PaymentsTab = ({ edition, onSaved }: { edition: Edition; onSaved: () => void }) => {
  const [form, setForm] = useState({
    payment_mode_delegate: edition.payment_mode_delegate,
    payment_mode_eb:       edition.payment_mode_eb,
    payment_mode_oc:       edition.payment_mode_oc,
    upi_id:                edition.upi_id ?? "",
    bank_details:          edition.bank_details ?? "",
    payment_qr_url:        edition.payment_qr_url ?? "",
    payment_instructions:  edition.payment_instructions ?? "",
    txt_pay_upi_btn:           edition.txt_pay_upi_btn,
    txt_upload_receipt:        edition.txt_upload_receipt,
    txt_pay_cash_notice:       edition.txt_pay_cash_notice,
    txt_auto_lock_notice:      edition.txt_auto_lock_notice,
    txt_receipt_uploaded:      edition.txt_receipt_uploaded,
    txt_payment_rejected:      edition.txt_payment_rejected,
    txt_locked_awaiting_entry: edition.txt_locked_awaiting_entry,
    txt_change_portfolio_btn:  edition.txt_change_portfolio_btn,
    txt_needs_reselection:     edition.txt_needs_reselection,
  });
  const [savingCfg, setSavingCfg] = useState(false);
  const [qrFile,    setQrFile]    = useState<File | null>(null);
  const [regs,       setRegs]       = useState<Registration[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [search,     setSearch]     = useState("");
  const [roleFilter,   setRoleFilter]   = useState<RoleKey>("all");
  const [statusFilter, setStatusFilter] = useState<StatusKey>("pending");
  const [committeeFilter, setCommitteeFilter] = useState("all");
  const [viewingReceipt, setViewingReceipt] = useState<{ url: string; name: string } | null>(null);
  const [rejectingId,   setRejectingId]   = useState<string | null>(null);
  const [rejectReason,  setRejectReason]  = useState("");
  const [autoApproving, setAutoApproving] = useState(false);

  const refresh = () =>
    Promise.all([getRegistrations(edition.id), getCommittees(edition.id)])
      .then(([r, c]) => { setRegs(r); setCommittees(c); });

  useEffect(() => { refresh(); }, [edition.id]); // eslint-disable-line

  const modeFor = (r: Registration): PaymentMode =>
    r.role === "delegate"        ? form.payment_mode_delegate :
    r.role === "executive_board" ? form.payment_mode_eb : form.payment_mode_oc;

  const autoApproveNone = async () => {
    setAutoApproving(true);
    let count = 0;
    for (const r of regs) {
      if (modeFor(r) === "none" && r.payment_status !== "approved") {
        await approvePayment(r.id);
        count++;
      }
    }
    setAutoApproving(false);
    if (count) { toast({ title: `✅ Auto-approved ${count} registrations` }); refresh(); }
    else toast({ title: "All already approved or no 'none'-mode registrations" });
  };

  const saveConfig = async () => {
    setSavingCfg(true);
    try {
      let payment_qr_url = form.payment_qr_url;
      if (qrFile) payment_qr_url = await uploadPaymentQRImage(edition.id, qrFile);
      const { error } = await updateEdition(edition.id, { ...form, payment_qr_url } as any);
      if (error) throw error;
      toast({ title: "💾 Settings saved" }); setQrFile(null);
      setForm(f => ({ ...f, payment_qr_url })); onSaved();
    } catch (e: any) { toast({ title: "Save failed", description: e.message, variant: "destructive" }); }
    finally { setSavingCfg(false); }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return regs.filter(r => {
      if (roleFilter !== "all" && r.role !== roleFilter) return false;
      if (statusFilter !== "all" && r.payment_status !== statusFilter) return false;
      if (committeeFilter !== "all" && r.committee_id !== committeeFilter) return false;
      if (q && !(r.full_name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [regs, roleFilter, statusFilter, committeeFilter, search]);

  const cName = (id: string | null) => committees.find(c => c.id === id)?.short_name ?? "—";

  const onApprove = async (r: Registration) => {
    const { error } = await approvePayment(r.id);
    if (error) return toast({ title: "Failed", description: (error as any).message, variant: "destructive" });
    toast({ title: "✅ Approved" }); refresh();
  };

  const submitReject = async () => {
    if (!rejectingId) return;
    const { error } = await rejectPayment(rejectingId, rejectReason);
    if (error) return toast({ title: "Failed", description: (error as any).message, variant: "destructive" });
    toast({ title: "Rejected" }); setRejectingId(null); setRejectReason(""); refresh();
  };

  const viewReceipt = async (r: Registration) => {
    if (!r.payment_receipt_path) return toast({ title: "No receipt", variant: "destructive" });
    const url = await getReceiptSignedUrl(r.payment_receipt_path);
    if (url) setViewingReceipt({ url, name: r.full_name });
    else toast({ title: "Could not load receipt", variant: "destructive" });
  };

  const exportExcel = () => {
    const rows = filtered.map(r => ({
      Name: r.full_name, Email: r.email, Phone: r.phone, School: r.school, Grade: r.grade,
      Role: r.role, Committee: cName(r.committee_id), Portfolio: r.portfolio ?? "",
      "EB Role": r.eb_role ?? "", "Payment Mode": modeFor(r), "Payment Status": r.payment_status,
      "Approved At": r.payment_approved_at ?? "", "Entry Verified": r.entry_verified_at ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payments");
    XLSX.writeFile(wb, `payments-${Date.now()}.xlsx`);
    toast({ title: `📦 Exported ${rows.length} rows` });
  };

  const stats = {
    total:    regs.length,
    pending:  regs.filter(r => r.payment_status === "pending").length,
    approved: regs.filter(r => r.payment_status === "approved").length,
    rejected: regs.filter(r => r.payment_status === "rejected").length,
    noneMode: regs.filter(r => modeFor(r) === "none" && r.payment_status !== "approved").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total",    v: stats.total,    cls: "text-primary"     },
          { label: "Pending",  v: stats.pending,  cls: "text-warning"     },
          { label: "Approved", v: stats.approved, cls: "text-success"     },
          { label: "Rejected", v: stats.rejected, cls: "text-destructive" },
        ].map(s => (
          <div key={s.label} className="glass rounded-2xl p-4 text-center">
            <div className={cn("text-2xl font-bold", s.cls)}>{s.v}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Config panel */}
      <div className="glass-strong rounded-3xl p-6 space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-border/50">
          <CreditCard className="w-5 h-5 text-primary" />
          <h2 className="font-display text-lg font-bold">Payment Configuration</h2>
        </div>

        {/* Mode selectors */}
        <div className="grid md:grid-cols-3 gap-5">
          {([
            { key: "payment_mode_delegate" as const, label: "Delegates"       },
            { key: "payment_mode_eb"       as const, label: "Executive Board" },
            { key: "payment_mode_oc"       as const, label: "Org. Committee"  },
          ]).map(cat => (
            <div key={cat.key} className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{cat.label}</p>
              <div className="flex flex-col gap-1.5">
                {MODES.map(m => (
                  <button key={m.v} type="button" onClick={() => setForm({ ...form, [cat.key]: m.v } as any)}
                    className={cn("flex items-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-xl border-2 transition-all text-left",
                      (form as any)[cat.key] === m.v
                        ? "border-primary bg-primary/8 text-primary"
                        : "border-border/60 hover:border-primary/30 text-foreground/60"
                    )}>
                    <m.icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{m.label} <span className="opacity-60 font-normal">— {m.desc}</span></span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Auto-approve banner */}
        {stats.noneMode > 0 && (
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-success/8 border border-success/20 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-success">{stats.noneMode} awaiting free auto-approval</p>
              <p className="text-xs text-muted-foreground">Payment mode is "None" — no verification needed.</p>
            </div>
            <Button size="sm" onClick={autoApproveNone} disabled={autoApproving}
              className="bg-success text-white border-0 hover:bg-success/80 shrink-0">
              {autoApproving ? "Approving…" : "Auto-Approve All"}
            </Button>
          </div>
        )}

        {/* UPI / bank details */}
        {[form.payment_mode_delegate, form.payment_mode_eb, form.payment_mode_oc].includes("upi") && (
          <div className="grid md:grid-cols-2 gap-4 pt-3 border-t border-border/40">
            <div className="space-y-1.5"><Label>UPI ID</Label>
              <Input value={form.upi_id} onChange={e => setForm({ ...form, upi_id: e.target.value })} placeholder="prumun@upi" /></div>
            <div className="space-y-1.5"><Label>Bank details</Label>
              <Input value={form.bank_details} onChange={e => setForm({ ...form, bank_details: e.target.value })} /></div>
            <div className="space-y-1.5 md:col-span-2"><Label>Payment instructions</Label>
              <Textarea rows={2} value={form.payment_instructions} onChange={e => setForm({ ...form, payment_instructions: e.target.value })} /></div>
            <div className="space-y-1.5">
              <Label>Payment QR image</Label>
              <Input type="file" accept="image/*" onChange={e => setQrFile(e.target.files?.[0] ?? null)} />
              {(qrFile || form.payment_qr_url) && (
                <img src={qrFile ? URL.createObjectURL(qrFile) : form.payment_qr_url} alt="QR"
                  className="mt-2 h-28 rounded-xl border border-border bg-white p-2 object-contain" />
              )}
            </div>
          </div>
        )}

        {/* UI microcopy collapsed */}
        <details className="pt-3 border-t border-border/40">
          <summary className="cursor-pointer text-xs uppercase tracking-widest text-muted-foreground font-bold select-none">
            UI copy text (click to expand)
          </summary>
          <div className="grid md:grid-cols-2 gap-3 mt-3">
            {([
              ["txt_pay_upi_btn","UPI button label"],["txt_upload_receipt","Upload receipt label"],
              ["txt_pay_cash_notice","Cash notice"],["txt_auto_lock_notice","Auto-lock notice"],
              ["txt_receipt_uploaded","Receipt uploaded msg"],["txt_payment_rejected","Rejection msg"],
              ["txt_locked_awaiting_entry","Locked/awaiting entry"],["txt_change_portfolio_btn","Change portfolio btn"],
              ["txt_needs_reselection","Needs reselection msg"],
            ] as const).map(([key, label]) => (
              <div key={key} className="space-y-1"><Label className="text-xs">{label}</Label>
                <Input value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value } as any)} /></div>
            ))}
          </div>
        </details>

        <div className="flex justify-end pt-2">
          <Button variant="hero" onClick={saveConfig} disabled={savingCfg}>
            <Save className="w-4 h-4" /> {savingCfg ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </div>

      {/* Approvals queue */}
      <div className="glass-strong rounded-3xl p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-5 h-5 text-primary" />
          <h2 className="font-display text-lg font-bold mr-auto">Approvals Queue</h2>
          <Button variant="outline" size="sm" onClick={exportExcel}><Download className="w-4 h-4" /> Excel</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search name or email…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          {[
            <select key="r" value={roleFilter} onChange={e => setRoleFilter(e.target.value as RoleKey)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="all">All roles</option><option value="delegate">Delegates</option>
              <option value="executive_board">EB</option><option value="organising_committee">OC</option>
            </select>,
            <select key="s" value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusKey)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="all">All status</option><option value="none">Not started</option>
              <option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
            </select>,
            <select key="c" value={committeeFilter} onChange={e => setCommitteeFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="all">All committees</option>
              {committees.map(c => <option key={c.id} value={c.id}>{c.short_name}</option>)}
            </select>,
          ]}
        </div>
        {filtered.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-12">Nothing matches these filters.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {filtered.map(r => (
              <div key={r.id} className="glass rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm truncate">{r.full_name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{r.email} · {r.school}</p>
                    <p className="text-xs mt-0.5">
                      <span className="font-bold text-primary">{cName(r.committee_id)}</span>
                      {r.portfolio ? ` · ${r.portfolio}` : ""}{r.eb_role ? ` · ${r.eb_role.replace("_"," ")}` : ""}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Mode: {modeFor(r).toUpperCase()}</p>
                  </div>
                  <StatusBadge s={r.payment_status} />
                </div>
                {r.payment_rejection_reason && <p className="text-[11px] text-destructive italic">Reason: {r.payment_rejection_reason}</p>}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                  {r.payment_receipt_path && <Button size="sm" variant="outline" onClick={() => viewReceipt(r)}><Eye className="w-3 h-3" /> Receipt</Button>}
                  {r.payment_status !== "approved" && (
                    <Button size="sm" variant="hero" className="flex-1" onClick={() => onApprove(r)}>
                      <CheckCircle2 className="w-3 h-3" /> Approve
                    </Button>
                  )}
                  {r.payment_status !== "rejected" && r.payment_status !== "approved" && (
                    <Button size="sm" variant="outline" onClick={() => { setRejectingId(r.id); setRejectReason(""); }}>
                      <XCircle className="w-3 h-3" /> Reject
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {viewingReceipt && (
        <div className="fixed inset-0 z-50 bg-foreground/70 flex items-center justify-center p-4" onClick={() => setViewingReceipt(null)}>
          <div className="glass-strong rounded-3xl p-6 max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">{viewingReceipt.name}'s receipt</h3>
              <Button variant="ghost" size="sm" onClick={() => setViewingReceipt(null)}>Close</Button>
            </div>
            {viewingReceipt.url.match(/\.pdf/i)
              ? <iframe src={viewingReceipt.url} className="w-full h-[70vh] rounded-xl" title="Receipt" />
              : <img src={viewingReceipt.url} alt="Receipt" className="w-full max-h-[70vh] object-contain rounded-xl" />
            }
          </div>
        </div>
      )}

      {rejectingId && (
        <div className="fixed inset-0 z-50 bg-foreground/70 flex items-center justify-center p-4" onClick={() => setRejectingId(null)}>
          <div className="glass-strong rounded-3xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-xl font-bold mb-3">Reject receipt</h3>
            <Textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Receipt unclear — please re-upload a clearer screenshot." />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => setRejectingId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={submitReject}>Reject</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ s }: { s: PaymentStatus }) => {
  const map: Record<PaymentStatus, string> = {
    none:     "bg-muted text-muted-foreground",
    pending:  "bg-warning/15 text-warning",
    approved: "bg-success/15 text-success",
    rejected: "bg-destructive/15 text-destructive",
  };
  return <span className={cn("text-[10px] font-bold tracking-widest px-2 py-1 rounded-full shrink-0", map[s])}>{s.toUpperCase()}</span>;
};
