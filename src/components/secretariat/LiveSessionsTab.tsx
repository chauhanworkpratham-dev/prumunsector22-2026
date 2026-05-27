import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { getTrainingSessions, createTrainingSession, updateTrainingSession, deleteTrainingSession, type TrainingSession } from "@/lib/munApi";
import { Plus, Trash2, Radio } from "lucide-react";

export const LiveSessionsTab = ({ editionId }: { editionId: string }) => {
  const [items, setItems] = useState<TrainingSession[]>([]);
  const [topic, setTopic] = useState("");
  const [desc, setDesc] = useState("");
  const [when, setWhen] = useState("");
  const [zoom, setZoom] = useState("");

  const refresh = () => getTrainingSessions(editionId).then(setItems);
  useEffect(() => { refresh(); }, [editionId]);

  const add = async () => {
    if (!topic.trim() || !when) { toast({ title: "Topic and date required", variant: "destructive" }); return; }
    await createTrainingSession({ edition_id: editionId, topic, description: desc || null, scheduled_at: new Date(when).toISOString(), zoom_link: zoom || null, recording_url: null });
    setTopic(""); setDesc(""); setWhen(""); setZoom(""); refresh();
  };
  const setRecording = async (id: string) => {
    const url = prompt("Recording URL?");
    if (url) { await updateTrainingSession(id, { recording_url: url }); refresh(); }
  };
  const remove = async (id: string) => { if (confirm("Delete?")) { await deleteTrainingSession(id); refresh(); } };

  return (
    <div className="space-y-6">
      <div className="glass-strong rounded-3xl p-6 space-y-3">
        <h3 className="font-display text-xl font-bold">Schedule Live Session</h3>
        <div className="space-y-1.5"><Label>Topic</Label><Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="ROP Workshop" /></div>
        <div className="space-y-1.5"><Label>Description</Label><Textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} /></div>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Date & time</Label><Input type="datetime-local" value={when} onChange={e => setWhen(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Zoom / Meet link</Label><Input value={zoom} onChange={e => setZoom(e.target.value)} placeholder="https://zoom.us/…" /></div>
        </div>
        <Button variant="hero" onClick={add}><Plus className="w-4 h-4" /> Schedule</Button>
      </div>

      <div className="space-y-2">
        {items.map(s => (
          <div key={s.id} className="glass-strong rounded-2xl p-4 flex items-center gap-3">
            <Radio className="w-5 h-5 text-primary" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold">{s.topic}</div>
              <div className="text-xs text-muted-foreground">{new Date(s.scheduled_at).toLocaleString()}{s.recording_url && " · Has recording"}</div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setRecording(s.id)}>Set recording</Button>
            <Button variant="ghost" size="sm" onClick={() => remove(s.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
          </div>
        ))}
        {items.length === 0 && <div className="glass rounded-2xl p-8 text-center text-muted-foreground text-sm">No sessions scheduled.</div>}
      </div>
    </div>
  );
};
