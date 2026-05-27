import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  getArchives, getAllEditions, startNewEdition, downloadArchiveJSON, downloadArchiveCSV,
  hardResetEverything, type Archive, type Edition,
} from "@/lib/munApi";
import { Archive as ArchiveIcon, Download, Sparkles, Calendar, AlertTriangle } from "lucide-react";

export const EditionsTab = ({ activeEdition, onChanged }: { activeEdition: Edition; onChanged: () => void }) => {
  const [archives, setArchives] = useState<Archive[]>([]);
  const [editions, setEditions] = useState<Edition[]>([]);
  const [newName, setNewName] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetting, setResetting] = useState(false);

  const refresh = () => Promise.all([getArchives(), getAllEditions()]).then(([a, e]) => { setArchives(a); setEditions(e); });
  useEffect(() => { refresh(); }, []);

  const startNew = async () => {
    if (!newName.trim() || !newDate) { toast({ title: "Name and start date required", variant: "destructive" }); return; }
    if (!confirm(`This will archive "${activeEdition.name}" and start "${newName}" as the new active edition. Proceed?`)) return;
    setBusy(true);
    try {
      await startNewEdition(activeEdition.id, newName, new Date(newDate).toISOString());
      toast({ title: "🎉 New edition started", description: `${activeEdition.name} archived. Welcome to ${newName}!` });
      setNewName(""); setNewDate(""); setNewEndDate("");
      refresh(); onChanged();
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const resetEverything = async () => {
    const confirmText = prompt(`This will WIPE every delegate registration, every announcement, and every archive for "${activeEdition.name}". Type RESET to confirm.`);
    if (confirmText !== "RESET") return;
    setResetting(true);
    try {
      await hardResetEverything(activeEdition.id);
      toast({ title: "🧹 Reset complete", description: "Matrix, announcements and archives wiped." });
      refresh(); onChanged();
    } catch (e: any) {
      toast({ title: "Reset failed", description: e.message, variant: "destructive" });
    } finally { setResetting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="glass-strong rounded-3xl p-6 border-2 border-primary/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-primary text-primary-foreground flex items-center justify-center"><Sparkles className="w-6 h-6" /></div>
          <div>
            <h3 className="font-display text-xl font-bold">Start New Edition</h3>
            <p className="text-xs text-muted-foreground">Archive the current edition and begin fresh. Committee templates will be copied forward.</p>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-3 mb-3">
          <div className="space-y-1.5"><Label>New edition name</Label><Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="PRUMUN 2027" /></div>
          <div className="space-y-1.5"><Label>Event start date</Label><Input type="datetime-local" value={newDate} onChange={e => setNewDate(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Event end date (optional)</Label><Input type="datetime-local" value={newEndDate} onChange={e => setNewEndDate(e.target.value)} /></div>
        </div>
        <Button variant="hero" onClick={startNew} disabled={busy}>{busy ? "Working…" : "🚀 Archive & Start New Edition"}</Button>
      </div>

      <div className="glass-strong rounded-3xl p-6 border-2 border-destructive/40">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center"><AlertTriangle className="w-6 h-6" /></div>
          <div>
            <h3 className="font-display text-xl font-bold text-destructive">Danger Zone — Reset Everything</h3>
            <p className="text-xs text-muted-foreground">Wipes the live matrix (all registrations), all announcements, and every archive. The current edition shell stays intact. Use only at the start of a brand-new conference cycle.</p>
          </div>
        </div>
        <Button variant="destructive" onClick={resetEverything} disabled={resetting}>
          {resetting ? "Resetting…" : "⚠️ Reset Matrix, Announcements & Archives"}
        </Button>
      </div>

      <div>
        <h3 className="font-display text-xl font-bold mb-3 flex items-center gap-2"><ArchiveIcon className="w-5 h-5" /> Past Editions Archive</h3>
        {archives.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-muted-foreground text-sm">No archives yet. The first archive is created when you start a new edition.</div>
        ) : (
          <div className="space-y-2">
            {archives.map(a => (
              <div key={a.id} className="glass-strong rounded-2xl p-4 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{a.edition_name}</div>
                  <div className="text-xs text-muted-foreground">Held {new Date(a.event_date).toLocaleDateString()} · {a.delegate_count} delegates · Archived {new Date(a.created_at).toLocaleDateString()}</div>
                </div>
                <Button variant="outline" size="sm" onClick={() => downloadArchiveJSON(a)}><Download className="w-3 h-3" /> JSON</Button>
                <Button variant="outline" size="sm" onClick={() => downloadArchiveCSV(a)}><Download className="w-3 h-3" /> CSV</Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h4 className="font-semibold text-sm text-muted-foreground mb-2">All editions ({editions.length})</h4>
        <div className="space-y-1">
          {editions.map(e => (
            <div key={e.id} className="text-xs flex items-center gap-2 p-2 rounded">
              <span className={`w-2 h-2 rounded-full ${e.is_active ? "bg-success" : "bg-muted-foreground/50"}`} />
              <span className="font-semibold">{e.name}</span>
              <span className="text-muted-foreground">· {new Date(e.event_date).toLocaleDateString()}</span>
              {e.is_active && <span className="text-success font-bold ml-1">ACTIVE</span>}
              {e.archived_at && <span className="text-muted-foreground ml-1">archived</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
