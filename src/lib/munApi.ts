// Centralised data layer for PRUMUN (Lovable Cloud backed).
import { supabase } from "@/integrations/supabase/client";

export type Edition = {
  id: string;
  name: string;
  event_date: string;
  event_end_date: string | null;
  countdown_title: string;
  countdown_subtitle: string | null;
  venue_name: string | null;
  venue_address: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  facebook_url: string | null;
  is_active: boolean;
  archived_at: string | null;
  stat_delegates: string;
  stat_committees: string;
  stat_years: string;
  stat_portfolios: string;
  logo_url: string | null;
  header_logo_url: string | null;
  qr_pending_title: string;
  qr_message_approved: string;
  qr_message_delegate_pending: string;
  qr_message_eb_pending: string;
  qr_message_oc_pending: string;
  disclaimer_qr: string;
  disclaimer_ai: string;
  hero_tagline: string;
  payment_mode_delegate: PaymentMode;
  payment_mode_eb: PaymentMode;
  payment_mode_oc: PaymentMode;
  upi_id: string | null;
  bank_details: string | null;
  payment_qr_url: string | null;
  payment_instructions: string | null;
  txt_pay_upi_btn: string;
  txt_pay_cash_notice: string;
  txt_auto_lock_notice: string;
  txt_receipt_uploaded: string;
  txt_payment_rejected: string;
  txt_locked_awaiting_entry: string;
  txt_change_portfolio_btn: string;
  txt_needs_reselection: string;
  txt_upload_receipt: string;
};

export type PaymentMode = "upi" | "cash" | "none";
export type PaymentStatus = "none" | "pending" | "approved" | "rejected";

export type SecretariatProfile = {
  user_id: string;
  full_name: string;
};

export type AIChat = {
  id: string;
  registration_id: string;
  edition_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

// ================== SECRETARIAT PROFILES ==================
export async function upsertSecretariatProfile(userId: string, fullName: string) {
  return supabase.from("secretariat_profiles" as any)
    .upsert({ user_id: userId, full_name: fullName } as any, { onConflict: "user_id" });
}
export async function getSecretariatProfiles(): Promise<Record<string, string>> {
  const { data } = await supabase.from("secretariat_profiles" as any).select("user_id, full_name");
  const map: Record<string, string> = {};
  ((data ?? []) as any[]).forEach(r => { map[r.user_id] = r.full_name; });
  return map;
}
export async function getMySecretariatProfile(userId: string): Promise<string | null> {
  const { data } = await supabase.from("secretariat_profiles" as any).select("full_name").eq("user_id", userId).maybeSingle();
  return (data as any)?.full_name ?? null;
}

// ================== AI CHAT LOG ==================
export async function logAIChat(registrationId: string, editionId: string, role: "user"|"assistant", content: string) {
  return supabase.from("ai_chats" as any).insert({ registration_id: registrationId, edition_id: editionId, role, content } as any);
}
export async function getAIChatsForRegistration(registrationId: string): Promise<AIChat[]> {
  const { data } = await supabase.from("ai_chats" as any).select("*").eq("registration_id", registrationId).order("created_at");
  return ((data ?? []) as unknown) as AIChat[];
}

export type ContactPerson = {
  id: string;
  edition_id: string;
  name: string;
  role: string | null;
  phone: string;
  email: string | null;
  sort_order: number;
};

export type Committee = {
  id: string;
  edition_id: string;
  name: string;
  short_name: string;
  agenda: string;
  description: string | null;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  portfolios: string[];
  sort_order: number;
  is_team_committee: boolean;
  team_size: number;
  room_number: string | null;
};

export type ParticipantRole = "delegate" | "executive_board" | "organising_committee";
export type EBRole = "chairperson" | "vice_chairperson" | "rapporteur";

export type Registration = {
  id: string;
  edition_id: string;
  committee_id: string | null;
  user_id: string | null;
  full_name: string;
  email: string;
  school: string;
  grade: string;
  phone: string;
  id_image_path: string;
  portfolio: string | null;
  payment_verified: boolean;
  created_at: string;
  role: ParticipantRole;
  eb_role: EBRole | null;
  pref1_committee_id: string | null;
  pref1_portfolio: string | null;
  pref2_committee_id: string | null;
  pref2_portfolio: string | null;
  team_lead_id: string | null;
  portfolio_locked_at: string | null;
  portfolio_changes_used: number;
  payment_receipt_path: string | null;
  payment_status: PaymentStatus;
  payment_approved_at: string | null;
  payment_approved_by: string | null;
  payment_rejection_reason: string | null;
  entry_verified_at: string | null;
  entry_verified_by: string | null;
  needs_reselection: boolean;
  /** Payer details — requires DB migration: ALTER TABLE registrations ADD COLUMN payer_name text, ADD COLUMN payer_phone text; */
  payer_name: string | null;
  payer_phone: string | null;
};

export type TeamInvite = {
  id: string;
  edition_id: string;
  committee_id: string;
  team_lead_registration_id: string | null;
  invitee_email: string;
  invitee_name: string;
  invitee_grade: string | null;
  assigned_portfolio: string;
  claimed_registration_id: string | null;
  created_at: string;
};

export type AttendanceRow = {
  id: string;
  edition_id: string;
  registration_id: string;
  attendance_date: string;
  status: "present" | "absent";
  marked_at: string;
  marked_by: string | null;
  method: string;
};

export type Announcement = {
  id: string;
  edition_id: string;
  title: string;
  body: string;
  pinned: boolean;
  published: boolean;
  created_at: string;
};

export type ScheduleItem = {
  id: string;
  edition_id: string;
  day_label: string;
  start_time: string;
  end_time: string | null;
  title: string;
  description: string | null;
  location: string | null;
  sort_order: number;
};

export type TrainingResource = {
  id: string;
  edition_id: string;
  type: "video" | "pdf" | "note" | "link";
  title: string;
  description: string | null;
  url: string;
  sort_order: number;
};

export type TrainingSession = {
  id: string;
  edition_id: string;
  topic: string;
  description: string | null;
  scheduled_at: string;
  zoom_link: string | null;
  recording_url: string | null;
};

export type Brochure = {
  id: string;
  edition_id: string;
  title: string;
  file_url: string;
  version: number;
  is_current: boolean;
  created_at: string;
};

export type Archive = {
  id: string;
  edition_id: string;
  edition_name: string;
  event_date: string;
  snapshot: any;
  delegate_count: number;
  created_at: string;
};

// ================== ACTIVE EDITION ==================
export async function getActiveEdition(): Promise<Edition | null> {
  const { data } = await supabase
    .from("editions")
    .select("*")
    .eq("is_active", true)
    .maybeSingle();
  return data as Edition | null;
}

export async function getAllEditions(): Promise<Edition[]> {
  const { data } = await supabase.from("editions").select("*").order("event_date", { ascending: false });
  return (data ?? []) as Edition[];
}

export async function updateEdition(id: string, patch: Partial<Edition>) {
  return supabase.from("editions").update(patch as any).eq("id", id).select().single();
}

// ================== CONTACT PERSONS ==================
export async function getContactPersons(editionId: string): Promise<ContactPerson[]> {
  const { data } = await supabase
    .from("contact_persons" as any)
    .select("*")
    .eq("edition_id", editionId)
    .order("sort_order");
  return ((data ?? []) as unknown) as ContactPerson[];
}
export async function createContactPerson(c: Omit<ContactPerson, "id">) {
  return supabase.from("contact_persons" as any).insert(c as any);
}
export async function updateContactPerson(id: string, patch: Partial<ContactPerson>) {
  return supabase.from("contact_persons" as any).update(patch as any).eq("id", id);
}
export async function deleteContactPerson(id: string) {
  return supabase.from("contact_persons" as any).delete().eq("id", id);
}

// ================== HARD RESET ==================
// Wipes registrations, announcements, archives, attendance, team invites.
export async function hardResetEverything(editionId: string) {
  // Order matters because of FK chains: invites → registrations → attendance.
  await supabase.from("attendance" as any).delete().eq("edition_id", editionId);
  await supabase.from("team_invites" as any).delete().eq("edition_id", editionId);
  await Promise.all([
    supabase.from("registrations").delete().eq("edition_id", editionId),
    supabase.from("announcements").delete().eq("edition_id", editionId),
  ]);
  await supabase.from("archives").delete().eq("edition_id", editionId);
}

// ================== COMMITTEES ==================
export async function getCommittees(editionId: string): Promise<Committee[]> {
  const { data } = await supabase
    .from("committees")
    .select("*")
    .eq("edition_id", editionId)
    .order("sort_order");
  return (data ?? []) as Committee[];
}

export async function createCommittee(c: Omit<Committee, "id">) {
  return supabase.from("committees").insert(c);
}
export async function updateCommittee(id: string, patch: Partial<Committee>) {
  return supabase.from("committees").update(patch).eq("id", id);
}
export async function deleteCommittee(id: string) {
  return supabase.from("committees").delete().eq("id", id);
}

// ================== REGISTRATIONS ==================
export async function getRegistrations(editionId: string): Promise<Registration[]> {
  const { data } = await supabase
    .from("registrations")
    .select("*")
    .eq("edition_id", editionId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Registration[];
}

export async function getOccupiedPortfolios(editionId: string): Promise<Record<string, string>> {
  // Only delegate-style portfolio claims occupy the matrix.
  const { data: regs } = await supabase
    .from("registrations")
    .select("committee_id, portfolio, role")
    .eq("edition_id", editionId);
  // Pre-assigned (but not-yet-claimed) team invites also reserve a portfolio.
  const { data: invites } = await supabase
    .from("team_invites" as any)
    .select("committee_id, assigned_portfolio, claimed_registration_id")
    .eq("edition_id", editionId);
  const map: Record<string, string> = {};
  (regs ?? []).forEach((r: any) => {
    if (r.role === "delegate" && r.committee_id && r.portfolio) {
      map[`${r.committee_id}::${r.portfolio}`] = "1";
    }
  });
  ((invites ?? []) as any[]).forEach((i) => {
    if (!i.claimed_registration_id && i.committee_id && i.assigned_portfolio) {
      map[`${i.committee_id}::${i.assigned_portfolio}`] = "invite";
    }
  });
  return map;
}

export async function getOccupiedEBRoles(editionId: string): Promise<Record<string, true>> {
  const { data } = await supabase
    .from("registrations")
    .select("committee_id, eb_role")
    .eq("edition_id", editionId)
    .eq("role", "executive_board");
  const map: Record<string, true> = {};
  (data ?? []).forEach((r: any) => {
    if (r.committee_id && r.eb_role) map[`${r.committee_id}::${r.eb_role}`] = true;
  });
  return map;
}

export async function getRegistrationByEmail(editionId: string, email: string): Promise<Registration | null> {
  const { data } = await supabase
    .from("registrations")
    .select("*")
    .eq("edition_id", editionId)
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();
  return data as Registration | null;
}

export async function createRegistration(r: Partial<Registration> & {
  edition_id: string; full_name: string; email: string; school: string;
  grade: string; phone: string; id_image_path: string;
}) {
  return supabase.from("registrations").insert({
    role: "delegate",
    payment_verified: false,
    ...r,
  } as any).select().single();
}

/**
 * Solo-delegate assignment: try preference 1, then preference 2.
 * Returns { committee_id, portfolio } the delegate actually got, or null if both taken.
 */
export async function assignFromPreferences(editionId: string, prefs: Array<{ committee_id: string; portfolio: string }>) {
  const occ = await getOccupiedPortfolios(editionId);
  for (const p of prefs) {
    if (!p.committee_id || !p.portfolio) continue;
    if (!occ[`${p.committee_id}::${p.portfolio}`]) return p;
  }
  return null;
}

export async function updateRegistration(id: string, patch: Partial<Registration>) {
  return supabase.from("registrations").update(patch as any).eq("id", id);
}

export async function deleteRegistration(id: string) {
  return supabase.from("registrations").delete().eq("id", id);
}

// ================== TEAM INVITES ==================
export async function getTeamInviteForEmail(editionId: string, email: string): Promise<TeamInvite | null> {
  const { data } = await supabase
    .from("team_invites" as any)
    .select("*")
    .eq("edition_id", editionId)
    .ilike("invitee_email", email.toLowerCase().trim())
    .is("claimed_registration_id", null)
    .maybeSingle();
  return (data as unknown) as TeamInvite | null;
}

export async function createTeamInvites(invites: Array<Omit<TeamInvite, "id" | "created_at" | "claimed_registration_id">>) {
  if (!invites.length) return { error: null };
  return supabase.from("team_invites" as any).insert(invites as any);
}

export async function markTeamInviteClaimed(inviteId: string, registrationId: string) {
  return supabase.from("team_invites" as any)
    .update({ claimed_registration_id: registrationId })
    .eq("id", inviteId);
}

// ================== ATTENDANCE ==================
const todayISO = () => {
  // Asia/Kolkata-aligned calendar date, formatted YYYY-MM-DD.
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" });
  return fmt.format(new Date());
};

export async function getAttendanceForDate(editionId: string, date: string = todayISO()): Promise<Record<string, AttendanceRow>> {
  const { data } = await supabase
    .from("attendance" as any)
    .select("*")
    .eq("edition_id", editionId)
    .eq("attendance_date", date);
  const map: Record<string, AttendanceRow> = {};
  ((data ?? []) as any[]).forEach((row) => { map[row.registration_id] = row as AttendanceRow; });
  return map;
}

export async function markAttendance(editionId: string, registrationId: string, status: "present" | "absent", method: string = "manual", date: string = todayISO()) {
  const { data: { user } } = await supabase.auth.getUser();
  return supabase.from("attendance" as any).upsert({
    edition_id: editionId,
    registration_id: registrationId,
    attendance_date: date,
    status,
    method,
    marked_at: new Date().toISOString(),
    marked_by: user?.id ?? null,
  } as any, { onConflict: "registration_id,attendance_date" });
}

export async function resetAttendanceForDate(editionId: string, date: string = todayISO()) {
  return supabase.from("attendance" as any).delete()
    .eq("edition_id", editionId)
    .eq("attendance_date", date);
}

export const attendanceTodayKey = todayISO;

// ================== ANNOUNCEMENTS ==================
export async function getAnnouncements(editionId: string): Promise<Announcement[]> {
  const { data } = await supabase
    .from("announcements")
    .select("*")
    .eq("edition_id", editionId)
    .eq("published", true)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });
  return (data ?? []) as Announcement[];
}
export async function getAllAnnouncementsAdmin(editionId: string): Promise<Announcement[]> {
  const { data } = await supabase
    .from("announcements")
    .select("*")
    .eq("edition_id", editionId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Announcement[];
}
export async function createAnnouncement(a: Omit<Announcement, "id" | "created_at">) {
  return supabase.from("announcements").insert(a);
}
export async function updateAnnouncement(id: string, patch: Partial<Announcement>) {
  return supabase.from("announcements").update(patch).eq("id", id);
}
export async function deleteAnnouncement(id: string) {
  return supabase.from("announcements").delete().eq("id", id);
}

// ================== SCHEDULE ==================
export async function getSchedule(editionId: string): Promise<ScheduleItem[]> {
  const { data } = await supabase
    .from("schedule_items")
    .select("*")
    .eq("edition_id", editionId)
    .order("day_label")
    .order("sort_order");
  return (data ?? []) as ScheduleItem[];
}
export async function createScheduleItem(s: Omit<ScheduleItem, "id">) {
  return supabase.from("schedule_items").insert(s);
}
export async function updateScheduleItem(id: string, patch: Partial<ScheduleItem>) {
  return supabase.from("schedule_items").update(patch).eq("id", id);
}
export async function deleteScheduleItem(id: string) {
  return supabase.from("schedule_items").delete().eq("id", id);
}

// ================== TRAINING ==================
export async function getTrainingResources(editionId: string): Promise<TrainingResource[]> {
  const { data } = await supabase
    .from("training_resources")
    .select("*")
    .eq("edition_id", editionId)
    .order("sort_order");
  return (data ?? []) as TrainingResource[];
}
export async function createTrainingResource(r: Omit<TrainingResource, "id">) {
  return supabase.from("training_resources").insert(r);
}
export async function updateTrainingResource(id: string, patch: Partial<TrainingResource>) {
  return supabase.from("training_resources").update(patch).eq("id", id);
}
export async function deleteTrainingResource(id: string) {
  return supabase.from("training_resources").delete().eq("id", id);
}

export async function getTrainingSessions(editionId: string): Promise<TrainingSession[]> {
  const { data } = await supabase
    .from("training_sessions")
    .select("*")
    .eq("edition_id", editionId)
    .order("scheduled_at");
  return (data ?? []) as TrainingSession[];
}
export async function createTrainingSession(s: Omit<TrainingSession, "id">) {
  return supabase.from("training_sessions").insert(s);
}
export async function updateTrainingSession(id: string, patch: Partial<TrainingSession>) {
  return supabase.from("training_sessions").update(patch).eq("id", id);
}
export async function deleteTrainingSession(id: string) {
  return supabase.from("training_sessions").delete().eq("id", id);
}

// ================== BROCHURES ==================
export async function getCurrentBrochure(editionId: string): Promise<Brochure | null> {
  const { data } = await supabase
    .from("brochures")
    .select("*")
    .eq("edition_id", editionId)
    .eq("is_current", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as Brochure | null;
}
export async function getAllBrochures(editionId: string): Promise<Brochure[]> {
  const { data } = await supabase
    .from("brochures")
    .select("*")
    .eq("edition_id", editionId)
    .order("version", { ascending: false });
  return (data ?? []) as Brochure[];
}
export async function uploadBrochureFile(editionId: string, file: File): Promise<string> {
  const path = `${editionId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const { error } = await supabase.storage.from("brochures").upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("brochures").getPublicUrl(path);
  return data.publicUrl;
}
export async function publishBrochure(editionId: string, title: string, fileUrl: string) {
  // Mark previous as not current
  await supabase.from("brochures").update({ is_current: false }).eq("edition_id", editionId);
  const { data: latest } = await supabase
    .from("brochures").select("version").eq("edition_id", editionId)
    .order("version", { ascending: false }).limit(1).maybeSingle();
  const nextVer = ((latest as any)?.version ?? 0) + 1;
  return supabase.from("brochures").insert({
    edition_id: editionId, title, file_url: fileUrl, version: nextVer, is_current: true,
  });
}
export async function deleteBrochure(id: string) {
  return supabase.from("brochures").delete().eq("id", id);
}

// ================== ID UPLOADS ==================
export async function uploadIdImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "bin";
  const path = `incoming/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("id-uploads").upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}

export async function getSignedIdUrl(path: string): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from("id-uploads").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

// ================== ARCHIVES & NEW EDITION ==================
export async function getArchives(): Promise<Archive[]> {
  const { data } = await supabase.from("archives").select("*").order("created_at", { ascending: false });
  return (data ?? []) as Archive[];
}

export async function startNewEdition(currentEditionId: string, newName: string, newEventDate: string) {
  // 1. Snapshot everything
  const [edition, committees, registrations, announcements, schedule, resources, sessions, brochures] = await Promise.all([
    supabase.from("editions").select("*").eq("id", currentEditionId).single(),
    supabase.from("committees").select("*").eq("edition_id", currentEditionId),
    supabase.from("registrations").select("*").eq("edition_id", currentEditionId),
    supabase.from("announcements").select("*").eq("edition_id", currentEditionId),
    supabase.from("schedule_items").select("*").eq("edition_id", currentEditionId),
    supabase.from("training_resources").select("*").eq("edition_id", currentEditionId),
    supabase.from("training_sessions").select("*").eq("edition_id", currentEditionId),
    supabase.from("brochures").select("*").eq("edition_id", currentEditionId),
  ]);

  const snapshot = {
    edition: edition.data,
    committees: committees.data ?? [],
    registrations: registrations.data ?? [],
    announcements: announcements.data ?? [],
    schedule: schedule.data ?? [],
    training_resources: resources.data ?? [],
    training_sessions: sessions.data ?? [],
    brochures: brochures.data ?? [],
  };

  // 2. Save archive
  await supabase.from("archives").insert({
    edition_id: currentEditionId,
    edition_name: (edition.data as any)?.name ?? "Unknown",
    event_date: (edition.data as any)?.event_date ?? new Date().toISOString(),
    snapshot,
    delegate_count: registrations.data?.length ?? 0,
  });

  // 3. Mark current edition archived + deactivate
  await supabase.from("editions").update({ is_active: false, archived_at: new Date().toISOString() }).eq("id", currentEditionId);

  // 4. Create new edition (active)
  const { data: newEd } = await supabase.from("editions").insert({
    name: newName,
    event_date: newEventDate,
    countdown_title: newName,
    is_active: true,
  }).select().single();

  // 5. Copy committees forward (template)
  if (newEd && committees.data) {
    const cloned = (committees.data as any[]).map(c => ({
      edition_id: (newEd as any).id,
      name: c.name,
      short_name: c.short_name,
      agenda: c.agenda,
      description: c.description,
      difficulty: c.difficulty,
      portfolios: c.portfolios,
      sort_order: c.sort_order,
    }));
    if (cloned.length) await supabase.from("committees").insert(cloned);
  }

  return newEd;
}

export function downloadArchiveJSON(archive: Archive) {
  const blob = new Blob([JSON.stringify(archive.snapshot, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${archive.edition_name.replace(/\s+/g, "_")}_archive.json`;
  a.click(); URL.revokeObjectURL(url);
}

export function downloadArchiveCSV(archive: Archive) {
  const regs = archive.snapshot?.registrations ?? [];
  const committees = archive.snapshot?.committees ?? [];
  const cMap = new Map(committees.map((c: any) => [c.id, c.short_name]));
  const headers = ["ID", "Name", "Email", "School", "Grade", "Phone", "Committee", "Portfolio", "Verified", "Created"];
  const rows = regs.map((r: any) => [
    r.id, r.full_name, r.email, r.school, r.grade, r.phone,
    cMap.get(r.committee_id) || "", r.portfolio, r.payment_verified ? "YES" : "NO", r.created_at
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${archive.edition_name.replace(/\s+/g, "_")}_delegates.csv`;
  a.click(); URL.revokeObjectURL(url);
}

// ================== AUTH HELPERS ==================
export async function isSecretariat(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "secretariat")
    .maybeSingle();
  return !!data;
}

// ================== CSV EXPORT (universal) ==================
/**
 * Generic CSV downloader. Headers + rows of strings.
 * Strings are quoted; embedded quotes escaped; everything UTF-8.
 */
export function downloadCSV(filename: string, headers: string[], rows: (string | number | boolean | null | undefined)[][]) {
  const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map(r => r.map(esc).join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ================== MEMBER PERMISSIONS ==================
export type TabKey =
  | "delegates" | "eb" | "oc" | "attendance" | "announcements" | "schedule"
  | "brochure" | "training" | "sessions" | "committees" | "contacts"
  | "members" | "settings" | "editions" | "qr_messages" | "disclaimers" | "ai_chats" | "backgrounds" | "payments" | "grades";

export type PermissionLevel = "none" | "view" | "edit" | "delete";

export type MemberPermission = {
  id: string;
  user_id: string;
  tab: TabKey;
  level: PermissionLevel;
};

export const ALL_TABS: { key: TabKey; label: string }[] = [
  { key: "delegates", label: "Delegates" },
  { key: "eb", label: "Executive Board" },
  { key: "oc", label: "Organising Committee" },
  { key: "attendance", label: "Attendance" },
  { key: "announcements", label: "Announcements" },
  { key: "schedule", label: "Schedule" },
  { key: "brochure", label: "Brochure" },
  { key: "training", label: "Training Library" },
  { key: "sessions", label: "Live Sessions" },
  { key: "committees", label: "Committees" },
  { key: "contacts", label: "Footer Contacts" },
  { key: "members", label: "Members" },
  { key: "settings", label: "Site Settings" },
  { key: "qr_messages", label: "QR Messages" },
  { key: "disclaimers", label: "Disclaimers" },
  { key: "ai_chats", label: "AI Chat Logs" },
  { key: "backgrounds", label: "Background Images" },
  { key: "payments", label: "Payments" },
  { key: "editions", label: "Editions & Archive" },
];

// ================== PAGE BACKGROUNDS ==================
export type PageBackgroundKey =
  | "home" | "committees" | "schedule" | "venue" | "brochure"
  | "register" | "login" | "delegate_portal" | "matrix";

export const BACKGROUND_PAGES: { key: PageBackgroundKey; label: string }[] = [
  { key: "home", label: "Home" },
  { key: "committees", label: "Committees" },
  { key: "schedule", label: "Schedule" },
  { key: "venue", label: "Venue" },
  { key: "brochure", label: "Brochure" },
  { key: "register", label: "Register" },
  { key: "login", label: "Login" },
  { key: "delegate_portal", label: "Delegate Portfolio Portal" },
  { key: "matrix", label: "Matrix" },
];

export type BgFit = "cover" | "contain" | "fill";
export type BgPosition = "center" | "top" | "bottom" | "left" | "right" | "top left" | "top right" | "bottom left" | "bottom right";

export type PageBackground = {
  id: string;
  edition_id: string;
  page_key: PageBackgroundKey;
  image_url: string | null;
  opacity: number;
  fit: BgFit;
  position: BgPosition;
  blur: number;
  image_url_dark: string | null;
  opacity_dark: number;
  fit_dark: BgFit;
  position_dark: BgPosition;
  blur_dark: number;
};

export async function getPageBackgrounds(editionId: string): Promise<Record<string, PageBackground>> {
  const { data } = await supabase.from("page_backgrounds" as any).select("*").eq("edition_id", editionId);
  const map: Record<string, PageBackground> = {};
  ((data ?? []) as any[]).forEach(r => { map[r.page_key] = r as PageBackground; });
  return map;
}

export async function upsertPageBackground(
  editionId: string,
  pageKey: PageBackgroundKey,
  patch: Partial<Pick<PageBackground, "image_url" | "opacity" | "fit" | "position" | "blur" | "image_url_dark" | "opacity_dark" | "fit_dark" | "position_dark" | "blur_dark">>,
) {
  return supabase.from("page_backgrounds" as any)
    .upsert({ edition_id: editionId, page_key: pageKey, ...patch } as any, { onConflict: "edition_id,page_key" });
}

export async function uploadPageBackgroundImage(editionId: string, pageKey: PageBackgroundKey, file: File, mode: "light" | "dark" = "light"): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${editionId}/${pageKey}-${mode}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("page-backgrounds").upload(path, file, { upsert: true, cacheControl: "3600" });
  if (error) throw error;
  const { data } = supabase.storage.from("page-backgrounds").getPublicUrl(path);
  return data.publicUrl;
}

export async function getPermissionsForUser(userId: string): Promise<Record<TabKey, PermissionLevel>> {
  const { data } = await supabase.from("member_permissions" as any).select("*").eq("user_id", userId);
  const map = {} as Record<TabKey, PermissionLevel>;
  ((data ?? []) as any[]).forEach((p) => { map[p.tab as TabKey] = p.level as PermissionLevel; });
  return map;
}

export async function getAllPermissions(): Promise<MemberPermission[]> {
  const { data } = await supabase.from("member_permissions" as any).select("*");
  return ((data ?? []) as unknown) as MemberPermission[];
}

export async function setPermission(userId: string, tab: TabKey, level: PermissionLevel) {
  return supabase.from("member_permissions" as any)
    .upsert({ user_id: userId, tab, level } as any, { onConflict: "user_id,tab" });
}

/**
 * Returns true if `userId` is the "owner" secretariat.
 *
 * CURRENT MECHANISM: The secretariat account with the earliest created_at in
 * user_roles is treated as owner. This is fragile — if the owner's account is
 * deleted and re-created the owner shifts.
 *
 * RECOMMENDED MIGRATION: ALTER TABLE user_roles ADD COLUMN is_owner boolean NOT NULL DEFAULT false;
 * Then update this function to: .eq("is_owner", true) instead of ordering by created_at.
 */
export async function isOwnerSecretariat(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  // First, try the stable is_owner flag (available after migration).
  const { data: ownerRow } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "secretariat")
    .eq("is_owner" as any, true)
    .eq("user_id", userId)
    .maybeSingle();
  if (ownerRow) return true;

  // Fallback: treat the earliest-created secretariat as owner.
  const { data: earliest } = await supabase
    .from("user_roles")
    .select("user_id, created_at")
    .eq("role", "secretariat")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (earliest as any)?.user_id === userId;
}

// ================== EDITABLE LOGOS ==================
/** kind = "site" → used in homepage hero etc. ; "header" → only navbar. */
export async function uploadEditionLogo(
  editionId: string,
  file: File,
  kind: "site" | "header" = "site",
): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  const path = `${editionId}/${kind}-logo-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("site-logos").upload(path, file, { upsert: true, cacheControl: "3600" });
  if (error) throw error;
  const { data } = supabase.storage.from("site-logos").getPublicUrl(path);
  return data.publicUrl;
}

// ================== DELEGATE PORTFOLIO CHANGE (1-min cooldown) ==================
/**
 * Swaps a delegate's portfolio. Server enforces RLS — only allowed
 * while portfolio_locked_at is null AND portfolio_changes_used < 1.
 * After a successful swap we mark portfolio_changes_used=1; the lock timer
 * (60s after registration) is enforced client-side AND by the server policy.
 */
export async function changeDelegatePortfolio(
  registrationId: string,
  newCommitteeId: string,
  newPortfolio: string,
) {
  // Re-check availability right before the write to avoid races.
  const { data: editionRow } = await supabase.from("registrations").select("edition_id, role").eq("id", registrationId).maybeSingle();
  if (!editionRow) return { error: { message: "Registration not found" } };
  if ((editionRow as any).role !== "delegate") return { error: { message: "Only delegates can swap portfolios" } };
  const occ = await getOccupiedPortfolios((editionRow as any).edition_id);
  const key = `${newCommitteeId}::${newPortfolio}`;
  if (occ[key]) return { error: { message: "Portfolio just got taken — pick another" } };

  return supabase.from("registrations").update({
    committee_id: newCommitteeId,
    portfolio: newPortfolio,
    portfolio_changes_used: 1,
    portfolio_locked_at: new Date().toISOString(),
  } as any).eq("id", registrationId);
}

/** Force-lock a registration's portfolio (called after the 60s window expires). */
export async function lockDelegatePortfolio(registrationId: string) {
  return supabase.from("registrations").update({
    portfolio_locked_at: new Date().toISOString(),
  } as any).eq("id", registrationId).is("portfolio_locked_at", null);
}

// ================== TEAM INVITE: resend ==================
/**
 * "Resend" surfaces a fresh shareable link for an invite. Returns the
 * URL the secretariat can copy / re-share with the invitee.
 */
export function buildInviteLink(invite: TeamInvite): string {
  const url = new URL(window.location.origin + "/register");
  url.searchParams.set("as", "delegate");
  url.searchParams.set("invite", invite.id);
  url.searchParams.set("email", invite.invitee_email);
  return url.toString();
}

export async function getTeamInvitesForEdition(editionId: string): Promise<TeamInvite[]> {
  const { data } = await supabase
    .from("team_invites" as any)
    .select("*")
    .eq("edition_id", editionId)
    .order("created_at", { ascending: false });
  return ((data ?? []) as unknown) as TeamInvite[];
}

// ================== PAYMENTS (Stage 1) & ENTRY VERIFICATION (Stage 2) ==================

export function paymentModeFor(edition: Edition | null, role: ParticipantRole): PaymentMode {
  if (!edition) return "none";
  if (role === "delegate") return edition.payment_mode_delegate;
  if (role === "executive_board") return edition.payment_mode_eb;
  return edition.payment_mode_oc;
}

export async function uploadPaymentReceipt(registrationId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${registrationId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("payment-receipts").upload(path, file, { upsert: true, cacheControl: "3600" });
  if (error) throw error;
  return path;
}

export async function getReceiptSignedUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from("payment-receipts").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export async function uploadPaymentQRImage(editionId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  const path = `${editionId}/qr-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("payment-qr").upload(path, file, { upsert: true, cacheControl: "3600" });
  if (error) throw error;
  const { data } = supabase.storage.from("payment-qr").getPublicUrl(path);
  return data.publicUrl;
}

/** Delegate submits a UPI receipt → status becomes "pending". */
export async function submitReceipt(registrationId: string, receiptPath: string) {
  return supabase.from("registrations").update({
    payment_receipt_path: receiptPath,
    payment_status: "pending",
    payment_rejection_reason: null,
  } as any).eq("id", registrationId);
}

/**
 * Secretariat approves a payment.
 *
 * "First-verified wins" portfolio resolution:
 *  - If user already has a final committee+portfolio that's still free, lock it.
 *  - Otherwise try pref1, then pref2 against current occupied set.
 *  - If both taken (or none set), mark needs_reselection=true. Portfolio
 *    stays unset until the user picks again.
 */
export async function approvePayment(registrationId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: regRow } = await supabase.from("registrations").select("*").eq("id", registrationId).single();
  if (!regRow) return { error: { message: "Registration not found" } };
  const reg = regRow as Registration;

  const occ = await getOccupiedPortfolios(reg.edition_id);
  const isFree = (cId: string | null, p: string | null) =>
    !!cId && !!p && (
      (reg.committee_id === cId && reg.portfolio === p) || // already holding it
      !occ[`${cId}::${p}`]
    );

  let committee_id: string | null = reg.committee_id;
  let portfolio: string | null = reg.portfolio;
  let needs_reselection = false;

  if (reg.role === "delegate") {
    if (committee_id && portfolio && isFree(committee_id, portfolio)) {
      // keep current
    } else if (isFree(reg.pref1_committee_id, reg.pref1_portfolio)) {
      committee_id = reg.pref1_committee_id;
      portfolio = reg.pref1_portfolio;
    } else if (isFree(reg.pref2_committee_id, reg.pref2_portfolio)) {
      committee_id = reg.pref2_committee_id;
      portfolio = reg.pref2_portfolio;
    } else {
      committee_id = null;
      portfolio = null;
      needs_reselection = true;
    }
  }

  return supabase.from("registrations").update({
    payment_status: "approved",
    payment_verified: true,
    payment_approved_at: new Date().toISOString(),
    payment_approved_by: user?.id ?? null,
    payment_rejection_reason: null,
    portfolio_locked_at: needs_reselection ? null : new Date().toISOString(),
    committee_id,
    portfolio,
    needs_reselection,
  } as any).eq("id", registrationId);
}

export async function rejectPayment(registrationId: string, reason: string) {
  return supabase.from("registrations").update({
    payment_status: "rejected",
    payment_verified: false,
    payment_rejection_reason: reason || "Receipt could not be verified — please re-upload.",
  } as any).eq("id", registrationId);
}

/** Bumped delegate picks a remaining open portfolio in any committee. */
export async function reselectPortfolioAfterBump(
  registrationId: string,
  committeeId: string,
  portfolio: string,
) {
  const { data: regRow } = await supabase.from("registrations").select("edition_id, role").eq("id", registrationId).maybeSingle();
  if (!regRow) return { error: { message: "Registration not found" } };
  if ((regRow as any).role !== "delegate") return { error: { message: "Only delegates can reselect" } };
  const occ = await getOccupiedPortfolios((regRow as any).edition_id);
  if (occ[`${committeeId}::${portfolio}`]) return { error: { message: "Just got taken — pick another" } };
  return supabase.from("registrations").update({
    committee_id: committeeId,
    portfolio,
    needs_reselection: false,
    portfolio_locked_at: new Date().toISOString(),
  } as any).eq("id", registrationId);
}

/** Stage 2: secretariat marks user verified for physical entry → QR appears. */
export async function verifyForEntry(registrationId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  return supabase.from("registrations").update({
    entry_verified_at: new Date().toISOString(),
    entry_verified_by: user?.id ?? null,
  } as any).eq("id", registrationId);
}

export async function revokeEntryVerification(registrationId: string) {
  return supabase.from("registrations").update({
    entry_verified_at: null,
    entry_verified_by: null,
  } as any).eq("id", registrationId);
}

/** Auto-lock when the active edition's mode is "none" (no payment required). */
export async function autoLockIfNoPayment(reg: Registration, edition: Edition) {
  const mode = paymentModeFor(edition, reg.role);
  if (mode !== "none" || reg.payment_status === "approved") return;
  await approvePayment(reg.id);
}
