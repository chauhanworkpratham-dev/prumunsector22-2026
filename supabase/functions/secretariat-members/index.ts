// Secretariat members management — list, approve, revoke, delete,
// change_password (owner-only), transfer_ownership (owner-only).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;

  // Verify caller is a secretariat using their JWT.
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader) return json({ error: "Unauthorized" }, 401);
  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user) return json({ error: "Unauthorized" }, 401);

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: roleRow } = await admin
    .from("user_roles").select("id").eq("user_id", user.id).eq("role", "secretariat").maybeSingle();
  if (!roleRow) return json({ error: "Forbidden" }, 403);

  // Determine current OWNER (earliest secretariat). Several actions are
  // owner-only: change_password, transfer_ownership, approve, revoke, delete.
  const { data: ownerRow } = await admin
    .from("user_roles").select("user_id, created_at, id")
    .eq("role", "secretariat").order("created_at", { ascending: true }).limit(1).maybeSingle();
  const isOwner = ownerRow?.user_id === user.id;

  try {
    if (req.method === "GET") {
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const { data: roles } = await admin.from("user_roles").select("user_id, role");
      const roleMap = new Map<string, string[]>();
      (roles ?? []).forEach((r: any) => {
        const arr = roleMap.get(r.user_id) ?? [];
        arr.push(r.role);
        roleMap.set(r.user_id, arr);
      });
      const users = (list?.users ?? []).map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        confirmed_at: u.email_confirmed_at,
        roles: roleMap.get(u.id) ?? [],
        is_secretariat: (roleMap.get(u.id) ?? []).includes("secretariat"),
      }));
      return json({ users, owner_user_id: ownerRow?.user_id ?? null });
    }

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { action, target_user_id, new_password } = body ?? {};
      if (!action) return json({ error: "action required" }, 400);

      // -------- approve / revoke / delete (owner-only) --------
      if (action === "approve" || action === "revoke" || action === "delete") {
        if (!isOwner) return json({ error: "Owner only" }, 403);
        if (!target_user_id) return json({ error: "target_user_id required" }, 400);

        if (action === "approve") {
          // Use upsert so re-approving an already-approved user is idempotent.
          await admin.from("user_roles").insert({ user_id: target_user_id, role: "secretariat" });
          // Also auto-confirm their email so they can sign in immediately.
          await admin.auth.admin.updateUserById(target_user_id, { email_confirm: true });
          return json({ ok: true });
        }
        if (action === "revoke") {
          if (target_user_id === user.id) return json({ error: "Cannot revoke yourself — transfer ownership first." }, 400);
          await admin.from("user_roles").delete().eq("user_id", target_user_id).eq("role", "secretariat");
          await admin.from("member_permissions").delete().eq("user_id", target_user_id);
          return json({ ok: true });
        }
        if (action === "delete") {
          if (target_user_id === user.id) return json({ error: "Cannot delete yourself — transfer ownership first." }, 400);
          await admin.from("member_permissions").delete().eq("user_id", target_user_id);
          await admin.from("user_roles").delete().eq("user_id", target_user_id);
          await admin.auth.admin.deleteUser(target_user_id);
          return json({ ok: true });
        }
      }

      // -------- change_password (owner only) --------
      if (action === "change_password") {
        if (!isOwner) return json({ error: "Owner only" }, 403);
        if (!target_user_id) return json({ error: "target_user_id required" }, 400);
        if (!new_password || typeof new_password !== "string" || new_password.length < 8) {
          return json({ error: "Password must be at least 8 characters" }, 400);
        }
        const { error } = await admin.auth.admin.updateUserById(target_user_id, { password: new_password });
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }

      // -------- transfer_ownership (owner only) --------
      // We make `target_user_id` the new OWNER by ensuring its secretariat
      // user_roles row has the EARLIEST created_at. We delete + re-insert
      // both rows so that the order is unambiguous.
      if (action === "transfer_ownership") {
        if (!isOwner) return json({ error: "Owner only" }, 403);
        if (!target_user_id) return json({ error: "target_user_id required" }, 400);
        if (target_user_id === user.id) return json({ error: "Already the owner" }, 400);

        // Make sure target is currently a secretariat.
        const { data: targetRole } = await admin.from("user_roles")
          .select("id").eq("user_id", target_user_id).eq("role", "secretariat").maybeSingle();
        if (!targetRole) return json({ error: "Target must be an approved secretariat" }, 400);

        // Wipe both secretariat rows…
        await admin.from("user_roles").delete()
          .in("user_id", [user.id, target_user_id]).eq("role", "secretariat");

        // …then re-insert in the order [new_owner, previous_owner] so the
        // earliest created_at corresponds to the new owner.
        await admin.from("user_roles").insert({ user_id: target_user_id, role: "secretariat" });
        // Tiny gap to guarantee ordering.
        await new Promise(r => setTimeout(r, 50));
        await admin.from("user_roles").insert({ user_id: user.id, role: "secretariat" });
        return json({ ok: true, new_owner: target_user_id });
      }

      return json({ error: "Unknown action" }, 400);
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (e: any) {
    return json({ error: e?.message ?? String(e) }, 500);
  }
});
