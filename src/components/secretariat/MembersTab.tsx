import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  ALL_TABS, getAllPermissions, setPermission, isOwnerSecretariat,
  getTeamInvitesForEdition, buildInviteLink, downloadCSV,
  getSecretariatProfiles, upsertSecretariatProfile,
  type PermissionLevel, type TabKey, type MemberPermission, type TeamInvite,
} from "@/lib/munApi";
import { useActiveEdition } from "@/hooks/useActiveEdition";
import {
  ShieldCheck, ShieldOff, Trash2, RefreshCw, UserCheck, Clock,
  Crown, KeyRound, Download, Send, Copy, Mail, ArrowRightLeft, Lock,
  User, Pencil, Check, X, ChevronRight, ChevronDown, Shield, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Member = {
  id: string; email: string; created_at: string;
  last_sign_in_at: string | null; confirmed_at: string | null; is_secretariat: boolean;
};

const LEVELS: PermissionLevel[] = ["none", "view", "edit", "delete"];
const LEVEL_META: Record<PermissionLevel, { label: string; color: string; bg: string }> = {
  none:   { label: "No access", color: "text-muted-foreground", bg: "bg-muted/60" },
  view:   { label: "View",      color: "text-blue-600",         bg: "bg-blue-50 dark:bg-blue-950/40" },
  edit:   { label: "Edit",      color: "text-amber-600",        bg: "bg-amber-50 dark:bg-amber-950/40" },
  delete: { label: "Full",      color: "text-emerald-600",      bg: "bg-emerald-50 dark:bg-emerald-950/40" },
};

export const MembersTab = () => {
  const { edition } = useActiveEdition();
  const [users,      setUsers]      = useState<Member[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [busy,       setBusy]       = useState<string | null>(null);
  const [meIsOwner,  setMeIsOwner]  = useState(false);
  const [ownerUid,   setOwnerUid]   = useState<string | null>(null);
  const [perms,      setPerms]      = useState<MemberPermission[]>([]);
  const [invites,    setInvites]    = useState<TeamInvite[]>([]);
  const [profiles,   setProfiles]   = useState<Record<string, string>>({});
  const [expanded,   setExpanded]   = useState<Record<string, boolean>>({});
  const [editName,   setEditName]   = useState<string | null>(null);
  const [nameDraft,  setNameDraft]  = useState("");
  const [pwFor,      setPwFor]      = useState<Member | null>(null);
  const [pwVal,      setPwVal]      = useState("coreprumun@2026");
  const [activeTab,  setActiveTab]  = useState<"members" | "invites">("members");

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const [res, p, owner, pf] = await Promise.all([
      supabase.functions.invoke("secretariat-members", { method: "GET" }),
      getAllPermissions(),
      isOwnerSecretariat(user?.id ?? null),
      getSecretariatProfiles(),
    ]);
    setProfiles(pf);
    if (!res.error) {
      setUsers((res.data?.users ?? []) as Member[]);
      setOwnerUid(res.data?.owner_user_id ?? null);
    } else {
      toast({ title: "Failed to load members", description: res.error.message, variant: "destructive" });
    }
    setPerms(p);
    setMeIsOwner(owner);
    if (edition) setInvites(await getTeamInvitesForEdition(edition.id));
    setLoading(false);
  };

  useEffect(() => { load(); }, [edition?.id]);

  const callFn = async (body: any, label: string) => {
    const key = body.target_user_id + body.action;
    setBusy(key);
    const { error } = await supabase.functions.invoke("secretariat-members", { method: "POST", body });
    setBusy(null);
    if (error) { toast({ title: `${label} failed`, description: error.message, variant: "destructive" }); return false; }
    toast({ title: label });
    load();
    return true;
  };

  const act = async (id: string, action: "approve" | "revoke" | "delete", label: string) => {
    if (action === "delete" && !confirm("Permanently delete this account? Cannot be undone.")) return;
    if (action === "revoke" && !confirm("Revoke secretariat access for this user?")) return;
    await callFn({ action, target_user_id: id }, label);
  };

  const setLevel = async (user_id: string, tab: TabKey, level: PermissionLevel) => {
    const { error } = await setPermission(user_id, tab, level);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    setPerms(prev => [...prev.filter(p => !(p.user_id === user_id && p.tab === tab)), { id: crypto.randomUUID(), user_id, tab, level }]);
  };

  const permFor = (uid: string, tab: TabKey): PermissionLevel =>
    (perms.find(p => p.user_id === uid && p.tab === tab)?.level as PermissionLevel) ?? "edit";

  const saveName = async (uid: string) => {
    const n = nameDraft.trim();
    if (n.length < 2) { toast({ title: "Name too short", variant: "destructive" }); return; }
    const { error } = await upsertSecretariatProfile(uid, n);
    if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); return; }
    setProfiles(p => ({ ...p, [uid]: n }));
    setEditName(null);
    toast({ title: "Name updated" });
  };

  const submitPw = async () => {
    if (!pwFor) return;
    if (pwVal.length < 8) { toast({ title: "Password too short", variant: "destructive" }); return; }
    const ok = await callFn({ action: "change_password", target_user_id: pwFor.id, new_password: pwVal }, "Password updated");
    if (ok) { setPwFor(null); setPwVal("coreprumun@2026"); }
  };

  const copyLink = async (i: TeamInvite) => {
    const link = buildInviteLink(i);
    try { await navigator.clipboard.writeText(link); toast({ title: "Link copied" }); }
    catch { window.prompt("Copy:", link); }
  };

  const mailInvite = (i: TeamInvite) => {
    const link = buildInviteLink(i);
    window.open(`mailto:${i.invitee_email}?subject=${encodeURIComponent("Your PRUMUN invite")}&body=${encodeURIComponent(`Hi ${i.invitee_name},\n\nRegister here:\n${link}\n\n— PRUMUN Secretariat`)}`);
  };

  const pending  = users.filter(u => !u.is_secretariat);
  const approved = users.filter(u => u.is_secretariat);

  /* ── Stat cards (Pulse-inspired) ── */
  const stats = [
    { label: "Total members",     value: users.length,    sub: "secretariats" },
    { label: "Active",            value: approved.length, sub: "approved"     },
    { label: "Pending",           value: pending.length,  sub: "await approval" },
    { label: "Team invites",      value: invites.length,  sub: "sent"         },
  ];

  return (
    <div className="space-y-6">

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="glass rounded-2xl p-5 hover-lift">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className="font-display text-3xl font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Tab bar ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="tab-bar">
          <button className="tab-item" aria-selected={activeTab === "members"} onClick={() => setActiveTab("members")}>
            <UserCheck className="w-3.5 h-3.5 inline mr-1.5" /> Members
          </button>
          <button className="tab-item" aria-selected={activeTab === "invites"} onClick={() => setActiveTab("invites")}>
            <Send className="w-3.5 h-3.5 inline mr-1.5" /> Team Invites
          </button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => downloadCSV(`members-${Date.now()}.csv`,
            ["Name","Email","Status","Owner","Signed up"],
            users.map(u => [profiles[u.id]??"", u.email, u.is_secretariat?"Active":"Pending",
              u.id===ownerUid?"OWNER":"", new Date(u.created_at).toLocaleDateString()]))}>
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
          <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /> Refresh
          </Button>
        </div>
      </div>

      {/* ═══════════════════ MEMBERS TAB ═══════════════════ */}
      {activeTab === "members" && (
        <div className="space-y-4">

          {/* Pending */}
          {pending.length > 0 && (
            <div className="glass-strong rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-border/50 bg-amber-50/50 dark:bg-amber-950/20">
                <Clock className="w-4 h-4 text-amber-500" />
                <h4 className="font-semibold text-sm">Pending Approval — {pending.length}</h4>
                {!meIsOwner && <span className="ml-auto text-[10px] text-muted-foreground flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Only owner can approve</span>}
              </div>
              <div className="divide-y divide-border/40">
                {pending.map(u => (
                  <div key={u.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold shrink-0">
                        {u.email[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{u.email}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString()} · {u.confirmed_at ? "Email verified" : "Unverified"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" disabled={!meIsOwner || busy === u.id + "approve"}
                        className="bg-gradient-primary text-white border-0 text-xs font-semibold hover:opacity-90"
                        onClick={() => act(u.id, "approve", "Member approved")}>
                        <ShieldCheck className="w-3.5 h-3.5" /> Approve
                      </Button>
                      <Button size="sm" variant="ghost" disabled={!meIsOwner || busy === u.id + "delete"}
                        onClick={() => act(u.id, "delete", "Account deleted")}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approved members */}
          <div className="glass-strong rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border/50">
              <UserCheck className="w-4 h-4 text-emerald-500" />
              <h4 className="font-semibold text-sm">Active Secretariats — {approved.length}</h4>
              <span className="ml-auto text-[10px] text-muted-foreground">Click the arrow to manage permissions</span>
            </div>

            <div className="divide-y divide-border/40">
              {approved.map(u => {
                const isOwnerRow = u.id === ownerUid;
                const isExpanded = expanded[u.id];

                return (
                  <div key={u.id}>
                    {/* ── Row header ── */}
                    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/30 transition-colors">
                      {/* Avatar */}
                      <div className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                        isOwnerRow ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white" : "bg-gradient-primary text-white",
                      )}>
                        {(profiles[u.id] ?? u.email)[0].toUpperCase()}
                      </div>

                      {/* Name + email */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {editName === u.id ? (
                            <span className="flex items-center gap-1">
                              <Input value={nameDraft} onChange={e => setNameDraft(e.target.value)}
                                className="h-7 text-sm w-40" autoFocus
                                onKeyDown={e => { if (e.key === "Enter") saveName(u.id); if (e.key === "Escape") setEditName(null); }} />
                              <button onClick={() => saveName(u.id)} className="w-6 h-6 rounded bg-primary text-white flex items-center justify-center hover:opacity-80"><Check className="w-3 h-3" /></button>
                              <button onClick={() => setEditName(null)} className="w-6 h-6 rounded bg-muted flex items-center justify-center hover:opacity-80"><X className="w-3 h-3" /></button>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold">{profiles[u.id] || <em className="text-muted-foreground font-normal text-xs">No name set</em>}</span>
                              {meIsOwner && (
                                <button onClick={() => { setEditName(u.id); setNameDraft(profiles[u.id] ?? ""); }}
                                  className="text-muted-foreground hover:text-primary transition-colors">
                                  <Pencil className="w-3 h-3" />
                                </button>
                              )}
                            </span>
                          )}
                          {isOwnerRow && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 text-[9px] font-bold tracking-wider">
                              <Crown className="w-2.5 h-2.5" /> OWNER
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {meIsOwner && (
                          <button onClick={() => { setPwFor(u); setPwVal("coreprumun@2026"); }}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/8 transition-all"
                            title="Change password">
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {meIsOwner && !isOwnerRow && (
                          <button onClick={() => confirm(`Transfer ownership to ${u.email}?`) && callFn({ action: "transfer_ownership", target_user_id: u.id }, "Ownership transferred")}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all"
                            title="Transfer ownership">
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {!isOwnerRow && meIsOwner && (
                          <button onClick={() => act(u.id, "revoke", "Access revoked")}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-all"
                            title="Revoke access">
                            <ShieldOff className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Expand arrow — only for non-owner editable members */}
                        {meIsOwner && !isOwnerRow ? (
                          <button
                            onClick={() => setExpanded(prev => ({ ...prev, [u.id]: !prev[u.id] }))}
                            className={cn(
                              "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                              isExpanded
                                ? "bg-primary text-white shadow-sm"
                                : "text-muted-foreground hover:text-primary hover:bg-primary/8 border border-border/60",
                            )}
                            title="Manage permissions">
                            <Shield className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Permissions</span>
                            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          </button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic px-2">
                            {isOwnerRow ? "Full access" : ""}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ── Permission matrix (expandable) ── */}
                    {isExpanded && meIsOwner && !isOwnerRow && (
                      <div className="px-5 pb-5 pt-2 bg-secondary/20 animate-fade-in border-t border-border/40">
                        <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase mb-3 flex items-center gap-1.5">
                          <Shield className="w-3 h-3" /> Permission Matrix — {profiles[u.id] || u.email}
                        </p>

                        <div className="rounded-xl border border-border/60 overflow-hidden bg-background">
                          {/* Header */}
                          <div className="grid gap-0" style={{ gridTemplateColumns: "1fr repeat(4, 100px)" }}>
                            <div className="px-4 py-2.5 text-[10px] font-bold tracking-wider text-muted-foreground bg-secondary/50">TAB</div>
                            {LEVELS.map(l => (
                              <div key={l} className={cn("px-2 py-2.5 text-center text-[10px] font-bold tracking-wider bg-secondary/50", LEVEL_META[l].color)}>
                                {LEVEL_META[l].label.toUpperCase()}
                              </div>
                            ))}
                          </div>

                          {/* Rows */}
                          {ALL_TABS.map((t, idx) => {
                            const cur = permFor(u.id, t.key);
                            return (
                              <div key={t.key}
                                className={cn("grid gap-0 border-t border-border/40 hover:bg-secondary/20 transition-colors", { "bg-secondary/10": idx % 2 === 0 })}
                                style={{ gridTemplateColumns: "1fr repeat(4, 100px)" }}>
                                <div className="px-4 py-2.5 text-xs font-medium">{t.label}</div>
                                {LEVELS.map(l => (
                                  <div key={l} className="px-2 py-2 flex items-center justify-center">
                                    <button
                                      onClick={() => setLevel(u.id, t.key, l)}
                                      className={cn(
                                        "w-full py-1.5 rounded-lg text-[10px] font-bold transition-all border",
                                        cur === l
                                          ? cn(LEVEL_META[l].bg, LEVEL_META[l].color, "border-current/30 shadow-sm")
                                          : "border-transparent bg-transparent text-muted-foreground/40 hover:bg-secondary hover:text-foreground",
                                      )}>
                                      {cur === l ? "●" : "○"}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>

                        <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Changes apply instantly. Owner always retains full access.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ INVITES TAB ═══════════════════ */}
      {activeTab === "invites" && (
        <div className="glass-strong rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
            <div>
              <h4 className="font-semibold text-sm flex items-center gap-2"><Send className="w-4 h-4 text-primary" /> Team Invites — {invites.length}</h4>
              <p className="text-[11px] text-muted-foreground">Resend registration links to team members who haven't claimed their seat.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => downloadCSV(`invites-${Date.now()}.csv`,
              ["Name","Email","Portfolio","Claimed"],
              invites.map(i => [i.invitee_name, i.invitee_email, i.assigned_portfolio, i.claimed_registration_id?"Yes":"No"]))}>
              <Download className="w-3.5 h-3.5" /> Export
            </Button>
          </div>

          {invites.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No team invites yet.</div>
          ) : (
            <div className="divide-y divide-border/40">
              {invites.map(i => (
                <div key={i.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{i.invitee_name} <span className="font-normal text-muted-foreground">· {i.invitee_email}</span></p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[11px] text-primary font-medium">{i.assigned_portfolio}</span>
                      <span className={cn("text-[10px] font-bold",
                        i.claimed_registration_id ? "text-emerald-600" : "text-amber-600")}>
                        {i.claimed_registration_id ? "✓ Claimed" : "Pending"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => copyLink(i)}>
                      <Copy className="w-3 h-3" /> Copy
                    </Button>
                    <Button size="sm" className="text-xs bg-gradient-primary text-white border-0 hover:opacity-90" onClick={() => mailInvite(i)}>
                      <Mail className="w-3 h-3" /> Resend
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Change password modal ── */}
      {pwFor && (
        <div className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPwFor(null)}>
          <div className="glass-strong rounded-2xl p-6 max-w-sm w-full shadow-elegant animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold flex items-center gap-2"><Lock className="w-4 h-4 text-primary" /> Change password</h3>
              <button onClick={() => setPwFor(null)} className="w-7 h-7 rounded-lg glass flex items-center justify-center hover:bg-destructive/10">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Account: <span className="font-semibold text-foreground">{pwFor.email}</span></p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">New password <span className="text-muted-foreground">(min. 8 chars)</span></Label>
                <Input type="text" value={pwVal} onChange={e => setPwVal(e.target.value)} autoComplete="new-password" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setPwFor(null)}>Cancel</Button>
                <Button size="sm" className="bg-gradient-primary text-white border-0 font-semibold hover:opacity-90" onClick={submitPw}
                  disabled={busy === pwFor.id + "change_password"}>
                  {busy === pwFor.id + "change_password" ? "Saving…" : "Update password"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
