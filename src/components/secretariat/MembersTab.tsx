// Owner-only console for managing secretariat membership AND the per-tab ×
// per-action permission matrix. The very first user with the secretariat
// role is the OWNER (server-side `is_owner_secretariat`); only the OWNER can
// edit permissions, approve/revoke other members, change passwords, or
// transfer ownership.
import { useEffect, useMemo, useState } from "react";
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
import { ShieldCheck, ShieldOff, Trash2, RefreshCw, UserCheck, Clock, Crown, KeyRound, Download, Send, Copy, Mail, ArrowRightLeft, Lock, User, Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Member = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  confirmed_at: string | null;
  is_secretariat: boolean;
};

const LEVELS: PermissionLevel[] = ["none", "view", "edit", "delete"];
const LEVEL_LABEL: Record<PermissionLevel, string> = {
  none: "No access", view: "View", edit: "Edit", delete: "Full",
};
const LEVEL_TONE: Record<PermissionLevel, string> = {
  none: "bg-muted text-muted-foreground",
  view: "bg-primary/10 text-primary",
  edit: "bg-warning/15 text-warning",
  delete: "bg-success/15 text-success",
};

const DEFAULT_PASSWORD = "coreprumun@2026";

export const MembersTab = () => {
  const { edition } = useActiveEdition();
  const [users, setUsers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [meIsOwner, setMeIsOwner] = useState(false);
  const [ownerUserId, setOwnerUserId] = useState<string | null>(null);
  const [perms, setPerms] = useState<MemberPermission[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [pwOpenFor, setPwOpenFor] = useState<Member | null>(null);
  const [pwValue, setPwValue] = useState(DEFAULT_PASSWORD);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [editNameFor, setEditNameFor] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const [membersRes, p, owner, pf] = await Promise.all([
      supabase.functions.invoke("secretariat-members", { method: "GET" }),
      getAllPermissions(),
      isOwnerSecretariat(user?.id ?? null),
      getSecretariatProfiles(),
    ]);
    setProfiles(pf);
    if (membersRes.error) {
      toast({ title: "Failed to load members", description: membersRes.error.message, variant: "destructive" });
    } else {
      setUsers((membersRes.data?.users ?? []) as Member[]);
      setOwnerUserId(membersRes.data?.owner_user_id ?? null);
    }
    setPerms(p);
    setMeIsOwner(owner);
    if (edition) setInvites(await getTeamInvitesForEdition(edition.id));
    setLoading(false);
  };

  useEffect(() => { load(); }, [edition?.id]);

  const callFn = async (body: any, label: string) => {
    setBusy(body.target_user_id + body.action);
    const { error } = await supabase.functions.invoke("secretariat-members", { method: "POST", body });
    setBusy(null);
    if (error) {
      toast({ title: `${label} failed`, description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: label });
    load();
    return true;
  };

  const act = async (target_user_id: string, action: "approve" | "revoke" | "delete", label: string) => {
    if (action === "delete" && !confirm("Permanently delete this user account? This cannot be undone.")) return;
    if (action === "revoke" && !confirm("Revoke secretariat access for this user?")) return;
    await callFn({ action, target_user_id }, label);
  };

  const transferOwnership = async (target: Member) => {
    if (!confirm(`Transfer OWNER role to ${target.email}? You will lose owner privileges immediately.`)) return;
    await callFn({ action: "transfer_ownership", target_user_id: target.id }, `👑 Ownership transferred to ${target.email}`);
  };

  const submitPassword = async () => {
    if (!pwOpenFor) return;
    if (pwValue.length < 8) { toast({ title: "Password too short", variant: "destructive" }); return; }
    const ok = await callFn({ action: "change_password", target_user_id: pwOpenFor.id, new_password: pwValue }, `🔑 Password updated for ${pwOpenFor.email}`);
    if (ok) { setPwOpenFor(null); setPwValue(DEFAULT_PASSWORD); }
  };

  const saveName = async (uid: string) => {
    const name = nameDraft.trim();
    if (name.length < 2) { toast({ title: "Name too short", variant: "destructive" }); return; }
    const { error } = await upsertSecretariatProfile(uid, name);
    if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); return; }
    setProfiles(p => ({ ...p, [uid]: name }));
    setEditNameFor(null);
    toast({ title: "✓ Name updated" });
  };

  const setLevel = async (user_id: string, tab: TabKey, level: PermissionLevel) => {
    const { error } = await setPermission(user_id, tab, level);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    setPerms(prev => {
      const others = prev.filter(p => !(p.user_id === user_id && p.tab === tab));
      return [...others, { id: crypto.randomUUID(), user_id, tab, level }];
    });
  };

  const permFor = (user_id: string, tab: TabKey): PermissionLevel => {
    const row = perms.find(p => p.user_id === user_id && p.tab === tab);
    return (row?.level as PermissionLevel) ?? "edit";
  };

  const pending = users.filter(u => !u.is_secretariat);
  const approved = users.filter(u => u.is_secretariat);

  const exportMembersCSV = () => {
    downloadCSV(`secretariat-members-${Date.now()}.csv`,
      ["Full name", "Email", "Status", "Owner", "Signed up", "Last sign-in", "Email confirmed"],
      users.map(u => [profiles[u.id] ?? "", u.email, u.is_secretariat ? "Approved" : "Pending",
        u.id === ownerUserId ? "OWNER" : "",
        new Date(u.created_at).toLocaleString(),
        u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : "Never",
        u.confirmed_at ? "Yes" : "No"]));
  };

  const exportInvitesCSV = () => {
    downloadCSV(`team-invites-${Date.now()}.csv`,
      ["Invitee name", "Email", "Grade", "Portfolio", "Claimed", "Created"],
      invites.map(i => [i.invitee_name, i.invitee_email, i.invitee_grade ?? "",
        i.assigned_portfolio,
        i.claimed_registration_id ? "Yes" : "No",
        new Date(i.created_at).toLocaleString()]));
  };

  const copyInviteLink = async (i: TeamInvite) => {
    const link = buildInviteLink(i);
    try {
      await navigator.clipboard.writeText(link);
      toast({ title: "🔗 Invite link copied", description: link });
    } catch {
      window.prompt("Copy this invite link:", link);
    }
  };

  const mailInvite = (i: TeamInvite) => {
    const link = buildInviteLink(i);
    const subject = encodeURIComponent(`Your PRUMUN team invite — ${i.assigned_portfolio}`);
    const body = encodeURIComponent(
      `Hi ${i.invitee_name},\n\nYou've been invited to join the PRUMUN team committee as ${i.assigned_portfolio}.\n\nFinish your registration here:\n${link}\n\nSee you at the conference!\n— PRUMUN Secretariat`
    );
    window.open(`mailto:${i.invitee_email}?subject=${subject}&body=${body}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-display text-xl font-bold flex items-center gap-2">
            Secretariat Members
            {meIsOwner && <span className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full bg-warning/15 text-warning flex items-center gap-1"><Crown className="w-3 h-3" /> OWNER</span>}
          </h3>
          <p className="text-sm text-muted-foreground">Approve sign-ups, manage admin access, change passwords, and transfer ownership. Default password for every new account: <code className="text-foreground">coreprumun@2026</code>.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportMembersCSV}><Download className="w-4 h-4" /> CSV</Button>
          <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Pending */}
      <div className="glass-strong rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-warning" />
          <h4 className="font-display font-bold">Pending Approval ({pending.length})</h4>
        </div>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending sign-ups.</p>
        ) : (
          <div className="space-y-2">
            {pending.map(u => (
              <div key={u.id} className="glass rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{u.email}</div>
                  <div className="text-xs text-muted-foreground">
                    Signed up {new Date(u.created_at).toLocaleDateString()}
                    {u.confirmed_at ? " · Email verified" : " · Email unverified"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="hero" disabled={busy === u.id + "approve" || !meIsOwner}
                    onClick={() => act(u.id, "approve", "Approved as secretariat")}>
                    <ShieldCheck className="w-4 h-4" /> Approve
                  </Button>
                  <Button size="sm" variant="ghost" disabled={busy === u.id + "delete" || !meIsOwner}
                    onClick={() => act(u.id, "delete", "User deleted")}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {!meIsOwner && <p className="text-xs text-muted-foreground italic mt-1">Only the owner can approve or remove sign-ups.</p>}
          </div>
        )}
      </div>

      {/* Approved + Permission matrix */}
      <div className="glass-strong rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <UserCheck className="w-4 h-4 text-success" />
          <h4 className="font-display font-bold">Active Secretariats ({approved.length})</h4>
        </div>
        <div className="space-y-4">
          {approved.map(u => {
            const isOwnerRow = u.id === ownerUserId;
            return (
              <div key={u.id} className="glass rounded-2xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate flex items-center gap-2 flex-wrap">
                      {editNameFor === u.id ? (
                        <span className="flex items-center gap-1">
                          <Input value={nameDraft} onChange={e => setNameDraft(e.target.value)} className="h-7 text-sm w-48" autoFocus
                            onKeyDown={e => { if (e.key === "Enter") saveName(u.id); if (e.key === "Escape") setEditNameFor(null); }} />
                          <Button size="sm" variant="hero" className="h-7 px-2" onClick={() => saveName(u.id)}><Check className="w-3 h-3" /></Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditNameFor(null)}><X className="w-3 h-3" /></Button>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{profiles[u.id] || <em className="text-muted-foreground font-normal">(no name)</em>}</span>
                          {meIsOwner && (
                            <button className="text-muted-foreground hover:text-foreground"
                              onClick={() => { setEditNameFor(u.id); setNameDraft(profiles[u.id] ?? ""); }}>
                              <Pencil className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      )}
                      {isOwnerRow && <span className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full bg-warning/15 text-warning flex items-center gap-1"><Crown className="w-3 h-3" /> OWNER</span>}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {u.email} · Last sign-in: {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : "Never"}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {meIsOwner && (
                      <Button size="sm" variant="outline"
                        onClick={() => { setPwOpenFor(u); setPwValue(DEFAULT_PASSWORD); }}>
                        <KeyRound className="w-3 h-3" /> Change password
                      </Button>
                    )}
                    {meIsOwner && !isOwnerRow && (
                      <Button size="sm" variant="outline" onClick={() => transferOwnership(u)}
                        disabled={busy === u.id + "transfer_ownership"}>
                        <ArrowRightLeft className="w-3 h-3" /> Transfer ownership
                      </Button>
                    )}
                    {!isOwnerRow && (
                      <Button size="sm" variant="ghost" disabled={busy === u.id + "revoke" || !meIsOwner}
                        onClick={() => act(u.id, "revoke", "Access revoked")}>
                        <ShieldOff className="w-4 h-4" /> Revoke
                      </Button>
                    )}
                  </div>
                </div>

                {/* Permission matrix */}
                {meIsOwner && !isOwnerRow ? (
                  <div className="rounded-xl border border-border overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-secondary/50">
                        <tr>
                          <th className="text-left p-2 font-bold tracking-wider"><KeyRound className="inline w-3 h-3 mr-1" />TAB</th>
                          {LEVELS.map(l => (
                            <th key={l} className="p-2 font-bold uppercase tracking-wider text-center">{LEVEL_LABEL[l]}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {ALL_TABS.map(t => {
                          const cur = permFor(u.id, t.key);
                          return (
                            <tr key={t.key} className="border-t border-border/50">
                              <td className="p-2 font-semibold">{t.label}</td>
                              {LEVELS.map(l => (
                                <td key={l} className="p-1 text-center">
                                  <button
                                    onClick={() => setLevel(u.id, t.key, l)}
                                    className={cn(
                                      "w-full px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all",
                                      cur === l ? LEVEL_TONE[l] + " ring-2 ring-primary/40" : "bg-muted/40 text-muted-foreground hover:bg-muted",
                                    )}
                                  >
                                    {cur === l ? "✓" : "·"}
                                  </button>
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    {isOwnerRow ? "Owner has full access to every tab." : "Only the owner can change permissions."}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Team invites + Resend */}
      <div className="glass-strong rounded-3xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div>
            <h4 className="font-display font-bold flex items-center gap-2"><Send className="w-4 h-4 text-primary" /> Team Invites ({invites.length})</h4>
            <p className="text-xs text-muted-foreground">Re-share registration links to teammates that haven't claimed their seat yet.</p>
          </div>
          <Button variant="outline" size="sm" onClick={exportInvitesCSV}><Download className="w-4 h-4" /> CSV</Button>
        </div>
        {invites.length === 0 ? (
          <p className="text-sm text-muted-foreground">No team invites yet.</p>
        ) : (
          <div className="space-y-2">
            {invites.map(i => (
              <div key={i.id} className="glass rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{i.invitee_name} <span className="text-xs text-muted-foreground">· {i.invitee_email}</span></div>
                  <div className="text-xs text-muted-foreground">
                    Portfolio: <span className="text-primary font-semibold">{i.assigned_portfolio}</span>
                    {i.claimed_registration_id
                      ? <span className="ml-2 text-success font-bold">✓ CLAIMED</span>
                      : <span className="ml-2 text-warning font-bold">PENDING</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => copyInviteLink(i)}>
                    <Copy className="w-3 h-3" /> Copy link
                  </Button>
                  <Button size="sm" variant="hero" onClick={() => mailInvite(i)}>
                    <Mail className="w-3 h-3" /> Resend
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Change-password dialog */}
      {pwOpenFor && (
        <div className="fixed inset-0 z-50 bg-foreground/70 flex items-center justify-center p-4" onClick={() => setPwOpenFor(null)}>
          <div className="glass-strong rounded-3xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-xl font-bold mb-1 flex items-center gap-2"><Lock className="w-5 h-5 text-primary" /> Change password</h3>
            <p className="text-xs text-muted-foreground mb-4">For <span className="font-semibold text-foreground">{pwOpenFor.email}</span>. They'll have to use the new password on their next sign-in. Default: <code>coreprumun@2026</code>.</p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>New password</Label>
                <Input type="text" value={pwValue} onChange={e => setPwValue(e.target.value)} autoComplete="new-password" />
                <p className="text-[11px] text-muted-foreground">At least 8 characters.</p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setPwOpenFor(null)}>Cancel</Button>
                <Button variant="hero" onClick={submitPassword} disabled={busy === pwOpenFor.id + "change_password"}>
                  {busy === pwOpenFor.id + "change_password" ? "Saving…" : "Update password"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
