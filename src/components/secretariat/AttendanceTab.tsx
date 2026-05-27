// Attendance tracker: per-day list of all delegates with QR scan + manual mark + reset.
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  getRegistrations, getCommittees, getAttendanceForDate, markAttendance, resetAttendanceForDate,
  attendanceTodayKey, downloadCSV, type Registration, type Committee, type AttendanceRow,
} from "@/lib/munApi";
import { supabase } from "@/integrations/supabase/client";
import { Search, ScanLine, X, CheckCircle2, XCircle, RotateCcw, CalendarDays, Camera, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Scanner, type IDetectedBarcode } from "@yudiel/react-qr-scanner";

export const AttendanceTab = ({ editionId }: { editionId: string }) => {
  const [regs, setRegs] = useState<Registration[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRow>>({});
  const [date, setDate] = useState<string>(attendanceTodayKey());
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState<string>("all"); // "all" | "eb" | "oc" | committee.id
  const [scannerOpen, setScannerOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const lastScanRef = useRef<{ id: string; at: number } | null>(null);

  const refresh = async () => {
    const [r, c, a] = await Promise.all([
      getRegistrations(editionId),
      getCommittees(editionId),
      getAttendanceForDate(editionId, date),
    ]);
    setRegs(r); setCommittees(c); setAttendance(a);
  };

  useEffect(() => { refresh(); }, [editionId, date]);

  // Realtime: refresh attendance when other devices mark
  useEffect(() => {
    const ch = supabase.channel(`att-${editionId}-${date}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance", filter: `edition_id=eq.${editionId}` }, () => {
        getAttendanceForDate(editionId, date).then(setAttendance);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [editionId, date]);

  const cName = (id: string | null) => committees.find(c => c.id === id)?.short_name ?? "—";

  const setStatus = async (regId: string, status: "present" | "absent", method: string = "manual") => {
    const { error } = await markAttendance(editionId, regId, status, method, date);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    refresh();
  };

  const handleScan = (codes: IDetectedBarcode[]) => {
    if (!codes.length) return;
    const raw = codes[0].rawValue.trim();
    // Accept either a bare UUID or "PRUMUN|<id>|..." legacy format
    const id = raw.includes("|") ? raw.split("|")[1] : raw;
    if (!id) return;
    if (lastScanRef.current && lastScanRef.current.id === id && Date.now() - lastScanRef.current.at < 3000) return;
    lastScanRef.current = { id, at: Date.now() };
    const reg = regs.find(r => r.id === id);
    if (!reg) {
      toast({ title: "❓ Unknown QR", description: "No delegate matches that code.", variant: "destructive" });
      return;
    }
    setStatus(reg.id, "present", "qr");
    toast({ title: `✅ ${reg.full_name}`, description: `Marked present in ${cName(reg.committee_id)}` });
  };

  const reset = async () => {
    if (!confirm(`Wipe attendance for ${date}?`)) return;
    setResetting(true);
    const { error } = await resetAttendanceForDate(editionId, date);
    setResetting(false);
    if (error) { toast({ title: "Reset failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "🧹 Day reset", description: `Cleared ${date}.` });
    refresh();
  };

  const scoped = useMemo(() => {
    if (group === "all") return regs;
    if (group === "eb") return regs.filter(r => r.role === "executive_board");
    if (group === "oc") return regs.filter(r => r.role === "organising_committee");
    return regs.filter(r => r.role === "delegate" && r.committee_id === group);
  }, [regs, group]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return scoped.filter(r => !q || r.full_name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || (r.portfolio ?? "").toLowerCase().includes(q));
  }, [scoped, search]);

  const scopedIds = useMemo(() => new Set(scoped.map(r => r.id)), [scoped]);
  const scopedAtt = useMemo(
    () => Object.values(attendance).filter(a => scopedIds.has(a.registration_id)),
    [attendance, scopedIds]
  );
  const stats = {
    total: scoped.length,
    present: scopedAtt.filter(a => a.status === "present").length,
    absent: scopedAtt.filter(a => a.status === "absent").length,
  };
  const unmarked = stats.total - stats.present - stats.absent;

  const groupLabel =
    group === "all" ? "Everyone" :
    group === "eb" ? "Executive Board" :
    group === "oc" ? "Organising Committee" :
    committees.find(c => c.id === group)?.short_name ?? "Group";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label={`TOTAL · ${groupLabel.toUpperCase()}`} value={stats.total} />
        <Stat label="PRESENT" value={stats.present} color="success" />
        <Stat label="ABSENT" value={stats.absent} color="destructive" />
        <Stat label="UNMARKED" value={unmarked} color="muted" />
      </div>

      <div className="glass-strong rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-muted-foreground" />
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-44" />
        </div>
        <select
          value={group}
          onChange={e => setGroup(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm font-semibold min-w-[180px]"
        >
          <option value="all">All participants</option>
          <option value="eb">— Executive Board</option>
          <option value="oc">— Organising Committee</option>
          {committees.length > 0 && <option disabled>──── Committees ────</option>}
          {committees.map(c => (
            <option key={c.id} value={c.id}>{c.short_name} — {c.name}</option>
          ))}
        </select>
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search name / email / portfolio…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="hero" onClick={() => setScannerOpen(true)}><ScanLine className="w-4 h-4" /> Scan QR</Button>
        <Button variant="outline" onClick={() => {
          downloadCSV(`attendance-${groupLabel.replace(/\s+/g, "_")}-${date}.csv`,
            ["Name", "Email", "Role", "Committee", "Portfolio / EB role", "Status", "Method", "Marked at"],
            scoped.map(r => {
              const a = attendance[r.id];
              return [
                r.full_name, r.email,
                r.role === "executive_board" ? "EB" : r.role === "organising_committee" ? "OC" : "Delegate",
                cName(r.committee_id),
                r.eb_role ?? r.portfolio ?? "",
                a?.status ?? "unmarked",
                a?.method ?? "",
                a ? new Date(a.marked_at).toLocaleString() : "",
              ];
            }));
        }}><Download className="w-4 h-4" /> CSV</Button>
        <Button variant="outline" onClick={reset} disabled={resetting} className="text-destructive hover:bg-destructive/10">
          <RotateCcw className="w-4 h-4" /> Reset day
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {filtered.map(r => {
          const att = attendance[r.id];
          const isPresent = att?.status === "present";
          const isAbsent = att?.status === "absent";
          return (
            <div key={r.id} className={cn("glass-strong rounded-2xl p-4 flex items-center gap-3 transition-all",
              isPresent && "border-2 border-success/40 bg-success/5",
              isAbsent && "border-2 border-destructive/40 bg-destructive/5",
            )}>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{r.full_name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {cName(r.committee_id)}{r.portfolio ? ` · ${r.portfolio}` : ""}{r.eb_role ? ` · ${r.eb_role.replace("_", " ")}` : ""}{r.role === "organising_committee" ? " · OC" : ""}
                </div>
                {att && <div className="text-[10px] text-muted-foreground mt-0.5">marked {new Date(att.marked_at).toLocaleTimeString()} · {att.method}</div>}
              </div>
              <Button size="sm" variant={isPresent ? "hero" : "outline"} onClick={() => setStatus(r.id, "present")}>
                <CheckCircle2 className="w-3 h-3" />
              </Button>
              <Button size="sm" variant={isAbsent ? "destructive" : "outline"} onClick={() => setStatus(r.id, "absent")}>
                <XCircle className="w-3 h-3" />
              </Button>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="md:col-span-2 glass rounded-2xl p-12 text-center text-muted-foreground">No matching registrations.</div>
        )}
      </div>

      {scannerOpen && (
        <div className="fixed inset-0 z-50 bg-foreground/80 flex items-center justify-center p-4" onClick={() => setScannerOpen(false)}>
          <div className="glass-strong rounded-3xl p-5 max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg font-bold flex items-center gap-2"><Camera className="w-4 h-4" /> Scan delegate QR</h3>
              <button onClick={() => setScannerOpen(false)} className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
            <div className="rounded-2xl overflow-hidden bg-black aspect-square">
              <Scanner onScan={handleScan} formats={["qr_code"]} components={{ finder: true }} styles={{ container: { width: "100%", height: "100%" } }} />
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">Point at the QR on a delegate's portfolio screen.</p>
          </div>
        </div>
      )}
    </div>
  );
};

const Stat = ({ label, value, color }: { label: string; value: number; color?: "success" | "destructive" | "muted" }) => (
  <div className="glass rounded-2xl p-4 text-center">
    <div className={cn("font-display text-3xl font-bold",
      color === "success" && "text-success",
      color === "destructive" && "text-destructive",
      color === "muted" && "text-muted-foreground",
    )}>{value}</div>
    <div className="text-[10px] tracking-widest text-muted-foreground font-bold mt-1">{label}</div>
  </div>
);
