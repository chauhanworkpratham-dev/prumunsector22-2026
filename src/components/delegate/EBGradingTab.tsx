// EB Grading Tab — spreadsheet/grid format, editable column headers, live leaderboard
import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { toast }  from "@/hooks/use-toast";
import { getRegistrations, getCommittees, type Registration, type Committee } from "@/lib/munApi";
import { Plus, Trophy, Save, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

type SpeechEntry = { id: string; label: string; marks: string };
type DelegateGrades = Record<string, SpeechEntry[]>;

const STORAGE_KEY = (editionId: string) => `mun_grades_${editionId}`;
const loadGrades = (id: string): DelegateGrades => { try { const s = localStorage.getItem(STORAGE_KEY(id)); return s ? JSON.parse(s) : {}; } catch { return {}; } };
const saveGrades = (id: string, d: DelegateGrades) => localStorage.setItem(STORAGE_KEY(id), JSON.stringify(d));

export const EBGradingTab = ({ editionId, committeeId }: { editionId: string; committeeId: string }) => {
  const [delegates, setDelegates] = useState<Registration[]>([]);
  const [committee, setCommittee] = useState<Committee | null>(null);
  const [grades,    setGrades]    = useState<DelegateGrades>({});

  useEffect(() => {
    Promise.all([getRegistrations(editionId), getCommittees(editionId)]).then(([regs, cmts]) => {
      setCommittee(cmts.find(c => c.id === committeeId) ?? null);
      setDelegates(regs.filter(r => r.role === "delegate" && r.committee_id === committeeId && r.payment_status === "approved"));
    });
    setGrades(loadGrades(editionId));
  }, [editionId, committeeId]);

  const total = (id: string) => (grades[id] ?? []).reduce((s, e) => s + (parseFloat(e.marks) || 0), 0);

  const allCols = useMemo(() => {
    const set = new Set<string>();
    delegates.forEach(d => (grades[d.id] ?? []).forEach(e => set.add(e.label)));
    return Array.from(set);
  }, [delegates, grades]);

  const addColumn = () => {
    const label = `Speech ${allCols.length + 1}`;
    setGrades(prev => {
      const next = { ...prev };
      delegates.forEach(d => {
        next[d.id] = [...(next[d.id] ?? []), { id: `sp-${d.id}-${Date.now()}`, label, marks: "" }];
      });
      saveGrades(editionId, next);
      return next;
    });
  };

  const renameCol = (oldLabel: string, newLabel: string) => {
    setGrades(prev => {
      const next = { ...prev };
      delegates.forEach(d => { next[d.id] = (next[d.id] ?? []).map(e => e.label === oldLabel ? { ...e, label: newLabel } : e); });
      saveGrades(editionId, next);
      return next;
    });
  };

  const setMark = (delegateId: string, col: string, val: string) => {
    setGrades(prev => {
      const entries = prev[delegateId] ?? [];
      const exists  = entries.find(e => e.label === col);
      const next = exists
        ? entries.map(e => e.label === col ? { ...e, marks: val } : e)
        : [...entries, { id: `sp-${delegateId}-${col}`, label: col, marks: val }];
      const updated = { ...prev, [delegateId]: next };
      saveGrades(editionId, updated);
      return updated;
    });
  };

  const leaderboard = useMemo(() =>
    delegates.map(d => ({ d, t: total(d.id) })).sort((a, b) => b.t - a.t),
    [delegates, grades]
  );

  const exportExcel = () => {
    const rows = leaderboard.map(({ d, t }, i) => {
      const row: any = { Rank: i+1, Delegate: d.full_name, Portfolio: d.portfolio ?? "" };
      allCols.forEach(col => { const sp = (grades[d.id] ?? []).find(e => e.label === col); row[col] = sp ? parseFloat(sp.marks) || 0 : 0; });
      row.Total = t;
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, committee?.short_name ?? "Grades");
    XLSX.writeFile(wb, `grades-${committee?.short_name ?? "sheet"}-${Date.now()}.xlsx`);
    toast({ title: "📦 Exported" });
  };

  if (!committee) return <div className="text-center text-muted-foreground py-12">Loading…</div>;

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">{committee.short_name} — Grading Sheet</h2>
          <p className="text-xs text-muted-foreground">{delegates.length} approved delegates · auto-saved</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={addColumn}><Plus className="w-4 h-4" /> Add Column</Button>
          <Button variant="outline" size="sm" onClick={exportExcel}><Download className="w-4 h-4" /> Excel</Button>
          <Button variant="hero"    size="sm" onClick={() => { saveGrades(editionId, grades); toast({ title: "✅ Saved" }); }}>
            <Save className="w-4 h-4" /> Save
          </Button>
        </div>
      </div>

      {delegates.length === 0 && (
        <div className="glass rounded-3xl p-16 text-center text-muted-foreground">
          <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No approved delegates in this committee.</p>
        </div>
      )}

      {/* ── Spreadsheet ── */}
      {delegates.length > 0 && (
        <div className="glass-strong rounded-2xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-primary/6 border-b-2 border-primary/20">
                  <th className="text-left px-4 py-3 font-bold text-xs sticky left-0 bg-primary/6 min-w-[160px] z-10">Delegate</th>
                  <th className="text-left px-3 py-3 font-bold text-xs text-muted-foreground min-w-[110px]">Portfolio</th>
                  {allCols.map(col => (
                    <th key={col} className="px-2 py-2 min-w-[120px]">
                      <Input
                        value={col}
                        onChange={e => renameCol(col, e.target.value)}
                        className="h-7 text-xs text-center font-bold border-primary/30 bg-white/60"
                      />
                    </th>
                  ))}
                  <th className="px-4 py-3 text-xs font-black text-primary text-center min-w-[80px]">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {delegates.map((d, ri) => {
                  const t = total(d.id);
                  return (
                    <tr key={d.id} className={cn(
                      "border-b border-border/40 hover:bg-blue-50/40 transition-colors",
                      ri % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                    )}>
                      <td className="px-4 py-2.5 font-semibold text-[13px] sticky left-0 bg-inherit z-10 whitespace-nowrap">{d.full_name}</td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{d.portfolio ?? "—"}</td>
                      {allCols.map(col => {
                        const val = (grades[d.id] ?? []).find(e => e.label === col)?.marks ?? "";
                        return (
                          <td key={col} className="px-2 py-1.5">
                            <Input
                              type="number" min={0}
                              value={val}
                              onChange={ev => setMark(d.id, col, ev.target.value)}
                              className="h-8 text-center text-sm font-semibold w-full border-border/50 hover:border-primary/40 focus:border-primary"
                              placeholder="—"
                            />
                          </td>
                        );
                      })}
                      <td className="px-4 py-2.5 text-center">
                        <span className={cn(
                          "font-black text-sm px-2.5 py-1 rounded-full",
                          t > 0 ? "bg-primary/10 text-primary" : "text-muted-foreground"
                        )}>{t > 0 ? t : "—"}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {leaderboard.some(x => x.t > 0) && (
        <div className="glass-strong rounded-3xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-warning" />
            <h3 className="font-display font-bold text-lg">Live Leaderboard</h3>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
            {leaderboard.filter(x => x.t > 0).map(({ d, t }, i) => (
              <div key={d.id} className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 border",
                i === 0 ? "bg-warning/8 border-warning/25" :
                i === 1 ? "bg-slate-50 border-border/60" :
                i === 2 ? "bg-amber-50/50 border-amber-200/40" : "bg-white border-border/40"
              )}>
                <span className="text-xl shrink-0">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i+1}.`}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{d.full_name}</p>
                  <p className="text-xs text-muted-foreground">{d.portfolio ?? "—"}</p>
                </div>
                <span className={cn("font-black text-base tabular-nums", i === 0 && "text-warning")}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
