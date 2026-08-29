import { createClient } from "@supabase/supabase-js";

const ALLOWED_ROLES = new Set(["admin", "kasa", "satis", "depo", "usta"]);

function usernameSlug(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9._-]+/g, ".").replace(/^\.+|\.+$/g, "");
}

function send(res, status, payload) {
  res.status(status).json(payload);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { ok: false, message: "Method not allowed" });

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return send(res, 500, { ok: false, message: "Vercel SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY eksik." });
  }

  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return send(res, 401, { ok: false, message: "Oturum doğrulanamadı." });

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const createdAuthIds = [];
  try {
    const { data: authData, error: authError } = await adminClient.auth.getUser(token);
    if (authError || !authData?.user) return send(res, 401, { ok: false, message: "Oturum süresi dolmuş. Tekrar giriş yap." });

    const { data: caller, error: callerError } = await adminClient
      .from("app_users")
      .select("auth_user_id,name,role,is_active")
      .eq("auth_user_id", authData.user.id)
      .single();
    if (callerError || !caller?.is_active || caller.role !== "admin") {
      return send(res, 403, { ok: false, message: "Personel yönetimini yalnızca aktif Admin hesabı kaydedebilir." });
    }

    const rawStaff = Array.isArray(req.body?.staff) ? req.body.staff : [];
    if (!rawStaff.length || rawStaff.length > 30) return send(res, 400, { ok: false, message: "Personel listesi boş veya 30 kişi sınırını aşıyor." });

    const staff = rawStaff.map((item) => {
      const name = String(item?.name || "").replace(/\s+/g, " ").trim();
      const role = ALLOWED_ROLES.has(String(item?.role || "")) ? String(item.role) : "kasa";
      const username = usernameSlug(item?.username || name);
      return {
        authUserId: String(item?.authUserId || "").trim() || null,
        username,
        email: `${username}@garage.local`,
        name,
        role,
        password: String(item?.password || "").trim(),
        allowedCategories: Array.isArray(item?.allowedCategories) ? item.allowedCategories.map(String).filter(Boolean) : [],
        permissions: item?.permissions && typeof item.permissions === "object" ? item.permissions : {}
      };
    });

    if (staff.some((item) => !item.name || !item.username)) return send(res, 400, { ok: false, message: "Her personel için geçerli bir ad gerekli." });
    if (!staff.some((item) => item.role === "admin")) return send(res, 400, { ok: false, message: "Listede en az bir Admin hesabı kalmalı." });
    if (!staff.some((item) => item.authUserId === authData.user.id)) return send(res, 400, { ok: false, message: "Giriş yaptığın Admin hesabını listeden silemezsin." });

    const duplicateUsernames = staff.filter((item, index, list) => list.findIndex((other) => other.username === item.username) !== index);
    if (duplicateUsernames.length) return send(res, 400, { ok: false, message: `Aynı kullanıcı adı birden fazla kullanılamaz: ${duplicateUsernames[0].username}` });

    const { data: existingProfiles, error: profileError } = await adminClient
      .from("app_users")
      .select("auth_user_id,username,name,role,is_active,last_seen_at,last_login_at,allowed_categories,permissions");
    if (profileError) throw profileError;

    const { data: authList, error: listError } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listError) throw listError;
    const authByEmail = new Map((authList?.users || []).map((user) => [String(user.email || "").toLowerCase(), user]));
    const profileById = new Map((existingProfiles || []).map((profile) => [String(profile.auth_user_id), profile]));
    const result = [];

    for (const item of staff) {
      let authUserId = item.authUserId;
      const matchingProfile = (existingProfiles || []).find((profile) =>
        String(profile.username || "").toLowerCase() === item.username.toLowerCase() ||
        String(profile.name || "").toLocaleLowerCase("tr-TR") === item.name.toLocaleLowerCase("tr-TR")
      );
      if (!authUserId) authUserId = matchingProfile?.auth_user_id || authByEmail.get(item.email.toLowerCase())?.id || null;

      if (!authUserId) {
        if (item.password.length < 4) throw new Error(`${item.name} için en az 4 karakterli şifre gir.`);
        const { data: created, error: createError } = await adminClient.auth.admin.createUser({
          email: item.email,
          password: item.password,
          email_confirm: true,
          user_metadata: { name: item.name, username: item.username, role: item.role }
        });
        if (createError) throw new Error(`${item.name} oluşturulamadı: ${createError.message}`);
        authUserId = created.user.id;
        createdAuthIds.push(authUserId);
      } else {
        const authChanges = {
          email: item.email,
          user_metadata: { name: item.name, username: item.username, role: item.role }
        };
        if (item.password) {
          if (item.password.length < 4) throw new Error(`${item.name} için şifre en az 4 karakter olmalı.`);
          authChanges.password = item.password;
        }
        const { error: updateAuthError } = await adminClient.auth.admin.updateUserById(authUserId, authChanges);
        if (updateAuthError) throw new Error(`${item.name} hesabı güncellenemedi: ${updateAuthError.message}`);
      }

      const oldProfile = profileById.get(String(authUserId));
      const profilePayload = {
        auth_user_id: authUserId,
        username: item.username,
        name: item.name,
        role: item.role,
        allowed_categories: item.allowedCategories,
        permissions: item.permissions,
        is_active: true,
        updated_at: new Date().toISOString()
      };
      const { error: upsertError } = await adminClient.from("app_users").upsert(profilePayload, { onConflict: "auth_user_id" });
      if (upsertError) throw new Error(`${item.name} profili kaydedilemedi: ${upsertError.message}`);

      result.push({
        auth_user_id: authUserId,
        username: item.username,
        name: item.name,
        role: item.role,
        is_active: true,
        last_seen_at: oldProfile?.last_seen_at || null,
        last_login_at: oldProfile?.last_login_at || null,
        allowed_categories: item.allowedCategories,
        permissions: item.permissions
      });
    }

    const keptIds = new Set(result.map((item) => String(item.auth_user_id)));
    const removedProfiles = (existingProfiles || []).filter((profile) => profile.is_active !== false && !keptIds.has(String(profile.auth_user_id)));
    for (const profile of removedProfiles) {
      if (String(profile.auth_user_id) === String(authData.user.id)) continue;
      const { error: deactivateError } = await adminClient.from("app_users").update({ is_active: false, updated_at: new Date().toISOString() }).eq("auth_user_id", profile.auth_user_id);
      if (deactivateError) throw deactivateError;
    }

    return send(res, 200, { ok: true, staff: result });
  } catch (error) {
    if (createdAuthIds.length) await adminClient.from("app_users").delete().in("auth_user_id", createdAuthIds).catch(() => {});
    for (const authUserId of createdAuthIds) await adminClient.auth.admin.deleteUser(authUserId).catch(() => {});
    return send(res, 500, { ok: false, message: error?.message || "Personel listesi kaydedilemedi." });
  }
}
