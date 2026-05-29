import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useSecretariatAuth } from "@/hooks/useSecretariatAuth";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import {
  LogOut, ShieldCheck, Users, Megaphone, CalendarDays, FileText,
  Video, Radio, Building2, Settings, Archive, UserCog, ClipboardCheck,
  Crown, HardHat, MessageSquare, Bot, CreditCard, ChevronRight,
  LayoutDashboard,
} from "lucide-react";
import { AttendanceTab }         from "@/components/secretariat/AttendanceTab";
import { DelegatesTab }          from "@/components/secretariat/DelegatesTab";
import { ExecutiveBoardTab }     from "@/components/secretariat/ExecutiveBoardTab";
import { OrganisingCommitteeTab }from "@/components/secretariat/OrganisingCommitteeTab";
import { AnnouncementsTab }      from "@/components/secretariat/AnnouncementsTab";
import { ScheduleTab }           from "@/components/secretariat/ScheduleTab";
import { BrochureTab }           from "@/components/secretariat/BrochureTab";
import { TrainingLibraryTab }    from "@/components/secretariat/TrainingLibraryTab";
import { LiveSessionsTab }       from "@/components/secretariat/LiveSessionsTab";
import { CommitteesTab }         from "@/components/secretariat/CommitteesTab";
import { EditsTab }              from "@/components/secretariat/EditsTab";
import { SecretariatMessagesTab }from "@/components/secretariat/SecretariatMessagesTab";
import { EditionsTab }           from "@/components/secretariat/EditionsTab";
import { MembersTab }            from "@/components/secretariat/MembersTab";
import { AIChatLogsTab }         from "@/components/secretariat/AIChatLogsTab";
import { PaymentsTab }           from "@/components/secretariat/PaymentsTab";
import { GradesTab }             from "@/components/secretariat/GradesTab";
import { PendingApprovalBanner } from "@/components/secretariat/PendingApprovalBanner";
import type { TabKey } from "@/lib/munApi";
import { cn, initials } from "@/lib/utils";

const ALL_TABS: { id: TabKey; label: string; icon: any; group: string }[] = [
  { id: "delegates",   label: "Delegates",         icon: Users,         group: "People"    },
  { id: "eb",          label: "Executive Board",   icon: Crown,         group: "People"    },
  { id: "oc",          label: "OC",                icon: HardHat,       group: "People"    },
  { id: "attendance",  label: "Attendance",        icon: ClipboardCheck,group: "People"    },
  { id: "payments",    label: "Payments",          icon: CreditCard,    group: "People"    },
  { id: "grades",      label: "Grades",            icon: LayoutDashboard,group: "People"   },
  { id: "announcements",label:"Announcements",     icon: Megaphone,     group: "Content"   },
  { id: "schedule",    label: "Schedule",          icon: CalendarDays,  group: "Content"   },
  { id: "brochure",    label: "Brochure",          icon: FileText,      group: "Content"   },
  { id: "training",    label: "Training Library",  icon: Video,         group: "Content"   },
  { id: "sessions",    label: "Live Sessions",     icon: Radio,         group: "Content"   },
  { id: "committees",  label: "Committees",        icon: Building2,     group: "Content"   },
  { id: "contacts",    label: "Messages",          icon: MessageSquare, group: "System"    },
  { id: "members",     label: "Members",           icon: UserCog,       group: "System"    },
  { id: "ai_chats",    label: "AI Logs",           icon: Bot,           group: "System"    },
  { id: "settings",    label: "CMS",               icon: Settings,      group: "System"    },
  { id: "editions",    label: "Editions",          icon: Archive,       group: "System"    },
];

const GROUPS = ["People", "Content", "System"] as const;

const Secretariat = () => {
  const navigate = useNavigate();
  const { checking, isSec, userId } = useSecretariatAuth();
  const { edition, refresh: refreshEdition } = useActiveEdition();
  const perms = usePermissions(userId);
  const [activeTab, setActiveTab] = useState<TabKey>("delegates");
  const [secEmail,  setSecEmail]  = useState<string | null>(null);
  const [sideCollapsed, setSideCollapsed] = useState(false);

  const logout = async () => { await supabase.auth.signOut(); navigate("/"); };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSecEmail(data.user?.email ?? null));
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-primary animate-pulse" />
          <p className="text-sm text-muted-foreground">Verifying access…</p>
        </div>
      </div>
    );
  }
  if (!isSec) return null;

  const tabs = ALL_TABS.filter(t => perms.can(t.id, "view"));
  const activeTabMeta = tabs.find(t => t.id === activeTab) ?? tabs[0];

  const renderContent = () => {
    if (!edition) return (
      <div className="glass rounded-2xl p-16 text-center text-muted-foreground">
        No active edition. Create one in <button className="text-primary font-semibold" onClick={() => setActiveTab("editions")}>Editions</button>.
      </div>
    );
    switch (activeTab) {
      case "delegates":    return <DelegatesTab editionId={edition.id} roleFilter="delegate" />;
      case "eb":           return <ExecutiveBoardTab editionId={edition.id} />;
      case "oc":           return <OrganisingCommitteeTab editionId={edition.id} />;
      case "attendance":   return <AttendanceTab editionId={edition.id} />;
      case "payments":     return <PaymentsTab edition={edition} onSaved={refreshEdition} />;
      case "grades":       return <GradesTab editionId={edition.id} />;
      case "announcements":return <AnnouncementsTab editionId={edition.id} />;
      case "schedule":     return <ScheduleTab editionId={edition.id} />;
      case "brochure":     return <BrochureTab editionId={edition.id} />;
      case "training":     return <TrainingLibraryTab editionId={edition.id} />;
      case "sessions":     return <LiveSessionsTab editionId={edition.id} />;
      case "committees":   return <CommitteesTab editionId={edition.id} />;
      case "contacts":     return <SecretariatMessagesTab editionId={edition.id} />;
      case "members":      return <MembersTab />;
      case "ai_chats":     return <AIChatLogsTab editionId={edition.id} />;
      case "settings":     return <EditsTab edition={edition} onSaved={refreshEdition} />;
      case "editions":     return <EditionsTab activeEdition={edition} onChanged={refreshEdition} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex flex-1 pt-16">
        {/* ── Left sidebar ── */}
        <aside className={cn(
          "hidden md:flex flex-col border-r border-border/50 bg-gradient-surface transition-all duration-300 shrink-0",
          sideCollapsed ? "w-14" : "w-56",
        )}>
          {/* Sidebar header */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-border/40">
            {!sideCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-xs font-bold text-primary tracking-wide">ADMIN</span>
                </div>
                {edition && <p className="text-[10px] text-muted-foreground truncate mt-0.5">{edition.name}</p>}
              </div>
            )}
            <button onClick={() => setSideCollapsed(v => !v)}
              className="w-7 h-7 rounded-lg glass flex items-center justify-center text-muted-foreground hover:text-primary transition-colors shrink-0">
              <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", !sideCollapsed && "rotate-180")} />
            </button>
          </div>

          {/* Nav groups */}
          <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
            {GROUPS.map(group => {
              const groupTabs = tabs.filter(t => t.group === group);
              if (groupTabs.length === 0) return null;
              return (
                <div key={group}>
                  {!sideCollapsed && (
                    <p className="text-[9px] font-bold tracking-[0.2em] text-muted-foreground/60 uppercase px-3 mb-1">{group}</p>
                  )}
                  <div className="space-y-0.5">
                    {groupTabs.map(t => {
                      const Icon = t.icon;
                      const isActive = activeTab === t.id;
                      return (
                        <button key={t.id} onClick={() => setActiveTab(t.id)}
                          title={sideCollapsed ? t.label : undefined}
                          className={cn(
                            "w-full flex items-center gap-2.5 rounded-xl transition-all text-sm",
                            sideCollapsed ? "justify-center p-2.5" : "px-3 py-2",
                            isActive
                              ? "bg-primary/10 text-primary font-semibold"
                              : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                          )}>
                          <Icon className="w-4 h-4 shrink-0" />
                          {!sideCollapsed && <span className="truncate text-xs">{t.label}</span>}
                          {isActive && !sideCollapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Sidebar footer — user info */}
          <div className="border-t border-border/40 p-3">
            {sideCollapsed ? (
              <button onClick={logout} title="Sign out"
                className="w-full flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-all">
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {initials((secEmail ?? "S").split("@")[0])}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{secEmail?.split("@")[0]}</p>
                  <p className="text-[10px] text-muted-foreground">Secretariat</p>
                </div>
                <button onClick={logout} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-all" title="Sign out">
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0 overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-16 z-20">
            <div className="flex items-center gap-3 min-w-0">
              {activeTabMeta && (
                <>
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <activeTabMeta.icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="font-display font-bold text-base truncate">{activeTabMeta.label}</h1>
                    {edition && <p className="text-[11px] text-muted-foreground hidden sm:block">{edition.name}</p>}
                  </div>
                </>
              )}
            </div>

            {/* Mobile tab selector */}
            <div className="md:hidden flex-1 max-w-[200px]">
              <select value={activeTab} onChange={e => setActiveTab(e.target.value as TabKey)}
                className="w-full h-8 rounded-xl border border-input bg-background px-2 text-xs font-semibold">
                {GROUPS.map(g => (
                  <optgroup key={g} label={g}>
                    {tabs.filter(t => t.group === g).map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 pb-24">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Secretariat;
