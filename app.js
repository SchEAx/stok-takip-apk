const APP_VERSION = '1.0.2';
let isOffline = !navigator.onLine;
let globalLoading = false;

const SUPABASE_URL = "https://dmsovrbkoeivkvmlzals.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtc292cmJrb2Vpdmt2bWx6YWxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNTg3NTMsImV4cCI6MjA5MjkzNDc1M30.Tf_8-AEkON4hvKsWiljiDV5z_LJW7KUebIkU-0R8x_A";
const VAPID_PUBLIC_KEY = "BAi5RqXIHt50gvHTCOLT0XJxzW6f8OB_pYt_JN4nOKIIP8Cj9KkUu44hsLRZKLxxOKrZVdPFX_c5qc141bJt4Hc";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const state = {
  products: [], filteredProducts: [], movements: [], stockRequests: [], requestFilter: "all",
  activeTab: "requests", loading: false, selectedStockRequestId: null, seenRequestIds: new Set(), realtimeReady: false, newRequestCount: 0,
highlightRequestIds: new Set(),
originalTitle: document.title,
  saleCart: [],
  lastQuickSale: null,
  operationQty: {},
  notifications: [], notificationFilter: "all", unreadNotificationCount: 0, notificationTableReady: true,
  activityLogs: [], activityLogTableReady: true, authReady: false, currentUser: null,
};

const el = {
  totalProductCount: document.getElementById("totalProductCount"), totalStockCount: document.getElementById("totalStockCount"), reservedStockCount: document.getElementById("reservedStockCount"), criticalStockCount: document.getElementById("criticalStockCount"),
  refreshBtn: document.getElementById("refreshBtn"), enableNotifyBtn: document.getElementById("enableNotifyBtn"), productForm: document.getElementById("productForm"), productId: document.getElementById("productId"), barcode: document.getElementById("barcode"),
  productBrand: document.getElementById("productBrand"), category: document.getElementById("category"), carBrand: document.getElementById("carBrand"), carModel: document.getElementById("carModel"), carType: document.getElementById("carType"), vehicleYear: document.getElementById("vehicleYear"), stock: document.getElementById("stock"), minStock: document.getElementById("minStock"), location: document.getElementById("location"), note: document.getElementById("note"),
  saveProductBtn: document.getElementById("saveProductBtn"), clearProductBtn: document.getElementById("clearProductBtn"), movementSearchInput: document.getElementById("movementSearchInput"), movementSearchList: document.getElementById("movementSearchList"), searchInput: document.getElementById("searchInput"), productTableBody: document.getElementById("productTableBody"), movementList: document.getElementById("movementList"),
  stockRequestsBox: document.getElementById("stockRequestsBox"), reservationPanel: document.getElementById("reservationPanel"), requestedTextBox: document.getElementById("requestedTextBox"), productSearchInput: document.getElementById("productSearchInput"), productMatchBox: document.getElementById("productMatchBox"), toast: document.getElementById("toast"),
  saleSearchInput: document.getElementById("saleSearchInput"), saleProductList: document.getElementById("saleProductList"), saleCartList: document.getElementById("saleCartList"), saleTotal: document.getElementById("saleTotal"), salePaymentType: document.getElementById("salePaymentType"), saleCustomerNote: document.getElementById("saleCustomerNote"), completeSaleBtn: document.getElementById("completeSaleBtn"), clearSaleBtn: document.getElementById("clearSaleBtn"), todaySaleTotal: document.getElementById("todaySaleTotal"), todaySaleQty: document.getElementById("todaySaleQty"), todayCashTotal: document.getElementById("todayCashTotal"), todayCardTotal: document.getElementById("todayCardTotal"), topSaleProducts: document.getElementById("topSaleProducts"), currentStaffSelect: document.getElementById("currentStaffSelect"), staffRoleBadge: document.getElementById("staffRoleBadge"), staffEditor: document.getElementById("staffEditor"), staffEditorBody: document.getElementById("staffEditorBody"), printLastSaleBtn: document.getElementById("printLastSaleBtn"), cancelLastSaleBtn: document.getElementById("cancelLastSaleBtn"), productImage: document.getElementById("productImage"), reportStartDate: document.getElementById("reportStartDate"), reportEndDate: document.getElementById("reportEndDate"), reportSearchInput: document.getElementById("reportSearchInput"), criticalSearchInput: document.getElementById("criticalSearchInput"), historySearchInput: document.getElementById("historySearchInput"),
  operationBrandFilter: document.getElementById("operationBrandFilter"), operationCategoryFilter: document.getElementById("operationCategoryFilter"), operationSearchInput: document.getElementById("operationSearchInput"), operationResultBox: document.getElementById("operationResultBox"),
  notificationBellBtn: document.getElementById("notificationBellBtn"), notificationUnreadCount: document.getElementById("notificationUnreadCount"), notificationList: document.getElementById("notificationList"),
  loginOverlay: document.getElementById("loginOverlay"), appShell: document.getElementById("appShell"), loginStaffSelect: document.getElementById("loginStaffSelect"), loginPasswordInput: document.getElementById("loginPasswordInput"), loginBtn: document.getElementById("loginBtn"), logoutBtn: document.getElementById("logoutBtn"), activeUserName: document.getElementById("activeUserName"), activeUserRole: document.getElementById("activeUserRole"), usersList: document.getElementById("usersList"), activityLogList: document.getElementById("activityLogList"), rolePermissionEditor: document.getElementById("rolePermissionEditor")
};


// APK/WebView içinde alert/confirm bazen çalışmadığı için uygulama içi onay penceresi.
function appConfirm(message, options = {}) {
  return new Promise((resolve) => {
    const overlay = document.getElementById("appConfirmOverlay");
    const titleEl = document.getElementById("appConfirmTitle");
    const msgEl = document.getElementById("appConfirmMessage");
    const okBtn = document.getElementById("appConfirmOk");
    const cancelBtn = document.getElementById("appConfirmCancel");
    if (!overlay || !msgEl || !okBtn || !cancelBtn) {
      // Son çare: tarayıcı confirm. Normalde APK'da buraya düşmemeli.
      resolve(window.confirm(String(message || "Devam edilsin mi?")));
      return;
    }
    titleEl.textContent = options.title || "Onay gerekiyor";
    msgEl.textContent = String(message || "Devam edilsin mi?");
    okBtn.textContent = options.okText || "Onayla";
    cancelBtn.textContent = options.cancelText || "İptal";
    okBtn.className = "btn " + (options.danger ? "danger" : "primary");
    const cleanup = (value) => {
      overlay.classList.add("hidden");
      okBtn.onclick = null;
      cancelBtn.onclick = null;
      overlay.onclick = null;
      document.onkeydown = null;
      resolve(value);
    };
    okBtn.onclick = () => cleanup(true);
    cancelBtn.onclick = () => cleanup(false);
    overlay.onclick = (e) => { if (e.target === overlay) cleanup(false); };
    document.onkeydown = (e) => { if (e.key === "Escape") cleanup(false); };
    overlay.classList.remove("hidden");
    setTimeout(() => okBtn.focus(), 50);
  });
}


const SESSION_STORE_KEY = "garage_current_session_v2";
const STAFF_META_STORE_KEY = "garage_staff_meta_v2";
const ACTIVITY_STORE_KEY = "garage_activity_logs_v2";
const ROLE_PERMISSION_STORE_KEY = "garage_role_permissions_v1";
const TAB_DEFINITIONS = [
  { key: "requests", label: "Depo" },
  { key: "operation", label: "İşlem" },
  { key: "search", label: "Ara" },
  { key: "add", label: "Ürün Ekle" },
  { key: "movements", label: "Hareketler" },
  { key: "sale", label: "Hızlı Satış" },
  { key: "reports", label: "Raporlar" },
  { key: "critical", label: "Kritik Stok" },
  { key: "notifications", label: "Bildirimler" },
  { key: "history", label: "Plaka Geçmişi" },
  { key: "users", label: "Kullanıcılar / Yetkiler" }
];
const ALL_TAB_KEYS = TAB_DEFINITIONS.map(t => t.key);
const DEFAULT_ROLE_PERMISSIONS = {
  admin: [...ALL_TAB_KEYS],
  depo: ["requests", "operation", "search", "add", "movements", "critical", "notifications"],
  kasa: ["search", "sale", "reports", "history"],
  satis: ["requests", "search", "sale", "notifications", "history"],
  usta: ["requests", "search", "notifications", "history"]
};
const ROLE_DEFAULT_TAB = { admin: "requests", depo: "requests", kasa: "sale", satis: "sale", usta: "requests" };
function normalizeRolePermissions(data) {
  const output = {};
  Object.keys(DEFAULT_ROLE_PERMISSIONS).forEach(role => {
    const incoming = Array.isArray(data?.[role]) ? data[role] : DEFAULT_ROLE_PERMISSIONS[role];
    output[role] = [...new Set(incoming.filter(tab => ALL_TAB_KEYS.includes(tab)))];
    if (role === "admin") output[role] = [...ALL_TAB_KEYS];
    if (!output[role].length) output[role] = [...DEFAULT_ROLE_PERMISSIONS[role]];
  });
  return output;
}
function readRolePermissions() {
  try {
    return normalizeRolePermissions(JSON.parse(localStorage.getItem(ROLE_PERMISSION_STORE_KEY) || "null"));
  } catch {
    return normalizeRolePermissions(null);
  }
}
function writeRolePermissions(permissions) {
  const normalized = normalizeRolePermissions(permissions);
  localStorage.setItem(ROLE_PERMISSION_STORE_KEY, JSON.stringify(normalized));
  saveRolePermissionsToSupabase(normalized).catch(() => {});
  return normalized;
}
async function loadRolePermissionsFromSupabase() {
  try {
    const { data, error } = await supabaseClient.from("app_settings").select("value").eq("key", "role_permissions").maybeSingle();
    if (error || !data?.value) return;
    localStorage.setItem(ROLE_PERMISSION_STORE_KEY, JSON.stringify(normalizeRolePermissions(data.value)));
  } catch (err) {
    console.warn("Yetki ayarları Supabase'den alınamadı, local devam:", err?.message || err);
  }
}
async function saveRolePermissionsToSupabase(permissions) {
  try {
    await supabaseClient.from("app_settings").upsert({ key: "role_permissions", value: normalizeRolePermissions(permissions), updated_at: new Date().toISOString() }, { onConflict: "key" });
  } catch (err) {
    console.warn("Yetki ayarları Supabase'e yazılamadı:", err?.message || err);
  }
}
function permissionsForRole(role) { return readRolePermissions()[role] || readRolePermissions().kasa; }
function canAccessTab(tab, role = currentStaff().role) { return permissionsForRole(role).includes(tab); }
function readStaffMeta() { try { return JSON.parse(localStorage.getItem(STAFF_META_STORE_KEY) || "{}"); } catch { return {}; } }
function writeStaffMeta(meta) { localStorage.setItem(STAFF_META_STORE_KEY, JSON.stringify(meta || {})); }
function updateStaffMeta(name, patch) {
  const key = normalizeStaffName(name);
  if (!key) return;
  const meta = readStaffMeta();
  meta[key] = { ...(meta[key] || {}), ...(patch || {}) };
  writeStaffMeta(meta);
}
function currentSession() { try { return JSON.parse(localStorage.getItem(SESSION_STORE_KEY) || "null"); } catch { return null; } }
function setCurrentSession(staff) {
  const session = { name: staff.name, role: staff.role, loginAt: new Date().toISOString(), sessionId: Date.now() + "_" + Math.random().toString(16).slice(2) };
  localStorage.setItem(SESSION_STORE_KEY, JSON.stringify(session));
  localStorage.setItem(CURRENT_STAFF_STORE_KEY, staff.name);
  updateStaffMeta(staff.name, { lastLoginAt: session.loginAt, lastSeenAt: session.loginAt, role: staff.role });
  state.currentUser = session;
  return session;
}
function clearCurrentSession() { localStorage.removeItem(SESSION_STORE_KEY); state.currentUser = null; }
function populateLoginStaffSelect() {
  if (!el.loginStaffSelect) return;
  const staff = readStaffList();
  el.loginStaffSelect.innerHTML = staff.map(s => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)} — ${roleLabel(s.role)}</option>`).join("");
}
function updateUserPill() {
  const staff = currentStaff();
  if (el.activeUserName) el.activeUserName.textContent = staff.name || "-";
  if (el.activeUserRole) el.activeUserRole.textContent = roleLabel(staff.role || "kasa");
}
function applyRoleVisibility() {
  const staff = currentStaff();
  const allowed = new Set(permissionsForRole(staff.role));
  ALL_TAB_KEYS.forEach(tab => {
    const nav = document.getElementById("nav-" + tab);
    if (nav) nav.classList.toggle("hidden", !allowed.has(tab));
  });
  document.body.dataset.role = staff.role || "kasa";
}
function showLogin() {
  populateLoginStaffSelect();
  if (el.loginOverlay) el.loginOverlay.classList.remove("hidden");
  if (el.appShell) el.appShell.classList.add("locked");
  setTimeout(() => el.loginPasswordInput?.focus(), 100);
}
function hideLogin() {
  if (el.loginOverlay) el.loginOverlay.classList.add("hidden");
  if (el.appShell) el.appShell.classList.remove("locked");
}
function loginWithSelectedStaff() {
  const name = el.loginStaffSelect?.value || "";
  const pass = String(el.loginPasswordInput?.value || "").trim();
  const staff = readStaffList().find(s => s.name === name);
  if (!staff) return showToast("Personel bulunamadı", true);
  if (pass !== normalizeStaffPassword(staff.password, defaultPasswordForRole(staff.role))) {
    return showToast("Şifre hatalı", true);
  }
  setCurrentSession(staff);
  if (el.loginPasswordInput) el.loginPasswordInput.value = "";
  hideLogin();
  updateUserPill();
  renderStaffSelector();
  applyRoleVisibility();
  const target = canAccessTab(state.activeTab, staff.role) ? state.activeTab : (ROLE_DEFAULT_TAB[staff.role] || "requests");
  switchTab(target);
  logActivity("login", `${staff.name} giriş yaptı`, "staff", staff.name);
  showToast(`Hoş geldin ${staff.name} ✅`);
}
function initAuthGate() {
  populateLoginStaffSelect();
  const session = currentSession();
  const staff = session ? readStaffList().find(s => s.name === session.name) : null;
  if (staff) {
    localStorage.setItem(CURRENT_STAFF_STORE_KEY, staff.name);
    state.currentUser = session;
    hideLogin();
    updateStaffMeta(staff.name, { lastSeenAt: new Date().toISOString(), role: staff.role });
  } else {
    showLogin();
  }
  updateUserPill();
  applyRoleVisibility();
  renderUsersList();
  renderRolePermissionEditor();
}
window.logoutCurrentUser = function() {
  const staff = currentStaff();
  logActivity("logout", `${staff.name} çıkış yaptı`, "staff", staff.name);
  clearCurrentSession();
  showLogin();
  showToast("Çıkış yapıldı");
};
function localActivityPush(item) {
  const logs = readLocalActivityLogs();
  logs.unshift(item);
  localStorage.setItem(ACTIVITY_STORE_KEY, JSON.stringify(logs.slice(0, 300)));
}
function readLocalActivityLogs() { try { return JSON.parse(localStorage.getItem(ACTIVITY_STORE_KEY) || "[]"); } catch { return []; } }
async function logActivity(action, description, entity_table = null, entity_id = null) {
  const staff = currentStaff();
  const item = { id: "local_" + Date.now() + "_" + Math.random().toString(16).slice(2), actor_name: staff.name, actor_role: staff.role, action, description, entity_table, entity_id: entity_id ? String(entity_id) : null, created_at: new Date().toISOString() };
  localActivityPush(item);
  if (state.activityLogTableReady) {
    try {
      const { error } = await supabaseClient.from("app_activity_logs").insert({ actor_name: item.actor_name, actor_role: item.actor_role, action: item.action, description: item.description, entity_table: item.entity_table, entity_id: item.entity_id });
      if (error) throw error;
    } catch (err) {
      console.warn("app_activity_logs tablosu yok veya erişilemiyor, yerel log tutuluyor:", err);
      state.activityLogTableReady = false;
    }
  }
  renderActivityLogs();
  renderUsersList();
  renderRolePermissionEditor();
}
async function loadActivityLogs() {
  let rows = readLocalActivityLogs();
  if (state.activityLogTableReady) {
    try {
      const { data, error } = await supabaseClient.from("app_activity_logs").select("*").order("created_at", { ascending: false }).limit(120);
      if (error) throw error;
      rows = data || rows;
    } catch (err) {
      console.warn("Aktivite logları Supabase'den alınamadı:", err);
      state.activityLogTableReady = false;
    }
  }
  state.activityLogs = rows || [];
  renderActivityLogs();
}
window.loadActivityLogs = loadActivityLogs;
function renderActivityLogs() {
  if (!el.activityLogList) return;
  const rows = (state.activityLogs.length ? state.activityLogs : readLocalActivityLogs()).slice(0, 80);
  el.activityLogList.innerHTML = rows.length ? rows.map(r => `<div class="movement-item"><div class="movement-top"><div><strong>${escapeHtml(r.actor_name || "-")}</strong><div class="muted">${escapeHtml(roleLabel(r.actor_role) || r.actor_role || "-")} · ${escapeHtml(r.action || "-")}</div></div><span class="muted">${formatDate(r.created_at)}</span></div><div>${escapeHtml(r.description || "-")}</div>${r.entity_table ? `<div class="muted">${escapeHtml(r.entity_table)} ${r.entity_id ? "#" + escapeHtml(String(r.entity_id).slice(0, 8)) : ""}</div>` : ""}</div>`).join("") : `<div class="empty-state">Henüz işlem kaydı yok</div>`;
}
function renderUsersList() {
  if (!el.usersList) return;
  const meta = readStaffMeta();
  const active = currentStaffName();
  const staff = readStaffList();
  el.usersList.innerHTML = staff.map(s => {
    const m = meta[s.name] || {};
    const online = s.name === active && !!currentSession();
    return `<div class="user-row ${online ? "online" : ""}"><div class="user-avatar">${escapeHtml((s.name || "?").slice(0,1).toLocaleUpperCase("tr-TR"))}</div><div><strong>${escapeHtml(s.name)}</strong><div class="muted">${roleLabel(s.role)} · Son giriş: ${m.lastLoginAt ? formatDate(m.lastLoginAt) : "-"}</div><div class="muted">Son görünme: ${m.lastSeenAt ? formatDate(m.lastSeenAt) : "-"}</div></div><span class="user-status">${online ? "Çevrimiçi" : "Pasif"}</span></div>`;
  }).join("");
}
window.renderUsersList = renderUsersList;

function renderRolePermissionEditor() {
  if (!el.rolePermissionEditor) return;
  const staff = currentStaff();
  if (staff.role !== "admin") {
    el.rolePermissionEditor.innerHTML = `<div class="empty-state">Menü yetkilerini sadece Admin düzenleyebilir.</div>`;
    return;
  }
  const permissions = readRolePermissions();
  const editableRoles = ["depo", "kasa", "satis", "usta"];
  el.rolePermissionEditor.innerHTML = editableRoles.map(role => `
    <div class="permission-role-card">
      <div class="permission-role-head">
        <strong>${roleLabel(role)}</strong>
        <small>${(permissions[role] || []).length} sekme aktif</small>
      </div>
      <div class="permission-check-grid">
        ${TAB_DEFINITIONS.filter(tab => tab.key !== "users").map(tab => `
          <label class="permission-check">
            <input type="checkbox" data-role-permission="${role}" value="${tab.key}" ${(permissions[role] || []).includes(tab.key) ? "checked" : ""} />
            <span>${escapeHtml(tab.label)}</span>
          </label>
        `).join("")}
      </div>
    </div>
  `).join("");
}
window.renderRolePermissionEditor = renderRolePermissionEditor;

window.saveRolePermissions = function() {
  if (!requireRoleAction(["admin"], "Menü yetkilerini sadece Admin düzenleyebilir")) return;
  const current = readRolePermissions();
  ["depo", "kasa", "satis", "usta"].forEach(role => {
    current[role] = [...document.querySelectorAll(`[data-role-permission="${role}"]:checked`)].map(input => input.value);
  });
  writeRolePermissions(current);
  applyRoleVisibility();
  renderRolePermissionEditor();
  logActivity("role_permissions", "Rol bazlı menü yetkileri güncellendi", "permissions", "menu");
  showToast("Menü yetkileri kaydedildi ✅");
};

window.resetRolePermissions = async function() {
  if (!requireRoleAction(["admin"], "Menü yetkilerini sadece Admin sıfırlayabilir")) return;
  if (!(await appConfirm("Menü yetkileri varsayılana dönsün mü?", { danger: true }))) return;
  localStorage.removeItem(ROLE_PERMISSION_STORE_KEY);
  applyRoleVisibility();
  renderRolePermissionEditor();
  logActivity("role_permissions_reset", "Rol bazlı menü yetkileri varsayılana döndü", "permissions", "menu");
  showToast("Menü yetkileri varsayılana döndü ✅");
};

function requireRoleAction(allowedRoles, message = "Bu işlem için yetkin yok") {
  const staff = currentStaff();
  if (!allowedRoles.includes(staff.role)) {
    showToast(message, true);
    logActivity("blocked", `${staff.name} yetkisiz işlem denedi: ${message}`, "permission", staff.role);
    return false;
  }
  return true;
}
function actorSuffix() {
  const staff = currentStaff();
  return ` · Personel: ${staff.name} (${roleLabel(staff.role)})`;
}

function showToast(message, isError = false) {
  el.toast.textContent = message; el.toast.classList.remove("hidden");
  el.toast.style.borderColor = isError ? "rgba(220,38,38,0.5)" : "rgba(22,163,74,0.5)";
  setTimeout(() => el.toast.classList.add("hidden"), 3500);
}
function notificationIcon(type) {
  return ({ stock_request: "📦", critical_stock: "⚠️", movement: "↔️", sale: "💳", system: "🔔" })[type] || "🔔";
}
function updateNotificationBadge() {
  const count = Number(state.unreadNotificationCount || 0);
  if (!el.notificationUnreadCount) return;
  if (count > 0) {
    el.notificationUnreadCount.textContent = count > 99 ? "99+" : String(count);
    el.notificationUnreadCount.classList.remove("hidden");
    if (el.notificationBellBtn) el.notificationBellBtn.classList.add("has-unread");
  } else {
    el.notificationUnreadCount.classList.add("hidden");
    if (el.notificationBellBtn) el.notificationBellBtn.classList.remove("has-unread");
  }
}
function renderNotifications() {
  if (!el.notificationList) return;
  let list = state.notifications || [];
  if (state.notificationFilter === "unread") list = list.filter(n => !n.is_read);
  else if (state.notificationFilter !== "all") list = list.filter(n => n.type === state.notificationFilter);
  if (!list.length) {
    el.notificationList.innerHTML = `<div class="empty-state">Bu filtrede bildirim yok</div>`;
    return;
  }
  el.notificationList.innerHTML = list.map(n => `
    <div class="notification-item ${n.is_read ? "read" : "unread"}">
      <div class="notification-icon">${notificationIcon(n.type)}</div>
      <div class="notification-body">
        <div class="notification-title-row">
          <strong>${escapeHtml(n.title || "Bildirim")}</strong>
          <span>${formatDate(n.created_at)}</span>
        </div>
        <div class="notification-message">${escapeHtml(n.message || "-")}</div>
        ${n.source_table || n.source_id ? `<div class="notification-source">${escapeHtml(n.source_table || "")}${n.source_id ? " #" + escapeHtml(String(n.source_id).slice(0, 8)) : ""}</div>` : ""}
      </div>
      <div class="notification-actions">
        ${n.is_read ? "" : `<button class="btn secondary mini" onclick="markNotificationRead('${n.id}')">Okundu</button>`}
      </div>
    </div>`).join("");
}
function pushLocalNotification({ title, message, type = "system", source_table = null, source_id = null, is_read = false }) {
  const item = { id: "local_" + Date.now() + "_" + Math.random().toString(16).slice(2), title, message, type, source_table, source_id, is_read, created_at: new Date().toISOString() };
  state.notifications.unshift(item);
  state.notifications = state.notifications.slice(0, 120);
  state.unreadNotificationCount = state.notifications.filter(n => !n.is_read).length;
  updateNotificationBadge();
  renderNotifications();
  return item;
}
async function createNotification({ title, message, type = "system", target_role = "depo", source_table = null, source_id = null, silent = false }) {
  const payload = { title, message, type, target_role, source_table, source_id, is_read: false };
  if (!state.notificationTableReady) {
    const item = pushLocalNotification(payload);
    if (!silent) playNotificationSound();
    return item;
  }
  try {
    const { data, error } = await supabaseClient.from("notifications").insert(payload).select("*").single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn("notifications tablosu kullanılamıyor, yerel bildirime düşüldü:", err);
    state.notificationTableReady = false;
    const item = pushLocalNotification(payload);
    if (!silent) playNotificationSound();
    return item;
  }
}
async function loadNotifications() {
  if (!state.notificationTableReady) { renderNotifications(); return; }
  try {
    const { data, error } = await supabaseClient.from("notifications").select("*").order("created_at", { ascending: false }).limit(120);
    if (error) throw error;
    state.notifications = data || [];
    state.unreadNotificationCount = state.notifications.filter(n => !n.is_read).length;
    updateNotificationBadge();
    renderNotifications();
  } catch (err) {
    console.warn("Bildirimler yüklenemedi:", err);
    state.notificationTableReady = false;
    renderNotifications();
  }
}
window.loadNotifications = loadNotifications;
window.setNotificationFilter = function(filter) { state.notificationFilter = filter || "all"; renderNotifications(); };
window.markNotificationRead = async function(id) {
  const item = state.notifications.find(n => String(n.id) === String(id));
  if (item) item.is_read = true;
  state.unreadNotificationCount = state.notifications.filter(n => !n.is_read).length;
  updateNotificationBadge();
  renderNotifications();
  if (!String(id).startsWith("local_") && state.notificationTableReady) {
    await supabaseClient.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("id", id);
  }
};
window.markAllNotificationsRead = async function() {
  state.notifications.forEach(n => n.is_read = true);
  state.unreadNotificationCount = 0;
  updateNotificationBadge();
  renderNotifications();
  if (state.notificationTableReady) {
    await supabaseClient.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("is_read", false);
  }
  showToast("Bildirimler okundu yapıldı ✅");
};
window.testInAppNotification = function() {
  pushLocalNotification({ title: "Test bildirimi", message: "Ses ve bildirim merkezi çalışıyor knk ✅", type: "system" });
  playNotificationSound();
  showToast("Test bildirimi oluşturuldu ✅");
};
function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function normalizeText(value) { return String(value || "").toLocaleLowerCase("tr-TR").trim(); }
function formatDate(value) { if (!value) return "-"; const d = new Date(value); if (Number.isNaN(d.getTime())) return value; return d.toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" }); }
function buildProductName(row) { return [row.product_brand, row.category, row.vehicle_brand, row.vehicle_model, row.vehicle_type, row.vehicle_year].filter(Boolean).join(" ").replace(/\s+/g, " ").trim(); }
function extractImageUrlFromNote(note) {
  const m = String(note || "").match(/\[IMG:([^\]]+)\]/i);
  return m ? m[1].trim() : "";
}
function stripImageUrlFromNote(note) {
  return String(note || "").replace(/\s*\[IMG:[^\]]+\]\s*/ig, " ").replace(/\s+/g, " ").trim();
}
function mergeNoteWithImage(note, imageUrl) {
  const clean = stripImageUrlFromNote(note);
  const img = String(imageUrl || "").trim();
  return [clean, img ? `[IMG:${img}]` : ""].filter(Boolean).join(" ").trim() || null;
}
function mapProduct(row) {
  return { id: row.id || "", barcode: row.barcode || "", name: row.product_name || buildProductName(row), productBrand: row.product_brand || "", category: row.category || "", carBrand: row.vehicle_brand || "", carModel: row.vehicle_model || "", carType: row.vehicle_type || "", vehicleYear: row.vehicle_year || "", stock: Number(row.quantity || 0), reserved: Number(row.reserved_quantity || 0), minStock: Number(row.min_stock || 0), location: row.location || "", note: stripImageUrlFromNote(row.note || ""), imageUrl: extractImageUrlFromNote(row.note || ""), createdAt: row.created_at || "" };
}
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

function updateNotifyButtonUI(isWorking = false) {
  if (!el.enableNotifyBtn) return;

  if (isWorking) {
    el.enableNotifyBtn.textContent = "Bildirim Açılıyor...";
    el.enableNotifyBtn.disabled = true;
    return;
  }

  if ("Notification" in window && Notification.permission === "granted") {
    el.enableNotifyBtn.textContent = "Bildirim Açık ✅";
    el.enableNotifyBtn.classList.remove("ghost");
    el.enableNotifyBtn.classList.add("success");
    el.enableNotifyBtn.disabled = true;
  } else {
    el.enableNotifyBtn.textContent = "Bildirim Aç";
    el.enableNotifyBtn.classList.remove("success");
    el.enableNotifyBtn.classList.add("ghost");
    el.enableNotifyBtn.disabled = false;
  }
}

async function enablePushNotifications() {
  try {
    updateNotifyButtonUI(true);

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      showToast("Bu cihaz push bildirim desteklemiyor", true);
      updateNotifyButtonUI(false);
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      showToast("Bildirim izni verilmedi", true);
      updateNotifyButtonUI(false);
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
    }

    const res = await fetch("/api/subscribe-push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription)
    });

    const data = await res.json();

    if (!data.ok) {
      throw new Error(data.message || "Push aboneliği kaydedilemedi");
    }

    updateNotifyButtonUI(false);
    showToast("Bildirim açık ✅");
  } catch (err) {
    console.error("Bildirim açma hatası:", err);
    updateNotifyButtonUI(false);
    showToast(err.message || "Bildirim açılamadı", true);
  }
}
function playNotificationSound() {
  try {
    const audio = new Audio("./notification.mp3");
    audio.volume = 1;
    audio.play().catch((err) => {
      console.warn("Ses otomatik çalınamadı:", err);
    });
  } catch (err) {
    console.warn("Bildirim sesi hatası:", err);
  }
}
function toProductRow(payload) {
  const productName = [payload.productBrand, payload.category, payload.carBrand, payload.carModel, payload.carType, payload.vehicleYear].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  return { barcode: payload.barcode || null, product_name: productName || payload.category, product_brand: payload.productBrand || null, category: payload.category || null, vehicle_brand: payload.carBrand || null, vehicle_model: payload.carModel || null, vehicle_type: payload.carType || null, vehicle_year: payload.vehicleYear || null, quantity: Number(payload.stock || 0), min_stock: Number(payload.minStock || 0), location: payload.location || null, note: mergeNoteWithImage(payload.note || "", payload.imageUrl || "") };
}
function formatRequestStatus(status) { return ({ bekliyor: "Bekliyor", rezerve_edildi: "Rezerve", teslim_edildi: "Teslim Edildi", montaj_bitti: "Tamamlandı", iptal: "İptal" })[status] || status || "-"; }
function requestVehicleText(req) {
  return [req?.vehicle_brand, req?.vehicle_model, req?.vehicle_type, req?.vehicle_year].filter(Boolean).join(" ");
}

function renderSelectedRequestDetail(req) {
  const vehicleText = requestVehicleText(req);
  el.requestedTextBox.innerHTML = `
    <div style="font-weight:700;color:#fff;">${escapeHtml(req?.requested_text || "-")}</div>
    <div class="muted">${escapeHtml(vehicleText || "Araç bilgisi yok")}</div>
  `;
}
function updateNewRequestAlert() {
  const alertBox = document.getElementById("newRequestAlert");
  const alertText = document.getElementById("newRequestAlertText");

  if (!alertBox || !alertText) return;

  if (state.newRequestCount > 0) {
    alertBox.classList.remove("hidden");
    alertText.textContent = `${state.newRequestCount} yeni depo talebi var`;
    document.title = `(${state.newRequestCount}) Depo Talebi`;
  } else {
    alertBox.classList.add("hidden");
    document.title = state.originalTitle || "Stok Takip";
  }
}

window.clearNewRequestAlert = function() {
  state.newRequestCount = 0;
  state.highlightRequestIds.clear();
  updateNewRequestAlert();
  renderStockRequests();
};
function setLoading(flag) { state.loading = flag; el.refreshBtn.disabled = flag; el.saveProductBtn.disabled = flag; el.movementSearchInput.disabled = flag; el.refreshBtn.textContent = flag ? "Yükleniyor..." : "Yenile"; el.saveProductBtn.textContent = flag ? "Kaydediliyor..." : "Ürünü Kaydet"; }

async function loadProducts() { const { data, error } = await supabaseClient.from("stock_products").select("*").order("product_name", { ascending: true }); if (error) throw error; state.products = (data || []).map(mapProduct); applySearch(); updateStats(); refreshProductQuickLists(); refreshOperationFilters(); renderOperationResults(); if (typeof renderSaleProducts === "function") renderSaleProducts(); }
async function loadMovements() { const { data, error } = await supabaseClient.from("stock_movements").select("*, stock_products(product_name, barcode)").order("created_at", { ascending: false }).limit(300); if (error) throw error; state.movements = data || []; renderMovements(); if (typeof renderSaleDashboard === "function") renderSaleDashboard(); }
async function loadStockRequests() {
  const { data, error } = await supabaseClient.from("stock_requests").select("*").in("status", ["bekliyor", "rezerve_edildi", "teslim_edildi", "montaj_bitti", "iptal"]).order("created_at", { ascending: false }).limit(150);
  if (error) { el.stockRequestsBox.innerHTML = `<div class="empty-state">Talep alınamadı: ${escapeHtml(error.message)}</div>`; return; }
  state.stockRequests = data || []; const todayTR = new Date().toLocaleDateString("tr-TR", {
  timeZone: "Europe/Istanbul"
});

state.stockRequests = state.stockRequests.filter(req => {
  if (req.status !== "montaj_bitti") return true;

  const reqDateTR = new Date(req.created_at).toLocaleDateString("tr-TR", {
    timeZone: "Europe/Istanbul"
  });

  return reqDateTR === todayTR;
});
  state.stockRequests.forEach((r) => state.seenRequestIds.add(r.id)); renderStockRequests();
}
window.loadStockRequests = loadStockRequests;
async function loadAll() { try { setLoading(true); await Promise.all([loadProducts(), loadMovements(), loadStockRequests()]); } catch (err) { console.error(err); showToast(err.message || "Veriler yüklenemedi", true); } finally { setLoading(false); } }
function updateStats() { const totalProduct = state.products.length; const totalStock = state.products.reduce((sum, p) => sum + Number(p.stock || 0), 0); const reserved = state.products.reduce((sum, p) => sum + Number(p.reserved || 0), 0); const critical = state.products.filter((p) => (Number(p.stock || 0) - Number(p.reserved || 0)) <= Number(p.minStock || 0)).length; el.totalProductCount.textContent = totalProduct; el.totalStockCount.textContent = totalStock; el.reservedStockCount.textContent = reserved; el.criticalStockCount.textContent = critical; }
function uniqueCleanValues(values) {
  return [...new Set((values || []).map(v => String(v || "").trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "tr"));
}
function setDatalistOptions(id, values) {
  const list = document.getElementById(id);
  if (!list) return;
  list.innerHTML = uniqueCleanValues(values)
    .map(v => `<option value="${escapeHtml(v)}"></option>`)
    .join("");
}
function refreshProductQuickLists() {
  setDatalistOptions("productBrandList", state.products.map(p => p.productBrand));
  setDatalistOptions("categoryList", state.products.map(p => p.category));
  setDatalistOptions("carBrandList", state.products.map(p => p.carBrand));
  setDatalistOptions("carModelList", state.products.map(p => p.carModel));
  setDatalistOptions("carTypeList", state.products.map(p => p.carType));
  setDatalistOptions("locationList", state.products.map(p => p.location));
}

function productSearchText(p) { return normalizeText([p.name, p.productBrand, p.category, p.carBrand, p.carModel, p.carType, p.vehicleYear, p.location, p.note].join(" ")); }
function applySearch() { const q = normalizeText(el.searchInput.value); state.filteredProducts = q ? state.products.filter((p) => productSearchText(p).includes(q)) : state.products; renderProducts(); }
function renderProducts() {
  if (!state.filteredProducts.length) { el.productTableBody.innerHTML = `<tr><td colspan="13" class="empty-cell">Kayıt bulunamadı</td></tr>`; return; }
  el.productTableBody.innerHTML = state.filteredProducts.map((p) => {
    const available = Number(p.stock || 0) - Number(p.reserved || 0);
    const isLow = available <= Number(p.minStock || 0);
    const img = p.imageUrl ? `<img class="product-thumb" src="${escapeHtml(p.imageUrl)}" onerror="this.style.display='none'" />` : `<div class="product-thumb empty">📦</div>`;
    return `<tr><td>${img}</td><td>${escapeHtml(p.productBrand || "-")}</td><td>${escapeHtml(p.category || "-")}</td><td>${escapeHtml(p.carBrand || "-")}</td><td>${escapeHtml(p.carModel || "-")}</td><td>${escapeHtml(p.carType || "-")}</td><td>${escapeHtml(p.vehicleYear || "-")}</td><td>${Number(p.stock || 0)}</td><td>${Number(p.reserved || 0)}</td><td class="${isLow ? "low-stock" : ""}">${available}</td><td>${Number(p.minStock || 0)}</td><td>${escapeHtml(p.location || "-")}</td><td><div class="action-group"><button class="action-btn edit" onclick="editProduct('${p.id}')">Düzenle</button><button class="action-btn delete" onclick="deleteProduct('${p.id}')">Sil</button></div></td></tr>`;
  }).join("");
}
function renderMovements() {
  if (!state.movements.length) { el.movementList.innerHTML = `<div class="empty-state">Henüz hareket yok</div>`; return; }
  el.movementList.innerHTML = state.movements.map((m) => { const productName = m.stock_products?.product_name || m.description || "-"; const type = String(m.movement_type || "").toLowerCase(); const typeClass = type.includes("giris") || type.includes("iade") || (type.includes("rezerv") && !type.includes("iptal")) ? "giris" : "cikis"; return `<div class="movement-item"><div class="movement-top"><div><strong>${escapeHtml(productName)}</strong><div class="muted">${escapeHtml(m.description || "-")}</div></div><span class="badge ${typeClass}">${escapeHtml(m.movement_type || "-")}</span></div><div>Miktar: <strong>${Number(m.quantity || 0)}</strong></div><div>Plaka: <strong>${escapeHtml(m.plate || "-")}</strong></div><div>Kayıt No: <strong>${escapeHtml(m.record_no || "-")}</strong></div><div>Tarih: <strong>${formatDate(m.created_at)}</strong></div></div>`; }).join("");
}
function renderMovementSearchResults() {
  const q = normalizeText(el.movementSearchInput.value); if (!q) { el.movementSearchList.innerHTML = `<div class="empty-state">Arama yaparak ürün seç</div>`; return; }
  const results = state.products.filter((p) => productSearchText(p).includes(q)).slice(0, 30); if (!results.length) { el.movementSearchList.innerHTML = `<div class="empty-state">Eşleşen ürün bulunamadı</div>`; return; }
  el.movementSearchList.innerHTML = results.map((p) => { const available = Number(p.stock || 0) - Number(p.reserved || 0); return `<div class="movement-search-item"><div class="movement-search-info"><strong>${escapeHtml(p.category || p.name || "-")}</strong><div class="muted">${escapeHtml(p.productBrand || "-")} / ${escapeHtml(p.carBrand || "-")} ${escapeHtml(p.carModel || "-")} ${escapeHtml(p.carType || "")} ${escapeHtml(p.vehicleYear || "")}</div><div class="muted">Stok: <strong>${p.stock}</strong> | Rezerve: <strong>${p.reserved}</strong> | Kullanılabilir: <strong>${available}</strong></div></div><div class="movement-search-actions"><button class="btn success" onclick="quickStockAction('${p.id}', 'giris')">Giriş</button><button class="btn danger" onclick="quickStockAction('${p.id}', 'cikis')">Çıkış</button></div></div>`; }).join("");
}

function getOperationQty(productId) {
  const value = Number(state.operationQty[productId] || 1);
  return value > 0 ? value : 1;
}
function setOperationQty(productId, value) {
  const qty = Math.max(1, Number(value || 1));
  state.operationQty[productId] = qty;
  renderOperationResults();
}
window.setOperationQty = setOperationQty;
window.stepOperationQty = function(productId, step) {
  setOperationQty(productId, getOperationQty(productId) + Number(step || 0));
};
function operationFilterOptions() {
  return {
    brands: uniqueCleanValues(state.products.map(p => p.carBrand)),
    categories: uniqueCleanValues(state.products.map(p => p.category))
  };
}
function refreshOperationFilters() {
  if (!el.operationBrandFilter || !el.operationCategoryFilter) return;
  const selectedBrand = el.operationBrandFilter.value;
  const selectedCategory = el.operationCategoryFilter.value;
  const { brands, categories } = operationFilterOptions();
  el.operationBrandFilter.innerHTML = `<option value="">Tüm markalar</option>` + brands.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
  el.operationCategoryFilter.innerHTML = `<option value="">Tüm kategoriler</option>` + categories.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
  el.operationBrandFilter.value = brands.includes(selectedBrand) ? selectedBrand : "";
  el.operationCategoryFilter.value = categories.includes(selectedCategory) ? selectedCategory : "";
}
function operationProductMatches(p, brand, category, q) {
  if (brand && String(p.carBrand || "") !== brand) return false;
  if (category && String(p.category || "") !== category) return false;
  if (q && !productSearchText(p).includes(q)) return false;
  return true;
}
function renderOperationResults() {
  if (!el.operationResultBox) return;
  const brand = el.operationBrandFilter?.value || "";
  const category = el.operationCategoryFilter?.value || "";
  const q = normalizeText(el.operationSearchInput?.value || "");
  let results = state.products.filter(p => operationProductMatches(p, brand, category, q));
  if (!brand && !category && !q) results = results.slice(0, 20);
  results = results.slice(0, 80);
  if (!results.length) {
    el.operationResultBox.innerHTML = `<div class="empty-state">Eşleşen ürün bulunamadı</div>`;
    return;
  }
  el.operationResultBox.innerHTML = results.map((p) => {
    const available = Number(p.stock || 0) - Number(p.reserved || 0);
    const qty = getOperationQty(p.id);
    const img = p.imageUrl ? `<img class="product-card-img" src="${escapeHtml(p.imageUrl)}" onerror="this.style.display='none'" />` : `<div class="product-card-img empty">📦</div>`;
    return `<div class="operation-card">
      ${img}
      <div class="operation-main">
        <div class="operation-title">${escapeHtml(p.name || p.category || "Ürün")}</div>
        <div class="operation-meta">${escapeHtml(p.productBrand || "-")} / ${escapeHtml(p.carBrand || "-")} ${escapeHtml(p.carModel || "")} ${escapeHtml(p.carType || "")} ${escapeHtml(p.vehicleYear || "")}</div>
        <div class="operation-meta">Kategori: <strong>${escapeHtml(p.category || "-")}</strong> · Raf: <strong>${escapeHtml(p.location || "-")}</strong></div>
        <div class="operation-stock-row">
          <span>Stok: <b>${Number(p.stock || 0)}</b></span>
          <span>Rezerve: <b>${Number(p.reserved || 0)}</b></span>
          <span>Kullanılabilir: <b class="${available <= 0 ? "stock-warning" : ""}">${available}</b></span>
        </div>
      </div>
      <div class="operation-actions">
        <div class="operation-qty-row">
          <button class="btn secondary mini" onclick="stepOperationQty('${p.id}', -1)">-</button>
          <input type="number" min="1" value="${qty}" onchange="setOperationQty('${p.id}', this.value)" />
          <button class="btn secondary mini" onclick="stepOperationQty('${p.id}', 1)">+</button>
        </div>
        <button class="btn success" onclick="operationStockAction('${p.id}', 'giris')">Giriş</button>
        <button class="btn danger" onclick="operationStockAction('${p.id}', 'cikis')" ${available <= 0 ? "disabled" : ""}>Çıkış</button>
        <button class="btn secondary" onclick="editProduct('${p.id}')">Düzenle</button>
      </div>
    </div>`;
  }).join("");
}
window.clearOperationFilters = function() {
  if (el.operationBrandFilter) el.operationBrandFilter.value = "";
  if (el.operationCategoryFilter) el.operationCategoryFilter.value = "";
  if (el.operationSearchInput) el.operationSearchInput.value = "";
  renderOperationResults();
};
window.operationStockAction = async function(id, type) { if (!requireRoleAction(["admin", "depo"], "Stok giriş/çıkış yetkisi sadece Admin/Depo")) return;
  const product = state.products.find((p) => String(p.id) === String(id));
  if (!product) return showToast("Ürün bulunamadı", true);
  const quantity = getOperationQty(id);
  const available = Number(product.stock || 0) - Number(product.reserved || 0);
  if (type === "cikis" && available < quantity) return showToast(`Yeterli kullanılabilir stok yok. Kullanılabilir: ${available}`, true);
  const label = type === "giris" ? "giriş" : "çıkış";
  if (!(await appConfirm(`${product.category || product.name} için ${quantity} adet ${label} yapılsın mı?`, { okText: "İşlemi Yap" }))) return;
  try {
    setLoading(true);
    const newQty = type === "giris" ? Number(product.stock || 0) + quantity : Number(product.stock || 0) - quantity;
    const { error: updateError } = await supabaseClient.from("stock_products").update({ quantity: newQty }).eq("id", id);
    if (updateError) throw updateError;
    const { error: movementError } = await supabaseClient.from("stock_movements").insert({
      product_id: id,
      movement_type: type,
      quantity,
      description: `Hızlı işlem ekranı manuel ${label}${actorSuffix()}`
    });
    if (movementError) throw movementError;
    if (type === "cikis") {
      const minStock = Number(product.minStock || 0);
      const willAvailable = newQty - Number(product.reserved || 0);
      if (willAvailable <= minStock) {
        await createNotification({
          title: "Kritik stok uyarısı",
          message: `${product.name || product.category || "Ürün"} kritik seviyede. Kullanılabilir: ${willAvailable}, Min: ${minStock}`,
          type: "critical_stock",
          target_role: "depo",
          source_table: "stock_products",
          source_id: id
        });
      }
    }
    await logActivity("stock_" + type, `${product.name || product.category} için ${quantity} adet ${label}`, "stock_products", id);
    showToast(`${quantity} adet ${label} kaydedildi ✅`);
    await Promise.all([loadProducts(), loadMovements()]);
    renderMovementSearchResults();
  } catch (err) {
    console.error(err);
    showToast(err.message || "İşlem kaydedilemedi", true);
  } finally {
    setLoading(false);
  }
};

function renderStockRequests() {
  let list = state.stockRequests || []; if (state.requestFilter !== "all") list = list.filter(req => req.status === state.requestFilter);
  if (!list.length) { el.stockRequestsBox.innerHTML = `<div class="empty-state">Bu filtrede talep yok</div>`; return; }
  el.stockRequestsBox.innerHTML = list.map((req) => `<div class="movement-item ${state.highlightRequestIds.has(req.id) ? "new-request-glow" : ""}"><div class="movement-top"><div><strong>${escapeHtml(req.plate || "Plaka yok")}</strong><div class="muted">${escapeHtml(req.customer_name || "-")}</div></div><span class="badge status-${escapeHtml(req.status || "bos")}">${formatRequestStatus(req.status)}</span></div><div>Usta: <strong>${escapeHtml(req.technician_name || "-")}</strong></div><div>İstenen: <strong>${escapeHtml(req.requested_text || "-")}</strong></div><div>Araç: <strong>${escapeHtml([
  req.vehicle_brand,
  req.vehicle_model,
  req.vehicle_type
].filter(Boolean).join(" ") || "-")}</strong></div><div>Tarih: <strong>${formatDate(req.created_at)}</strong></div><div class="row-gap" style="margin-top:10px;"><button class="btn primary" onclick="openReservationPanel('${req.id}')">Ürün Eşleştir</button>${req.status === "rezerve_edildi" ? `<button class="btn danger" onclick="cancelReservation('${req.id}')">Rezervi İptal Et</button>` : ""}</div></div>`).join("");
}
window.setRequestFilter = function(status) { state.requestFilter = status; renderStockRequests(); };
function clearProductForm() { [el.productId, el.barcode, el.productBrand, el.category, el.carBrand, el.carModel, el.carType, el.vehicleYear, el.stock, el.minStock, el.location, el.productImage, el.note].filter(Boolean).forEach((x) => x.value = ""); }
function fillProductForm(product) { el.productId.value = product.id || ""; el.barcode.value = product.barcode || ""; el.productBrand.value = product.productBrand || ""; el.category.value = product.category || ""; el.carBrand.value = product.carBrand || ""; el.carModel.value = product.carModel || ""; el.carType.value = product.carType || ""; el.vehicleYear.value = product.vehicleYear || ""; el.stock.value = product.stock ?? ""; el.minStock.value = product.minStock ?? ""; el.location.value = product.location || ""; if (el.productImage) el.productImage.value = product.imageUrl || ""; el.note.value = product.note || ""; switchTab("add"); window.scrollTo({ top: 0, behavior: "smooth" }); }
window.editProduct = function(id) { if (!requireRoleAction(["admin", "depo"], "Ürün düzenleme yetkisi sadece Admin/Depo")) return; const product = state.products.find((p) => String(p.id) === String(id)); if (!product) return showToast("Ürün bulunamadı", true); fillProductForm(product); };
window.deleteProduct = async function(id) { if (!requireRoleAction(["admin"], "Ürün silme yetkisi sadece Admin")) return; const product = state.products.find((p) => String(p.id) === String(id)); if (!(await appConfirm("Bu ürünü silmek istediğine emin misin?", { danger: true, okText: "Sil" }))) return; try { setLoading(true); const { error } = await supabaseClient.from("stock_products").delete().eq("id", id); if (error) throw error; await logActivity("product_delete", `Ürün silindi: ${product?.name || id}`, "stock_products", id); showToast("Ürün silindi"); await loadAll(); } catch (err) { console.error(err); showToast(err.message || "Ürün silinemedi", true); } finally { setLoading(false); } };
window.quickStockAction = async function(id, type) { if (!requireRoleAction(["admin", "depo"], "Stok giriş/çıkış yetkisi sadece Admin/Depo")) return;
  const product = state.products.find((p) => String(p.id) === String(id)); if (!product) return showToast("Ürün bulunamadı", true);
  const qtyText = prompt(`${product.category || product.name} için ${type === "giris" ? "giriş" : "çıkış"} miktarı gir:`, "1"); if (qtyText === null) return;
  const quantity = Number(qtyText); if (!quantity || quantity <= 0) return showToast("Geçerli miktar gir", true);
  const available = Number(product.stock || 0) - Number(product.reserved || 0); if (type === "cikis" && available < quantity) return showToast(`Yeterli kullanılabilir stok yok. Kullanılabilir: ${available}`, true);
  if (!(await appConfirm(`${product.category || product.name} için ${quantity} adet ${type === "giris" ? "giriş" : "çıkış"} yapılsın mı?`, { okText: "İşlemi Yap" }))) return;
  try { setLoading(true); const newQty = type === "giris" ? Number(product.stock) + quantity : Number(product.stock) - quantity; const { error: updateError } = await supabaseClient.from("stock_products").update({ quantity: newQty }).eq("id", id); if (updateError) throw updateError; const { error: movementError } = await supabaseClient.from("stock_movements").insert({ product_id: id, movement_type: type, quantity, description: `Manuel ${type === "giris" ? "stok giriş" : "stok çıkış"}${actorSuffix()}` }); if (movementError) throw movementError; if (type === "cikis") { const minStock = Number(product.minStock || 0); const willAvailable = newQty - Number(product.reserved || 0); if (willAvailable <= minStock) { await createNotification({ title: "Kritik stok uyarısı", message: `${product.name || product.category || "Ürün"} kritik seviyede. Kullanılabilir: ${willAvailable}, Min: ${minStock}`, type: "critical_stock", target_role: "depo", source_table: "stock_products", source_id: id }); } } showToast("Hareket kaydedildi"); await loadAll(); renderMovementSearchResults(); } catch (err) { console.error(err); showToast(err.message || "Hareket kaydedilemedi", true); } finally { setLoading(false); }
};

function formatSaleMoney(value) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

function saleAvailable(product) {
  return Number(product?.stock || 0) - Number(product?.reserved || 0);
}

function isSameTurkeyDate(value, date = new Date()) {
  if (!value) return false;
  const tr = new Date(value).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" });
  const now = date.toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" });
  return tr === now;
}

function parseSaleMovement(m) {
  const desc = String(m.description || "");
  const movementType = String(m.movement_type || "").toLowerCase();
  const isRefund = movementType === "hizli_satis_iade" || desc.toLocaleLowerCase("tr-TR").includes("hızlı satış iade");
  const isSale = movementType === "hizli_satis" || isRefund || desc.toLocaleLowerCase("tr-TR").includes("hızlı satış");
  if (!isSale) return null;

  const paymentMatch = desc.match(/Hızlı satış \((.*?)\)/i);
  const totalMatch = desc.match(/Toplam:\s*([^\-]+)/i);
  const unitMatch = desc.match(/Birim:\s*([^\-]+)/i);
  const qty = Number(m.quantity || 0);

  const parseMoney = (txt) => {
    const cleaned = String(txt || "")
      .replace(/[^0-9,\.]/g, "")
      .replace(/\./g, "")
      .replace(",", ".");
    return Number(cleaned || 0);
  };

  const total = totalMatch ? parseMoney(totalMatch[1]) : (unitMatch ? parseMoney(unitMatch[1]) * qty : 0);

  return {
    paymentType: paymentMatch ? paymentMatch[1].trim() : "Bilinmiyor",
    total: isRefund ? -Math.abs(total) : total,
    qty: isRefund ? -Math.abs(qty) : qty,
    productName: m.stock_products?.product_name || m.description || "Ürün",
    isRefund
  };
}

function todaySaleStats() {
  const todays = (state.movements || [])
    .filter(m => isSameTurkeyDate(m.created_at))
    .map(parseSaleMovement)
    .filter(Boolean);

  const stats = {
    total: 0,
    qty: 0,
    cash: 0,
    card: 0,
    partial: 0,
    none: 0,
    top: new Map()
  };

  todays.forEach(s => {
    stats.total += Number(s.total || 0);
    stats.qty += Number(s.qty || 0);
    const p = String(s.paymentType || "").toLocaleLowerCase("tr-TR");
    if (p.includes("nakit")) stats.cash += Number(s.total || 0);
    else if (p.includes("kart")) stats.card += Number(s.total || 0);
    else if (p.includes("kısmi") || p.includes("kismi")) stats.partial += Number(s.total || 0);
    else stats.none += Number(s.total || 0);

    const key = s.productName || "Ürün";
    const old = stats.top.get(key) || { name: key, qty: 0, total: 0 };
    old.qty += Number(s.qty || 0);
    old.total += Number(s.total || 0);
    stats.top.set(key, old);
  });

  return stats;
}

function renderSaleDashboard() {
  const stats = todaySaleStats();
  if (el.todaySaleTotal) el.todaySaleTotal.textContent = formatSaleMoney(stats.total);
  if (el.todaySaleQty) el.todaySaleQty.textContent = String(stats.qty || 0);
  if (el.todayCashTotal) el.todayCashTotal.textContent = formatSaleMoney(stats.cash);
  if (el.todayCardTotal) el.todayCardTotal.textContent = formatSaleMoney(stats.card);

  if (el.topSaleProducts) {
    const top = [...stats.top.values()].sort((a, b) => b.qty - a.qty || b.total - a.total).slice(0, 5);
    el.topSaleProducts.innerHTML = top.length ? top.map((item, index) => `
      <div class="top-sale-item">
        <span>${index + 1}</span>
        <div><strong>${escapeHtml(item.name)}</strong><small>${item.qty} adet · ${formatSaleMoney(item.total)}</small></div>
      </div>
    `).join("") : `<div class="empty-state">Henüz hızlı satış yok</div>`;
  }
}



const STAFF_STORE_KEY = "garage_staff_list_v1";
const CURRENT_STAFF_STORE_KEY = "garage_current_staff_v1";
const DEFAULT_STAFF_LIST = [
  { name: "Admin", role: "admin", password: "0000" },
  { name: "Kasa", role: "kasa", password: "1111" },
  { name: "Satış", role: "satis", password: "4444" },
  { name: "Depo", role: "depo", password: "2222" },
  { name: "Usta", role: "usta", password: "3333" }
];

function normalizeStaffName(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeStaffPassword(value, fallback = "1234") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function roleLabel(role) {
  return ({ admin: "Admin", kasa: "Kasa", depo: "Depo", satis: "Satış", usta: "Usta" })[role] || "Personel";
}

function defaultPasswordForRole(role) {
  const found = DEFAULT_STAFF_LIST.find(s => s.role === role);
  return found?.password || "1234";
}

function normalizeStaffItem(item) {
  const role = String(item?.role || "kasa");
  return {
    name: normalizeStaffName(item?.name),
    role,
    password: normalizeStaffPassword(item?.password, defaultPasswordForRole(role))
  };
}

function readStaffList() {
  try {
    const raw = localStorage.getItem(STAFF_STORE_KEY);
    if (!raw) return DEFAULT_STAFF_LIST.map(normalizeStaffItem);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_STAFF_LIST.map(normalizeStaffItem);
    const cleaned = parsed
      .map(normalizeStaffItem)
      .filter(item => item.name)
      .slice(0, 30);
    return cleaned.length ? cleaned : DEFAULT_STAFF_LIST.map(normalizeStaffItem);
  } catch {
    return DEFAULT_STAFF_LIST.map(normalizeStaffItem);
  }
}

function cleanStaffList(list) {
  const cleaned = (list || [])
    .map(normalizeStaffItem)
    .filter(item => item.name)
    .filter((item, index, arr) => arr.findIndex(x => x.name.toLocaleLowerCase("tr-TR") === item.name.toLocaleLowerCase("tr-TR")) === index)
    .slice(0, 30);
  return cleaned.length ? cleaned : DEFAULT_STAFF_LIST.map(normalizeStaffItem);
}
function writeStaffList(list) {
  const cleaned = cleanStaffList(list);
  localStorage.setItem(STAFF_STORE_KEY, JSON.stringify(cleaned));
  saveStaffListToSupabase(cleaned).catch(() => {});
  return cleaned;
}
async function loadStaffListFromSupabase() {
  try {
    const { data, error } = await supabaseClient
      .from("app_users")
      .select("name, role, password, is_active")
      .eq("is_active", true)
      .order("name", { ascending: true });
    if (error) throw error;
    if (Array.isArray(data) && data.length) {
      const mapped = data.map(row => ({ name: row.name, role: row.role, password: row.password }));
      localStorage.setItem(STAFF_STORE_KEY, JSON.stringify(cleanStaffList(mapped)));
    } else {
      await saveStaffListToSupabase(readStaffList());
    }
  } catch (err) {
    console.warn("Personel Supabase'den alınamadı, local devam:", err?.message || err);
  }
}
async function saveStaffListToSupabase(list) {
  try {
    const rows = cleanStaffList(list).map(item => ({ name: item.name, role: item.role, password: item.password, is_active: true, updated_at: new Date().toISOString() }));
    const { error } = await supabaseClient.from("app_users").upsert(rows, { onConflict: "name" });
    if (error) throw error;
  } catch (err) {
    console.warn("Personel Supabase'e yazılamadı:", err?.message || err);
  }
}

function currentStaffName() {
  const saved = localStorage.getItem(CURRENT_STAFF_STORE_KEY);
  const staff = readStaffList();
  if (saved && staff.some(s => s.name === saved)) return saved;

  const cashier = staff.find(s => s.role === "kasa");
  return cashier?.name || staff[0]?.name || "Kasa";
}

function currentStaff() {
  const name = currentStaffName();
  return readStaffList().find(s => s.name === name) || { name, role: "kasa", password: "1111" };
}

function adminStaff() {
  return readStaffList().find(s => s.role === "admin") || DEFAULT_STAFF_LIST[0];
}

function verifyStaffPassword(targetName) {
  const staff = readStaffList();
  const target = staff.find(s => s.name === targetName);
  if (!target) {
    showToast("Personel bulunamadı", true);
    return false;
  }

  const admin = adminStaff();
  const entered = prompt(`${target.name} hesabına geçmek için şifre gir:\n(Admin şifresi de geçerlidir.)`);

  if (entered === null) return false;

  const pass = String(entered || "").trim();
  const targetPass = normalizeStaffPassword(target.password, defaultPasswordForRole(target.role));
  const adminPass = normalizeStaffPassword(admin.password, "0000");

  if (pass === targetPass || pass === adminPass) return true;

  showToast("Personel şifresi hatalı", true);
  return false;
}

function verifyAdminPassword() {
  const admin = adminStaff();
  const entered = prompt("Bu işlem için Admin şifresi gerekli:");
  if (entered === null) return false;

  if (String(entered || "").trim() === normalizeStaffPassword(admin.password, "0000")) return true;

  showToast("Admin şifresi hatalı", true);
  return false;
}

function renderStaffSelector() {
  if (!el.currentStaffSelect) return;
  const staff = readStaffList();
  const current = currentStaffName();
  el.currentStaffSelect.innerHTML = staff.map(s => `<option value="${escapeHtml(s.name)}" ${s.name === current ? "selected" : ""}>${escapeHtml(s.name)}</option>`).join("");
  const active = currentStaff();
  if (el.staffRoleBadge) el.staffRoleBadge.textContent = roleLabel(active.role);
  updateUserPill();
  applyRoleVisibility();
  renderUsersList();
}

window.setCurrentStaff = function(name) {
  if (!name) return;

  const current = currentStaffName();
  if (name === current) {
    renderStaffSelector();
    return;
  }

  if (!verifyStaffPassword(name)) {
    renderStaffSelector();
    return;
  }

  localStorage.setItem(CURRENT_STAFF_STORE_KEY, name);
  renderStaffSelector();
  showToast(`Aktif personel: ${name} ✅`);
};

function staffEditorRow(item = { name: "", role: "kasa", password: "" }) {
  return `
    <div class="staff-editor-row" data-staff-row>
      <input data-staff-name value="${escapeHtml(item.name || "")}" placeholder="Personel adı" />
      <select data-staff-role>
        <option value="admin" ${item.role === "admin" ? "selected" : ""}>Admin</option>
        <option value="kasa" ${item.role === "kasa" ? "selected" : ""}>Kasa</option>
        <option value="satis" ${item.role === "satis" ? "selected" : ""}>Satış</option>
        <option value="depo" ${item.role === "depo" ? "selected" : ""}>Depo</option>
        <option value="usta" ${item.role === "usta" ? "selected" : ""}>Usta</option>
      </select>
      <input data-staff-password type="password" value="${escapeHtml(item.password || "")}" placeholder="Şifre" />
      <button type="button" class="btn danger" onclick="this.closest('[data-staff-row]').remove()">Sil</button>
    </div>`;
}

window.openStaffEditor = function() {
  if (!requireRoleAction(["admin"], "Personel yönetimi sadece Admin")) return;
  if (!el.staffEditor || !el.staffEditorBody) return;
  if (!verifyAdminPassword()) return;

  el.staffEditorBody.innerHTML = readStaffList().map(staffEditorRow).join("");
  el.staffEditor.classList.remove("hidden");
};

window.closeStaffEditor = function() {
  if (el.staffEditor) el.staffEditor.classList.add("hidden");
};

window.addStaffEditorRow = function() {
  if (!el.staffEditorBody) return;
  el.staffEditorBody.insertAdjacentHTML("beforeend", staffEditorRow({ name: "", role: "kasa", password: "" }));
};

window.saveStaffEditor = async function() {
  if (!el.staffEditorBody) return;
  const rows = [...el.staffEditorBody.querySelectorAll("[data-staff-row]")];
  const staff = rows.map(row => {
    const role = row.querySelector("[data-staff-role]")?.value || "kasa";
    return {
      name: normalizeStaffName(row.querySelector("[data-staff-name]")?.value),
      role,
      password: normalizeStaffPassword(row.querySelector("[data-staff-password]")?.value, defaultPasswordForRole(role))
    };
  }).filter(x => x.name);
  const saved = writeStaffList(staff);
  await saveStaffListToSupabase(saved);
  if (!saved.some(s => s.name === currentStaffName())) localStorage.setItem(CURRENT_STAFF_STORE_KEY, saved.find(s => s.role === "kasa")?.name || saved[0]?.name || "Kasa");
  renderStaffSelector();
  closeStaffEditor();
  showToast("Personel listesi ve şifreler kaydedildi ✅");
};

window.resetStaffEditor = async function() {
  if (!(await appConfirm("Personel listesi ve şifreler varsayılana dönsün mü?", { danger: true }))) return;
  localStorage.removeItem(STAFF_STORE_KEY);
  localStorage.removeItem(CURRENT_STAFF_STORE_KEY);
  await saveStaffListToSupabase(DEFAULT_STAFF_LIST);
  if (el.staffEditorBody) el.staffEditorBody.innerHTML = readStaffList().map(staffEditorRow).join("");
  renderStaffSelector();
  showToast("Personel listesi ve şifreler varsayılana döndü ✅");
};

const SALE_FAVORITES_STORE_KEY = "garage_sale_favorites_v1";
const DEFAULT_SALE_FAVORITES = [
  "Paspas",
  "Bagaj Havuzu",
  "Cam Rüzgarlığı",
  "LED",
  "Xenon",
  "Sensör"
];

function normalizeFavoriteLine(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function readSaleFavorites() {
  try {
    const raw = localStorage.getItem(SALE_FAVORITES_STORE_KEY);
    if (!raw) return [...DEFAULT_SALE_FAVORITES];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...DEFAULT_SALE_FAVORITES];

    const cleaned = parsed
      .map(normalizeFavoriteLine)
      .filter(Boolean)
      .slice(0, 20);

    return cleaned.length ? cleaned : [...DEFAULT_SALE_FAVORITES];
  } catch {
    return [...DEFAULT_SALE_FAVORITES];
  }
}

function writeSaleFavorites(list) {
  const cleaned = (list || [])
    .map(normalizeFavoriteLine)
    .filter(Boolean)
    .filter((value, index, arr) => arr.findIndex(x => x.toLocaleLowerCase("tr-TR") === value.toLocaleLowerCase("tr-TR")) === index)
    .slice(0, 20);

  localStorage.setItem(SALE_FAVORITES_STORE_KEY, JSON.stringify(cleaned.length ? cleaned : DEFAULT_SALE_FAVORITES));
  return cleaned.length ? cleaned : [...DEFAULT_SALE_FAVORITES];
}

function renderSaleFavorites() {
  const box = document.getElementById("saleFavoriteButtons");
  if (!box) return;

  const favorites = readSaleFavorites();

  box.innerHTML = favorites.map((name) => `
    <button type="button" onclick="setSaleFavoriteSearch(decodeURIComponent('${encodeURIComponent(name)}'))">${escapeHtml(name)}</button>
  `).join("");
}

window.openSaleFavoritesEditor = function() {
  const editor = document.getElementById("saleFavoriteEditor");
  const textarea = document.getElementById("saleFavoriteTextarea");
  if (!editor || !textarea) return;

  textarea.value = readSaleFavorites().join("\n");
  editor.classList.remove("hidden");
  setTimeout(() => textarea.focus(), 50);
};

window.closeSaleFavoritesEditor = function() {
  const editor = document.getElementById("saleFavoriteEditor");
  if (editor) editor.classList.add("hidden");
};

window.saveSaleFavoritesFromEditor = function() {
  const textarea = document.getElementById("saleFavoriteTextarea");
  if (!textarea) return;

  const favorites = textarea.value
    .split(/\n|,/)
    .map(normalizeFavoriteLine)
    .filter(Boolean);

  writeSaleFavorites(favorites);
  renderSaleFavorites();
  closeSaleFavoritesEditor();
  showToast("Favori butonlar kaydedildi ✅");
};

window.resetSaleFavorites = function() {
  localStorage.removeItem(SALE_FAVORITES_STORE_KEY);
  renderSaleFavorites();

  const textarea = document.getElementById("saleFavoriteTextarea");
  if (textarea) textarea.value = DEFAULT_SALE_FAVORITES.join("\n");

  showToast("Favoriler varsayılana döndü ✅");
};

window.setSaleFavoriteSearch = function(keyword) {
  if (!el.saleSearchInput) return;
  el.saleSearchInput.value = keyword;
  renderSaleProducts();
  el.saleSearchInput.focus();
};

function findExactBarcodeProduct(value) {
  const q = String(value || "").trim();
  if (q.length < 4) return null;
  return state.products.find(p => String(p.barcode || "").trim() === q) || null;
}

function handleSaleSearchInput() {
  const value = el.saleSearchInput?.value || "";
  const exact = findExactBarcodeProduct(value);
  if (exact) {
    addToSaleCart(exact.id, { silent: true });
    el.saleSearchInput.value = "";
    renderSaleProducts();
    showToast("Barkod ile sepete eklendi ✅");
    return;
  }
  renderSaleProducts();
}

function renderSaleProducts() {
  if (!el.saleProductList) return;

  const q = normalizeText(el.saleSearchInput?.value || "");
  if (!q) {
    el.saleProductList.innerHTML = `<div class="empty-state">Satışa ürün eklemek için arama yap</div>`;
    return;
  }

  const results = state.products
    .filter((p) => productSearchText(p).includes(q) || normalizeText(p.barcode).includes(q))
    .slice(0, 40);

  if (!results.length) {
    el.saleProductList.innerHTML = `<div class="empty-state">Eşleşen ürün bulunamadı</div>`;
    return;
  }

  el.saleProductList.innerHTML = results.map((p) => {
    const available = saleAvailable(p);
    return `
      <div class="sale-product-item">
        <div>
          <div class="sale-product-title">${escapeHtml(p.category || p.name || "-")}</div>
          <div class="sale-product-meta">
            ${escapeHtml(p.productBrand || "-")} / ${escapeHtml(p.carBrand || "-")} ${escapeHtml(p.carModel || "-")} ${escapeHtml(p.carType || "")} ${escapeHtml(p.vehicleYear || "")}<br>
            Barkod: ${escapeHtml(p.barcode || "-")} · Raf: ${escapeHtml(p.location || "-")} · Kullanılabilir: <strong class="${available <= 0 ? "stock-warning" : ""}">${available}</strong>
          </div>
        </div>
        <div class="sale-product-actions">
          <button class="btn primary" onclick="addToSaleCart('${p.id}')" ${available <= 0 ? "disabled" : ""}>Sepete Ekle</button>
        </div>
      </div>
    `;
  }).join("");
}

window.addToSaleCart = function(productId, options = {}) {
  const product = state.products.find((p) => String(p.id) === String(productId));
  if (!product) return showToast("Ürün bulunamadı", true);

  const available = saleAvailable(product);
  if (available <= 0) return showToast("Bu üründe kullanılabilir stok yok", true);

  const existing = state.saleCart.find((item) => String(item.productId) === String(productId));
  if (existing) {
    if (Number(existing.qty || 0) + 1 > available) return showToast(`Yeterli stok yok. Kullanılabilir: ${available}`, true);
    existing.qty = Number(existing.qty || 0) + 1;
  } else {
    state.saleCart.push({
      productId: product.id,
      name: product.category || product.name || "Ürün",
      detail: [product.productBrand, product.carBrand, product.carModel, product.carType, product.vehicleYear].filter(Boolean).join(" "),
      qty: 1,
      price: ""
    });
  }

  renderSaleCart();
  if (!options.silent) showToast("Ürün sepete eklendi ✅");
};

window.updateSaleCartItem = function(productId, key, value) {
  const item = state.saleCart.find((x) => String(x.productId) === String(productId));
  if (!item) return;

  if (key === "qty") {
    const product = state.products.find((p) => String(p.id) === String(productId));
    const available = saleAvailable(product);
    const qty = Math.max(1, Math.floor(Number(value || 1)));
    item.qty = Math.min(qty, available || qty);
  }

  if (key === "price") {
    item.price = String(value || "").replace(",", ".");
  }

  // Input yazarken sepeti komple render etme; render odak kaçırıyor.
  updateSaleTotalDisplay();
};

window.removeSaleCartItem = function(productId) {
  state.saleCart = state.saleCart.filter((x) => String(x.productId) !== String(productId));
  renderSaleCart();
};

function saleCartTotal() {
  return state.saleCart.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.price || 0)), 0);
}

function updateSaleTotalDisplay() {
  if (el.saleTotal) {
    el.saleTotal.textContent = formatSaleMoney(saleCartTotal());
  }
}

function renderSaleCart() {
  if (!el.saleCartList) return;

  if (!state.saleCart.length) {
    el.saleCartList.innerHTML = `<div class="empty-state">Sepet boş</div>`;
    if (el.saleTotal) el.saleTotal.textContent = formatSaleMoney(0);
    return;
  }

  el.saleCartList.innerHTML = state.saleCart.map((item) => `
    <div class="sale-cart-item">
      <div>
        <div class="sale-cart-title">${escapeHtml(item.name)}</div>
        <div class="sale-cart-meta">${escapeHtml(item.detail || "-")}</div>
      </div>
      <div class="sale-cart-actions">
        <input type="number" min="1" step="1" value="${Number(item.qty || 1)}" oninput="updateSaleCartItem('${item.productId}', 'qty', this.value)" />
        <input type="number" min="0" step="0.01" placeholder="Fiyat" value="${escapeHtml(item.price)}" oninput="updateSaleCartItem('${item.productId}', 'price', this.value)" />
        <button class="btn danger" onclick="removeSaleCartItem('${item.productId}')">Sil</button>
      </div>
    </div>
  `).join("");

  if (el.saleTotal) el.saleTotal.textContent = formatSaleMoney(saleCartTotal());
}

window.clearSaleCart = function() {
  state.saleCart = [];
  if (el.saleCustomerNote) el.saleCustomerNote.value = "";
  renderSaleCart();
};

const LAST_QUICK_SALE_STORE_KEY = "garage_last_quick_sale_v1";

function saveLastQuickSale(sale) {
  state.lastQuickSale = sale || null;

  try {
    if (sale) localStorage.setItem(LAST_QUICK_SALE_STORE_KEY, JSON.stringify(sale));
    else localStorage.removeItem(LAST_QUICK_SALE_STORE_KEY);
  } catch (e) {
    console.warn("Son satış hafızaya alınamadı:", e);
  }

  updateLastSaleButtons();
}

function loadLastQuickSale() {
  try {
    const raw = localStorage.getItem(LAST_QUICK_SALE_STORE_KEY);
    state.lastQuickSale = raw ? JSON.parse(raw) : null;
  } catch {
    state.lastQuickSale = null;
  }
  updateLastSaleButtons();
}

function updateLastSaleButtons() {
  const hasSale = !!(state.lastQuickSale && state.lastQuickSale.items && state.lastQuickSale.items.length);
  const isCancelled = !!state.lastQuickSale?.cancelledAt;

  if (el.printLastSaleBtn) el.printLastSaleBtn.disabled = !hasSale;
  if (el.cancelLastSaleBtn) {
    el.cancelLastSaleBtn.disabled = !hasSale || isCancelled;
    el.cancelLastSaleBtn.textContent = isCancelled ? "Son Satış İptal Edildi" : "Son Satışı İptal Et";
  }
}


function buildQuickSaleSnapshot() {
  const staff = currentStaff();
  return {
    saleNo: "HS-" + Date.now().toString().slice(-8),
    createdAt: new Date().toISOString(),
    staffName: staff.name,
    staffRole: roleLabel(staff.role),
    paymentType: el.salePaymentType?.value || "Nakit",
    note: String(el.saleCustomerNote?.value || "").trim(),
    total: saleCartTotal(),
    items: state.saleCart.map(item => ({
      productId: item.productId,
      name: item.name,
      detail: item.detail,
      qty: Number(item.qty || 0),
      price: Number(item.price || 0),
      lineTotal: Number(item.qty || 0) * Number(item.price || 0)
    }))
  };
}

function printQuickSaleReceipt(sale = state.lastQuickSale) {
  if (!sale || !sale.items?.length) return showToast("Yazdırılacak satış fişi yok", true);

  const itemsHtml = sale.items.map(item => `
    <tr>
      <td>
        <strong>${escapeHtml(item.name || "Ürün")}</strong>
        <small>${escapeHtml(item.detail || "")}</small>
      </td>
      <td>${Number(item.qty || 0)}</td>
      <td>${formatSaleMoney(item.price)}</td>
      <td>${formatSaleMoney(item.lineTotal)}</td>
    </tr>
  `).join("");

  const win = window.open("", "_blank", "width=420,height=720");
  if (!win) return showToast("Fiş penceresi açılamadı. Popup iznini kontrol et.", true);

  win.document.write(`
    <html>
      <head>
        <title>Hızlı Satış Fişi - ${escapeHtml(sale.saleNo)}</title>
        <style>
          @page { size: A5 portrait; margin: 6mm; }
          body { margin:0; font-family: Arial, sans-serif; color:#111; background:#fff; font-size:11px; }
          .page { padding:6mm; }
          .head { text-align:center; border-bottom:1px solid #ddd; padding-bottom:8px; margin-bottom:8px; }
          .head img { max-width:110px; max-height:64px; object-fit:contain; margin-bottom:4px; }
          h1 { font-size:16px; margin:3px 0; }
          .muted { color:#666; font-size:10px; }
          .info { display:grid; grid-template-columns:1fr 1fr; gap:5px; margin:8px 0; }
          .box { border:1px solid #ddd; border-radius:8px; padding:6px; }
          table { width:100%; border-collapse:collapse; margin-top:8px; }
          th,td { border-bottom:1px dashed #ddd; padding:5px 3px; text-align:left; vertical-align:top; }
          th:nth-child(2),td:nth-child(2){ text-align:center; width:34px; }
          th:nth-child(3),th:nth-child(4),td:nth-child(3),td:nth-child(4){ text-align:right; white-space:nowrap; }
          small { display:block; color:#666; margin-top:2px; }
          .total { display:flex; justify-content:space-between; align-items:center; margin-top:10px; padding:8px; border-radius:8px; background:#f3f4f6; font-size:14px; font-weight:800; }
          .foot { margin-top:12px; text-align:center; color:#666; font-size:10px; }
          .print { margin:8px; padding:10px 14px; border:0; border-radius:10px; background:#111; color:#fff; font-weight:700; cursor:pointer; }
          @media print { .print { display:none; } }
        </style>
      </head>
      <body>
        <button class="print" onclick="window.print()">Yazdır</button>
        <div class="page">
          <div class="head">
            <img src="/logo.png" onerror="this.style.display='none'" />
            <h1>Garage İstanbul</h1>
            <div class="muted">Hızlı Satış Fişi</div>
          </div>
          <div class="info">
            <div class="box"><b>Fiş No</b><br>${escapeHtml(sale.saleNo)}</div>
            <div class="box"><b>Tarih</b><br>${formatDate(sale.createdAt)}</div>
            <div class="box"><b>Personel</b><br>${escapeHtml(sale.staffName || "-")} (${escapeHtml(sale.staffRole || "-")})</div>
            <div class="box"><b>Ödeme</b><br>${escapeHtml(sale.paymentType || "-")}</div>
          </div>
          <table>
            <thead><tr><th>Ürün</th><th>Ad.</th><th>Birim</th><th>Tutar</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div class="total"><span>TOPLAM</span><span>${formatSaleMoney(sale.total)}</span></div>
          ${sale.note ? `<div class="box" style="margin-top:8px"><b>Not</b><br>${escapeHtml(sale.note)}</div>` : ""}
          <div class="foot">Teşekkür ederiz · Powered By GPT & SchEAx</div>
        </div>
      </body>
    </html>
  `);
  win.document.close();
  setTimeout(() => { try { win.focus(); } catch {} }, 250);
}

window.printLastQuickSale = function() {
  printQuickSaleReceipt(state.lastQuickSale);
};

window.cancelLastQuickSale = async function() {
  const sale = state.lastQuickSale;
  if (!sale || !sale.items?.length) return showToast("İptal edilecek son satış yok", true);
  if (sale.cancelledAt) return showToast("Bu satış zaten iptal edilmiş", true);

  const reason = prompt(`Son satış iptal edilecek.
Fiş: ${sale.saleNo}
Toplam: ${formatSaleMoney(sale.total)}

İade/iptal nedeni:`, "Müşteri iadesi");
  if (reason === null) return;

  if (!(await appConfirm(`${sale.saleNo} numaralı satış iptal edilsin mi?
Stoklar geri eklenecek ve cirodan düşülecek.`, { danger: true, okText: "Satışı İptal Et" }))) return;

  try {
    setLoading(true);
    const staff = currentStaff();

    for (const item of sale.items) {
      const product = state.products.find((p) => String(p.id) === String(item.productId));
      const currentQty = Number(product?.stock || 0);
      const newQty = currentQty + Number(item.qty || 0);

      const { error: updateError } = await supabaseClient
        .from("stock_products")
        .update({ quantity: newQty })
        .eq("id", item.productId);

      if (updateError) throw updateError;

      const desc = `Hızlı satış iade (${sale.paymentType || "-"}) - Personel: ${staff.name} (${roleLabel(staff.role)}) - İptal Fiş: ${sale.saleNo} - Birim: ${formatSaleMoney(item.price)} - Toplam: ${formatSaleMoney(item.lineTotal)} - Neden: ${reason || "-"}`;

      const { error: movementError } = await supabaseClient
        .from("stock_movements")
        .insert({
          product_id: item.productId,
          movement_type: "hizli_satis_iade",
          quantity: Number(item.qty || 0),
          description: desc
        });

      if (movementError) throw movementError;
    }

    saveLastQuickSale({
      ...sale,
      cancelledAt: new Date().toISOString(),
      cancelReason: reason || "-",
      cancelledBy: staff.name
    });

    showToast("Satış iptal edildi, stoklar geri eklendi ✅");
    await loadAll();
    renderSaleProducts();
    renderSaleDashboard();
  } catch (err) {
    console.error("Satış iptal hatası:", err);
    showToast(err.message || "Satış iptal edilemedi", true);
  } finally {
    setLoading(false);
  }
};

async function completeQuickSale() {
  if (!state.saleCart.length) return showToast("Sepet boş", true);

  const missingPrice = state.saleCart.find((item) => Number(item.price || 0) <= 0);
  if (missingPrice) return showToast("Sepette fiyatı girilmeyen ürün var", true);

  for (const item of state.saleCart) {
    const product = state.products.find((p) => String(p.id) === String(item.productId));
    const available = saleAvailable(product);
    if (!product) return showToast(`${item.name} ürünü bulunamadı`, true);
    if (available < Number(item.qty || 0)) return showToast(`${item.name} için stok yetersiz. Kullanılabilir: ${available}`, true);
  }

  const saleSnapshot = buildQuickSaleSnapshot();
  const total = saleSnapshot.total;
  const paymentType = saleSnapshot.paymentType;
  const note = saleSnapshot.note;
  const staff = currentStaff();

  if (!(await appConfirm(`${state.saleCart.length} kalem satış tamamlanacak. Toplam: ${formatSaleMoney(total)}\nDevam edilsin mi?`, { okText: "Satışı Tamamla" }))) return;

  try {
    setLoading(true);

    for (const item of state.saleCart) {
      const product = state.products.find((p) => String(p.id) === String(item.productId));
      const newQty = Number(product.stock || 0) - Number(item.qty || 0);

      const { error: updateError } = await supabaseClient
        .from("stock_products")
        .update({ quantity: newQty })
        .eq("id", item.productId);

      if (updateError) throw updateError;

      const desc = `Hızlı satış (${paymentType}) - Personel: ${staff.name} (${roleLabel(staff.role)}) - Fiş: ${saleSnapshot.saleNo} - Birim: ${formatSaleMoney(item.price)} - Toplam: ${formatSaleMoney(Number(item.qty || 0) * Number(item.price || 0))}${note ? " - Not: " + note : ""}`;

      const { error: movementError } = await supabaseClient
        .from("stock_movements")
        .insert({
          product_id: item.productId,
          movement_type: "hizli_satis",
          quantity: Number(item.qty || 0),
          description: desc
        });

      if (movementError) throw movementError;
    }

    saveLastQuickSale(saleSnapshot);
    showToast(`Satış tamamlandı ✅ Toplam: ${formatSaleMoney(total)}`);
    const shouldPrint = await appConfirm("Satış tamamlandı. Fiş yazdırılsın mı?", { okText: "Fiş Yazdır", cancelText: "Kapat" });
    clearSaleCart();
    await loadAll();
    renderSaleProducts();
    renderSaleDashboard();
    if (shouldPrint) printQuickSaleReceipt(saleSnapshot);
  } catch (err) {
    console.error("Hızlı satış hatası:", err);
    showToast(err.message || "Satış tamamlanamadı", true);
  } finally {
    setLoading(false);
  }
}

window.openReservationPanel = function(requestId) {
  const req = state.stockRequests.find((r) => String(r.id) === String(requestId));
  if (!req) return showToast("Talep bulunamadı", true);

  state.selectedStockRequestId = requestId;
  el.reservationPanel.classList.remove("hidden");

  renderSelectedRequestDetail(req);

el.productSearchInput.value = req.requested_text || "";
searchProductsForRequest(req.requested_text || "", true);
};

function softText(value) {
  return String(value || "")
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function searchProductsForRequest(query = "", autoSuggest = false) {
  const selectedReq = state.stockRequests.find(
    r => String(r.id) === String(state.selectedStockRequestId)
  );

  const q = softText(query);

  const reqBrand = softText(selectedReq?.vehicle_brand);
  const reqModel = softText(selectedReq?.vehicle_model);
  const reqType = softText(selectedReq?.vehicle_type);
  const reqYear = softText(selectedReq?.vehicle_year);
  const reqText = softText(selectedReq?.requested_text);

  const searchSource = autoSuggest
    ? softText([reqText, reqBrand, reqModel, reqType, reqYear].filter(Boolean).join(" "))
    : q;

  if (!searchSource) {
    el.productMatchBox.innerHTML = `<div class="empty-state">Ürün aramak için yazmaya başla</div>`;
    return;
  }

  const words = searchSource
    .split(/\s+/)
    .filter(w => w.length >= 2)
    .map(w => w.replace(/ligi$|ligi$|lik$|ligi$|ligi$/g, ""));

  const results = state.products
    .map((p) => {
      const text = softText([
        p.name,
        p.productBrand,
        p.category,
        p.carBrand,
        p.carModel,
        p.carType,
        p.vehicleYear,
        p.location,
        p.note
      ].join(" "));

      let score = 0;

      words.forEach(w => {
        if (text.includes(w)) score += 2;
      });

      if (q && text.includes(q)) score += 8;

      if (reqBrand && softText(p.carBrand).includes(reqBrand)) score += 30;
      if (reqModel && softText(p.carModel).includes(reqModel)) score += 25;
      if (reqType && softText(p.carType).includes(reqType)) score += 15;
      if (reqYear && softText(p.vehicleYear).includes(reqYear)) score += 6;

      return { p, score };
    })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 25)
    .map(x => x.p);

  if (!results.length) {
    el.productMatchBox.innerHTML = `<div class="empty-state">Eşleşen ürün bulunamadı</div>`;
    return;
  }

  el.productMatchBox.innerHTML = results.map((p) => {
    const available = Number(p.stock || 0) - Number(p.reserved || 0);

    return `
      <div class="movement-search-item">
        <div class="movement-search-info">
          <strong>${escapeHtml(p.category || p.name || "-")}</strong>
          <div class="muted">
            ${escapeHtml(p.productBrand || "-")} /
            ${escapeHtml(p.carBrand || "-")}
            ${escapeHtml(p.carModel || "-")}
            ${escapeHtml(p.carType || "-")}
            ${escapeHtml(p.vehicleYear || "")}
          </div>
          <div class="muted">
            Stok: ${p.stock} | Rezerve: ${p.reserved} | Kullanılabilir:
            <strong class="${available <= 0 ? "stock-warning" : ""}">${available}</strong>
          </div>
        </div>

        <div class="movement-search-actions">
          <input id="qty_${p.id}" type="number" value="1" min="1" style="max-width:90px" />
          <button
            class="btn primary"
            onclick="reserveProductForRequest('${p.id}')"
            ${available <= 0 ? "disabled" : ""}
          >
            ${available <= 0 ? "Stok Yok" : "Rezerve Et"}
          </button>
        </div>
      </div>
    `;
  }).join("");
}


window.reserveProductForRequest = async function(productId) { if (!requireRoleAction(["admin", "depo"], "Rezervasyon yetkisi sadece Admin/Depo")) return;
  if (!state.selectedStockRequestId) return showToast("Talep seçilmedi", true); const quantity = Number(document.getElementById("qty_" + productId)?.value || 1); if (!quantity || quantity <= 0) return showToast("Geçerli adet gir", true);
  try { setLoading(true); const { error } = await supabaseClient.rpc("reserve_stock_for_request", { p_request_id: state.selectedStockRequestId, p_product_id: productId, p_quantity: quantity, p_delivered_to: "" }); if (error) throw error; showToast("Stok rezerve edildi ✅ Yeni ürün ekleyebilirsin."); await loadAll(); const stillSelected = state.stockRequests.find(r => String(r.id) === String(state.selectedStockRequestId)); if (stillSelected) { el.reservationPanel.classList.remove("hidden"); renderSelectedRequestDetail(stillSelected); searchProductsForRequest(el.productSearchInput.value); } } catch (err) { console.error(err); showToast(err.message || "Rezerve edilemedi", true); } finally { setLoading(false); }
};
window.cancelReservation = async function(requestId) { if (!requireRoleAction(["admin", "depo"], "Rezerv iptali yetkisi sadece Admin/Depo")) return; if (!(await appConfirm("Bu rezervi iptal etmek istediğine emin misin?", { danger: true, okText: "Rezervi İptal Et" }))) return; try { setLoading(true); const { error } = await supabaseClient.rpc("cancel_stock_reservation", { p_request_id: requestId }); if (error) throw error; showToast("Rezerv iptal edildi ✅"); await loadAll(); } catch (err) { console.error(err); showToast(err.message || "Rezerv iptal edilemedi", true); } finally { setLoading(false); } };
function switchTab(tab) {
  const staff = currentStaff();
  if (!canAccessTab(tab, staff.role)) {
    showToast(`${roleLabel(staff.role)} yetkisi bu sayfayı açamaz`, true);
    tab = ROLE_DEFAULT_TAB[staff.role] || "requests";
  }
  state.activeTab = tab;
  ["search", "add", "requests", "operation", "movements", "sale", "reports", "critical", "notifications", "history", "users"].forEach((key) => {
    const page = document.getElementById("page-" + key);
    const nav = document.getElementById("nav-" + key);
    if (page) page.classList.add("hidden");
    if (nav) nav.classList.remove("active");
  });
  const activePage = document.getElementById("page-" + tab);
  const activeNav = document.getElementById("nav-" + tab);
  if (activePage) activePage.classList.remove("hidden");
  if (activeNav) activeNav.classList.add("active");
  updateStaffMeta(staff.name, { lastSeenAt: new Date().toISOString(), role: staff.role });
  renderUsersList();
  if (tab === "requests") {
  state.newRequestCount = 0;
  updateNewRequestAlert();
  loadStockRequests();
}
if (tab === "operation") {
  refreshOperationFilters();
  renderOperationResults();
}
if (tab === "sale") {
  renderSaleFavorites();
  renderSaleProducts();
  renderSaleCart();
  renderSaleDashboard();
}
if (tab === "reports") renderReports();
if (tab === "critical") renderCriticalStock();
if (tab === "notifications") { loadNotifications(); }
if (tab === "history") renderPlateHistory();
if (tab === "users") { renderUsersList(); loadActivityLogs(); }
}
window.switchTab = switchTab;
function showUpdateNotice(newVersion) {
  if (document.getElementById("updateNotice")) return;

  const notice = document.createElement("div");
  notice.id = "updateNotice";
  notice.className = "update-notice";
  notice.innerHTML = `⚡ Yeni sürüm hazır <strong>${escapeHtml(newVersion || "")}</strong><span>Güncellemek için tıkla</span>`;

  notice.addEventListener("click", async () => {
    notice.innerHTML = "⚡ Güncelleniyor...";

    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
      }

      if (el.reportSearchInput) el.reportSearchInput.addEventListener("input", renderReports);
if (el.criticalSearchInput) el.criticalSearchInput.addEventListener("input", renderCriticalStock);
if (el.historySearchInput) el.historySearchInput.addEventListener("keydown", (e) => { if (e.key === "Enter") renderPlateHistory(); });
if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
      }

      localStorage.setItem("stok_app_version", String(newVersion || Date.now()));
    } catch (err) {
      console.warn("Güncelleme temizliği yapılamadı:", err);
    }

    window.location.reload(true);
  });

  document.body.appendChild(notice);
  showToast("Yeni sürüm mevcut ⚡ Sağ alttaki uyarıya tıkla.");
}

async function checkAppVersion() {
  try {
    const res = await fetch("./version.json?_=" + Date.now(), { cache: "no-store" });
    if (!res.ok) return;

    const data = await res.json();
    const remoteVersion = String(data.version || "").trim();
    if (!remoteVersion) return;

    const localVersion = localStorage.getItem("stok_app_version");

    if (!localVersion) {
      localStorage.setItem("stok_app_version", remoteVersion);
      return;
    }

    if (localVersion !== remoteVersion) {
      showUpdateNotice(remoteVersion);
    }
  } catch (err) {
    console.warn("Sürüm kontrolü yapılamadı:", err);
  }
}

function initUpdateChecker() {
  checkAppVersion();
  setInterval(checkAppVersion, 60 * 1000);
}

function playNotifySound() { try { const AudioContext = window.AudioContext || window.webkitAudioContext; const ctx = new AudioContext(); const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.type = "sine"; osc.frequency.value = 880; gain.gain.setValueAtTime(0.001, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.03); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45); osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.5); } catch (e) { console.warn("Ses çalınamadı", e); } }
async function requestNotificationPermission() { if (!("Notification" in window)) { showToast("Bu tarayıcı bildirim desteklemiyor", true); return; } const result = await Notification.requestPermission(); showToast(result === "granted" ? "Bildirim izni açıldı ✅" : "Bildirim izni verilmedi", result !== "granted"); }
async function notifyNewRequest(req) {
  state.newRequestCount += 1;
  state.highlightRequestIds.add(req.id);

  updateNewRequestAlert();
  playNotificationSound();

  const title = "Yeni depo talebi";
  const message = `Plaka: ${req.plate || "-"} · İstenen: ${req.requested_text || "-"}`;

  if (typeof showToast === "function") {
    showToast("Yeni depo talebi geldi ✅");
  }

  await createNotification({
    title,
    message,
    type: "stock_request",
    target_role: "depo",
    source_table: "stock_requests",
    source_id: req.id,
    silent: true
  });

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, {
      body: message,
      tag: "stock-request-" + req.id,
      renotify: true
    });
  }

  setTimeout(() => {
    state.highlightRequestIds.delete(req.id);
    renderStockRequests();
  }, 15000);
}function initRealtimeNotifications() {
  if (state.realtimeReady) return;
  state.realtimeReady = true;

  supabaseClient
    .channel("stock_requests_watch")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "stock_requests" },
      async (payload) => {
        const req = payload.new;
        if (!req || state.seenRequestIds.has(req.id)) return;

        state.seenRequestIds.add(req.id);
        await notifyNewRequest(req);
        await loadStockRequests();
      }
    )
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications" },
      async (payload) => {
        const item = payload.new;
        if (!item) return;
        if (!state.notifications.some(n => String(n.id) === String(item.id))) {
          state.notifications.unshift(item);
          state.notifications = state.notifications.slice(0, 120);
          state.unreadNotificationCount = state.notifications.filter(n => !n.is_read).length;
          updateNotificationBadge();
          renderNotifications();
          playNotificationSound();
        }
      }
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "stock_requests" },
      async (payload) => {
        const updatedReq = payload.new;
        if (!updatedReq) return;

        const index = state.stockRequests.findIndex(
          r => String(r.id) === String(updatedReq.id)
        );

        if (index >= 0) {
          state.stockRequests[index] = updatedReq;
        } else {
          state.stockRequests.unshift(updatedReq);
        }

        renderStockRequests();

        if (String(state.selectedStockRequestId) === String(updatedReq.id)) {
          renderSelectedRequestDetail(updatedReq);
          el.productSearchInput.value = updatedReq.requested_text || "";
          searchProductsForRequest(updatedReq.requested_text || "", true);
        }

        showToast("Depo talebi güncellendi ✅");
      }
    )
    .subscribe();
}


// ====================== MEGA PAKET: RAPOR / KRİTİK STOK / PLAKA GEÇMİŞİ ======================
function dateInputValue(d = new Date()) {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
  return x.toISOString().slice(0, 10);
}
function parseReportDate(value, endOfDay = false) {
  if (!value) return null;
  const d = new Date(value + (endOfDay ? "T23:59:59" : "T00:00:00"));
  return Number.isNaN(d.getTime()) ? null : d;
}
function saleMovementRowsForReport() {
  const start = parseReportDate(document.getElementById("reportStartDate")?.value, false);
  const end = parseReportDate(document.getElementById("reportEndDate")?.value, true);
  const q = normalizeText(document.getElementById("reportSearchInput")?.value || "");
  return (state.movements || [])
    .map(m => ({ raw: m, parsed: parseSaleMovement(m) }))
    .filter(x => x.parsed)
    .filter(x => {
      const d = new Date(x.raw.created_at || "");
      if (start && d < start) return false;
      if (end && d > end) return false;
      if (!q) return true;
      return normalizeText([x.parsed.productName, x.parsed.paymentType, x.raw.description, x.raw.movement_type].join(" ")).includes(q);
    });
}
function aggregateBy(rows, keyFn) {
  const map = new Map();
  rows.forEach(({ parsed }) => {
    const key = keyFn(parsed) || "-";
    const old = map.get(key) || { name: key, qty: 0, total: 0, count: 0 };
    old.qty += Number(parsed.qty || 0);
    old.total += Number(parsed.total || 0);
    old.count += 1;
    map.set(key, old);
  });
  return [...map.values()].sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
}
function reportListHtml(items) {
  return items.length ? items.slice(0, 15).map((item, index) => `
    <div class="top-sale-item">
      <span>${index + 1}</span>
      <div><strong>${escapeHtml(item.name)}</strong><small>${item.qty} adet · ${formatSaleMoney(item.total)} · ${item.count} hareket</small></div>
    </div>`).join("") : `<div class="empty-state">Bu aralıkta veri yok</div>`;
}
function extractStaffFromDescription(desc = "") {
  const m = String(desc || "").match(/Personel:\s*([^\-]+)/i);
  return m ? m[1].trim() : "Personel Yok";
}
window.renderReports = function() {
  if (!document.getElementById("page-reports")) return;
  if (el.reportStartDate && !el.reportStartDate.value) el.reportStartDate.value = dateInputValue(new Date());
  if (el.reportEndDate && !el.reportEndDate.value) el.reportEndDate.value = dateInputValue(new Date());
  const rows = saleMovementRowsForReport();
  const total = rows.reduce((s, r) => s + Number(r.parsed.total || 0), 0);
  const qty = rows.reduce((s, r) => s + Number(r.parsed.qty || 0), 0);
  const refunds = rows.filter(r => r.parsed.isRefund).reduce((s, r) => s + Math.abs(Number(r.parsed.total || 0)), 0);
  const setText = (id, val) => { const node = document.getElementById(id); if (node) node.textContent = val; };
  setText("reportTotalSales", formatSaleMoney(total));
  setText("reportTotalQty", String(qty));
  setText("reportRefundTotal", formatSaleMoney(refunds));
  setText("reportMoveCount", String(rows.length));
  const products = aggregateBy(rows, p => p.productName);
  const staff = aggregateBy(rows, p => extractStaffFromDescription(rows.find(r => r.parsed === p)?.raw?.description || ""));
  const payments = aggregateBy(rows, p => p.paymentType);
  const productBox = document.getElementById("reportProductList"); if (productBox) productBox.innerHTML = reportListHtml(products);
  const staffBox = document.getElementById("reportStaffList"); if (staffBox) staffBox.innerHTML = reportListHtml(staff);
  const paymentBox = document.getElementById("reportPaymentList"); if (paymentBox) paymentBox.innerHTML = reportListHtml(payments);
};
window.exportReportCsv = function() {
  const rows = saleMovementRowsForReport();
  const lines = [["Tarih", "Ürün", "Adet", "Tutar", "Ödeme", "Açıklama"]];
  rows.forEach(({ raw, parsed }) => lines.push([formatDate(raw.created_at), parsed.productName, parsed.qty, parsed.total, parsed.paymentType, raw.description || ""]));
  const csv = lines.map(row => row.map(v => '"' + String(v ?? "").replace(/"/g, '""') + '"').join(";")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `satis-raporu-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  showToast("Rapor CSV olarak indirildi ✅");
};
window.renderCriticalStock = function() {
  const box = document.getElementById("criticalStockList");
  if (!box) return;
  const q = normalizeText(document.getElementById("criticalSearchInput")?.value || "");
  let items = (state.products || []).filter(p => (Number(p.stock || 0) - Number(p.reserved || 0)) <= Number(p.minStock || 0));
  if (q) items = items.filter(p => productSearchText(p).includes(q));
  items.sort((a, b) => (saleAvailable(a) - Number(a.minStock || 0)) - (saleAvailable(b) - Number(b.minStock || 0)));
  box.innerHTML = items.length ? items.map(p => {
    const available = saleAvailable(p);
    const img = p.imageUrl ? `<img class="product-card-img" src="${escapeHtml(p.imageUrl)}" onerror="this.style.display='none'" />` : `<div class="product-card-img empty">📦</div>`;
    return `<div class="sale-product-item critical-card">${img}<div><div class="sale-product-title">${escapeHtml(p.category || p.name || "-")}</div><div class="sale-product-meta">${escapeHtml(p.productBrand || "-")} / ${escapeHtml(p.carBrand || "-")} ${escapeHtml(p.carModel || "")} ${escapeHtml(p.carType || "")}<br>Mevcut: ${p.stock} · Rezerve: ${p.reserved} · Kullanılabilir: <strong class="stock-warning">${available}</strong> · Min: ${p.minStock} · Raf: ${escapeHtml(p.location || "-")}</div></div><button class="btn primary" onclick="editProduct('${p.id}')">Düzenle</button></div>`;
  }).join("") : `<div class="empty-state">Kritik stokta ürün yok 🎉</div>`;
};
function matchesHistoryQuery(text, q) {
  return normalizeText(text).includes(q) || normalizeText(String(text).replace(/\s+/g, "")).includes(normalizeText(q).replace(/\s+/g, ""));
}
window.renderPlateHistory = function() {
  const q = normalizeText(document.getElementById("historySearchInput")?.value || "");
  const requestBox = document.getElementById("historyRequestList");
  const moveBox = document.getElementById("historyMovementList");
  if (!requestBox || !moveBox) return;
  if (!q) {
    requestBox.innerHTML = `<div class="empty-state">Plaka veya müşteri adı yaz</div>`;
    moveBox.innerHTML = `<div class="empty-state">Plaka veya müşteri adı yaz</div>`;
    return;
  }
  const reqs = (state.stockRequests || []).filter(r => matchesHistoryQuery([r.plate, r.customer_name, r.record_no, r.requested_text, r.vehicle_brand, r.vehicle_model].join(" "), q));
  const moves = (state.movements || []).filter(m => matchesHistoryQuery([m.plate, m.record_no, m.description, m.stock_products?.product_name, m.movement_type].join(" "), q));
  const allDates = [...reqs.map(r => r.created_at), ...moves.map(m => m.created_at)].filter(Boolean).sort().reverse();
  const setText = (id, val) => { const node = document.getElementById(id); if (node) node.textContent = val; };
  setText("historyRequestCount", String(reqs.length));
  setText("historyMovementCount", String(moves.length));
  setText("historySaleCount", String(moves.filter(m => String(m.movement_type || "").includes("satis") || String(m.description || "").toLocaleLowerCase("tr-TR").includes("satış")).length));
  setText("historyLastDate", allDates[0] ? formatDate(allDates[0]) : "-");
  requestBox.innerHTML = reqs.length ? reqs.map(r => `<div class="movement-item"><div class="movement-top"><div><strong>${escapeHtml(r.plate || "Plaka yok")}</strong><div class="muted">${escapeHtml(r.customer_name || "-")}</div></div><span class="badge status-${escapeHtml(r.status || "bos")}">${formatRequestStatus(r.status)}</span></div><div>İstenen: <strong>${escapeHtml(r.requested_text || "-")}</strong></div><div>Araç: ${escapeHtml([r.vehicle_brand, r.vehicle_model, r.vehicle_type, r.vehicle_year].filter(Boolean).join(" ") || "-")}</div><div>Tarih: ${formatDate(r.created_at)}</div></div>`).join("") : `<div class="empty-state">Talep bulunamadı</div>`;
  moveBox.innerHTML = moves.length ? moves.map(m => `<div class="movement-item"><div class="movement-top"><div><strong>${escapeHtml(m.stock_products?.product_name || m.description || "-")}</strong><div class="muted">${escapeHtml(m.description || "-")}</div></div><span class="badge ${String(m.movement_type || "").includes("iade") ? "giris" : "cikis"}">${escapeHtml(m.movement_type || "-")}</span></div><div>Miktar: <strong>${Number(m.quantity || 0)}</strong></div><div>Plaka: <strong>${escapeHtml(m.plate || "-")}</strong></div><div>Kayıt No: <strong>${escapeHtml(m.record_no || "-")}</strong></div><div>Tarih: <strong>${formatDate(m.created_at)}</strong></div></div>`).join("") : `<div class="empty-state">Hareket bulunamadı</div>`;
};

el.productForm.addEventListener("submit", async (e) => { e.preventDefault(); if (!requireRoleAction(["admin", "depo"], "Ürün kaydetme yetkisi sadece Admin/Depo")) return; const payload = { id: el.productId.value.trim(), barcode: el.barcode.value.trim(), productBrand: el.productBrand.value.trim(), category: el.category.value.trim(), carBrand: el.carBrand.value.trim(), carModel: el.carModel.value.trim(), carType: el.carType.value.trim(), vehicleYear: el.vehicleYear.value.trim(), stock: el.stock.value.trim(), minStock: el.minStock.value.trim(), location: el.location.value.trim(), note: el.note.value.trim(), imageUrl: el.productImage?.value?.trim() || "" }; if (!payload.category || !payload.carBrand || !payload.carModel) return showToast("Zorunlu alanlar: Ürün Kategorisi, Araç Markası, Araç Modeli", true); try { setLoading(true); if (payload.id) { const { error } = await supabaseClient.from("stock_products").update(toProductRow(payload)).eq("id", payload.id); if (error) throw error; await logActivity("product_update", `Ürün güncellendi: ${payload.category} ${payload.carBrand} ${payload.carModel}`, "stock_products", payload.id); showToast("Ürün güncellendi"); } else { const { data, error } = await supabaseClient.from("stock_products").insert(toProductRow(payload)).select("id").single(); if (error) throw error; await logActivity("product_insert", `Ürün eklendi: ${payload.category} ${payload.carBrand} ${payload.carModel}`, "stock_products", data?.id); showToast("Ürün kaydedildi"); } clearProductForm(); await loadProducts(); } catch (err) { console.error(err); showToast(err.message || "Ürün kaydedilemedi", true); } finally { setLoading(false); } });
el.clearProductBtn.addEventListener("click", clearProductForm); el.refreshBtn.addEventListener("click", loadAll); el.enableNotifyBtn.addEventListener("click", enablePushNotifications); el.searchInput.addEventListener("input", applySearch); el.movementSearchInput.addEventListener("input", renderMovementSearchResults); el.productSearchInput.addEventListener("input", () => searchProductsForRequest(el.productSearchInput.value));
if (el.operationBrandFilter) el.operationBrandFilter.addEventListener("change", renderOperationResults);
if (el.operationCategoryFilter) el.operationCategoryFilter.addEventListener("change", renderOperationResults);
if (el.operationSearchInput) el.operationSearchInput.addEventListener("input", renderOperationResults);
if (el.saleSearchInput) {
  el.saleSearchInput.addEventListener("input", handleSaleSearchInput);
  el.saleSearchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const exact = findExactBarcodeProduct(el.saleSearchInput.value);
      if (exact) {
        addToSaleCart(exact.id);
        el.saleSearchInput.value = "";
        renderSaleProducts();
      }
    }
  });
}
if (el.completeSaleBtn) el.completeSaleBtn.addEventListener("click", completeQuickSale);
if (el.clearSaleBtn) el.clearSaleBtn.addEventListener("click", clearSaleCart);
if (el.printLastSaleBtn) el.printLastSaleBtn.addEventListener("click", printLastQuickSale);
if (el.cancelLastSaleBtn) el.cancelLastSaleBtn.addEventListener("click", cancelLastQuickSale);
if (el.currentStaffSelect) el.currentStaffSelect.addEventListener("change", (e) => setCurrentStaff(e.target.value));
if (el.loginBtn) el.loginBtn.addEventListener("click", loginWithSelectedStaff);
if (el.loginPasswordInput) el.loginPasswordInput.addEventListener("keydown", (e) => { if (e.key === "Enter") loginWithSelectedStaff(); });
if (el.logoutBtn) el.logoutBtn.addEventListener("click", logoutCurrentUser);
if (el.reportSearchInput) el.reportSearchInput.addEventListener("input", renderReports);
if (el.criticalSearchInput) el.criticalSearchInput.addEventListener("input", renderCriticalStock);
if (el.historySearchInput) el.historySearchInput.addEventListener("keydown", (e) => { if (e.key === "Enter") renderPlateHistory(); });
if ("serviceWorker" in navigator) { window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(console.error)); }
async function bootApp() {
  await Promise.all([loadStaffListFromSupabase(), loadRolePermissionsFromSupabase()]);
  initAuthGate();
  renderStaffSelector();
  renderSaleFavorites();
  loadLastQuickSale();
  switchTab(canAccessTab("requests") ? "requests" : (ROLE_DEFAULT_TAB[currentStaff().role] || "requests"));
  updateNotifyButtonUI();
  loadNotifications();
  loadActivityLogs();
  loadAll();
  initRealtimeNotifications();
  initUpdateChecker();
}
bootApp();


async function checkVersion() {
  try {
    const localVersion = localStorage.getItem('app_version');
    if (localVersion !== APP_VERSION) {
      localStorage.setItem('app_version', APP_VERSION);
      if ('caches' in window) {
        const names = await caches.keys();
        for (const name of names) {
          await caches.delete(name);
        }
      }
    }
  } catch (err) {
    console.error(err);
  }
}

window.addEventListener('offline', () => {
  isOffline = true;
});

window.addEventListener('online', () => {
  isOffline = false;
});

window.addEventListener('error', (e) => {
  console.error('GLOBAL ERROR', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('PROMISE ERROR', e.reason);
});

checkVersion();
