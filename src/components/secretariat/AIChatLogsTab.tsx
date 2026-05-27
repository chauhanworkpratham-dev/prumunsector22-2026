// Browse every AI conversation by every delegate / EB / OC member.
// Filterable by committee and by role. Click a person to see their chat.
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  getRegistrations, getCommittees, getAIChatsForRegistration, downloadCSV,
  type Registration, type Committee, type AIChat,
} from "@/lib/munApi";
import { MessageSquare, Search, Download, ArrowLeft, Bot, User, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const ROLE_LABEL: Record<string, string> = {
  delegate: "Delegate",
  executive_board: "Executive Board",
  organising_committee: "Organising Committee",
};

export const AIChatLogsTab = ({ editionId }: { editionId: string }) => {
  const [regs, setRegs] = useState<Registration[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCommittee, setFilterCommittee] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Registration | null>(null);
  const [chats, setChats] = useState<AIChat[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const [r, c] = await Promise.all([getRegistrations(editionId), getCommittees(editionId)]);
      setRegs(r); setCommittees(c); setLoading(false);
    })();
  }, [editionId]);

  useEffect(() => {
    if (!selected) { setChats([]); return; }
    setChatsLoading(true);
    getAIChatsForRegistration(selected.id).then(c => { setChats(c); setChatsLoading(false); });
  }, [selected?.id]);

  const cMap = useMemo(() => Object.fromEntries(committees.map(c => [c.id, c])), [committees]);

  const filtered = regs.filter(r => {
    if (filterCommittee && r.committee_id !== filterCommittee) return false;
    if (filterRole && r.role !== filterRole) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.full_name.toLowerCase().includes(q) && !r.email.toLowerCase().includes(q) && !(r.portfolio ?? "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const exportCSV = () => {
    if (!selected) return;
    downloadCSV(`ai-chat-${selected.full_name.replace(/\s+/g,"_")}-${Date.now()}.csv`,
      ["When", "Speaker", "Content"],
      chats.map(c => [new Date(c.created_at).toLocaleString(), c.role, c.content]));
  };

  if (selected) {
    const c = cMap[selected.committee_id ?? ""];
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)}><ArrowLeft className="w-4 h-4" /> Back to list</Button>
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={!chats.length}><Download className="w-4 h-4" /> Export CSV</Button>
        </div>
        <div className="glass-strong rounded-3xl p-6">
          <div className="border-b border-border pb-3 mb-4">
            <h3 className="font-display text-xl font-bold">{selected.full_name}</h3>
            <p className="text-xs text-muted-foreground">
              {ROLE_LABEL[selected.role]} · {c?.short_name ?? "—"} · {selected.portfolio ?? selected.eb_role ?? "—"} · {selected.email}
            </p>
          </div>
          {chatsLoading ? (
            <p className="text-sm text-muted-foreground py-12 text-center">Loading chats…</p>
          ) : chats.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">No conversations yet.</p>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {chats.map(m => (
                <div key={m.id} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                    m.role === "user" ? "bg-gradient-primary text-primary-foreground" : "glass")}>
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest opacity-70 mb-1">
                      {m.role === "user" ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                      {m.role} · {new Date(m.created_at).toLocaleString()}
                    </div>
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <span className="whitespace-pre-wrap">{m.content}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-display text-xl font-bold flex items-center gap-2"><MessageSquare className="w-5 h-5 text-primary" /> AI Chat Logs</h3>
          <p className="text-xs text-muted-foreground">Browse every participant's conversations with the AI assistant. Click a name to read.</p>
        </div>
      </div>

      <div className="glass-strong rounded-3xl p-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground"><Search className="inline w-3 h-3 mr-1" />Search</label>
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, email, portfolio…" />
        </div>
        <div className="min-w-[180px]">
          <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground"><Filter className="inline w-3 h-3 mr-1" />Committee</label>
          <select value={filterCommittee} onChange={e => setFilterCommittee(e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">All committees</option>
            {committees.map(c => <option key={c.id} value={c.id}>{c.short_name} — {c.name}</option>)}
          </select>
        </div>
        <div className="min-w-[180px]">
          <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Position</label>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">All roles</option>
            <option value="delegate">Delegate</option>
            <option value="executive_board">Executive Board</option>
            <option value="organising_committee">Organising Committee</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-12">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12 glass rounded-2xl">No participants match these filters.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(r => {
            const c = cMap[r.committee_id ?? ""];
            const sub = r.role === "executive_board"
              ? (r.eb_role ?? "EB").replace("_"," ")
              : r.role === "organising_committee" ? "OC" : (r.portfolio ?? "—");
            return (
              <button key={r.id} onClick={() => setSelected(r)}
                className="glass rounded-2xl p-4 text-left hover:border-primary/40 border border-transparent hover-lift transition-all">
                <div className="font-semibold truncate">{r.full_name}</div>
                <div className="text-xs text-muted-foreground truncate">{c?.short_name ?? "—"} · {sub}</div>
                <div className="text-[10px] uppercase tracking-widest text-primary font-bold mt-2">{ROLE_LABEL[r.role]}</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
