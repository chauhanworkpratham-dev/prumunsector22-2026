import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { updateEdition, type Edition } from "@/lib/munApi";
import { Save, MessageSquare, CheckCircle2, Hourglass } from "lucide-react";

/**
 * QR Messages tab — lets the secretariat edit the messages shown under the
 * QR-code card on the Delegate / EB / OC portal pages.
 */
export const QrMessagesTab = ({ edition, onSaved }: { edition: Edition; onSaved: () => void }) => {
  const build = (e: Edition) => ({
    qr_message_approved: e.qr_message_approved ?? "Approved — use this QR to enter",
    qr_pending_title: e.qr_pending_title ?? "Waiting for Secretariat's approval",
    qr_message_delegate_pending: e.qr_message_delegate_pending ?? "",
    qr_message_eb_pending: e.qr_message_eb_pending ?? "",
    qr_message_oc_pending: e.qr_message_oc_pending ?? "",
  });
  const [form, setForm] = useState(build(edition));
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(build(edition)); }, [edition.id, edition.qr_message_approved, edition.qr_pending_title, edition.qr_message_delegate_pending, edition.qr_message_eb_pending, edition.qr_message_oc_pending]);

  const save = async () => {
    setSaving(true);
    const { error } = await updateEdition(edition.id, form as any);
    setSaving(false);
    if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "💬 QR messages updated", description: "Live in every portal." });
    onSaved();
  };

  return (
    <div className="glass-strong rounded-3xl p-6 space-y-5 max-w-3xl">
      <div>
        <h3 className="font-display text-xl font-bold flex items-center gap-2"><MessageSquare className="w-5 h-5 text-primary" /> QR Card Messages</h3>
        <p className="text-xs text-muted-foreground mt-1">Edit the captions shown under each user's QR ticket. Changes go live instantly.</p>
      </div>

      <div className="glass rounded-2xl p-4 space-y-2">
        <Label className="flex items-center gap-2 text-success font-semibold"><CheckCircle2 className="w-4 h-4" /> Approved (QR active)</Label>
        <Input value={form.qr_message_approved} onChange={e => setForm({ ...form, qr_message_approved: e.target.value })} placeholder="Approved — use this QR to enter" />
      </div>

      <div className="glass rounded-2xl p-4 space-y-3">
        <Label className="flex items-center gap-2 text-warning font-semibold"><Hourglass className="w-4 h-4" /> Pending approval (shared title)</Label>
        <Input value={form.qr_pending_title} onChange={e => setForm({ ...form, qr_pending_title: e.target.value })} placeholder="Waiting for Secretariat's approval" />

        <div className="space-y-1.5 pt-2">
          <Label>🎓 Delegate · pending message</Label>
          <Textarea rows={2} value={form.qr_message_delegate_pending} onChange={e => setForm({ ...form, qr_message_delegate_pending: e.target.value })} placeholder="Pay cash at the venue…" />
        </div>

        <div className="space-y-1.5">
          <Label>👑 Executive Board · pending message</Label>
          <Textarea rows={2} value={form.qr_message_eb_pending} onChange={e => setForm({ ...form, qr_message_eb_pending: e.target.value })} placeholder="EB members don't pay…" />
        </div>

        <div className="space-y-1.5">
          <Label>✨ Organising Committee · pending message</Label>
          <Textarea rows={2} value={form.qr_message_oc_pending} onChange={e => setForm({ ...form, qr_message_oc_pending: e.target.value })} placeholder="OC members don't pay…" />
        </div>
      </div>

      <Button variant="hero" onClick={save} disabled={saving}>
        <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save QR messages"}
      </Button>
    </div>
  );
};
