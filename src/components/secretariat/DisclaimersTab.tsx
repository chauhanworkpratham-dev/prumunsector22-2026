import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { updateEdition, type Edition } from "@/lib/munApi";
import { Save, ShieldAlert, QrCode, Sparkles } from "lucide-react";

export const DisclaimersTab = ({ edition, onSaved }: { edition: Edition; onSaved: () => void }) => {
  const [qr, setQr] = useState(edition.disclaimer_qr ?? "");
  const [ai, setAi] = useState(edition.disclaimer_ai ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setQr(edition.disclaimer_qr ?? "");
    setAi(edition.disclaimer_ai ?? "");
  }, [edition.id, edition.disclaimer_qr, edition.disclaimer_ai]);

  const save = async () => {
    setSaving(true);
    const { error } = await updateEdition(edition.id, { disclaimer_qr: qr, disclaimer_ai: ai } as any);
    setSaving(false);
    if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "🛡 Disclaimers updated" });
    onSaved();
  };

  return (
    <div className="glass-strong rounded-3xl p-6 space-y-5 max-w-3xl">
      <div>
        <h3 className="font-display text-xl font-bold flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-warning" /> Portal Disclaimers</h3>
        <p className="text-xs text-muted-foreground mt-1">These appear on every delegate / EB / OC portfolio page.</p>
      </div>

      <div className="glass rounded-2xl p-4 space-y-2">
        <Label className="flex items-center gap-2 font-semibold"><QrCode className="w-4 h-4 text-primary" /> QR code disclaimer</Label>
        <Textarea rows={3} value={qr} onChange={e => setQr(e.target.value)} placeholder="Do not share this QR code…" />
      </div>

      <div className="glass rounded-2xl p-4 space-y-2">
        <Label className="flex items-center gap-2 font-semibold"><Sparkles className="w-4 h-4 text-accent" /> AI assistant disclaimer</Label>
        <Textarea rows={3} value={ai} onChange={e => setAi(e.target.value)} placeholder="Use the AI assistant wisely…" />
      </div>

      <Button variant="hero" onClick={save} disabled={saving}>
        <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save disclaimers"}
      </Button>
    </div>
  );
};
