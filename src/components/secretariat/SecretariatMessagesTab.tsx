import { useEffect, useState, useMemo } from "react";
import {
  MessageCircle, Search, Trash2, Phone, User, Clock,
  CheckCheck, Tag, Download, EyeOff, X, MessageSquareDot,
  Inbox, ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

type StoredMessage = {
  id: string;
  secretariatId: string;
  recipientName: string;
  recipientRole: string;
  name: string;
  school?: string;
  phone?: string;
  subject: string;
  message: string;
  timestamp: string;
  read: boolean;
  role?: string;
  contact?: string;
  grade?: string;
};

const STORAGE_KEY = "mun_secretariat_messages";

const loadMessages = (): StoredMessage[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw).map((m: any) => ({
      ...m,
      subject:       m.subject       ?? m.title      ?? "(no subject)",
      message:       m.message       ?? m.body       ?? "",
      recipientName: m.recipientName ?? m.secretariatId ?? "Secretariat",
      recipientRole: m.recipientRole ?? "",
      name:          m.name          ?? m.full_name  ?? "Unknown",
      read:          m.read          ?? false,
    }));
  } catch { return []; }
};

const saveMessages = (msgs: StoredMessage[]) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));

export const SecretariatMessagesTab = ({ editionId }: { editionId: string }) => {
  const [messages,    setMessages]    = useState<StoredMessage[]>([]);
  const [selected,    setSelected]    = useState<StoredMessage | null>(null);
  const [search,      setSearch]      = useState("");
  const [filter,      setFilter]      = useState<"all" | "unread" | "read">("all");
  const [mobileView,  setMobileView]  = useState<"list" | "detail">("list");

  useEffect(() => {
    setMessages(loadMessages());
    const t = setInterval(() => setMessages(loadMessages()), 15_000);
    return () => clearInterval(t);
  }, [editionId]);

  const markRead   = (id: string) => { const u = messages.map(m => m.id === id ? { ...m, read: true }  : m); setMessages(u); saveMessages(u); };
  const markUnread = (id: string) => { const u = messages.map(m => m.id === id ? { ...m, read: false } : m); setMessages(u); saveMessages(u); };
  const deleteMsg  = (id: string) => {
    const u = messages.filter(m => m.id !== id); setMessages(u); saveMessages(u);
    if (selected?.id === id) { setSelected(null); setMobileView("list"); }
  };
  const openMessage = (m: StoredMessage) => {
    setSelected(m); setMobileView("detail"); if (!m.read) markRead(m.id);
  };
  const markAllRead = () => { const u = messages.map(m => ({ ...m, read: true })); setMessages(u); saveMessages(u); };

  const exportExcel = () => {
    const rows = filtered.map(m => ({
      From:     m.name,
      School:   m.school   ?? "",
      Phone:    m.phone    ?? m.contact ?? "",
      Subject:  m.subject,
      Message:  m.message,
      To:       m.recipientName,
      "To Role": m.recipientRole,
      Received: new Date(m.timestamp).toLocaleString("en-IN"),
      Read:     m.read ? "Yes" : "No",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Messages");
    XLSX.writeFile(wb, `messages-${Date.now()}.xlsx`);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return messages
      .filter(m => {
        if (filter === "unread" && m.read)  return false;
        if (filter === "read"   && !m.read) return false;
        if (q && !(
          m.name.toLowerCase().includes(q) ||
          m.subject.toLowerCase().includes(q) ||
          m.message.toLowerCase().includes(q) ||
          (m.school ?? "").toLowerCase().includes(q) ||
          m.recipientName.toLowerCase().includes(q)
        )) return false;
        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [messages, search, filter]);

  const unreadCount = messages.filter(m => !m.read).length;

  const fmtTime = (iso: string) => {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60)    return "Just now";
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const avatar = (name: string) =>
    name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  /* ── Detail panel ── */
  const DetailPanel = () => {
    if (!selected) return (
      <div className="hidden md:flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/40 bg-slate-50 text-muted-foreground gap-3">
        <MessageCircle className="w-12 h-12 opacity-20" />
        <p className="font-semibold text-sm">Select a message to read</p>
        <p className="text-xs">Click any message in the list</p>
      </div>
    );

    return (
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-border/50 overflow-hidden shadow-sm min-h-0">
        {/* Detail header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40 bg-gradient-to-r from-slate-50 to-blue-50/30 shrink-0">
          <button
            className="md:hidden w-8 h-8 rounded-xl bg-secondary/70 flex items-center justify-center"
            onClick={() => setMobileView("list")}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm truncate text-foreground">{selected.subject}</h3>
            <p className="text-xs text-muted-foreground">
              {new Date(selected.timestamp).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => selected.read ? markUnread(selected.id) : markRead(selected.id)}
              title={selected.read ? "Mark unread" : "Mark read"}
              className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-primary transition-colors"
            >
              {selected.read ? <EyeOff className="w-4 h-4" /> : <CheckCheck className="w-4 h-4" />}
            </button>
            <button
              onClick={() => deleteMsg(selected.id)}
              className="p-2 rounded-xl hover:bg-destructive/8 text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Detail body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Sender card */}
          <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-primary/4 to-blue-50/40 p-4">
            <p className="text-[9px] uppercase tracking-[0.25em] font-black text-muted-foreground/60 mb-3">From</p>
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-blue-400 text-white flex items-center justify-center font-black text-base shrink-0">
                {avatar(selected.name)}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 flex-1">
                <DetailField label="Name"   value={selected.name} />
                {selected.school  && <DetailField label="School"  value={selected.school} />}
                {(selected.phone || selected.contact) && (
                  <DetailField label="Phone" value={selected.phone ?? selected.contact ?? ""} link={`tel:${selected.phone ?? selected.contact}`} />
                )}
                {selected.role  && <DetailField label="Role"   value={selected.role} />}
                {selected.grade && <DetailField label="Grade"  value={selected.grade} />}
              </div>
            </div>
          </div>

          {/* Recipient card */}
          {selected.recipientName && selected.recipientName !== "Secretariat" && (
            <div className="rounded-2xl border border-border/50 bg-secondary/30 p-4">
              <p className="text-[9px] uppercase tracking-[0.25em] font-black text-muted-foreground/60 mb-2">Sent to</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">{selected.recipientName}</p>
                  {selected.recipientRole && <p className="text-xs text-primary font-semibold">{selected.recipientRole}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Subject + message */}
          <div className="rounded-2xl border border-border/50 bg-white p-5 space-y-4">
            <div>
              <p className="text-[9px] uppercase tracking-[0.25em] font-black text-muted-foreground/60 mb-1">Subject</p>
              <p className="font-bold text-sm text-foreground">{selected.subject}</p>
            </div>
            <div className="h-px bg-border/40" />
            <div>
              <p className="text-[9px] uppercase tracking-[0.25em] font-black text-muted-foreground/60 mb-2">Message</p>
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{selected.message}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {(selected.phone || selected.contact) && (
              <a
                href={`https://wa.me/${(selected.phone ?? selected.contact ?? "").replace(/\D/g, "")}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-semibold hover:bg-green-100 transition-colors"
              >
                <Phone className="w-4 h-4" /> WhatsApp Reply
              </a>
            )}
            <span className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-secondary/50 border border-border text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              {new Date(selected.timestamp).toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" })}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4" style={{ height: "calc(100vh - 140px)", minHeight: "500px" }}>

      {/* Header */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <Inbox className="w-5 h-5 text-primary" />
          <h2 className="font-display text-xl font-bold">Messages</h2>
          {unreadCount > 0 && (
            <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
        <div className="flex-1" />
        <button
          onClick={exportExcel}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-white text-xs font-semibold hover:bg-secondary transition-colors shadow-sm"
        >
          <Download className="w-3.5 h-3.5" /> Excel
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 shrink-0">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, subject, message…"
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm"
          />
        </div>
        <div className="flex rounded-xl border border-border overflow-hidden bg-white shadow-sm">
          {(["all", "unread", "read"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("px-4 py-2 text-xs font-semibold capitalize transition-all",
                filter === f ? "bg-primary text-white" : "text-muted-foreground hover:bg-secondary")}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Two-pane layout */}
      <div className="flex-1 flex gap-4 min-h-0">

        {/* List pane */}
        <div className={cn(
          "flex flex-col bg-white rounded-2xl border border-border/50 overflow-hidden shadow-sm",
          mobileView === "detail"
            ? "hidden md:flex md:w-[320px] md:shrink-0"
            : "flex flex-1 md:w-[320px] md:shrink-0"
        )}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-slate-50/80 shrink-0">
            <span className="text-xs font-bold text-muted-foreground">
              {filtered.length} message{filtered.length !== 1 ? "s" : ""}
            </span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-[11px] text-primary font-semibold hover:underline">
                Mark all read
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground gap-3">
                <MessageSquareDot className="w-10 h-10 opacity-20" />
                <p className="font-semibold text-sm">{search ? "No results" : "No messages yet"}</p>
              </div>
            ) : (
              filtered.map(m => (
                <button key={m.id} onClick={() => openMessage(m)}
                  className={cn(
                    "w-full flex items-start gap-3 px-4 py-3.5 border-b border-border/30 text-left transition-colors hover:bg-primary/4",
                    selected?.id === m.id && "bg-primary/6 border-l-[3px] border-l-primary",
                    !m.read && "bg-blue-50/50"
                  )}>
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 mt-0.5",
                    !m.read
                      ? "bg-gradient-to-br from-primary to-blue-400 text-white shadow-sm"
                      : "bg-secondary text-muted-foreground"
                  )}>
                    {avatar(m.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={cn("text-sm truncate",
                        !m.read ? "font-bold text-foreground" : "font-medium text-foreground/75")}>
                        {m.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0 ml-1">{fmtTime(m.timestamp)}</span>
                    </div>
                    <p className={cn("text-xs truncate mt-0.5",
                      !m.read ? "font-semibold text-foreground/80" : "text-muted-foreground")}>
                      {m.subject}
                    </p>
                    <p className="text-[11px] text-muted-foreground/70 truncate mt-0.5 leading-snug">{m.message}</p>
                    {m.recipientName && m.recipientName !== "Secretariat" && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-primary font-semibold">
                        <Tag className="w-2.5 h-2.5" /> To: {m.recipientName}
                      </span>
                    )}
                  </div>
                  {!m.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Detail pane */}
        <div className={cn("flex-1 min-w-0", mobileView === "list" ? "hidden md:flex" : "flex")}>
          <DetailPanel />
        </div>
      </div>
    </div>
  );
};

const DetailField = ({
  label, value, link,
}: { label: string; value: string; link?: string }) => (
  <div>
    <p className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-bold">{label}</p>
    {link
      ? <a href={link} className="text-sm font-semibold text-primary hover:underline">{value}</a>
      : <p className="text-sm font-semibold text-foreground">{value}</p>
    }
  </div>
);
