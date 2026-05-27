import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { 
  Users, Plus, Trash2, Mail, Phone, ArrowUp, ArrowDown, 
  MessageSquare, UserPlus, Eye, Clock, ShieldAlert, Sparkles 
} from "lucide-react";

export type SecMember = {
  id: string;
  name: string;
  role: "secretariat" | "staff";
  position: string;
  phone: string;
  email: string;
  photo: string;
  rank: number;
};

export type SecMessage = {
  id: string;
  secretariatId: string;
  delegateName: string;
  delegateSchool: string;
  delegateClass: string;
  delegateRole: string;
  delegateContact: string;
  title: string;
  message: string;
  timestamp: string;
};

const DEFAULT_MEMBERS: SecMember[] = [
  {
    id: "sec-1",
    name: "Aarav Sharma",
    role: "secretariat",
    position: "Secretary General",
    phone: "+91 98765 43210",
    email: "secgen@prumun.org",
    photo: "https://api.dicebear.com/7.x/adventurer/svg?seed=Aarav",
    rank: 1
  },
  {
    id: "sec-2",
    name: "Diya Kaplan",
    role: "secretariat",
    position: "Director General",
    phone: "+91 98765 43211",
    email: "directorgent@prumun.org",
    photo: "https://api.dicebear.com/7.x/adventurer/svg?seed=Diya",
    rank: 2
  },
  {
    id: "staff-1",
    name: "Rohan Verma",
    role: "staff",
    position: "Chief of Staff",
    phone: "+91 98765 43212",
    email: "rohan@prumun.org",
    photo: "https://api.dicebear.com/7.x/adventurer/svg?seed=Rohan",
    rank: 3
  }
];

export const SecretariatMessagesTab = ({ editionId }: { editionId: string }) => {
  const [members, setMembers] = useState<SecMember[]>([]);
  const [messages, setMessages] = useState<SecMessage[]>([]);
  const [activeTab, setActiveTab] = useState<"secretariat" | "staff">("secretariat");

  // Form for new member
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState<Omit<SecMember, "id">>({
    name: "",
    role: "secretariat",
    position: "",
    phone: "",
    email: "",
    photo: "https://api.dicebear.com/7.x/adventurer/svg?seed=Guest",
    rank: 4
  });

  // Modal states for messages
  const [selectedMember, setSelectedMember] = useState<SecMember | null>(null);
  const [activeMessage, setActiveMessage] = useState<SecMessage | null>(null);

  useEffect(() => {
    // Load members
    const storedMembers = localStorage.getItem("mun_secretariats_list");
    if (storedMembers) {
      setMembers(JSON.parse(storedMembers));
    } else {
      setMembers(DEFAULT_MEMBERS);
      localStorage.setItem("mun_secretariats_list", JSON.stringify(DEFAULT_MEMBERS));
    }

    // Load messages
    const storedMsgs = localStorage.getItem("mun_secretariat_messages");
    if (storedMsgs) {
      setMessages(JSON.parse(storedMsgs));
    } else {
      setMessages([]);
    }
  }, []);

  const saveMembers = (list: SecMember[]) => {
    setMembers(list);
    localStorage.setItem("mun_secretariats_list", JSON.stringify(list));
  };

  const handleAddMember = () => {
    if (!newMember.name || !newMember.position) {
      toast({ title: "Validation error", description: "Name and Position are required.", variant: "destructive" });
      return;
    }
    const created: SecMember = {
      ...newMember,
      id: `member-${Date.now()}`
    };
    const updated = [...members, created];
    saveMembers(updated);
    setShowAddModal(false);
    setNewMember({
      name: "",
      role: "secretariat",
      position: "",
      phone: "",
      email: "",
      photo: `https://api.dicebear.com/7.x/adventurer/svg?seed=${Date.now()}`,
      rank: members.length + 1
    });
    toast({ title: "🎉 Member added!", description: `${created.name} is now listed.` });
  };

  const handleDeleteMember = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to remove this profile?")) return;
    const filtered = members.filter(m => m.id !== id);
    saveMembers(filtered);
    toast({ title: "🗑️ Member removed" });
  };

  const handleUpdateRank = (id: string, newRank: number) => {
    const updated = members.map(m => m.id === id ? { ...m, rank: newRank } : m);
    saveMembers(updated);
  };

  const handlePhotoUpload = (id: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const base64 = e.target.result as string;
        const updated = members.map(m => m.id === id ? { ...m, photo: base64 } : m);
        saveMembers(updated);
        toast({ title: "📸 Photograph uploaded!" });
      }
    };
    reader.readAsDataURL(file);
  };

  // Filter and sort members
  const sortedMembers = [...members]
    .filter(m => m.role === activeTab)
    .sort((a, b) => a.rank - b.rank);

  // Filter messages for active profile modal
  const memberMessages = selectedMember 
    ? messages
        .filter(msg => msg.secretariatId === selectedMember.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h3 className="font-display text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Secretariat & Staff Administration
          </h3>
          <p className="text-xs text-muted-foreground mt-1">Manage public profile circles, update ranks, and view private messages.</p>
        </div>
        <Button variant="hero" size="sm" onClick={() => setShowAddModal(true)}>
          <UserPlus className="w-4 h-4 mr-2" /> Add Secretariat/Staff
        </Button>
      </div>

      {/* Role Selection tabs */}
      <div className="flex gap-1.5 border-b border-border/40 pb-2">
        <button
          onClick={() => setActiveTab("secretariat")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "secretariat" ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-secondary/40"
          }`}
        >
          Secretariat Members
        </button>
        <button
          onClick={() => setActiveTab("staff")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "staff" ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-secondary/40"
          }`}
        >
          Staff & Officers
        </button>
      </div>

      {/* Grid of Profiles */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedMembers.map(m => {
          const msgCount = messages.filter(msg => msg.secretariatId === m.id).length;
          return (
            <div 
              key={m.id} 
              onClick={() => setSelectedMember(m)}
              className="glass hover-lift rounded-2xl p-5 border border-border/50 shadow-soft cursor-pointer flex flex-col justify-between"
            >
              <div className="flex gap-4">
                <div className="relative group shrink-0">
                  <div className="w-16 h-16 rounded-full border-2 border-primary/30 overflow-hidden bg-secondary">
                    <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
                  </div>
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center cursor-pointer transition-opacity text-[9px] text-white font-bold">
                    Upload
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoUpload(m.id, file);
                      }} 
                    />
                  </label>
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="font-bold truncate">{m.name}</h4>
                  <p className="text-xs text-primary font-semibold">{m.position}</p>
                  
                  <div className="flex flex-col gap-0.5 mt-2 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Phone className="w-2.5 h-2.5" /> {m.phone || "No phone"}</span>
                    <span className="flex items-center gap-1"><Mail className="w-2.5 h-2.5" /> {m.email || "No email"}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/40">
                <div className="flex items-center gap-1 text-[10px] font-bold tracking-widest text-muted-foreground">
                  RANK: 
                  <input 
                    type="number" 
                    value={m.rank} 
                    onChange={e => handleUpdateRank(m.id, parseInt(e.target.value) || 0)}
                    onClick={e => e.stopPropagation()} 
                    className="w-10 h-6 border rounded bg-background text-center text-foreground"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-primary flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-full">
                    <MessageSquare className="w-2.5 h-2.5" /> {msgCount} Msgs
                  </span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={e => handleDeleteMember(m.id, e)} 
                    className="text-destructive hover:bg-destructive/10 p-2 h-8 w-8 rounded-full"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-strong rounded-3xl p-6 max-w-md w-full animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-xl font-bold mb-4">Add Profile Member</h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input value={newMember.name} onChange={e => setNewMember({ ...newMember, name: e.target.value })} placeholder="e.g. Advay Kapoor" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Role Category</Label>
                  <select 
                    value={newMember.role} 
                    onChange={e => setNewMember({ ...newMember, role: e.target.value as any })}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="secretariat">Secretariat</option>
                    <option value="staff">Staff/Officer</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Position Rank Order</Label>
                  <Input type="number" value={newMember.rank} onChange={e => setNewMember({ ...newMember, rank: parseInt(e.target.value) || 1 })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Position Title</Label>
                <Input value={newMember.position} onChange={e => setNewMember({ ...newMember, position: e.target.value })} placeholder="e.g. Chief Liaison Officer" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Contact Phone</Label>
                  <Input value={newMember.phone} onChange={e => setNewMember({ ...newMember, phone: e.target.value })} placeholder="+91..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Email Address</Label>
                  <Input type="email" value={newMember.email} onChange={e => setNewMember({ ...newMember, email: e.target.value })} placeholder="name@prumun.org" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border/40">
              <Button variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button variant="hero" onClick={handleAddMember}>Add Profile</Button>
            </div>
          </div>
        </div>
      )}

      {/* Messages Viewer Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedMember(null)}>
          <div className="glass-strong rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] flex flex-col justify-between animate-fade-in" onClick={e => e.stopPropagation()}>
            <div>
              <div className="flex justify-between items-start gap-4 border-b border-border/40 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-secondary">
                    <img src={selectedMember.photo} alt={selectedMember.name} />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold">{selectedMember.name}</h3>
                    <p className="text-xs text-primary font-semibold">{selectedMember.position}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedMember(null)}>Close</Button>
              </div>

              <Label className="font-bold text-sm block mb-2 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-primary" /> Delegate Messages Inbox ({memberMessages.length})
              </Label>

              <div className="space-y-2 overflow-y-auto max-h-[40vh] pr-1">
                {memberMessages.length === 0 ? (
                  <div className="text-center text-xs text-muted-foreground py-8 border border-dashed rounded-xl">
                    No messages addressed to this profile yet.
                  </div>
                ) : (
                  memberMessages.map(msg => (
                    <div 
                      key={msg.id} 
                      onClick={() => setActiveMessage(msg)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                        activeMessage?.id === msg.id 
                          ? "border-primary bg-primary/5" 
                          : "border-border/50 hover:bg-secondary/40"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-xs truncate">{msg.title}</h4>
                        <span className="text-[9px] text-muted-foreground flex items-center gap-1 shrink-0">
                          <Clock className="w-2.5 h-2.5" /> {new Date(msg.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">From: {msg.delegateName} ({msg.delegateSchool})</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Active message expanded details */}
            {activeMessage && (
              <div className="mt-4 p-4 border border-primary/20 bg-primary/[0.02] rounded-xl text-left animate-fade-in max-h-[25vh] overflow-y-auto">
                <h4 className="font-bold text-sm border-b border-border/40 pb-1.5 mb-2">{activeMessage.title}</h4>
                
                <div className="grid grid-cols-2 gap-2 text-[10px] mb-3 text-muted-foreground border-b border-border/40 pb-2">
                  <div><strong>Delegate:</strong> {activeMessage.delegateName}</div>
                  <div><strong>Contact:</strong> {activeMessage.delegateContact}</div>
                  <div><strong>School:</strong> {activeMessage.delegateSchool} ({activeMessage.delegateClass})</div>
                  <div><strong>MUN Role:</strong> {activeMessage.delegateRole}</div>
                </div>

                <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">{activeMessage.message}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
