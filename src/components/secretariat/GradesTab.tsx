// Admin Grades Tab — shows all marks per committee, export PDF/Excel
import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { getCommittees, getRegistrations, type Committee, type Registration } from "@/lib/munApi";
import { Download, Search, Trophy, Medal, FileText, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

type GradeEntry = {
  delegateId: string;
  delegateName: string;
  committee: string;
  committeeId: string;
  portfolio: string;
  speeches: { label: string; marks: number }[];
  total: number;
};

const STORAGE_KEY = (editionId: string) => `mun_grades_${editionId}`;

export function loadAllGrades(editionId: string): Record<string, { label: string; marks: number }[]> {
  try {
    const s = localStorage.getItem(STORAGE_KEY(editionId));
    return s ? JSON.parse(s) : {};
  } catch { return {}; }
}

export const GradesTab = ({ editionId }: { editionId: string }) => {
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [regs,       setRegs]       = useState<Registration[]>([]);
  const [search,     setSearch]     = useState("");
  const [selCmte,    setSelCmte]    = useState("all");
  const [allGrades,  setAllGrades]  = useState<Record<string, { label: string; marks: number }[]>>({});

  const refresh = () => {
    Promise.all([getCommittees(editionId), getRegistrations(editionId)]).then(([c, r]) => {
      setCommittees(c);
      setRegs(r.filter(x => x.role === "delegate" && x.payment_status === "approved"));
    });
    setAllGrades(loadAllGrades(editionId));
  };

  useEffect(() => { refresh(); }, [editionId]);

  // Rebuild every 10 s to catch EB updates in real-time
  useEffect(() => {
    const id = setInterval(() => setAllGrades(loadAllGrades(editionId)), 10_000);
    return () => clearInterval(id);
  }, [editionId]);

  const rows: GradeEntry[] = useMemo(() => {
    return regs.map(r => {
      const c       = committees.find(x => x.id === r.committee_id);
      const speeches = allGrades[r.id] ?? [];
      const total    = speeches.reduce((s, e) => s + (Number(e.marks) || 0), 0);
      return {
        delegateId:   r.id,
        delegateName: r.full_name,
        committee:    c?.short_name ?? "—",
        committeeId:  r.committee_id ?? "",
        portfolio:    r.portfolio ?? "—",
        speeches,
        total,
      };
    });
  }, [regs, committees, allGrades]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows
      .filter(r =>
        (selCmte === "all" || r.committeeId === selCmte) &&
        (!q || r.delegateName.toLowerCase().includes(q) || r.portfolio.toLowerCase().includes(q))
      )
      .sort((a, b) => b.total - a.total);
  }, [rows, selCmte, search]);

  // Committee-level subtotals
  const cmteGroups = useMemo(() => {
    const map: Record<string, GradeEntry[]> = {};
    filtered.forEach(r => {
      if (!map[r.committeeId]) map[r.committeeId] = [];
      map[r.committeeId].push(r);
    });
    return map;
  }, [filtered]);

  // ── Export Excel ──
  const exportExcel = () => {
    const rows2 = filtered.map((r, i) => ({
      Rank: i + 1,
      Delegate: r.delegateName,
      Committee: r.committee,
      Portfolio: r.portfolio,
      ...Object.fromEntries(r.speeches.map(s => [s.label, s.marks])),
      Total: r.total,
    }));
    const ws = XLSX.utils.json_to_sheet(rows2);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Grades");
    XLSX.writeFile(wb, `grades-${editionId}-${Date.now()}.xlsx`);
    toast({ title: "📦 Grades exported to Excel" });
  };

  // ── Export PDF ──
  const exportPDF = () => {
    const tableRows = filtered.map((r, i) => `
      <tr style="background:${i%2===0?"#f9fafb":"#fff"}">
        <td>${i+1}</td>
        <td>${r.delegateName}</td>
        <td>${r.committee}</td>
        <td>${r.portfolio}</td>
        ${r.speeches.map(s => `<td>${s.marks}</td>`).join("")}
        <td style="font-weight:700;color:#1d4ed8">${r.total}</td>
      </tr>`).join("");

    // Unique speech columns across all
    const allLabels = Array.from(new Set(filtered.flatMap(r => r.speeches.map(s => s.label))));
    const win = window.open("", "_blank")!;
    win.document.write(`
      <html><head><title>Grades Report</title>
      <style>
        body{font-family:sans-serif;font-size:11px;padding:16px}
        h2{margin-bottom:8px}
        table{border-collapse:collapse;width:100%}
        th{background:#1d4ed8;color:#fff;padding:6px 8px;text-align:left;font-size:10px}
        td{padding:5px 8px;border-bottom:1px solid #e5e7eb}
      </style></head><body>
      <h2>Delegate Grades — ${new Date().toLocaleDateString("en-IN")}</h2>
      <table><thead><tr>
        <th>#</th><th>Delegate</th><th>Committee</th><th>Portfolio</th>
        ${allLabels.map(l => `<th>${l}</th>`).join("")}
        <th>TOTAL</th>
      </tr></thead><tbody>${tableRows}</tbody></table>
      </body></html>`);
    win.document.close();
    win.print();
  };

  const topScore = filtered[0]?.total ?? 0;

  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Users}  label="Delegates graded" value={rows.filter(r => r.total > 0).length} />
        <StatCard icon={Trophy} label="Top score"         value={topScore}  color="warning" />
        <StatCard icon={Medal}  label="Committees"        value={committees.length} color="primary" />
        <StatCard icon={Users}  label="Total registered"  value={regs.length} />
      </div>

      {/* Filters & export */}
      <div className="glass-strong rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search delegate or portfolio…" value={search}
            onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select value={selCmte} onChange={e => setSelCmte(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="all">All committees</option>
          {committees.map(c => <option key={c.id} value={c.id}>{c.short_name}</option>)}
        </select>
        <Button variant="outline" size="sm" onClick={exportPDF}>
          <FileText className="w-4 h-4" /> PDF
        </Button>
        <Button variant="outline" size="sm" onClick={exportExcel}>
          <Download className="w-4 h-4" /> Excel
        </Button>
        <Button variant="ghost" size="sm" onClick={refresh}>Refresh</Button>
      </div>

      {/* Leaderboard — grouped by committee when "all" selected */}
      {selCmte === "all" ? (
        Object.entries(cmteGroups).map(([cmteId, entries]) => {
          const cmte = committees.find(c => c.id === cmteId);
          return (
            <div key={cmteId} className="glass-strong rounded-3xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <h3 className="font-display font-bold">{cmte?.short_name ?? "—"} — {cmte?.name}</h3>
                <span className="text-xs text-muted-foreground">({entries.length} delegates)</span>
              </div>
              <GradeTable rows={entries} />
            </div>
          );
        })
      ) : (
        <div className="glass-strong rounded-3xl p-5">
          <GradeTable rows={filtered} showRank />
        </div>
      )}

      {filtered.length === 0 && (
        <div className="glass rounded-3xl p-16 text-center text-muted-foreground">
          <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No grades recorded yet.</p>
          <p className="text-xs mt-1">EBs grade delegates from their portfolio tab.</p>
        </div>
      )}
    </div>
  );
};

const GradeTable = ({ rows, showRank = true }: { rows: GradeEntry[]; showRank?: boolean }) => {
  if (rows.length === 0) return <p className="text-xs text-muted-foreground italic">No data.</p>;
  const allLabels = Array.from(new Set(rows.flatMap(r => r.speeches.map(s => s.label))));
  return (
    <div className="overflow-x-auto rounded-xl">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            {showRank && <th className="text-left py-2 pr-3 font-bold text-muted-foreground">#</th>}
            <th className="text-left py-2 pr-3 font-bold">Delegate</th>
            <th className="text-left py-2 pr-3 font-bold">Portfolio</th>
            {allLabels.map(l => <th key={l} className="text-center py-2 px-2 font-bold text-muted-foreground min-w-[70px]">{l}</th>)}
            <th className="text-center py-2 px-3 font-bold text-primary">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.delegateId} className={cn("border-b border-border/30 transition-colors hover:bg-secondary/30",
              i === 0 && "bg-warning/5")}>
              {showRank && (
                <td className="py-2 pr-3">
                  {i === 0 ? <Trophy className="w-4 h-4 text-warning inline" />
                   : i === 1 ? <Medal className="w-4 h-4 text-muted-foreground inline" />
                   : i === 2 ? <Medal className="w-4 h-4 text-amber-600 inline" />
                   : <span className="text-muted-foreground">{i + 1}</span>}
                </td>
              )}
              <td className="py-2 pr-3 font-semibold">{r.delegateName}</td>
              <td className="py-2 pr-3 text-muted-foreground">{r.portfolio}</td>
              {allLabels.map(l => {
                const sp = r.speeches.find(s => s.label === l);
                return <td key={l} className="py-2 px-2 text-center">{sp ? sp.marks : "—"}</td>;
              })}
              <td className="py-2 px-3 text-center font-bold text-primary">{r.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color = "foreground" }: {
  icon: any; label: string; value: number; color?: string;
}) => (
  <div className="glass rounded-2xl p-4">
    <Icon className={cn("w-5 h-5 mb-2",
      color === "warning" && "text-warning",
      color === "primary" && "text-primary",
    )} />
    <div className="font-display text-2xl font-bold">{value}</div>
    <div className="text-xs text-muted-foreground">{label}</div>
  </div>
);
