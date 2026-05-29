// EB Grading Tab — grade delegates, speech boxes, leaderboard, persistent via localStorage
import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { getRegistrations, getCommittees, type Registration, type Committee } from "@/lib/munApi";
import { Plus, Trash2, Trophy, Medal, Save, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type SpeechEntry = { id: string; label: string; marks: string };
type DelegateGrades = Record<string, SpeechEntry[]>; // delegateId → entries

const STORAGE_KEY = (editionId: string) => `mun_grades_${editionId}`;

const loadGrades = (editionId: string): DelegateGrades => {
  try { const s = localStorage.getItem(STORAGE_KEY(editionId)); return s ? JSON.parse(s) : {}; }
  catch { return {}; }
};
const saveGrades = (editionId: string, data: DelegateGrades) => {
  localStorage.setItem(STORAGE_KEY(editionId), JSON.stringify(data));
};

export const EBGradingTab = ({ editionId, committeeId }: { editionId: string; committeeId: string }) => {
  const [delegates, setDelegates] = useState<Registration[]>([]);
  const [committee, setCommittee] = useState<Committee | null>(null);
  const [grades,    setGrades]    = useState<DelegateGrades>({});
  const [expanded,  setExpanded]  = useState<Record<string, boolean>>({});

  useEffect(() => {
    Promise.all([getRegistrations(editionId), getCommittees(editionId)]).then(([regs, cmts]) => {
      const cmte = cmts.find(c => c.id === committeeId) ?? null;
      setCommittee(cmte);
      setDelegates(regs.filter(r =>
        r.role === "delegate" &&
        r.committee_id === committeeId &&
        r.payment_status === "approved"
      ));
    });
    setGrades(loadGrades(editionId));
  }, [editionId, committeeId]);

  const updateEntry = (delegateId: string, entryId: string, field: "label" | "marks", val: string) => {
    setGrades(prev => {
      const entries = (prev[delegateId] ?? []).map(e => e.id === entryId ? { ...e, [field]: val } : e);
      const next = { ...prev, [delegateId]: entries };
      saveGrades(editionId, next);
      return next;
    });
  };

  const addSpeech = (delegateId: string) => {
    setGrades(prev => {
      const entries = [...(prev[delegateId] ?? []), { id: `sp-${Date.now()}`, label: `Speech ${(prev[delegateId]?.length ?? 0) + 1}`, marks: "" }];
      const next = { ...prev, [delegateId]: entries };
      saveGrades(editionId, next);
      return next;
    });
    setExpanded(p => ({ ...p, [delegateId]: true }));
  };

  const removeSpeech = (delegateId: string, entryId: string) => {
    setGrades(prev => {
      const entries = (prev[delegateId] ?? []).filter(e => e.id !== entryId);
      const next = { ...prev, [delegateId]: entries };
      saveGrades(editionId, next);
      return next;
    });
  };

  const total = (delegateId: string) =>
    (grades[delegateId] ?? []).reduce((s, e) => s + (parseFloat(e.marks) || 0), 0);

  const saveAll = () => { saveGrades(editionId, grades); toast({ title: "✅ Grades saved" }); };

  // Build leaderboard
  const leaderboard = useMemo(() =>
    delegates
      .map(d => ({ d, t: total(d.id) }))
      .sort((a, b) => b.t - a.t),
    [delegates, grades]
  );

  if (!committee) return <div className="text-center text-muted-foreground py-12">Loading committee…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">{committee.short_name} — Grading</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {delegates.length} approved delegates · Grades auto-save on every change
          </p>
        </div>
        <Button variant="hero" size="sm" onClick={saveAll}><Save className="w-4 h-4" /> Save all</Button>
      </div>

      {delegates.length === 0 && (
        <div className="glass rounded-3xl p-16 text-center text-muted-foreground">
          <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No approved delegates in this committee yet.</p>
        </div>
      )}

      {/* Per-delegate grading cards */}
      <div className="space-y-3">
        {delegates.map(d => {
          const entries = grades[d.id] ?? [];
          const t       = total(d.id);
          const isOpen  = expanded[d.id] ?? entries.length > 0;
          return (
            <div key={d.id} className="glass-strong rounded-2xl overflow-hidden">
              {/* Header row */}
              <button
                type="button"
                onClick={() => setExpanded(p => ({ ...p, [d.id]: !isOpen }))}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-secondary/30 transition-colors text-left"
              >
                {isOpen ? <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />
                        : <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />}
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-sm">{d.full_name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{d.portfolio ?? "—"}</span>
                </div>
                <span className="text-sm font-bold text-primary mr-2">Total: {t}</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  onClick={e => { e.stopPropagation(); addSpeech(d.id); }}
                >
                  <Plus className="w-3 h-3" /> Add Speech
                </Button>
              </button>

              {/* Entries */}
              {isOpen && (
                <div className="px-5 pb-4 space-y-2 border-t border-border/40 pt-3">
                  {entries.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
                      No speeches yet. Click "Add Speech" to start grading.
                    </p>
                  ) : (
                    entries.map(e => (
                      <div key={e.id} className="flex items-center gap-2">
                        <Input
                          value={e.label}
                          onChange={ev => updateEntry(d.id, e.id, "label", ev.target.value)}
                          className="flex-1 h-9 text-sm"
                          placeholder="Label e.g. Opening speech"
                        />
                        <Input
                          type="number"
                          min={0}
                          value={e.marks}
                          onChange={ev => updateEntry(d.id, e.id, "marks", ev.target.value)}
                          className="w-24 h-9 text-sm text-center"
                          placeholder="Marks"
                        />
                        <button onClick={() => removeSpeech(d.id, e.id)}
                          className="text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                  {entries.length > 0 && (
                    <div className="flex justify-end pt-1">
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary">
                        Total: {t}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Leaderboard */}
      {leaderboard.some(x => x.t > 0) && (
        <div className="glass-strong rounded-3xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-warning" />
            <h3 className="font-display font-bold text-lg">Live Leaderboard</h3>
          </div>
          <div className="space-y-2">
            {leaderboard.map(({ d, t }, i) => (
              <div key={d.id} className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-2.5 transition-colors",
                i === 0 ? "bg-warning/10 border border-warning/20" :
                i === 1 ? "bg-secondary/50" :
                i === 2 ? "bg-secondary/30" : ""
              )}>
                <div className="w-7 flex justify-center shrink-0">
                  {i === 0 ? <Trophy className="w-5 h-5 text-warning" />
                   : i === 1 ? <Medal className="w-4 h-4 text-slate-400" />
                   : i === 2 ? <Medal className="w-4 h-4 text-amber-600" />
                   : <span className="text-xs text-muted-foreground font-bold">{i + 1}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{d.full_name}</p>
                  <p className="text-xs text-muted-foreground">{d.portfolio ?? "—"}</p>
                </div>
                <span className={cn("font-bold text-sm", i === 0 && "text-warning")}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
