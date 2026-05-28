// Stage-1 payment configuration + approval queue + Excel export.
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  getRegistrations, getCommittees, updateEdition,
  approvePayment, rejectPayment, uploadPaymentQRImage, getReceiptSignedUrl,
  type Registration, type Committee, type Edition, type PaymentMode, type PaymentStatus,
} from "@/lib/munApi";
import {
  CreditCard, Save, Upload, CheckCircle2, XCircle, Search, Download,
  QrCode, Eye, Banknote, Wallet, Ban, Filter, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

type RoleKey = "all" | "delegate" | "executive_board" | "organising_committee";
type StatusKey = "all" | PaymentStatus;

const MODES: { v: PaymentMode; label: string; icon: any }[] = [
  { v: "upi", label: "UPI", icon: QrCode },
  { v: "cash", label: "Cash", icon: Banknote },
  { v: "none", label: "None (auto-lock)", icon: Ban },
];

export const PaymentsTab = ({ edition, onSaved }: { edition: Edition; onSaved: () => void }) => {
  // ---- Config form ----
  const [form, setForm] = useState({
    payment_mode_delegate: edition.payment_mode_delegate,
    payment_mode_eb: edition.payment_mode_eb,
    payment_mode_oc: edition.payment_mode_oc,
    upi_id: edition.upi_id ?? "",
    bank_details: edition.bank_details ?? "",
    payment_qr_url: edition.payment_qr_url ?? "",
    payment_instructions: edition.payment_instructions ?? "",
    txt_pay_upi_btn: edition.txt_pay_upi_btn,
    txt_pay_cash_notice: edition.txt_pay_cash_notice,
    txt_auto_lock_notice: edition.txt_auto_lock_notice,
    txt_receipt_uploaded: edition.txt_receipt_uploaded,
    txt_payment_rejected: edition.txt_payment_rejected,
    txt_locked_awaiting_entry: edition.txt_locked_awaiting_entry,
    txt_change_portfolio_btn: edition.txt_change_portfolio_btn,
    txt_needs_reselection: edition.txt_needs_reselection,
    txt_upload_receipt: edition.txt_upload_receipt,
  });
  const [savingCfg, setSavingCfg] = useState(false);
  const [qrFile, setQrFile] = useState<File | null>(null);

  // ---- Data ----
  const [regs, setRegs] = useState<Registration[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleKey>("all");
  const [statusFilter, setStatusFilter] = useState<StatusKey>("pending");
  const [committeeFilter, setCommitteeFilter] = useState<string>("all");
  const [viewingReceipt, setViewingReceipt] = useState<{ url: string; name: string } | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const refresh = () => Promise.all([getRegistrations(edition.id), getCommittees(edition.id)])
    .then(([r, c]) => { setRegs(r); setCommittees(c); });

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [edition.id]);

  // ---- Save config ----
  const saveConfig = async () => {
    setSavingCfg(true);
    try {
      let payment_qr_url = form.payment_qr_url;
      if (qrFile) payment_qr_url = await uploadPaymentQRImage(edition.id, qrFile);
      const { error } = await updateEdition(edition.id, { ...form, payment_qr_url } as any);
      if (error) throw error;
      toast({ title: "💾 Saved", description: "Payment settings updated." });
      setQrFile(null);
      setForm(f => ({ ...f, payment_qr_url }));
      onSaved();
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally { setSavingCfg(false); }
  };

  // ---- Filtering ----
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return regs.filter(r => {
      if (roleFilter !== "all" && r.role !== roleFilter) return false;
      if (statusFilter !== "all" && r.payment_status !== statusFilter) return false;
      if (committeeFilter !== "all" && r.committee_id !== committeeFilter) return false;
      if (q && !(r.full_name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [regs, roleFilter, statusFilter, committeeFilter, search]);

  const cName = (id: string | null) => committees.find(c => c.id === id)?.short_name ?? "—";

  // ---- Approve / reject ----
  const onApprove = async (r: Registration) => {
    const { error } = await approvePayment(r.id);
    if (error) return toast({ title: "Approve failed", description: (error as any).message, variant: "destructive" });
    const fresh = (await getRegistrations(edition.id)).find(x => x.id === r.id);
    toast({
      title: "✅ Payment approved",
      description: fresh?.needs_reselection
        ? "Both preferences were taken — user will pick a new portfolio."
        : `Locked: ${cName(fresh?.committee_id ?? null)} · ${fresh?.portfolio ?? "—"}`,
    });
    refresh();
  };
  const submitReject = async () => {
    if (!rejectingId) return;
    const { error } = await rejectPayment(rejectingId, rejectReason);
    if (error) return toast({ title: "Failed", description: (error as any).message, variant: "destructive" });
    toast({ title: "Receipt rejected", description: "User can re-upload." });
    setRejectingId(null); setRejectReason(""); refresh();
  };
  const viewReceipt = async (r: Registration) => {
    if (!r.payment_receipt_path) return toast({ title: "No receipt uploaded", variant: "destructive" });
    const url = await getReceiptSignedUrl(r.payment_receipt_path);
    if (url) setViewingReceipt({ url, name: r.full_name });
    else toast({ title: "Could not load receipt", variant: "destructive" });
  };

  // ---- Excel export ----
  const exportExcel = () => {
    const rows = filtered.map(r => ({
      Name: r.full_name,
      Email: r.email,
      Phone: r.phone,
      School: r.school,
      Grade: r.grade,
      Role: r.role,
      Committee: cName(r.committee_id),
      Portfolio: r.portfolio ?? "",
      "EB Role": r.eb_role ?? "",
      "Payment Mode": r.role === "delegate" ? form.payment_mode_delegate
        : r.role === "executive_board" ? form.payment_mode_eb : form.payment_mode_oc,
      "Payment Status": r.payment_status,
      "Approved At": r.payment_approved_at ?? "",
      "Entry Verified At": r.entry_verified_at ?? "",
      "Needs Reselection": r.needs_reselection ? "YES" : "",
      "Rejection Reason": r.payment_rejection_reason ?? "",
      "Created At": r.created_at,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payments");
    XLSX.writeFile(wb, `payments-${edition.name.replace(/\s+/g, "_")}-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast({ title: "📦 Exported", description: `${rows.length} rows.` });
  };

  const stats = {
    total: regs.length,
    pending: regs.filter(r => r.payment_status === "pending").length,
    approved: regs.filter(r => r.payment_status === "approved").length,
    rejected: regs.filter(r => r.payment_status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      {/* ===== Stats ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total" value={stats.total} icon={Wallet} />
        <Stat label="Pending" value={stats.pending} icon={CreditCard} color="warning" />
        <Stat label="Approved" value={stats.approved} icon={CheckCircle2} color="success" />
        <Stat label="Rejected" value={stats.rejected} icon={XCircle} color="destructive" />
      </div>

      {/* ===== Configuration ===== */}
      <div className="glass-strong rounded-3xl p-6 space-y-6">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          <h2 className="font-display text-xl font-bold">Payment Configuration</h2>
        </div>

        {/* Quick Payment Mode Selection */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Payment Methods by Role</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { key: "payment_mode_delegate", label: "Delegates" },
              { key: "payment_mode_eb", label: "Executive Board" },
              { key: "payment_mode_oc", label: "Organising Committee" },
            ].map(cat => (
              <div key={cat.key} className="glass rounded-2xl p-3">
                <Label className="text-xs font-semibold text-muted-foreground mb-2 block">{cat.label}</Label>
                <div className="flex gap-1">
                  {MODES.map(m => (
                    <button key={m.v} type="button"
                      onClick={() => setForm({ ...form, [cat.key]: m.v } as any)}
                      className={cn("flex-1 px-2 py-2 text-[10px] font-bold rounded-lg border-2 transition-all flex items-center justify-center gap-1 whitespace-nowrap",
                        (form as any)[cat.key] === m.v
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/50 hover:border-primary/40")}>
                      <m.icon className="w-3 h-3" /> {m.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Details (Collapsed Section) */}
        <div className="border-t border-border/40 pt-4">
          <details className="group cursor-pointer">
            <summary className="text-sm font-semibold text-foreground flex items-center gap-2 hover:text-primary transition-colors">
              <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
              Payment Details (UPI, Bank)
            </summary>
            <div className="mt-4 space-y-3 pl-6">
              <div className="space-y-1.5">
                <Label className="text-xs">UPI ID</Label>
                <Input placeholder="prumun@upi" value={form.upi_id} onChange={e => setForm({ ...form, upi_id: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Bank Details</Label>
                <Input placeholder="Account, IFSC, Holder Name" value={form.bank_details} onChange={e => setForm({ ...form, bank_details: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Instructions (shown to users)</Label>
                <Textarea rows={2} placeholder="e.g., Send payment via UPI to..." value={form.payment_instructions} onChange={e => setForm({ ...form, payment_instructions: e.target.value })} className="text-sm" />
              </div>
            </div>
          </details>
        </div>

        {/* Payment QR */}
        <div className="border-t border-border/40 pt-4">
          <Label className="text-sm font-semibold">Payment QR Code</Label>
          <div className="mt-3 grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Input type="file" accept="image/*" onChange={e => setQrFile(e.target.files?.[0] ?? null)} className="text-sm" />
              <p className="text-xs text-muted-foreground">JPG, PNG • max 5 MB</p>
            </div>
            {(qrFile || form.payment_qr_url) && (
              <div className="flex items-center justify-center">
                <img
                  src={qrFile ? URL.createObjectURL(qrFile) : form.payment_qr_url}
                  alt="Payment QR"
                  className="h-32 rounded-xl border border-primary/30 object-contain bg-white p-2"
                />
              </div>
            )}
          </div>
        </div>

        {/* User-Facing Text (Collapsed) */}
        <div className="border-t border-border/40 pt-4">
          <details className="group cursor-pointer">
            <summary className="text-sm font-semibold text-foreground flex items-center gap-2 hover:text-primary transition-colors">
              <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
              Customize User Messages
            </summary>
            <div className="mt-4 space-y-3 pl-6 max-h-96 overflow-y-auto">
              {([
                ["txt_pay_upi_btn", "Pay via UPI button"],
                ["txt_upload_receipt", "Upload receipt label"],
                ["txt_pay_cash_notice", "Cash payment notice"],
                ["txt_auto_lock_notice", "Auto-lock (no payment) message"],
                ["txt_receipt_uploaded", "Receipt confirmed message"],
                ["txt_payment_rejected", "Receipt rejected message"],
                ["txt_locked_awaiting_entry", "Locked, awaiting entry"],
                ["txt_change_portfolio_btn", "Change portfolio button"],
                ["txt_needs_reselection", "Needs reselection message"],
              ] as const).map(([key, label]) => (
                <div key={key} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{label}</Label>
                  <Input value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value } as any)} className="text-xs" />
                </div>
              ))}
            </div>
          </details>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-2 border-t border-border/40 pt-4">
          <Button variant="outline" onClick={() => { setQrFile(null); refresh(); }}>Cancel</Button>
          <Button className="bg-gradient-primary text-white" onClick={saveConfig} disabled={savingCfg}>
            {savingCfg ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {savingCfg ? "Saving..." : "Save Configuration"}
          </Button>
        </div>
      </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="hero" onClick={saveConfig} disabled={savingCfg}>
            <Save className="w-4 h-4" /> {savingCfg ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </div>

      {/* ===== Approvals queue ===== */}
      <div className="glass-strong rounded-3xl p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-5 h-5 text-primary" />
          <h2 className="font-display text-xl font-bold mr-auto">Approvals Queue</h2>
          <Button variant="outline" size="sm" onClick={exportExcel}>
            <Download className="w-4 h-4" /> Excel
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search name or email…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as RoleKey)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="all">All roles</option>
            <option value="delegate">Delegates</option>
            <option value="executive_board">EB</option>
            <option value="organising_committee">OC</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusKey)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="all">All status</option>
            <option value="none">Not started</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select value={committeeFilter} onChange={e => setCommitteeFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="all">All committees</option>
            {committees.map(c => <option key={c.id} value={c.id}>{c.short_name}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-12">Nothing matches these filters.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map(r => (
              <div key={r.id} className="glass rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold truncate">{r.full_name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                    <p className="text-xs mt-1">
                      <span className="font-bold text-primary">{cName(r.committee_id)}</span>
                      {r.portfolio ? ` · ${r.portfolio}` : ""}
                      {r.eb_role ? ` · ${r.eb_role.replace("_", " ")}` : ""}
                    </p>
                  </div>
                  <StatusBadge s={r.payment_status} />
                </div>

                {r.payment_rejection_reason && r.payment_status === "rejected" && (
                  <p className="text-[11px] text-destructive italic">Reason: {r.payment_rejection_reason}</p>
                )}
                {r.needs_reselection && (
                  <p className="text-[11px] text-warning font-semibold">Needs reselection — both prefs taken.</p>
                )}

                <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                  {r.payment_receipt_path && (
                    <Button size="sm" variant="outline" onClick={() => viewReceipt(r)}>
                      <Eye className="w-3 h-3" /> Receipt
                    </Button>
                  )}
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

      {/* Receipt viewer */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 bg-foreground/70 flex items-center justify-center p-4" onClick={() => setViewingReceipt(null)}>
          <div className="glass-strong rounded-3xl p-6 max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">{viewingReceipt.name}'s receipt</h3>
              <Button variant="ghost" size="sm" onClick={() => setViewingReceipt(null)}>Close</Button>
            </div>
            {viewingReceipt.url.match(/\.pdf/i)
              ? <iframe src={viewingReceipt.url} className="w-full h-[70vh] rounded-xl" title="Receipt" />
              : <img src={viewingReceipt.url} alt="Receipt" className="w-full max-h-[70vh] object-contain rounded-xl" />}
          </div>
        </div>
      )}

      {/* Reject reason dialog */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 bg-foreground/70 flex items-center justify-center p-4" onClick={() => setRejectingId(null)}>
          <div className="glass-strong rounded-3xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-xl font-bold mb-3">Reject receipt</h3>
            <Label>Reason (shown to user)</Label>
            <Textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Receipt unclear, please re-upload…" />
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

const Stat = ({ label, value, icon: Icon, color = "primary" }: { label: string; value: number; icon: any; color?: string }) => (
  <div className="glass rounded-2xl p-4 flex items-center gap-3">
    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center",
      color === "warning" && "bg-warning/15 text-warning",
      color === "success" && "bg-success/15 text-success",
      color === "destructive" && "bg-destructive/15 text-destructive",
      color === "primary" && "bg-primary/15 text-primary")}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{label}</div>
    </div>
  </div>
);

const StatusBadge = ({ s }: { s: PaymentStatus }) => {
  const map: Record<PaymentStatus, { label: string; cls: string }> = {
    none:     { label: "NEW",       cls: "bg-muted text-muted-foreground" },
    pending:  { label: "PENDING",   cls: "bg-warning/15 text-warning" },
    approved: { label: "APPROVED",  cls: "bg-success/15 text-success" },
    rejected: { label: "REJECTED",  cls: "bg-destructive/15 text-destructive" },
  };
  const m = map[s];
  return <span className={cn("text-[10px] font-bold tracking-widest px-2 py-1 rounded-full shrink-0", m.cls)}>{m.label}</span>;
};
