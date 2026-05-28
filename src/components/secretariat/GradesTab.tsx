import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { getCommittees, getRegistrations, type Committee, type Registration } from "@/lib/munApi";
import { Trophy, Download, RefreshCw, TrendingUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

type ScoreBoardRow = {
  rank: number;
  delegateName: string;
  portfolio: string;
  committee: string;
  scores: number[];
  total: number;
  average: number;
};

export const GradesTab = ({ editionId }: { editionId: string }) => {
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [scoreboards, setScoreboards] = useState<Record<string, any[]>>({});
  const [selectedCommittee, setSelectedCommittee] = useState<string>("all");
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const [comms, regs] = await Promise.all([
        getCommittees(editionId),
        getRegistrations(editionId)
      ]);
      setCommittees(comms);
      setRegistrations(regs);

      // Load all scoreboards from localStorage
      const allScoreboards: Record<string, any[]> = {};
      comms.forEach(c => {
        const key = `mun_live_scoreboard_publish_${editionId}_${c.id}`;
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            allScoreboards[c.id] = JSON.parse(stored).scoreboard || [];
          } catch {}
        }
      });
      setScoreboards(allScoreboards);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load grades data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000); // Auto-sync every 5s
    return () => clearInterval(interval);
  }, [editionId]);

  const getCommitteeName = (id: string) => committees.find(c => c.id === id)?.short_name || id;

  // Aggregate all scoreboards
  const allScores = Object.entries(scoreboards)
    .flatMap(([committeeId, scores]) =>
      (scores || []).map((s: any) => ({
        ...s,
        committeeId,
        committeeName: getCommitteeName(committeeId)
      }))
    )
    .sort((a, b) => b.total - a.total);

  const filteredScores = selectedCommittee === "all"
    ? allScores
    : allScores.filter(s => s.committeeId === selectedCommittee);

  const stats = {
    totalGraded: filteredScores.length,
    avgScore: filteredScores.length > 0
      ? (filteredScores.reduce((sum, s) => sum + s.total, 0) / filteredScores.length).toFixed(2)
      : "—",
    highestScore: filteredScores.length > 0 ? Math.max(...filteredScores.map(s => s.total)) : "—",
  };

  const exportToExcel = () => {
    const data = filteredScores.map((s, idx) => ({
      Rank: idx + 1,
      "Delegate Name": s.delegateName,
      Committee: s.committeeName,
      Portfolio: s.country,
      "Total Score": s.total,
      "Average Score": s.average,
      "Speeches": s.scores.length,
      "Score Breakdown": s.scores.join(" | "),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leaderboard");
    XLSX.writeFile(wb, `PruMUN_Leaderboard_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast({ title: "✅ Exported", description: `${filteredScores.length} scores exported to Excel` });
  };

  const exportToPDF = () => {
    // For now, show a message. In production, use a PDF library
    toast({ title: "📄 PDF Export", description: "PDF export coming soon. Use print preview for now." });
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={Users} label="Total Graded" value={stats.totalGraded} />
        <StatCard icon={Trophy} label="Average Score" value={stats.avgScore} />
        <StatCard icon={TrendingUp} label="Highest Score" value={stats.highestScore} />
      </div>

      {/* Controls */}
      <div className="glass-strong rounded-2xl p-4 space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Filter by Committee:</label>
            <select
              value={selectedCommittee}
              onChange={(e) => setSelectedCommittee(e.target.value)}
              className="mt-1 h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Committees</option>
              {committees.map(c => (
                <option key={c.id} value={c.id}>{c.short_name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <Download className="w-4 h-4" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={exportToPDF}>
            <Download className="w-4 h-4" /> PDF
          </Button>
        </div>
      </div>

      {/* Leaderboard Table */}
      {filteredScores.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-semibold">No grades recorded yet</p>
          <p className="text-sm">Grades will appear here once EBs submit scorecards for their committees.</p>
        </div>
      ) : (
        <div className="glass-strong rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-muted-foreground uppercase font-bold text-xs tracking-wider border-b border-border/40">
                <tr>
                  <th className="p-4 text-center w-12">Rank</th>
                  <th className="p-4 text-left">Delegate Name</th>
                  <th className="p-4 text-left">Committee</th>
                  <th className="p-4 text-left">Portfolio</th>
                  <th className="p-4 text-center">Speeches</th>
                  <th className="p-4 text-center">Total Score</th>
                  <th className="p-4 text-center">Average</th>
                  <th className="p-4 text-left">Score Breakdown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredScores.map((score, idx) => (
                  <tr key={`${score.committeeId}-${score.registrationId}`} className="hover:bg-secondary/25 transition-colors">
                    <td className="p-4 text-center font-bold text-primary text-lg">
                      {selectedCommittee === "all" ? idx + 1 : idx + 1}
                    </td>
                    <td className="p-4 font-semibold text-foreground">{score.delegateName}</td>
                    <td className="p-4 text-primary-deep font-medium">{score.committeeName}</td>
                    <td className="p-4 text-muted-foreground">{score.country}</td>
                    <td className="p-4 text-center font-semibold">{score.scores?.length || 0}</td>
                    <td className="p-4 text-center font-bold text-success text-lg">{score.total}</td>
                    <td className="p-4 text-center font-semibold text-primary">{score.average?.toFixed(2)}</td>
                    <td className="p-4 text-xs font-mono text-muted-foreground">{score.scores?.join(" | ") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer info */}
      <div className="text-xs text-muted-foreground text-center">
        Grades auto-sync every 5 seconds. Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) => (
  <div className="glass rounded-2xl p-4 text-center">
    <div className="w-10 h-10 mx-auto rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
      <Icon className="w-5 h-5" />
    </div>
    <div className="text-xs text-muted-foreground font-semibold">{label}</div>
    <div className="text-2xl font-bold gradient-text-deep mt-1">{value}</div>
  </div>
);
