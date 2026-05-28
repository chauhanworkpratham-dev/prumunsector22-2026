import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useSecretariatAuth } from "@/hooks/useSecretariatAuth";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { LogOut, ShieldCheck, Users, Megaphone, CalendarDays, FileText, Video, Radio, Building2, Settings, Archive, UserCog, ClipboardCheck, Crown, HardHat, MessageSquare, Bot, CreditCard } from "lucide-react";
import { AttendanceTab } from "@/components/secretariat/AttendanceTab";
import { DelegatesTab } from "@/components/secretariat/DelegatesTab";
import { ExecutiveBoardTab } from "@/components/secretariat/ExecutiveBoardTab";
import { OrganisingCommitteeTab } from "@/components/secretariat/OrganisingCommitteeTab";
import { AnnouncementsTab } from "@/components/secretariat/AnnouncementsTab";
import { ScheduleTab } from "@/components/secretariat/ScheduleTab";
import { BrochureTab } from "@/components/secretariat/BrochureTab";
import { TrainingLibraryTab } from "@/components/secretariat/TrainingLibraryTab";
import { LiveSessionsTab } from "@/components/secretariat/LiveSessionsTab";
import { CommitteesTab } from "@/components/secretariat/CommitteesTab";
import { EditsTab } from "@/components/secretariat/EditsTab";
import { SecretariatMessagesTab } from "@/components/secretariat/SecretariatMessagesTab";
import { EditionsTab } from "@/components/secretariat/EditionsTab";
import { MembersTab } from "@/components/secretariat/MembersTab";
import { AIChatLogsTab } from "@/components/secretariat/AIChatLogsTab";
import { PaymentsTab } from "@/components/secretariat/PaymentsTab";

import { PendingApprovalBanner } from "@/components/secretariat/PendingApprovalBanner";
import type { TabKey } from "@/lib/munApi";

const Secretariat = () => {
  const navigate = useNavigate();
  const { checking, isSec, userId } = useSecretariatAuth();
  const { edition, refresh: refreshEdition } = useActiveEdition();
  const perms = usePermissions(userId);
  const [activeTab, setActiveTab] = useState("delegates");

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (checking) {
    return <div className="min-h-screen bg-background"><Navbar /><div className="pt-36 text-center text-muted-foreground">Verifying access…</div></div>;
  }
  if (!isSec) return null;

  const allTabs: { id: TabKey; label: string; icon: any }[] = [
    { id: "delegates", label: "Delegates", icon: Users },
    { id: "eb", label: "Executive Board", icon: Crown },
    { id: "oc", label: "Organising Committee", icon: HardHat },
    { id: "attendance", label: "Attendance", icon: ClipboardCheck },
    { id: "announcements", label: "Announcements", icon: Megaphone },
    { id: "schedule", label: "Schedule", icon: CalendarDays },
    { id: "brochure", label: "Brochure", icon: FileText },
    { id: "training", label: "Training Library", icon: Video },
    { id: "sessions", label: "Live Sessions", icon: Radio },
    { id: "committees", label: "Committees", icon: Building2 },
    { id: "contacts", label: "Secretariats/Messages", icon: MessageSquare }, // mapped to contacts key
    { id: "members", label: "Members", icon: UserCog },
    { id: "settings", label: "Centralized CMS", icon: Settings }, // mapped to settings key
    { id: "ai_chats", label: "AI Chat Logs", icon: Bot },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "editions", label: "Editions & Archive", icon: Archive },
  ];
  // Hide tabs the user has no access to (owner sees everything).
  const tabs = allTabs.filter(t => perms.can(t.id, "view"));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-36 pb-24 container">
        <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
          <div>
            <p className="text-xs tracking-[0.3em] text-accent font-bold mb-1 flex items-center gap-2">
              <ShieldCheck className="w-3 h-3" /> SECRETARIAT CONSOLE
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-bold gradient-text-deep">Mission Control</h1>
            {edition && <p className="text-sm text-muted-foreground mt-1">Active edition: <span className="font-semibold text-foreground">{edition.name}</span></p>}
          </div>
          <Button variant="ghost" size="sm" onClick={logout}><LogOut className="w-4 h-4" /> Sign out</Button>
        </div>

        <Tabs value={tabs.find(t => t.id === activeTab) ? activeTab : (tabs[0]?.id ?? "delegates")} onValueChange={setActiveTab}>
          <TabsList className="h-auto flex-wrap justify-start bg-transparent p-0 gap-1.5 mb-6">
            {tabs.map(t => (
              <TabsTrigger key={t.id} value={t.id}
                className={[
                  "glass rounded-xl px-3 py-2 text-xs font-semibold border border-border/50 transition-all",
                  "data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:border-primary/40 data-[state=active]:shadow-sm",
                  "hover:border-primary/30 hover:text-primary",
                ].join(" ")}>
                <t.icon className="w-3.5 h-3.5 mr-1.5 inline" /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {edition ? (
            <>
              {perms.can("delegates", "view") && <TabsContent value="delegates"><DelegatesTab editionId={edition.id} roleFilter="delegate" /></TabsContent>}
              {perms.can("eb", "view") && <TabsContent value="eb"><ExecutiveBoardTab editionId={edition.id} /></TabsContent>}
              {perms.can("oc", "view") && <TabsContent value="oc"><OrganisingCommitteeTab editionId={edition.id} /></TabsContent>}
              {perms.can("attendance", "view") && <TabsContent value="attendance"><AttendanceTab editionId={edition.id} /></TabsContent>}
              {perms.can("announcements", "view") && <TabsContent value="announcements"><AnnouncementsTab editionId={edition.id} /></TabsContent>}
              {perms.can("schedule", "view") && <TabsContent value="schedule"><ScheduleTab editionId={edition.id} /></TabsContent>}
              {perms.can("brochure", "view") && <TabsContent value="brochure"><BrochureTab editionId={edition.id} /></TabsContent>}
              {perms.can("training", "view") && <TabsContent value="training"><TrainingLibraryTab editionId={edition.id} /></TabsContent>}
              {perms.can("sessions", "view") && <TabsContent value="sessions"><LiveSessionsTab editionId={edition.id} /></TabsContent>}
              {perms.can("committees", "view") && <TabsContent value="committees"><CommitteesTab editionId={edition.id} /></TabsContent>}
              {perms.can("contacts", "view") && <TabsContent value="contacts"><SecretariatMessagesTab editionId={edition.id} /></TabsContent>}
              {perms.can("members", "view") && <TabsContent value="members"><MembersTab /></TabsContent>}
              {perms.can("settings", "view") && <TabsContent value="settings"><EditsTab edition={edition} onSaved={refreshEdition} /></TabsContent>}
              {perms.can("ai_chats", "view") && <TabsContent value="ai_chats"><AIChatLogsTab editionId={edition.id} /></TabsContent>}
              {perms.can("payments", "view") && <TabsContent value="payments"><PaymentsTab edition={edition} onSaved={refreshEdition} /></TabsContent>}
              
              {perms.can("editions", "view") && <TabsContent value="editions"><EditionsTab activeEdition={edition} onChanged={refreshEdition} /></TabsContent>}
            </>
          ) : (
            <div className="glass rounded-3xl p-12 text-center text-muted-foreground">No active edition. Create one in the Editions tab.</div>
          )}
        </Tabs>
      </section>
      <Footer />
    </div>
  );
};

export default Secretariat;
