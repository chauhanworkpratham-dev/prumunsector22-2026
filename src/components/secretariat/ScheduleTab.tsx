import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { getSchedule, createScheduleItem, deleteScheduleItem, downloadCSV, type ScheduleItem } from "@/lib/munApi";
import { Trash2, Plus, Download } from "lucide-react";

export const ScheduleTab = ({ editionId }: { editionId: string }) => {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [day, setDay] = useState("Day 1");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [loc, setLoc] = useState("");

  const refresh = () => getSchedule(editionId).then(setItems);
  useEffect(() => { refresh(); }, [editionId]);

  const add = async () => {
    if (!title.trim() || !start.trim()) { toast({ title: "Title and start time required", variant: "destructive" }); return; }
    await createScheduleItem({ edition_id: editionId, day_label: day, start_time: start, end_time: end || null, title, description: desc || null, location: loc || null, sort_order: items.filter(i => i.day_label === day).length });
    setTitle(""); setDesc(""); setLoc(""); setStart(""); setEnd(""); refresh();
  };
  const remove = async (id: string) => { if (confirm("Delete?")) { await deleteScheduleItem(id); refresh(); } };

  const grouped = items.reduce<Record<string, ScheduleItem[]>>((a, i) => { (a[i.day_label] ||= []).push(i); return a; }, {});

  const exportCSV = () => {
    downloadCSV(`schedule-${Date.now()}.csv`,
      ["Day", "Start", "End", "Title", "Description", "Location"],
      items.map(i => [i.day_label, i.start_time, i.end_time ?? "", i.title, i.description ?? "", i.location ?? ""]));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4" /> CSV</Button>
      </div>
      <div className="glass-strong rounded-3xl p-6 space-y-3">
        <h3 className="font-display text-xl font-bold">Add Schedule Item</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Day label</Label><Input value={day} onChange={e => setDay(e.target.value)} placeholder="Day 1 — Aug 1" /></div>
          <div className="space-y-1.5"><Label>Location</Label><Input value={loc} onChange={e => setLoc(e.target.value)} placeholder="Hall A" /></div>
          <div className="space-y-1.5"><Label>Start time</Label><Input value={start} onChange={e => setStart(e.target.value)} placeholder="09:00" /></div>
          <div className="space-y-1.5"><Label>End time (optional)</Label><Input value={end} onChange={e => setEnd(e.target.value)} placeholder="10:30" /></div>
        </div>
        <div className="space-y-1.5"><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Opening Ceremony" /></div>
        <div className="space-y-1.5"><Label>Description</Label><Textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} /></div>
        <Button variant="hero" onClick={add}><Plus className="w-4 h-4" /> Add</Button>
      </div>

      {Object.entries(grouped).map(([d, list]) => (
        <div key={d} className="glass-strong rounded-2xl p-5">
          <h4 className="font-display font-bold mb-3">{d}</h4>
          <div className="space-y-2">
            {list.map(it => (
              <div key={it.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-primary/5">
                <div className="text-primary font-mono font-bold w-20 text-sm">{it.start_time}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{it.title}</div>
                  {it.description && <div className="text-xs text-muted-foreground">{it.description}</div>}
                </div>
                <Button variant="ghost" size="sm" onClick={() => remove(it.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
          </div>
        </div>
      ))}
      {items.length === 0 && <div className="glass rounded-2xl p-8 text-center text-muted-foreground text-sm">No schedule items yet.</div>}
    </div>
  );
};
