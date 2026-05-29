import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  getRegistrations, updateRegistration, deleteRegistration, getCommittees,
  getSignedIdUrl, uploadIdImage, verifyForEntry, revokeEntryVerification,
  type Registration, type Committee,
} from "@/lib/munApi";
import {
  CheckCircle2, Lock, Trash2, Search, Download, Users, Eye, Pencil, X,
  Save, Upload, QrCode, Unlock, ShieldCheck, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

type RoleFilter = "delegate" | "executive_board" | "organising_committee";

const ROLE_COPY: Record<RoleFilter, { label: string; emptyHint: string }> = {
  delegate: { label: "delegate", emptyHint: "No delegate registrations" },
  executive_board: { label: "executive board member", emptyHint: "No EB registrations" },
  organising_committee: { label: "OC member", emptyHint: "No OC registrations" },
};

/* ── PDF export via browser print ── */
function exportPDF(regs: Registration[], committees: Committee[], roleFilter: RoleFilter) {
  const cName = (id: string | null) => committees.find(c => c.id === id)?.short_name ?? "—";
  const rows = regs.map((r, i) => `
    <tr style="background:${i%2===0?"#f9fafb":"#fff"}">
      <td>${i+1}</td>
      <td>${r.full_name}</td>
      <td>${r.email}</td>
      <td>${r.school}</td>
      <td>${r.grade}</td>
      <td>${r.phone}</td>
      <td>${cName(r.committee_id)}</td>
      <td>${r.portfolio ?? r.eb_role ?? "—"}</td>
      <td>${r.payment_status.toUpperCase()}</td>
      <td>${r.entry_verified_at ? "YES" : "NO"}</td>
    </tr>`).join("");
  const win = window.open("", "_blank")!;
  win.document.write(`
    <html><head><title>${roleFilter} list</title>
    <style>
      body{font-family:sans-serif;font-size:11px;padding:16px}
      h2{margin-bottom:8px}
      table{border-collapse:collapse;width:100%}
      th{background:#1d4ed8;color:#fff;padding:6px 8px;text-align:left;font-size:10px}
      td{padding:5px 8px;border-bottom:1px solid #e5e7eb}
    </style></head><body>
    <h2>${ROLE_COPY[roleFilter].label.toUpperCase()} REGISTRATIONS — ${new Date().toLocaleDateString("en-IN")}</h2>
    <table><thead><tr>
      <th>#</th><th>Name</th><th>Email</th><th>School</th><th>Grade</th>
      <th>Phone</th><th>Committee</th><th>Portfolio/Role</th><th>Payment</th><th>Entry Verified</th>
    </tr></thead><tbody>${rows}</tbody></table>
    </body></html>`);
  win.document.close();
  win.print();
}

export const DelegatesTab = ({
  editionId,
  roleFilter = "delegate",
}: {
  editionId: string;
  roleFilter?: RoleFilter;
}) => {
  const [regs,       setRegs]       = useState<Registration[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [search,     setSearch]     = useState("");
  const [filter,     setFilter]     = useState<"all" | "pending" | "verified">("all");
  const [viewing,    setViewing]    = useState<{ url: string; name: string } | null>(null);
  const [editing,    setEditing]    = useState<Registration | null>(null);

  const refresh = () =>
    Promise.all([getRegistrations(editionId), getCommittees(editionId)]).then(([rAll, c]) => {
      setRegs(rAll.filter(r => r.role === roleFilter));
      setCommittees(c);
    });

  useEffect(() => { refresh(); }, [editionId, roleFilter]);

  const generateEntryQR = async (id: string) => {
    await verifyForEntry(id);
    refresh();
    toast({ title: "🎫 Entry QR generated", description: "User can now use it at the gate." });
  };
  const revokeEntry = async (id: string) => {
    await revokeEntryVerification(id);
    refresh();
    toast({ title: "Entry revoked" });
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this registration permanently?")) return;
    await deleteRegistration(id);
    refresh();
    toast({ title: "Deleted" });
  };
  const viewId = async (r: Registration) => {
    const url = await getSignedIdUrl(r.id_image_path);
    if (url) setViewing({ url, name: r.full_name });
    else toast({ title: "Could not load ID", variant: "destructive" });
  };

  /* ── Excel export ── */
  const exportExcel = () => {
    const cName = (id: string | null) => committees.find(c => c.id === id)?.short_name ?? "";
    const rows = filtered.map(r => ({
      Name: r.full_name,
      Email: r.email,
      School: r.school,
      Grade: r.grade,
      Phone: r.phone,
      Committee: cName(r.committee_id),
      "Portfolio / Role": r.portfolio ?? r.eb_role ?? "",
      "Pref 1 Committee": cName(r.pref1_committee_id),
      "Pref 1 Portfolio": r.pref1_portfolio ?? "",
      "Pref 2 Committee": cName(r.pref2_committee_id),
      "Pref 2 Portfolio": r.pref2_portfolio ?? "",
      "Payment Status": r.payment_status,
      "Entry Verified": r.entry_verified_at ? "YES" : "NO",
      Registered: r.created_at,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, ROLE_COPY[roleFilter].label);
    XLSX.writeFile(wb, `${roleFilter}-${Date.now()}.xlsx`);
    toast({ title: "📦 Excel exported", description: `${rows.length} records.` });
  };

  const filtered = regs.filter(r => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.full_name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.school.toLowerCase().includes(q) ||
      (r.portfolio ?? "").toLowerCase().includes(q);
    const matchFilter =
      filter === "all" ||
      (filter === "verified" ? r.entry_verified_at != null : r.entry_verified_at == null);
    return matchSearch && matchFilter;
  });

  const stats = {
    total:   regs.length,
    verified: regs.filter(r => r.entry_verified_at != null).length,
    pending:  regs.filter(r => r.entry_verified_at == null).length,
  };

  return (
    <div className="space-y-6">
      {/* ── Stat row ── */}
      <div className="grid grid-cols-3 gap-4">
        <Stat icon={Users}         label="Total"    value={stats.total}    />
        <Stat icon={CheckCircle2}  label="Verified" value={stats.verified} color="success" />
        <Stat icon={Lock}          label="Pending"  value={stats.pending}  color="warning" />
      </div>

      {/* ── Search & filters ── */}
      <div className="glass-strong rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, email, school, portfolio…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "pending", "verified"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("px-4 py-2 text-xs font-semibold rounded-lg uppercase tracking-wider transition-all",
                filter === f ? "bg-gradient-primary text-primary-foreground" : "hover:bg-secondary")}>
              {f}
            </button>
          ))}
        </div>
        {/* Export buttons */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportPDF(filtered, committees, roleFilter)}>
            <FileText className="w-4 h-4" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={exportExcel}>
            <Download className="w-4 h-4" /> Excel
          </Button>
        </div>
      </div>

      {/* ── List ── */}
      {filtered.length === 0 ? (
        <div className="glass rounded-3xl p-16 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold">{ROLE_COPY[roleFilter].emptyHint}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const c  = committees.find(x => x.id === r.committee_id);
            const p1 = committees.find(x => x.id === r.pref1_committee_id);
            const p2 = committees.find(x => x.id === r.pref2_committee_id);
            const chosenPref =
              r.committee_id && r.portfolio
                ? r.pref1_committee_id === r.committee_id && r.pref1_portfolio === r.portfolio ? 1
                  : r.pref2_committee_id === r.committee_id && r.pref2_portfolio === r.portfolio ? 2
                  : 0
                : null;
            const roleBadge =
              r.role === "executive_board" ? "EB" :
              r.role === "organising_committee" ? "OC" : "DEL";
            return (
              <div key={r.id} className="glass-strong rounded-2xl p-4 flex flex-wrap items-start gap-4">
                {/* Left info */}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm">{r.full_name}</h3>
                    <span className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full bg-primary/10 text-primary">{roleBadge}</span>
                    <span className={cn("text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full",
                      r.payment_status === "approved" ? "bg-success/15 text-success"
                        : r.payment_status === "pending" ? "bg-warning/15 text-warning"
                        : r.payment_status === "rejected" ? "bg-destructive/15 text-destructive"
                        : "bg-muted text-muted-foreground")}>
                      {r.payment_status === "approved" ? "VERIFIED" :
                       r.payment_status === "pending"  ? "PENDING PAY" :
                       r.payment_status === "rejected" ? "REJECTED" : "UNPAID"}
                    </span>
                    {r.entry_verified_at && (
                      <span className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full bg-success/15 text-success flex items-center gap-1">
                        <ShieldCheck className="w-2.5 h-2.5" /> ENTRY OK
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{r.school} · Grade {r.grade} · {r.email} · {r.phone}</p>
                  <p className="text-xs">
                    <span className="text-primary font-bold">{c?.short_name ?? "—"}</span>
                    {r.portfolio ? ` · ${r.portfolio}` : ""}
                    {r.eb_role ? ` · ${r.eb_role.replace("_", " ")}` : ""}
                  </p>
                  {r.role === "delegate" && (r.pref1_committee_id || r.pref2_committee_id) && (
                    <div className="flex gap-2 mt-1">
                      <PrefMini n={1} short={p1?.short_name} portfolio={r.pref1_portfolio} chosen={chosenPref === 1} />
                      <PrefMini n={2} short={p2?.short_name} portfolio={r.pref2_portfolio} chosen={chosenPref === 2} />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 items-center">
                  <Button variant="outline" size="sm" onClick={() => viewId(r)}><Eye className="w-3 h-3" /> ID</Button>
                  <Button variant="outline" size="sm" onClick={() => setEditing(r)}><Pencil className="w-3 h-3" /> Edit</Button>
                  {r.payment_status === "approved" && !r.entry_verified_at && (
                    <Button variant="hero" size="sm" onClick={() => generateEntryQR(r.id)}>
                      <QrCode className="w-3 h-3" /> Generate QR
                    </Button>
                  )}
                  {r.entry_verified_at && (
                    <Button variant="outline" size="sm" onClick={() => revokeEntry(r.id)}>
                      <Unlock className="w-3 h-3" /> Revoke
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => remove(r.id)} className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── ID viewer modal ── */}
      {viewing && (
        <div className="fixed inset-0 z-50 bg-foreground/70 flex items-center justify-center p-4" onClick={() => setViewing(null)}>
          <div className="glass-strong rounded-3xl p-6 max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">{viewing.name}'s ID</h3>
              <Button variant="ghost" size="sm" onClick={() => setViewing(null)}>Close</Button>
            </div>
            {viewing.url.match(/\.pdf/i)
              ? <iframe src={viewing.url} className="w-full h-[70vh] rounded-xl" title="ID document" />
              : <img src={viewing.url} alt="ID document" className="w-full max-h-[70vh] object-contain rounded-xl" />
            }
          </div>
        </div>
      )}

      {/* ── Edit modal ── */}
      {editing && (
        <EditDelegateDialog
          reg={editing}
          committees={committees}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refresh(); }}
        />
      )}
    </div>
  );
};

/* ── Edit dialog ── */
const EditDelegateDialog = ({
  reg, committees, onClose, onSaved,
}: {
  reg: Registration; committees: Committee[]; onClose: () => void; onSaved: () => void;
}) => {
  const [form, setForm] = useState({
    full_name: reg.full_name,
    email: reg.email,
    phone: reg.phone,
    school: reg.school,
    grade: reg.grade,
    committee_id: reg.committee_id ?? "",
    portfolio: reg.portfolio ?? "",
    pref1_committee_id: reg.pref1_committee_id ?? "",
    pref1_portfolio: reg.pref1_portfolio ?? "",
    pref2_committee_id: reg.pref2_committee_id ?? "",
    pref2_portfolio: reg.pref2_portfolio ?? "",
  });
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [saving,   setSaving]   = useState(false);

  const committee   = committees.find(c => c.id === form.committee_id);
  const p1Committee = committees.find(c => c.id === form.pref1_committee_id);
  const p2Committee = committees.find(c => c.id === form.pref2_committee_id);
  const isDelegate  = reg.role === "delegate";

  const save = async () => {
    setSaving(true);
    try {
      let id_image_path = reg.id_image_path;
      if (newPhoto) id_image_path = await uploadIdImage(newPhoto);
      const patch: any = {
        full_name: form.full_name, email: form.email, phone: form.phone,
        school: form.school, grade: form.grade,
        committee_id: form.committee_id || null,
        portfolio: form.portfolio || null,
        id_image_path,
      };
      if (isDelegate) {
        patch.pref1_committee_id = form.pref1_committee_id || null;
        patch.pref1_portfolio = form.pref1_portfolio || null;
        patch.pref2_committee_id = form.pref2_committee_id || null;
        patch.pref2_portfolio = form.pref2_portfolio || null;
      }
      const { error } = await updateRegistration(reg.id, patch);
      if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); setSaving(false); return; }
      toast({ title: "✅ Saved" });
      onSaved();
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-foreground/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass-strong rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display text-xl font-bold">Edit {ROLE_COPY[reg.role as RoleFilter]?.label ?? "participant"}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Full name</Label><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>School</Label><Input value={form.school} onChange={e => setForm({ ...form, school: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Grade</Label><Input value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} /></div>
          <div className="space-y-1.5">
            <Label>Final committee</Label>
            <select value={form.committee_id} onChange={e => setForm({ ...form, committee_id: e.target.value, portfolio: "" })}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">— None —</option>
              {committees.map(c => <option key={c.id} value={c.id}>{c.short_name} — {c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Final portfolio</Label>
            <select value={form.portfolio} onChange={e => setForm({ ...form, portfolio: e.target.value })}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">— Select —</option>
              {committee?.portfolios.map(p => <option key={p} value={p}>{p}</option>)}
              {form.portfolio && !committee?.portfolios.includes(form.portfolio) && (
                <option value={form.portfolio}>{form.portfolio} (custom)</option>
              )}
            </select>
          </div>
          {isDelegate && (
            <>
              <div className="md:col-span-2 mt-2 pt-3 border-t border-border">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-2">Preferences</p>
              </div>
              <div className="space-y-1.5">
                <Label>Pref 1 — committee</Label>
                <select value={form.pref1_committee_id} onChange={e => setForm({ ...form, pref1_committee_id: e.target.value, pref1_portfolio: "" })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">— None —</option>
                  {committees.map(c => <option key={c.id} value={c.id}>{c.short_name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Pref 1 — portfolio</Label>
                <select value={form.pref1_portfolio} onChange={e => setForm({ ...form, pref1_portfolio: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">— Select —</option>
                  {p1Committee?.portfolios.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Pref 2 — committee</Label>
                <select value={form.pref2_committee_id} onChange={e => setForm({ ...form, pref2_committee_id: e.target.value, pref2_portfolio: "" })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">— None —</option>
                  {committees.map(c => <option key={c.id} value={c.id}>{c.short_name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Pref 2 — portfolio</Label>
                <select value={form.pref2_portfolio} onChange={e => setForm({ ...form, pref2_portfolio: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">— Select —</option>
                  {p2Committee?.portfolios.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </>
          )}
          <div className="space-y-1.5 md:col-span-2">
            <Label>Replace ID / Photo (optional)</Label>
            <label className="flex items-center gap-2 cursor-pointer glass rounded-xl px-4 py-3 hover:bg-secondary transition">
              <Upload className="w-4 h-4" />
              <span className="text-sm">{newPhoto ? newPhoto.name : "Choose new image or PDF…"}</span>
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => setNewPhoto(e.target.files?.[0] ?? null)} />
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="hero" onClick={save} disabled={saving}><Save className="w-4 h-4" /> {saving ? "Saving…" : "Save changes"}</Button>
        </div>
      </div>
    </div>
  );
};

const Stat = ({ icon: Icon, label, value, color = "primary" }: {
  icon: any; label: string; value: number; color?: "primary" | "success" | "warning";
}) => (
  <div className="glass rounded-3xl p-5">
    <Icon className={cn("w-6 h-6 mb-2",
      color === "primary" && "text-primary",
      color === "success" && "text-success",
      color === "warning" && "text-warning"
    )} />
    <div className="font-display text-3xl font-bold">{value}</div>
    <div className="text-xs text-muted-foreground tracking-wide">{label}</div>
  </div>
);

const PrefMini = ({ n, short, portfolio, chosen }: {
  n: 1 | 2; short?: string; portfolio?: string | null; chosen: boolean;
}) => (
  <div className={cn("rounded-lg px-2 py-1 border text-[10px]",
    chosen ? "border-success/40 bg-success/10" : "border-border/60 bg-muted/40 opacity-80"
  )}>
    <span className="font-bold">P{n}: </span>
    <span>{short ?? "—"} {portfolio ?? "—"}</span>
    {chosen && <span className="text-success font-bold ml-1">✓</span>}
  </div>
);
