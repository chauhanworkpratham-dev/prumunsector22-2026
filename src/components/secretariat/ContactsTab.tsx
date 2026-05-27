import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  getContactPersons, createContactPerson, updateContactPerson, deleteContactPerson,
  downloadCSV, type ContactPerson,
} from "@/lib/munApi";
import { Plus, Trash2, Save, Download } from "lucide-react";

export const ContactsTab = ({ editionId }: { editionId: string }) => {
  const [items, setItems] = useState<ContactPerson[]>([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const refresh = () => getContactPersons(editionId).then(setItems);
  useEffect(() => { refresh(); }, [editionId]);

  const add = async () => {
    if (!name.trim() || !phone.trim()) {
      toast({ title: "Name and phone required", variant: "destructive" });
      return;
    }
    const { error } = await createContactPerson({
      edition_id: editionId,
      name: name.trim(),
      role: role.trim() || null,
      phone: phone.trim(),
      email: email.trim() || null,
      sort_order: items.length,
    });
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    setName(""); setRole(""); setPhone(""); setEmail("");
    refresh();
    toast({ title: "Contact added" });
  };

  const saveOne = async (c: ContactPerson) => {
    const { error } = await updateContactPerson(c.id, c);
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else toast({ title: "Saved" });
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this contact?")) return;
    await deleteContactPerson(id);
    refresh();
  };

  const updateLocal = (id: string, patch: Partial<ContactPerson>) =>
    setItems(items.map(c => c.id === id ? { ...c, ...patch } : c));

  const exportCSV = () => {
    downloadCSV(`footer-contacts-${Date.now()}.csv`,
      ["Name", "Role", "Phone", "Email"],
      items.map(c => [c.name, c.role ?? "", c.phone, c.email ?? ""]));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4" /> CSV</Button>
      </div>
      <div className="glass-strong rounded-3xl p-6 space-y-3 max-w-2xl">
        <h3 className="font-display text-xl font-bold">Add Footer Contact</h3>
        <p className="text-xs text-muted-foreground">These names appear when a visitor clicks the Contact button in the website footer.</p>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Name *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Aarav Sharma" /></div>
          <div className="space-y-1.5"><Label>Role</Label><Input value={role} onChange={e => setRole(e.target.value)} placeholder="Secretary General" /></div>
          <div className="space-y-1.5"><Label>Phone *</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98xxxxxx00" /></div>
          <div className="space-y-1.5"><Label>Email (optional)</Label><Input value={email} onChange={e => setEmail(e.target.value)} placeholder="contact@prumun.in" /></div>
        </div>
        <Button variant="hero" onClick={add}><Plus className="w-4 h-4" /> Add Contact</Button>
      </div>

      <div className="space-y-3">
        {items.length === 0 && <div className="glass rounded-2xl p-8 text-center text-muted-foreground text-sm">No contacts yet.</div>}
        {items.map(c => (
          <div key={c.id} className="glass-strong rounded-2xl p-4 grid md:grid-cols-5 gap-3 items-end">
            <Input value={c.name} onChange={e => updateLocal(c.id, { name: e.target.value })} placeholder="Name" />
            <Input value={c.role ?? ""} onChange={e => updateLocal(c.id, { role: e.target.value })} placeholder="Role" />
            <Input value={c.phone} onChange={e => updateLocal(c.id, { phone: e.target.value })} placeholder="Phone" />
            <Input value={c.email ?? ""} onChange={e => updateLocal(c.id, { email: e.target.value })} placeholder="Email" />
            <div className="flex gap-2">
              <Button size="sm" variant="hero" onClick={() => saveOne(c)} className="flex-1"><Save className="w-3 h-3" /></Button>
              <Button size="sm" variant="ghost" onClick={() => remove(c.id)} className="text-destructive"><Trash2 className="w-3 h-3" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
