import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { getCommittees, createCommittee, updateCommittee, deleteCommittee, downloadCSV, type Committee } from "@/lib/munApi";
import { Plus, Trash2, Save, Users, Download } from "lucide-react";

export const CommitteesTab = ({ editionId }: { editionId: string }) => {
  const [items, setItems] = useState<Committee[]>([]);
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [agenda, setAgenda] = useState("");
  const [portfolios, setPortfolios] = useState("");
  const [isTeam, setIsTeam] = useState(false);
  const [teamSize, setTeamSize] = useState(4);
  const [roomNumber, setRoomNumber] = useState("");

  const refresh = () => getCommittees(editionId).then(setItems);
  useEffect(() => { refresh(); }, [editionId]);

  const add = async () => {
    if (!name.trim() || !shortName.trim()) { toast({ title: "Name & short name required", variant: "destructive" }); return; }
    const { error } = await createCommittee({
      edition_id: editionId, name, short_name: shortName, agenda, description: null,
      difficulty: "Intermediate", portfolios: portfolios.split(",").map(p => p.trim()).filter(Boolean),
      sort_order: items.length,
      is_team_committee: isTeam,
      team_size: isTeam ? Math.max(2, teamSize) : 1,
      room_number: roomNumber.trim() || null,
    });
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    setName(""); setShortName(""); setAgenda(""); setPortfolios(""); setIsTeam(false); setTeamSize(4); setRoomNumber("");
    refresh();
    toast({ title: "Committee added" });
  };
  const save = async (c: Committee, patch: Partial<Committee>) => {
    const { error } = await updateCommittee(c.id, patch);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    refresh(); toast({ title: "Saved" });
  };
  const remove = async (id: string) => { if (confirm("Delete committee and all its registrations?")) { await deleteCommittee(id); refresh(); } };

  const exportCSV = () => {
    downloadCSV(`committees-${Date.now()}.csv`,
      ["Short name", "Name", "Difficulty", "Room", "Team committee", "Team size", "Portfolios", "Agenda"],
      items.map(c => [c.short_name, c.name, c.difficulty, c.room_number ?? "", c.is_team_committee ? "YES" : "NO",
        String(c.team_size), c.portfolios.join(" | "), c.agenda]));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4" /> CSV</Button>
      </div>
      <div className="glass-strong rounded-3xl p-6 space-y-3">
        <h3 className="font-display text-xl font-bold">Add Committee</h3>
        <div className="grid md:grid-cols-3 gap-3">
          <div className="space-y-1.5 md:col-span-1"><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Short name</Label><Input value={shortName} onChange={e => setShortName(e.target.value)} placeholder="UNSC" /></div>
          <div className="space-y-1.5"><Label>Room number</Label><Input value={roomNumber} onChange={e => setRoomNumber(e.target.value)} placeholder="001" /></div>
        </div>
        <div className="space-y-1.5"><Label>Agenda</Label><Textarea value={agenda} onChange={e => setAgenda(e.target.value)} rows={2} /></div>
        <div className="space-y-1.5"><Label>Portfolios (comma-separated)</Label><Textarea value={portfolios} onChange={e => setPortfolios(e.target.value)} rows={3} placeholder="USA, China, India, …" /></div>

        <div className="glass rounded-xl p-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <Switch checked={isTeam} onCheckedChange={setIsTeam} id="team-toggle" />
            <Label htmlFor="team-toggle" className="cursor-pointer flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Team committee (4-in-1 style)
            </Label>
          </div>
          {isTeam && (
            <div className="flex items-center gap-2">
              <Label className="text-xs">Team size</Label>
              <Input type="number" min={2} max={8} value={teamSize} onChange={e => setTeamSize(Number(e.target.value) || 4)} className="w-20" />
            </div>
          )}
        </div>
        {isTeam && <p className="text-xs text-muted-foreground">Team mode: one delegate registers and pre-assigns portfolios for {teamSize - 1} teammates by email. Teammates finish their own ID upload to claim their seat.</p>}

        <Button variant="hero" onClick={add}><Plus className="w-4 h-4" /> Add</Button>
      </div>

      <div className="space-y-3">
        {items.map(c => (
          <CommitteeRow key={c.id} c={c} onSave={save} onDelete={remove} />
        ))}
      </div>
    </div>
  );
};

const CommitteeRow = ({ c, onSave, onDelete }: { c: Committee; onSave: (c: Committee, p: Partial<Committee>) => void; onDelete: (id: string) => void }) => {
  const [agenda, setAgenda] = useState(c.agenda);
  const [portfolios, setPortfolios] = useState(c.portfolios.join(", "));
  const [isTeam, setIsTeam] = useState(c.is_team_committee);
  const [teamSize, setTeamSize] = useState(c.team_size);
  const [difficulty, setDifficulty] = useState<Committee["difficulty"]>(c.difficulty);
  const [roomNumber, setRoomNumber] = useState(c.room_number ?? "");
  return (
    <div className="glass-strong rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="min-w-0">
          <span className="text-xs font-bold text-primary tracking-widest">{c.short_name}</span>
          <h4 className="font-bold truncate">{c.name}</h4>
          {c.is_team_committee && <span className="text-[10px] font-bold tracking-widest text-primary px-2 py-0.5 rounded-full bg-primary/10 inline-flex items-center gap-1 mt-1"><Users className="w-3 h-3" /> TEAM OF {c.team_size}</span>}
        </div>
        <Button variant="ghost" size="sm" onClick={() => onDelete(c.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
      </div>
      <div className="space-y-2">
        <Textarea value={agenda} onChange={e => setAgenda(e.target.value)} rows={2} />
        <Textarea value={portfolios} onChange={e => setPortfolios(e.target.value)} rows={3} />
        <div className="flex items-center gap-3 glass rounded-xl p-3 flex-wrap">
          <Label className="text-xs">Difficulty</Label>
          <select value={difficulty} onChange={e => setDifficulty(e.target.value as Committee["difficulty"])}
            className="h-9 rounded-md border border-input bg-background px-2 text-xs font-semibold">
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
          <div className="w-px h-5 bg-border mx-1" />
          <Label className="text-xs">Room</Label>
          <Input value={roomNumber} onChange={e => setRoomNumber(e.target.value)} placeholder="001" className="w-24 h-9" />
          <div className="w-px h-5 bg-border mx-1" />
          <Switch checked={isTeam} onCheckedChange={setIsTeam} id={`team-${c.id}`} />
          <Label htmlFor={`team-${c.id}`} className="text-xs flex items-center gap-1"><Users className="w-3 h-3" /> Team committee</Label>
          {isTeam && (
            <>
              <Label className="text-xs ml-auto">Team size</Label>
              <Input type="number" min={2} max={8} value={teamSize} onChange={e => setTeamSize(Number(e.target.value) || 4)} className="w-20" />
            </>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => onSave(c, {
          agenda,
          portfolios: portfolios.split(",").map(p => p.trim()).filter(Boolean),
          is_team_committee: isTeam,
          team_size: isTeam ? Math.max(2, teamSize) : 1,
          difficulty,
          room_number: roomNumber.trim() || null,
        })}><Save className="w-3 h-3" /> Save</Button>
      </div>
    </div>
  );
};
