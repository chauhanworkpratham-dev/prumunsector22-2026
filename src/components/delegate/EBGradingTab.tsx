import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { 
  getRegistrations, type Registration, type Committee, downloadCSV 
} from "@/lib/munApi";
import { 
  Gavel, Plus, Printer, Award, Calculator, Save, 
  Trash2, ShieldAlert, CheckCircle, TrendingUp 
} from "lucide-react";

type GradeRow = {
  registrationId: string;
  delegateName: string;
  country: string;
  scores: number[]; // variable length speech scores
};

export const EBGradingTab = ({ 
  committee, editionId 
}: { 
  committee: Committee; editionId: string;
}) => {
  const [delegates, setDelegates] = useState<Registration[]>([]);
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [calculatedScoreboard, setCalculatedScoreboard] = useState<any[] | null>(null);

  useEffect(() => {
    // Fetch all registrations in this committee
    getRegistrations(editionId).then(regs => {
      const filtered = regs.filter(r => r.committee_id === committee.id && r.role === "delegate");
      setDelegates(filtered);
      
      // Load or initialize grades
      const localKey = `mun_eb_grades_${editionId}_${committee.id}`;
      const saved = localStorage.getItem(localKey);
      if (saved) {
        setGrades(JSON.parse(saved));
      } else {
        const init = filtered.map(d => ({
          registrationId: d.id,
          delegateName: d.full_name,
          country: d.portfolio || "Unassigned",
          scores: [0, 0, 0] // 3 default speech boxes
        }));
        setGrades(init);
        localStorage.setItem(localKey, JSON.stringify(init));
      }
    });
  }, [committee.id, editionId]);

  const saveGradesLocally = (updated: GradeRow[]) => {
    setGrades(updated);
    localStorage.setItem(`mun_eb_grades_${editionId}_${committee.id}`, JSON.stringify(updated));
    
    // Sync to global admin live view key
    localStorage.setItem(`mun_live_eb_grades_sync_${editionId}_${committee.id}`, JSON.stringify({
      committeeId: committee.id,
      committeeName: committee.short_name,
      lastUpdated: new Date().toISOString(),
      grades: updated
    }));
  };

  const handleScoreChange = (regId: string, speechIndex: number, val: number) => {
    const updated = grades.map(g => {
      if (g.registrationId === regId) {
        const copy = [...g.scores];
        copy[speechIndex] = val;
        return { ...g, scores: copy };
      }
      return g;
    });
    saveGradesLocally(updated);
  };

  const handleAddSpeechBox = (regId: string) => {
    const updated = grades.map(g => {
      if (g.registrationId === regId) {
        return { ...g, scores: [...g.scores, 0] };
      }
      return g;
    });
    saveGradesLocally(updated);
    toast({ title: "🎤 Speech box added", description: "A new marking cell has been added for this delegate." });
  };

  const handleCalculateScoreboard = () => {
    const list = grades.map(g => {
      const sum = g.scores.reduce((a, b) => a + b, 0);
      const avg = g.scores.length > 0 ? Number((sum / g.scores.length).toFixed(2)) : 0;
      return {
        ...g,
        total: sum,
        average: avg
      };
    });
    
    // Sort highest to lowest
    const sorted = list.sort((a, b) => b.total - a.total);
    setCalculatedScoreboard(sorted);
    
    // Sync completed scoreboard to admin in real-time
    localStorage.setItem(`mun_live_scoreboard_publish_${editionId}_${committee.id}`, JSON.stringify({
      committeeId: committee.id,
      committeeName: committee.short_name,
      publishedAt: new Date().toISOString(),
      scoreboard: sorted
    }));
    
    toast({ title: "🏆 Ranked Scoreboard Published!", description: "Results compiled and pushed to administrative portal." });
  };

  const handleExportCSV = () => {
    if (!calculatedScoreboard) return;
    const headers = ["Rank", "Delegate Name", "Country/Portfolio", "Speeches Scored", "Individual Scores", "Total Score", "Average Score"];
    const rows = calculatedScoreboard.map((row, i) => [
      i + 1,
      row.delegateName,
      row.country,
      row.scores.length,
      row.scores.join(" | "),
      row.total,
      row.average
    ]);
    downloadCSV(`${committee.short_name}_Scoreboard_Export.csv`, headers, rows);
    toast({ title: "📊 Scoreboard exported to Excel CSV!" });
  };

  return (
    <div className="glass-strong rounded-3xl p-6 space-y-6 text-left animate-fade-in">
      <div className="flex flex-wrap justify-between items-center gap-4 border-b border-border/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Gavel className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold">EB Grading Vault</h3>
            <p className="text-xs text-muted-foreground">Committee: <span className="font-semibold text-primary">{committee.name} ({committee.short_name})</span></p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-1.5" /> Print
          </Button>
          <Button variant="hero" size="sm" className="rounded-xl" onClick={handleCalculateScoreboard}>
            <Calculator className="w-4 h-4 mr-1.5" /> Calculate Scoreboard
          </Button>
        </div>
      </div>

      {grades.length === 0 ? (
        <div className="text-center text-xs text-muted-foreground py-10 border border-dashed rounded-2xl">
          No delegates registered in this committee yet to grade.
        </div>
      ) : (
        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
          {grades.map(g => (
            <div key={g.registrationId} className="glass rounded-2xl p-4 border border-border/40 hover:border-primary/20 flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h4 className="font-bold truncate text-sm">{g.delegateName}</h4>
                <p className="text-xs text-primary font-semibold">{g.country}</p>
              </div>

              {/* Dynamic Speeches inputs */}
              <div className="flex flex-wrap items-center gap-2">
                {g.scores.map((score, sIdx) => (
                  <div key={sIdx} className="space-y-1">
                    <span className="text-[9px] font-bold text-muted-foreground block text-center">SP {sIdx + 1}</span>
                    <Input 
                      type="number" 
                      min={0} 
                      max={10} 
                      value={score} 
                      onChange={e => handleScoreChange(g.registrationId, sIdx, Number(e.target.value) || 0)} 
                      className="w-12 h-9 text-center p-1 rounded-lg text-xs"
                    />
                  </div>
                ))}
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleAddSpeechBox(g.registrationId)}
                  className="h-9 px-2.5 rounded-lg border-dashed mt-4 text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Speech
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Calculated Ranked Scoreboard Section */}
      {calculatedScoreboard && (
        <div className="border-t border-border/40 pt-6 mt-6 space-y-4 animate-fade-in">
          <div className="flex justify-between items-center">
            <h4 className="font-display font-bold text-base flex items-center gap-1.5 text-success">
              <Award className="w-5 h-5" /> Ranked Committee Scoreboard
            </h4>
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="text-xs rounded-xl">
              Export Excel CSV
            </Button>
          </div>

          <div className="glass rounded-2xl overflow-hidden border border-border/50">
            <table className="w-full text-xs text-left">
              <thead className="bg-secondary/40 text-muted-foreground uppercase font-bold text-[9px] tracking-wider border-b border-border/40">
                <tr>
                  <th className="p-3 text-center w-12">Rank</th>
                  <th className="p-3">Delegate</th>
                  <th className="p-3">Portfolio</th>
                  <th className="p-3 text-center">Speeches</th>
                  <th className="p-3 text-center">Scores Matrix</th>
                  <th className="p-3 text-center w-20">Total</th>
                  <th className="p-3 text-center w-20">Average</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {calculatedScoreboard.map((row, idx) => (
                  <tr key={row.registrationId} className="hover:bg-secondary/25 transition-colors">
                    <td className="p-3 text-center font-bold text-primary">{idx + 1}</td>
                    <td className="p-3 font-semibold text-foreground">{row.delegateName}</td>
                    <td className="p-3 text-primary-deep font-medium">{row.country}</td>
                    <td className="p-3 text-center">{row.scores.length}</td>
                    <td className="p-3 text-center font-mono text-muted-foreground">{row.scores.join(" , ")}</td>
                    <td className="p-3 text-center font-bold text-foreground">{row.total}</td>
                    <td className="p-3 text-center font-bold text-success">{row.average}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
