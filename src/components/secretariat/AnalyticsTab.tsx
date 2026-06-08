import { useEffect, useState } from "react";
import { getRegistrations, getCommittees, type Registration, type Committee } from "@/lib/munApi";
import { Users, CreditCard, CheckCircle2, Clock, TrendingUp, BarChart3, Globe, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { editionId: string };

type DayCount = { day: string; count: number };

function last7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
  });
}

export const AnalyticsTab = ({ editionId }: Props) => {
  const [regs,  setRegs]  = useState<Registration[]>([]);
  const [comts, setComts] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!editionId) return;
    Promise.all([getRegistrations(editionId), getCommittees(editionId)]).then(([r, c]) => {
      setRegs(r); setComts(c); setLoading(false);
    });
  }, [editionId]);

  if (loading) return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-24 bg-secondary rounded-2xl" />
      ))}
    </div>
  );

  const total      = regs.length;
  const verified   = regs.filter(r => r.payment_status === "approved").length;
  const pending    = regs.filter(r => r.payment_status === "pending").length;
  const rejected   = regs.filter(r => r.payment_status === "rejected").length;
  const delegates  = regs.filter(r => r.role === "delegate").length;
  const ebs        = regs.filter(r => r.role === "executive_board").length;
  const ocs        = regs.filter(r => r.role === "organising_committee").length;
  const noneMode   = regs.filter(r => r.payment_status === "approved" && r.role !== "delegate").length;

  // Registrations per day (last 7 days) — approximated from created_at
  const days = last7Days();
  const dayCounts: DayCount[] = days.map(day => {
    const count = regs.filter(r => {
      const d = new Date(r.created_at);
      return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }) === day;
    }).length;
    return { day, count };
  });
  const maxDay = Math.max(...dayCounts.map(d => d.count), 1);

  // Committee fill rates
  const committeeStats = comts.map(c => {
    const assigned = regs.filter(r => r.committee_id === c.id && r.role === "delegate").length;
    const capacity = c.portfolios?.length ?? 1;
    return { name: c.short_name, assigned, capacity, pct: Math.round((assigned / capacity) * 100) };
  }).sort((a, b) => b.pct - a.pct);

  // Recent activity
  const recent = [...regs]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  const STAT_CARDS = [
    { label: "Total Registrations", value: total,    icon: Users,         color: "text-primary",     bg: "bg-primary/8"    },
    { label: "Payment Verified",    value: verified,  icon: CheckCircle2, color: "text-success",     bg: "bg-success/8"    },
    { label: "Pending Review",      value: pending,   icon: Clock,        color: "text-warning",     bg: "bg-warning/8"    },
    { label: "Rejected",            value: rejected,  icon: CreditCard,   color: "text-destructive", bg: "bg-destructive/8"},
    { label: "Delegates",           value: delegates, icon: Users,        color: "text-blue-600",    bg: "bg-blue-50"      },
    { label: "Executive Board",     value: ebs,       icon: Globe,        color: "text-purple-600",  bg: "bg-purple-50"    },
    { label: "OC Members",          value: ocs,       icon: Activity,     color: "text-amber-600",   bg: "bg-amber-50"     },
    { label: "Committees",          value: comts.length, icon: BarChart3, color: "text-primary",     bg: "bg-primary/8"    },
  ];

  return (
    <div className="space-y-5">
      {/* Stat grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STAT_CARDS.map(s => (
          <div key={s.label} className="glass rounded-2xl p-4 hover-lift">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", s.bg)}>
              <s.icon className={cn("w-4 h-4", s.color)} />
            </div>
            <div className={cn("text-2xl font-bold font-display", s.color)}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Registrations chart (bar) */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Registrations · Last 7 days</span>
          </div>
          <div className="flex items-end gap-1.5 h-32">
            {dayCounts.map(({ day, count }) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-[9px] font-bold text-primary">{count > 0 ? count : ""}</div>
                <div
                  className="w-full rounded-t-md bg-gradient-primary transition-all duration-500"
                  style={{ height: `${Math.max((count / maxDay) * 100, count > 0 ? 8 : 2)}%`, opacity: count > 0 ? 1 : 0.15 }}
                />
                <div className="text-[8px] text-muted-foreground text-center leading-tight whitespace-nowrap">{day}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Role donut (CSS-only) */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Role breakdown</span>
          </div>
          {total === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No registrations yet.</p>
          ) : (
            <div className="space-y-3">
              {[
                { label: "Delegates",        value: delegates, color: "bg-primary",     pct: Math.round((delegates / total) * 100) },
                { label: "Executive Board",  value: ebs,       color: "bg-purple-500",  pct: Math.round((ebs / total) * 100)       },
                { label: "OC Members",       value: ocs,       color: "bg-amber-500",   pct: Math.round((ocs / total) * 100)       },
              ].map(r => (
                <div key={r.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium flex items-center gap-1.5">
                      <span className={cn("w-2 h-2 rounded-full inline-block", r.color)} />
                      {r.label}
                    </span>
                    <span className="font-bold text-muted-foreground">{r.value} <span className="text-muted-foreground/60">({r.pct}%)</span></span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all duration-700", r.color)} style={{ width: `${r.pct}%` }} />
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-border/40">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Verification rate</span>
                  <span className="font-bold text-success">{total > 0 ? Math.round((verified / total) * 100) : 0}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Committee fill rates */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Committee fill rates</span>
          </div>
          {committeeStats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No committees yet.</p>
          ) : (
            <div className="space-y-2.5">
              {committeeStats.map(c => (
                <div key={c.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold">{c.name}</span>
                    <span className="text-muted-foreground">{c.assigned}/{c.capacity} seats</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all",
                        c.pct >= 90 ? "bg-success" : c.pct >= 60 ? "bg-primary" : "bg-warning"
                      )}
                      style={{ width: `${Math.min(c.pct, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Recent registrations</span>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No registrations yet.</p>
          ) : (
            <div className="space-y-2">
              {recent.map(r => (
                <div key={r.id} className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0",
                    r.role === "delegate" ? "bg-primary/10 text-primary" :
                    r.role === "executive_board" ? "bg-purple-100 text-purple-700" :
                    "bg-amber-100 text-amber-700"
                  )}>
                    {r.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{r.full_name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{r.school} · {r.role === "delegate" ? r.portfolio ?? "No portfolio" : r.eb_role?.replace(/_/g, " ") ?? r.role}</p>
                  </div>
                  <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0",
                    r.payment_status === "approved" ? "bg-success/10 text-success" :
                    r.payment_status === "pending"  ? "bg-warning/10 text-warning" :
                    r.payment_status === "rejected" ? "bg-destructive/10 text-destructive" :
                    "bg-secondary text-muted-foreground"
                  )}>
                    {r.payment_status === "approved" ? "✓" : r.payment_status === "pending" ? "⏳" : r.payment_status === "rejected" ? "✗" : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
