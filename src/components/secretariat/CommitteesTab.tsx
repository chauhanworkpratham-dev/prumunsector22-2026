import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import {
  getCommittees, createCommittee, updateCommittee, deleteCommittee,
  downloadCSV, getRegistrations, type Committee, type Registration,
} from "@/lib/munApi";
import { Plus, Trash2, Save, Users, Download, ChevronDown, ChevronRight, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Preset colors the admin can pick from ── */
const COLOR_PRESETS = [
  { label: "Blue",    bg: "bg-blue-500/15",    text: "text-blue-600 dark:text-blue-400",    hex: "#3b82f6" },
  { label: "Green",   bg: "bg-green-500/15",   text: "text-green-600 dark:text-green-400",  hex: "#22c55e" },
  { label: "Amber",   bg: "bg-amber-500/15",   text: "text-amber-600 dark:text-amber-400",  hex: "#f59e0b" },
  { label: "Red",     bg: "bg-red-500/15",     text: "text-red-600 dark:text-red-400",      hex: "#ef4444" },
  { label: "Purple",  bg: "bg-purple-500/15",  text: "text-purple-600 dark:text-purple-400",hex: "#a855f7" },
  { label: "Pink",    bg: "bg-pink-500/15",    text: "text-pink-600 dark:text-pink-400",    hex: "#ec4899" },
  { label: "Cyan",    bg: "bg-cyan-500/15",    text: "text-cyan-600 dark:text-cyan-400",    hex: "#06b6d4" },
  { label: "Indigo",  bg: "bg-indigo-500/15",  text: "text-indigo-600 dark:text-indigo-400",hex: "#6366f1" },
  { label: "Orange",  bg: "bg-orange-500/15",  text: "text-orange-600 dark:text-orange-400",hex: "#f97316" },
  { label: "Teal",    bg: "bg-teal-500/15",    text: "text-teal-600 dark:text-teal-400",   hex: "#14b8a6" },
];

/* ── Extend Committee type with custom difficulty fields (stored in description via JSON prefix) ── */
function packDifficulty(label: string, colorHex: string): string {
  return `__diff__${JSON.stringify({ label, colorHex })}`;
}
function unpackDifficulty(raw: string | null): { label: string; colorHex: string } {
  if (!raw) return { label: "Intermediate", colorHex: "#f59e0b" };
  if (raw.startsWith("__diff__")) {
    try { return JSON.parse(raw.slice(8)); } catch { /* fall-through */ }
  }
  // Legacy: map old values to colors
  if (raw === "Beginner")     return { label: "Beginner",     colorHex: "#22c55e" };
  if (raw === "Advanced")     return { label: "Advanced",     colorHex: "#ef4444" };
  return { label: raw, colorHex: "#f59e0b" };
}

export const CommitteesTab = ({ editionId }: { editionId: string }) => {
  const [items,       setItems]       = useState<Committee[]>([]);
  const [name,        setName]        = useState("");
  const [shortName,   setShortName]   = useState("");
  const [agenda,      setAgenda]      = useState("");
  const [portfolios,  setPortfolios]  = useState("");
  const [isTeam,      setIsTeam]      = useState(false);
  const [teamSize,    setTeamSize]    = useState(4);
  const [roomNumber,  setRoomNumber]  = useState("");
  const [diffLabel,   setDiffLabel]   = useState("Intermediate");
  const [diffColor,   setDiffColor]   = useState("#f59e0b");
  const [showColorPicker, setShowColorPicker] = useState(false);

  // All registrations for showing team invites
  const [regs, setRegs] = useState<Registration[]>([]);

  const refresh = () => {
    getCommittees(editionId).then(setItems);
    getRegistrations(editionId).then(setRegs);
  };
  useEffect(() => { refresh(); }, [editionId]);

  const add = async () => {
    if (!name.trim() || !shortName.trim()) {
      toast({ title: "Name & short name required", variant: "destructive" });
      return;
    }
    const { error } = await createCommittee({
      edition_id: editionId,
      name,
      short_name: shortName,
      agenda,
      description: packDifficulty(diffLabel, diffColor),
      difficulty: "Intermediate" as Committee["difficulty"], // kept for type compat
      portfolios: portfolios.split(",").map(p => p.trim()).filter(Boolean),
      sort_order: items.length,
      is_team_committee: isTeam,
      team_size: isTeam ? Math.max(2, teamSize) : 1,
      room_number: roomNumber.trim() || null,
    });
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    setName(""); setShortName(""); setAgenda(""); setPortfolios(""); setIsTeam(false); setTeamSize(4); setRoomNumber("");
    setDiffLabel("Intermediate"); setDiffColor("#f59e0b");
    refresh();
    toast({ title: "Committee added" });
  };

  const save = async (c: Committee, patch: Partial<Committee>) => {
    const { error } = await updateCommittee(c.id, patch);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    refresh(); toast({ title: "Saved" });
  };

  const remove = async (id: string) => {
    if (confirm("Delete committee and all its registrations?")) { await deleteCommittee(id); refresh(); }
  };

  const exportCSV = () => {
    downloadCSV(
      `committees-${Date.now()}.csv`,
      ["Short name", "Name", "Difficulty", "Room", "Team committee", "Team size", "Portfolios", "Agenda"],
      items.map(c => {
        const d = unpackDifficulty(c.description);
        return [c.short_name, c.name, d.label, c.room_number ?? "", c.is_team_committee ? "YES" : "NO",
          String(c.team_size), c.portfolios.join(" | "), c.agenda];
      })
    );
  };

  const selectedPreset = COLOR_PRESETS.find(p => p.hex === diffColor);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4" /> CSV</Button>
      </div>

      {/* ── Add Committee form ── */}
      <div className="glass-strong rounded-3xl p-6 space-y-3">
        <h3 className="font-display text-xl font-bold">Add Committee</h3>

        <div className="grid md:grid-cols-3 gap-3">
          <div className="space-y-1.5 md:col-span-1"><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Short name</Label><Input value={shortName} onChange={e => setShortName(e.target.value)} placeholder="UNSC" /></div>
          <div className="space-y-1.5"><Label>Room number</Label><Input value={roomNumber} onChange={e => setRoomNumber(e.target.value)} placeholder="001" /></div>
        </div>

        <div className="space-y-1.5"><Label>Agenda</Label><Textarea value={agenda} onChange={e => setAgenda(e.target.value)} rows={2} /></div>
        <div className="space-y-1.5"><Label>Portfolios (comma-separated)</Label><Textarea value={portfolios} onChange={e => setPortfolios(e.target.value)} rows={3} placeholder="USA, China, India, …" /></div>

        {/* Difficulty label + color picker */}
        <div className="glass rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Palette className="w-4 h-4 text-primary shrink-0" />
            <Label className="text-sm font-semibold">Difficulty / Level</Label>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <Input
              value={diffLabel}
              onChange={e => setDiffLabel(e.target.value)}
              placeholder="e.g. Beginner / Advanced / Expert…"
              className="flex-1 min-w-[160px]"
            />
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColorPicker(v => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-input hover:border-primary/50 transition-all text-sm font-semibold"
              >
                <span className="w-5 h-5 rounded-full border border-white/30 shadow-sm" style={{ background: diffColor }} />
                {selectedPreset?.label ?? "Custom"}
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              {showColorPicker && (
                <div className="absolute top-full mt-2 right-0 z-20 glass-strong rounded-2xl p-3 border border-border/60 shadow-elegant w-52 animate-fade-in">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">Pick badge color</p>
                  <div className="grid grid-cols-5 gap-2">
                    {COLOR_PRESETS.map(p => (
                      <button
                        key={p.hex}
                        type="button"
                        title={p.label}
                        onClick={() => { setDiffColor(p.hex); setShowColorPicker(false); }}
                        className={cn("w-8 h-8 rounded-full border-2 transition-all hover:scale-110",
                          diffColor === p.hex ? "border-foreground scale-110" : "border-transparent"
                        )}
                        style={{ background: p.hex }}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Label className="text-xs shrink-0">Custom hex</Label>
                    <Input
                      value={diffColor}
                      onChange={e => setDiffColor(e.target.value)}
                      placeholder="#000000"
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  {/* Preview */}
                  <div className="mt-2 flex items-center justify-center">
                    <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: diffColor + "33", color: diffColor }}>
                      {diffLabel || "Preview"}
                    </span>
                  </div>
                </div>
              )}
            </div>
            {/* Live badge preview */}
            <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: diffColor + "33", color: diffColor }}>
              {diffLabel || "—"}
            </span>
          </div>
        </div>

        {/* Team toggle */}
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
        {isTeam && <p className="text-xs text-muted-foreground">Team mode: one delegate registers and pre-assigns portfolios for {teamSize - 1} teammates by email.</p>}

        <Button variant="hero" onClick={add}><Plus className="w-4 h-4" /> Add</Button>
      </div>

      {/* ── Existing committees ── */}
      <div className="space-y-4">
        {items.map(c => {
          const teamRegs = regs.filter(r => r.committee_id === c.id && c.is_team_committee);
          return (
            <CommitteeRow
              key={c.id}
              c={c}
              teamRegs={teamRegs}
              onSave={save}
              onDelete={remove}
            />
          );
        })}
      </div>
    </div>
  );
};

/* ── Individual committee row ── */
const CommitteeRow = ({
  c, teamRegs, onSave, onDelete,
}: {
  c: Committee;
  teamRegs: Registration[];
  onSave: (c: Committee, p: Partial<Committee>) => void;
  onDelete: (id: string) => void;
}) => {
  const initDiff = unpackDifficulty(c.description);
  const [agenda,      setAgenda]      = useState(c.agenda);
  const [portfolios,  setPortfolios]  = useState(c.portfolios.join(", "));
  const [isTeam,      setIsTeam]      = useState(c.is_team_committee);
  const [teamSize,    setTeamSize]    = useState(c.team_size);
  const [diffLabel,   setDiffLabel]   = useState(initDiff.label);
  const [diffColor,   setDiffColor]   = useState(initDiff.colorHex);
  const [roomNumber,  setRoomNumber]  = useState(c.room_number ?? "");
  const [showCP,      setShowCP]      = useState(false);
  const [teamsOpen,   setTeamsOpen]   = useState(false);

  const selectedPreset = COLOR_PRESETS.find(p => p.hex === diffColor);

  return (
    <div className="glass-strong rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <div className="min-w-0">
          <span className="text-xs font-bold text-primary tracking-widest">{c.short_name}</span>
          <h4 className="font-bold truncate">{c.name}</h4>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {c.is_team_committee && (
              <span className="text-[10px] font-bold tracking-widest text-primary px-2 py-0.5 rounded-full bg-primary/10 inline-flex items-center gap-1">
                <Users className="w-3 h-3" /> TEAM OF {c.team_size}
              </span>
            )}
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: diffColor + "33", color: diffColor }}>
              {diffLabel}
            </span>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onDelete(c.id)} className="text-destructive shrink-0">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <Textarea value={agenda} onChange={e => setAgenda(e.target.value)} rows={2} placeholder="Agenda" />
      <Textarea value={portfolios} onChange={e => setPortfolios(e.target.value)} rows={3} placeholder="Portfolios (comma-separated)" />

      {/* Difficulty & room & team inline controls */}
      <div className="flex items-center gap-3 glass rounded-xl p-3 flex-wrap">
        {/* Difficulty label */}
        <div className="flex items-center gap-2">
          <Label className="text-xs shrink-0">Level</Label>
          <Input
            value={diffLabel}
            onChange={e => setDiffLabel(e.target.value)}
            placeholder="Intermediate"
            className="h-9 w-32 text-xs"
          />
        </div>
        {/* Color picker toggle */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowCP(v => !v)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-input hover:border-primary/50 text-xs font-semibold transition-all"
          >
            <span className="w-4 h-4 rounded-full" style={{ background: diffColor }} />
            {selectedPreset?.label ?? "Color"}
          </button>
          {showCP && (
            <div className="absolute top-full mt-1 left-0 z-20 glass-strong rounded-2xl p-3 border border-border/60 shadow-elegant w-48 animate-fade-in">
              <div className="grid grid-cols-5 gap-2 mb-2">
                {COLOR_PRESETS.map(p => (
                  <button key={p.hex} type="button" title={p.label}
                    onClick={() => { setDiffColor(p.hex); setShowCP(false); }}
                    className={cn("w-7 h-7 rounded-full border-2 transition-all hover:scale-110",
                      diffColor === p.hex ? "border-foreground" : "border-transparent"
                    )}
                    style={{ background: p.hex }}
                  />
                ))}
              </div>
              <Input value={diffColor} onChange={e => setDiffColor(e.target.value)} placeholder="#000" className="h-7 text-xs font-mono" />
            </div>
          )}
        </div>
        {/* Live preview */}
        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: diffColor + "33", color: diffColor }}>
          {diffLabel}
        </span>

        <div className="w-px h-5 bg-border mx-1" />
        <Label className="text-xs">Room</Label>
        <Input value={roomNumber} onChange={e => setRoomNumber(e.target.value)} placeholder="001" className="w-24 h-9" />

        <div className="w-px h-5 bg-border mx-1" />
        <Switch checked={isTeam} onCheckedChange={setIsTeam} id={`team-${c.id}`} />
        <Label htmlFor={`team-${c.id}`} className="text-xs flex items-center gap-1"><Users className="w-3 h-3" /> Team</Label>
        {isTeam && (
          <>
            <Label className="text-xs">Size</Label>
            <Input type="number" min={2} max={8} value={teamSize} onChange={e => setTeamSize(Number(e.target.value) || 4)} className="w-16 h-9" />
          </>
        )}
      </div>

      <Button variant="outline" size="sm" onClick={() => onSave(c, {
        agenda,
        portfolios: portfolios.split(",").map(p => p.trim()).filter(Boolean),
        is_team_committee: isTeam,
        team_size: isTeam ? Math.max(2, teamSize) : 1,
        difficulty: "Intermediate" as Committee["difficulty"],
        description: packDifficulty(diffLabel, diffColor),
        room_number: roomNumber.trim() || null,
      })}>
        <Save className="w-3 h-3" /> Save
      </Button>

      {/* ── Team invites section (below the committee) ── */}
      {isTeam && (
        <div className="border-t border-border/50 pt-3">
          <button
            type="button"
            onClick={() => setTeamsOpen(v => !v)}
            className="flex items-center gap-2 text-xs font-bold text-primary hover:underline"
          >
            {teamsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            <Users className="w-3.5 h-3.5" />
            Teams in {c.short_name} ({teamRegs.length} registrations)
          </button>
          {teamsOpen && (
            <div className="mt-3 space-y-2 animate-fade-in">
              {teamRegs.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No team registrations yet.</p>
              ) : (
                teamRegs.map(r => (
                  <div key={r.id} className="flex items-center gap-3 rounded-xl bg-secondary/30 px-3 py-2 text-xs">
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold truncate block">{r.full_name}</span>
                      <span className="text-muted-foreground">{r.portfolio ?? "No portfolio"} · {r.school}</span>
                    </div>
                    <span className={cn("px-2 py-0.5 rounded-full font-bold text-[9px]",
                      r.payment_status === "approved" ? "bg-success/15 text-success" :
                      r.payment_status === "pending"  ? "bg-warning/15 text-warning"  :
                      "bg-muted text-muted-foreground"
                    )}>
                      {r.payment_status.toUpperCase()}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
