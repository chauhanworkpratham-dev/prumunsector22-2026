import { useEffect, useRef, useState } from "react";
import { Button }      from "@/components/ui/button";
import { Textarea }    from "@/components/ui/textarea";
import { Send, Sparkles, Loader2, MessageCircle, RotateCcw } from "lucide-react";
import { toast }       from "@/hooks/use-toast";
import ReactMarkdown   from "react-markdown";
import remarkGfm       from "remark-gfm";
import { logAIChat }   from "@/lib/munApi";
import { cn }          from "@/lib/utils";
import type { Registration, Edition } from "@/lib/munApi";

type Msg = { role: "user" | "assistant"; content: string };

const HISTORY_KEY = (id: string) => `mun_ai_history_${id}`;

const loadHistory = (id: string): Msg[] => {
  try { const s = localStorage.getItem(HISTORY_KEY(id)); return s ? JSON.parse(s) : []; }
  catch { return []; }
};
const saveHistory = (id: string, msgs: Msg[]) => {
  // keep last 60 messages only to stay within storage limits
  const trimmed = msgs.slice(-60);
  localStorage.setItem(HISTORY_KEY(id), JSON.stringify(trimmed));
};

const SUGGESTIONS = [
  "Give me a country profile for my portfolio",
  "Draft my opening speech (90 seconds)",
  "Outline a position paper with 3 key arguments",
  "Who are potential bloc partners for my country?",
  "Explain moderated vs unmoderated caucus",
  "Draft 4 operative clauses for a working paper",
  "What are the key issues in this committee's agenda?",
  "Help me prepare for cross-examination",
];

export const AIAssistant = ({
  registration,
  edition,
}: {
  registration: Registration;
  edition: Edition;
}) => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-build rich context from registration data
  const context = [
    `Conference: ${edition.name}`,
    `Delegate: ${registration.full_name}`,
    `School: ${registration.school}, Grade: ${registration.grade}`,
    `Role: ${registration.role === "delegate" ? "Delegate" : registration.role === "executive_board" ? `Executive Board — ${registration.eb_role?.replace(/_/g, " ") ?? "member"}` : "Organising Committee"}`,
    registration.committee_id ? `Committee: (assigned)` : "",
    registration.portfolio ? `Portfolio / Country: ${registration.portfolio}` : "",
    registration.eb_role    ? `EB Role: ${registration.eb_role.replace(/_/g, " ")}` : "",
    `Event date: ${edition.event_date}`,
    edition.venue_name ? `Venue: ${edition.venue_name}` : "",
  ].filter(Boolean).join("\n");

  // Load persisted history on mount
  useEffect(() => {
    const hist = loadHistory(registration.id);
    setMessages(hist);
  }, [registration.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const userMsg: Msg = { role: "user", content };
    const next = [...messages, userMsg];
    setMessages(next);
    saveHistory(registration.id, next);
    setInput("");
    setLoading(true);
    logAIChat(registration.id, edition.id, "user", content).catch(() => {});

    let acc = "";
    const upsert = (chunk: string) => {
      acc += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          const updated = prev.map((m, i) => i === prev.length - 1 ? { ...m, content: acc } : m);
          saveHistory(registration.id, updated);
          return updated;
        }
        const updated = [...prev, { role: "assistant" as const, content: acc }];
        saveHistory(registration.id, updated);
        return updated;
      });
    };

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delegate-ai`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: next, context }),
      });

      if (!resp.ok || !resp.body) {
        const code = resp.status;
        if (code === 429) toast({ title: "Rate limit", description: "Wait a moment and try again.", variant: "destructive" });
        else if (code === 402) toast({ title: "AI credits exhausted", description: "Contact the secretariat.", variant: "destructive" });
        else toast({ title: "AI error", description: `${code} — please try again.`, variant: "destructive" });
        setMessages(prev => { const u = prev.slice(0, -1); saveHistory(registration.id, u); return u; });
        setLoading(false);
        return;
      }

      const reader  = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let done = false;
      while (!done) {
        const r = await reader.read();
        if (r.done) break;
        buf += decoder.decode(r.value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) upsert(c);
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Connection error", variant: "destructive" });
    } finally {
      setLoading(false);
      if (acc) logAIChat(registration.id, edition.id, "assistant", acc).catch(() => {});
    }
  };

  const reset = () => {
    setMessages([]);
    saveHistory(registration.id, []);
  };

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Context banner */}
      <div className="glass rounded-2xl p-3 flex flex-wrap gap-3 text-xs">
        {[
          registration.full_name,
          registration.portfolio ?? registration.eb_role ?? null,
          edition.name,
        ].filter(Boolean).map((v, i) => (
          <span key={i} className="px-2.5 py-1 rounded-full bg-primary/8 text-primary font-semibold">{v}</span>
        ))}
        <span className="text-muted-foreground self-center ml-auto">AI has your full profile</span>
      </div>

      <div className="glass-strong rounded-3xl p-4 md:p-5 flex flex-col h-[72vh] min-h-[480px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary text-white flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold">AI Research Assistant</h2>
              <p className="text-[10px] text-muted-foreground">Research · Speeches · Position papers · ROP · Anything</p>
            </div>
          </div>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={reset} disabled={loading} className="text-xs">
              <RotateCcw className="w-3 h-3" /> Clear
            </Button>
          )}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pr-1">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 gap-4">
              <MessageCircle className="w-10 h-10 text-primary/25" />
              <div>
                <p className="font-semibold text-sm">Ask me anything</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  I know your committee, portfolio and conference details. Get help with research, speeches, ROP and more.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-2 w-full max-w-2xl mt-2">
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => send(s)}
                    className="text-left px-3 py-2.5 rounded-xl border border-border/60 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/4 transition-all">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
                {m.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-gradient-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                  m.role === "user"
                    ? "bg-primary text-white rounded-br-sm"
                    : "bg-white border border-border/60 shadow-sm rounded-bl-sm"
                )}>
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none prose-headings:font-display prose-p:my-1 prose-ul:my-1">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content || "…"}</ReactMarkdown>
                    </div>
                  ) : (
                    <span className="whitespace-pre-wrap leading-relaxed">{m.content}</span>
                  )}
                </div>
              </div>
            ))
          )}
          {loading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-2 justify-start">
              <div className="w-6 h-6 rounded-full bg-gradient-primary flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <div className="bg-white border border-border/60 shadow-sm rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking…
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="mt-4 pt-3 border-t border-border/50">
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask anything — research, speeches, ROP, strategy…"
              className="flex-1 resize-none rounded-2xl text-sm min-h-[44px] max-h-[130px]"
              rows={1}
            />
            <Button onClick={() => send()} disabled={!input.trim() || loading}
              className="h-11 w-11 rounded-2xl bg-gradient-primary border-0 shrink-0 p-0 flex items-center justify-center">
              {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
            Enter to send · Shift+Enter for new line · History saved automatically
          </p>
        </div>
      </div>
    </div>
  );
};
