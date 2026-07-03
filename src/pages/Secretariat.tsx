import { useEffect, useState } from "react";
import { useNavigate }         from "react-router-dom";
import { Navbar }              from "@/components/Navbar";
import { useSecretariatAuth }  from "@/hooks/useSecretariatAuth";
import { useActiveEdition }    from "@/hooks/useActiveEdition";
import { usePermissions }      from "@/hooks/usePermissions";
import { supabase }            from "@/integrations/supabase/client";
import {
  LogOut, ShieldCheck, Users, Megaphone, CalendarDays, FileText,
  Video, Radio, Building2, Settings, Archive, UserCog, ClipboardCheck,
  Crown, HardHat, MessageSquare, Bot, CreditCard, ChevronRight,
  Menu, X, Trophy, BarChart3, Loader2,
} from "lucide-react";
import { AttendanceTab }          from "@/components/secretariat/AttendanceTab";
import { DelegatesTab }           from "@/components/secretariat/DelegatesTab";
import { ExecutiveBoardTab }      from "@/components/secretariat/ExecutiveBoardTab";
import { OrganisingCommitteeTab } from "@/components/secretariat/OrganisingCommitteeTab";
import { AnnouncementsTab }       from "@/components/secretariat/AnnouncementsTab";
import { ScheduleTab }            from "@/components/secretariat/ScheduleTab";
import { BrochureTab }            from "@/components/secretariat/BrochureTab";
import { TrainingLibraryTab }     from "@/components/secretariat/TrainingLibraryTab";
import { LiveSessionsTab }        from "@/components/secretariat/LiveSessionsTab";
import { CommitteesTab }          from "@/components/secretariat/CommitteesTab";
import { EditsTab }               from "@/components/secretariat/EditsTab";
import { SecretariatMessagesTab } from "@/components/secretariat/SecretariatMessagesTab";
import { EditionsTab }            from "@/components/secretariat/EditionsTab";
import { MembersTab }             from "@/components/secretariat/MembersTab";
import { AIChatLogsTab }          from "@/components/secretariat/AIChatLogsTab";
import { PaymentsTab }            from "@/components/secretariat/PaymentsTab";
import { GradesTab }              from "@/components/secretariat/GradesTab";
import { AnalyticsTab }           from "@/components/secretariat/AnalyticsTab";
import { PendingApprovalBanner }  from "@/components/secretariat/PendingApprovalBanner";
import type { TabKey }            from "@/lib/munApi";
import { cn, initials }           from "@/lib/utils";

const ALL_TABS: { id: TabKey; label: string; icon: any; group: string }[] = [
  { id: "analytics",     label: "Analytics",        icon: BarChart3,      group: "Overview" },
  { id: "grades",        label: "Grades",           icon: Trophy,         group: "Overview" },
  { id: "delegates",     label: "Delegates",        icon: Users,          group: "People"   },
  { id: "eb",            label: "Executive Board",  icon: Crown,          group: "People"   },
  { id: "oc",            label: "OC",               icon: HardHat,        group: "People"   },
  { id: "attendance",    label: "Attendance",       icon: ClipboardCheck, group: "People"   },
  { id: "payments",      label: "Payments",         icon: CreditCard,     group: "People"   },
  { id: "announcements", label: "Announcements",    icon: Megaphone,      group: "Content"  },
  { id: "schedule",      label: "Schedule",         icon: CalendarDays,   group: "Content"  },
  { id: "brochure",      label: "Brochure",         icon: FileText,       group: "Content"  },
  { id: "training",      label: "Training Library", icon: Video,          group: "Content"  },
  { id: "sessions",      label: "Live Sessions",    icon: Radio,          group: "Content"  },
  { id: "committees",    label: "Committees",       icon: Building2,      group: "Content"  },
  { id: "contacts",      label: "Messages",         icon: MessageSquare,  group: "System"   },
  { id: "members",       label: "Members",          icon: UserCog,        group: "System"   },
  { id: "ai_chats",      label: "AI Logs",          icon: Bot,            group: "System"   },
  { id: "settings",      label: "CMS",              icon: Settings,       group: "System"   },
  { id: "editions",      label: "Editions",         icon: Archive,        group: "System"   },
];

const GROUPS = ["Overview", "People", "Content", "System"] as const;

const Secretariat = () => {
  const navigate = useNavigate();
  const { checking, isSec, userId } = useSecretariatAuth();
  const { edition, refresh: refreshEdition } = useActiveEdition();
  const perms = usePermissions(userId);

  const [activeTab,      setActiveTab]      = useState<TabKey>("analytics");
  const [secEmail,       setSecEmail]       = useState<string | null>(null);
  const [sideCollapsed,  setSideCollapsed]  = useState(false);
  const [mobileSideOpen, setMobileSideOpen] = useState(false);

  const logout = async () => { await supabase.auth.signOut(); navigate("/"); };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSecEmail(data.user?.email ?? null));
  }, []);

  const switchTab = (t: TabKey) => { setActiveTab(t); setMobileSideOpen(false); };

  /* ── Loading ── */
  if (checking) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-navy/30" />
        <p className="text-sm text-navy/40">Verifying access…</p>
      </div>
    </div>
  );

  if (!isSec) return <PendingApprovalBanner email={secEmail} />;

  const tabs = ALL_TABS.filter(t => perms.can(t.id, "view"));
  const activeTabMeta = tabs.find(t => t.id === activeTab) ?? tabs[0];

  const renderContent = () => {
    if (!edition && activeTab !== "editions") return (
      <div className="border border-navy/8 rounded-sm p-16 text-center bg-white">
        <p className="text-navy/40 text-sm">No active edition. Create one in{" "}
          <button className="text-gold font-semibold underline underline-offset-2"
            onClick={() => switchTab("editions")}>Editions</button>.
        </p>
      </div>
    );
    switch (activeTab) {
      case "analytics":     return <AnalyticsTab editionId={edition?.id ?? ""} />;
      case "grades":        return <GradesTab editionId={edition!.id} />;
      case "delegates":     return <DelegatesTab editionId={edition!.id} roleFilter="delegate" />;
      case "eb":            return <ExecutiveBoardTab editionId={edition!.id} />;
      case "oc":            return <OrganisingCommitteeTab editionId={edition!.id} />;
      case "attendance":    return <AttendanceTab editionId={edition!.id} />;
      case "payments":      return <PaymentsTab edition={edition!} onSaved={refreshEdition} />;
      case "announcements": return <AnnouncementsTab editionId={edition!.id} />;
      case "schedule":      return <ScheduleTab editionId={edition!.id} />;
      case "brochure":      return <BrochureTab editionId={edition!.id} />;
      case "training":      return <TrainingLibraryTab editionId={edition!.id} />;
      case "sessions":      return <LiveSessionsTab editionId={edition!.id} />;
      case "committees":    return <CommitteesTab editionId={edition!.id} />;
      case "contacts":      return <SecretariatMessagesTab editionId={edition!.id} />;
      case "members":       return <MembersTab />;
      case "ai_chats":      return <AIChatLogsTab editionId={edition!.id} />;
      case "settings":      return <EditsTab edition={edition!} onSaved={refreshEdition} />;
      case "editions":      return <EditionsTab activeEdition={edition} onChanged={refreshEdition} />;
      default:              return null;
    }
  };

  /* ── Shared side nav ── */
  const SideNav = ({ collapsed = false }: { collapsed?: boolean }) => (
    <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
      {GROUPS.map(group => {
        const groupTabs = tabs.filter(t => t.group === group);
        if (!groupTabs.length) return null;
        return (
          <div key={group}>
            {!collapsed && (
              <p className="text-[9px] font-bold tracking-[0.22em] text-navy/30 uppercase px-3 mb-1.5">{group}</p>
            )}
            <div className="space-y-0.5">
              {groupTabs.map(t => {
                const Icon = t.icon;
                const active = activeTab === t.id;
                return (
                  <button key={t.id} onClick={() => switchTab(t.id)}
                    title={collapsed ? t.label : undefined}
                    className={cn(
                      "w-full flex items-center gap-2.5 rounded-sm transition-all text-sm",
                      collapsed ? "justify-center p-2.5" : "px-3 py-2.5",
                      active
                        ? "bg-navy text-white font-semibold"
                        : "text-navy/55 hover:bg-navy/5 hover:text-navy",
                    )}>
                    <Icon className="w-4 h-4 shrink-0" />
                    {!collapsed && <span className="truncate text-[13px]">{t.label}</span>}
                    {active && !collapsed && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gold" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <div className="flex flex-1 pt-14 overflow-hidden">

        {/* ── Desktop sidebar ── */}
        <aside className={cn(
          "hidden md:flex flex-col border-r border-navy/8 shrink-0 transition-all duration-300 bg-white",
          sideCollapsed ? "w-[60px]" : "w-[220px]",
        )}>
          {/* Sidebar header */}
          <div className="flex items-center gap-2 px-3 py-4 border-b border-navy/8 min-h-[56px]">
            {!sideCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-gold shrink-0" />
                  <span className="text-[11px] font-bold text-navy tracking-widest uppercase">Admin</span>
                </div>
                {edition && <p className="text-[10px] text-navy/40 truncate mt-0.5">{edition.name}</p>}
              </div>
            )}
            <button onClick={() => setSideCollapsed(v => !v)}
              className="w-7 h-7 rounded-sm hover:bg-navy/5 flex items-center justify-center text-navy/35 hover:text-navy transition-colors shrink-0">
              <ChevronRight className={cn("w-3.5 h-3.5 transition-transform duration-300", !sideCollapsed && "rotate-180")} />
            </button>
          </div>

          <SideNav collapsed={sideCollapsed} />

          {/* Sidebar footer */}
          <div className="border-t border-navy/8 p-3">
            {sideCollapsed ? (
              <button onClick={logout} title="Sign out"
                className="w-full flex items-center justify-center p-2 rounded-sm text-navy/35 hover:text-red-600 hover:bg-red-50 transition-all">
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-sm bg-navy flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                  {initials(secEmail?.split("@")[0] ?? "A")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-navy truncate">{secEmail?.split("@")[0]}</p>
                  <p className="text-[9px] text-navy/40 truncate">{secEmail}</p>
                </div>
                <button onClick={logout} title="Sign out"
                  className="p-1.5 rounded-sm text-navy/35 hover:text-red-600 hover:bg-red-50 transition-all shrink-0">
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ── Mobile sidebar drawer ── */}
        {mobileSideOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-navy/25 backdrop-blur-sm" onClick={() => setMobileSideOpen(false)} />
            <aside className="relative w-72 max-w-[85vw] bg-white flex flex-col h-full shadow-elegant border-r border-navy/8">
              <div className="flex items-center justify-between px-4 py-4 border-b border-navy/8">
                <div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-gold" />
                    <span className="text-xs font-bold text-navy tracking-widest uppercase">Admin Portal</span>
                  </div>
                  {edition && <p className="text-[10px] text-navy/40 mt-0.5">{edition.name}</p>}
                </div>
                <button onClick={() => setMobileSideOpen(false)}
                  className="w-8 h-8 rounded-sm hover:bg-navy/5 flex items-center justify-center text-navy/40">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <SideNav />
              <div className="border-t border-navy/8 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-sm bg-navy flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {initials(secEmail?.split("@")[0] ?? "A")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-navy truncate">{secEmail?.split("@")[0]}</p>
                    <p className="text-[10px] text-navy/40 truncate">{secEmail}</p>
                  </div>
                  <button onClick={logout}
                    className="p-1.5 rounded-sm text-navy/35 hover:text-red-600 hover:bg-red-50 transition-all">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden bg-white">

          {/* Mobile floating button */}
          <div className="md:hidden fixed bottom-6 right-6 z-40">
            <button onClick={() => setMobileSideOpen(true)}
              className="w-14 h-14 rounded-sm bg-navy text-white shadow-elegant flex items-center justify-center hover:bg-navy-mid transition-all active:scale-95"
              aria-label="Open navigation">
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Mobile active tab bar */}
          <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-navy/8 bg-white">
            {activeTabMeta && (
              <>
                <div className="w-8 h-8 rounded-sm bg-navy flex items-center justify-center shrink-0">
                  <activeTabMeta.icon className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-navy truncate">{activeTabMeta.label}</p>
                  {edition && <p className="text-[10px] text-navy/40 truncate">{edition.name}</p>}
                </div>
              </>
            )}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
            <div className="animate-fade-in">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Secretariat;
