import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { getAllAnnouncementsAdmin, createAnnouncement, updateAnnouncement, deleteAnnouncement, downloadCSV, type Announcement } from "@/lib/munApi";
import { Pin, Trash2, Plus, Eye, EyeOff, Download } from "lucide-react";

export const AnnouncementsTab = ({ editionId }: { editionId: string }) => {
  const [items, setItems] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);

  const refresh = () => getAllAnnouncementsAdmin(editionId).then(setItems);
  useEffect(() => { refresh(); }, [editionId]);

  const add = async () => {
    if (!title.trim() || !body.trim()) {
      toast({ title: "Title and body required", variant: "destructive" });
      return;
    }
    const { error } = await createAnnouncement({ edition_id: editionId, title: title.trim(), body: body.trim(), pinned, published: true });
    if (error) { toast({ title: "Failed to post", description: error.message, variant: "destructive" }); return; }
    setTitle(""); setBody(""); setPinned(false); refresh();
    toast({ title: "📣 Announcement posted" });
  };
  const togglePin = async (a: Announcement) => {
    const { error } = await updateAnnouncement(a.id, { pinned: !a.pinned });
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    refresh();
  };
  const togglePub = async (a: Announcement) => {
    const { error } = await updateAnnouncement(a.id, { published: !a.published });
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    refresh();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    const { error } = await deleteAnnouncement(id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    refresh();
  };

  const exportCSV = () => {
    downloadCSV(`announcements-${Date.now()}.csv`,
      ["Title", "Body", "Pinned", "Published", "Created"],
      items.map(a => [a.title, a.body, a.pinned ? "YES" : "NO", a.published ? "YES" : "NO", new Date(a.created_at).toLocaleString()]));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4" /> CSV</Button>
      </div>
      <div className="glass-strong rounded-3xl p-6 space-y-3">
        <h3 className="font-display text-xl font-bold">New Announcement</h3>
        <div className="space-y-1.5"><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Important update" /></div>
        <div className="space-y-1.5"><Label>Body</Label><Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Details…" rows={4} /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} /> Pin to top</label>
        <Button variant="hero" onClick={add}><Plus className="w-4 h-4" /> Post</Button>
      </div>

      <div className="space-y-3">
        {items.map(a => (
          <div key={a.id} className="glass-strong rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h4 className="font-bold flex items-center gap-2">{a.pinned && <Pin className="w-4 h-4 text-primary" />}{a.title}</h4>
                <p className="text-sm text-foreground/80 whitespace-pre-line mt-1">{a.body}</p>
                <p className="text-[10px] text-muted-foreground mt-2">{new Date(a.created_at).toLocaleString()} · {a.published ? "Published" : "Draft"}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => togglePin(a)}><Pin className={a.pinned ? "w-4 h-4 text-primary" : "w-4 h-4"} /></Button>
                <Button variant="ghost" size="sm" onClick={() => togglePub(a)}>{a.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</Button>
                <Button variant="ghost" size="sm" onClick={() => remove(a.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="glass rounded-2xl p-8 text-center text-muted-foreground text-sm">No announcements yet.</div>}
      </div>
    </div>
  );
};
