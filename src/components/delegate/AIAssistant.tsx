import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles, Loader2, MessageCircle, RotateCcw, ShieldAlert } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { logAIChat } from "@/lib/munApi";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Give me a 1-page country profile to start research",
  "Draft an opening speech (90 seconds)",
  "Outline a position paper with 3 key arguments",
  "Suggest possible bloc partners and why",
  "Explain the ROP for a moderated caucus",
  "Draft 4 operative clauses for a working paper",
];

export const AIAssistant = ({ context, registrationId, editionId, disclaimer }: {
  context: string;
  registrationId?: string;
  editionId?: string;
  disclaimer?: string;
}) => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const userMsg: Msg = { role: "user", content };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    if (registrationId && editionId) logAIChat(registrationId, editionId, "user", content).catch(() => {});

    let acc = "";
    const upsert = (chunk: string) => {
      acc += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: acc } : m);
        }
        return [...prev, { role: "assistant", content: acc }];
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
        if (resp.status === 429) toast({ title: "Rate limit", description: "Please wait a moment.", variant: "destructive" });
        else if (resp.status === 402) toast({ title: "AI credits exhausted", description: "Please contact the secretariat.", variant: "destructive" });
        else toast({ title: "AI error", description: "Please try again.", variant: "destructive" });
        setMessages(prev => prev.slice(0, -1));
        setLoading(false);
        return;
      }
      const reader = resp.body.getReader();
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
      if (acc && registrationId && editionId) logAIChat(registrationId, editionId, "assistant", acc).catch(() => {});
    }
  };

  const reset = () => setMessages([]);

  return (
    <div className="space-y-3 animate-fade-in">
    {disclaimer && (
      <div className="glass rounded-2xl p-3 flex items-start gap-2 border border-warning/40 bg-warning/10 dark:bg-warning/15">
        <ShieldAlert className="w-4 h-4 text-warning shrink-0 mt-0.5" />
        <p className="text-xs text-foreground/90 dark:text-foreground leading-relaxed">{disclaimer}</p>
      </div>
    )}
    <div className="glass-strong rounded-3xl p-4 md:p-6 flex flex-col h-[70vh] min-h-[500px]">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary text-primary-foreground flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold">AI Research Assistant</h2>
            <p className="text-[11px] text-muted-foreground">Country research · Position papers · Speeches · ROP help</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={reset} disabled={loading}>
            <RotateCcw className="w-3 h-3" /> New chat
          </Button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <MessageCircle className="w-12 h-12 text-primary/40 mb-3" />
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Ask anything about your portfolio, MUN procedure, or get help drafting speeches and resolutions.
            </p>
            <div className="grid sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)}
                  className="glass rounded-xl px-3 py-2.5 text-xs text-left hover:bg-primary/5 hover:border-primary/30 border border-transparent transition-all">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                m.role === "user"
                  ? "bg-gradient-primary text-primary-foreground"
                  : "glass"
              )}>
                {m.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-display prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content || "…"}</ReactMarkdown>
                  </div>
                ) : (
                  <span className="whitespace-pre-wrap">{m.content}</span>
                )}
              </div>
            </div>
          ))
        )}
        {loading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="glass rounded-2xl px-4 py-2.5 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Thinking…
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-border">
        <div className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            placeholder="Ask anything… (Shift+Enter for new line)"
            rows={1}
            className="resize-none min-h-[44px] max-h-32"
            disabled={loading}
          />
          <Button variant="hero" size="icon" onClick={() => send()} disabled={loading || !input.trim()}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          AI can make mistakes — verify facts before submitting official documents.
        </p>
      </div>
    </div>
    </div>
  );
};
