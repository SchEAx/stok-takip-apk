const APP_VERSION = '3.4.0-akilli-tema-sistemi';
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
  operationResults: [], operationSearchTimer: null, operationQuerySeq: 0, operationCacheKey: "",
  movementResults: [], movementSearchTimer: null, movementQuerySeq: 0,
  operationFilterOptionsLoaded: false, operationBrands: [], operationCategories: [],
  quickQty: {},
  notifications: [], notificationFilter: "all", unreadNotificationCount: 0, notificationTableReady: true,
  activityLogs: [], activityLogTableReady: true, authReady: false, currentUser: null,
  categoryValues: [], categoryValueRows: [],
  orderSuggestionRows: [],
  purchaseOrderDraft: [], purchaseOrders: [],
  criticalCategoryFilter: "all", criticalProductBrandFilter: "all", criticalCarBrandFilter: "all",
  orderSuggestionCategoryFilter: "all", orderSuggestionProductBrandFilter: "all", orderSuggestionCarBrandFilter: "all",
};

const el = {
  totalProductCount: document.getElementById("totalProductCount"), totalStockCount: document.getElementById("totalStockCount"), reservedStockCount: document.getElementById("reservedStockCount"), criticalStockCount: document.getElementById("criticalStockCount"),
  refreshBtn: document.getElementById("refreshBtn"), enableNotifyBtn: document.getElementById("enableNotifyBtn"), productForm: document.getElementById("productForm"), productId: document.getElementById("productId"), barcode: document.getElementById("barcode"),
  productBrand: document.getElementById("productBrand"), category: document.getElementById("category"), carBrand: document.getElementById("carBrand"), carModel: document.getElementById("carModel"), carType: document.getElementById("carType"), vehicleYear: document.getElementById("vehicleYear"), stock: document.getElementById("stock"), minStock: document.getElementById("minStock"), location: document.getElementById("location"), note: document.getElementById("note"),
  saveProductBtn: document.getElementById("saveProductBtn"), clearProductBtn: document.getElementById("clearProductBtn"), movementSearchInput: document.getElementById("movementSearchInput"), movementSearchList: document.getElementById("movementSearchList"), searchInput: document.getElementById("searchInput"), productTableBody: document.getElementById("productTableBody"), movementList: document.getElementById("movementList"),
  stockRequestsBox: document.getElementById("stockRequestsBox"), reservationPanel: document.getElementById("reservationPanel"), requestedTextBox: document.getElementById("requestedTextBox"), productSearchInput: document.getElementById("productSearchInput"), productMatchBox: document.getElementById("productMatchBox"), toast: document.getElementById("toast"),
  saleSearchInput: document.getElementById("saleSearchInput"), saleProductList: document.getElementById("saleProductList"), saleCartList: document.getElementById("saleCartList"), saleTotal: document.getElementById("saleTotal"), saleDiscount: document.getElementById("saleDiscount"), saleFinalTotal: document.getElementById("saleFinalTotal"), salePaymentType: document.getElementById("salePaymentType"), saleCustomerName: document.getElementById("saleCustomerName"),
saleCustomerPhone: document.getElementById("saleCustomerPhone"), saleCustomerNote: document.getElementById("saleCustomerNote"), completeSaleBtn: document.getElementById("completeSaleBtn"), clearSaleBtn: document.getElementById("clearSaleBtn"), todaySaleTotal: document.getElementById("todaySaleTotal"), todaySaleQty: document.getElementById("todaySaleQty"), todayCashTotal: document.getElementById("todayCashTotal"), todayCardTotal: document.getElementById("todayCardTotal"), topSaleProducts: document.getElementById("topSaleProducts"), currentStaffSelect: document.getElementById("currentStaffSelect"), staffRoleBadge: document.getElementById("staffRoleBadge"), staffEditor: document.getElementById("staffEditor"), staffEditorBody: document.getElementById("staffEditorBody"), printLastSaleBtn: document.getElementById("printLastSaleBtn"), cancelLastSaleBtn: document.getElementById("cancelLastSaleBtn"), productImage: document.getElementById("productImage"), reportStartDate: document.getElementById("reportStartDate"), reportEndDate: document.getElementById("reportEndDate"), reportSearchInput: document.getElementById("reportSearchInput"), criticalSearchInput: document.getElementById("criticalSearchInput"), historySearchInput: document.getElementById("historySearchInput"),
  operationBrandFilter: document.getElementById("operationBrandFilter"), operationCategoryFilter: document.getElementById("operationCategoryFilter"), operationSearchInput: document.getElementById("operationSearchInput"), operationResultBox: document.getElementById("operationResultBox"),
  notificationBellBtn: document.getElementById("notificationBellBtn"), notificationUnreadCount: document.getElementById("notificationUnreadCount"), notificationList: document.getElementById("notificationList"),
  loginOverlay: document.getElementById("loginOverlay"), appShell: document.getElementById("appShell"), loginStaffSelect: document.getElementById("loginStaffSelect"), loginPasswordInput: document.getElementById("loginPasswordInput"), loginBtn: document.getElementById("loginBtn"), logoutBtn: document.getElementById("logoutBtn"), activeUserName: document.getElementById("activeUserName"), activeUserRole: document.getElementById("activeUserRole"), usersList: document.getElementById("usersList"), activityLogList: document.getElementById("activityLogList"), rolePermissionEditor: document.getElementById("rolePermissionEditor"),
excelProductBrandFilter: document.getElementById("excelProductBrandFilter"),
excelCategoryFilter: document.getElementById("excelCategoryFilter"),
excelCarBrandFilter: document.getElementById("excelCarBrandFilter"),
excelFilterSummary: document.getElementById("excelFilterSummary"),
productImageFile: document.getElementById("productImageFile"),
productImagePreview: document.getElementById("productImagePreview"),
productImageStatus: document.getElementById("productImageStatus"),
productImageRemoveBtn: document.getElementById("productImageRemoveBtn"),
productImageViewBtn: document.getElementById("productImageViewBtn"),
categoryValueForm: document.getElementById("categoryValueForm"),
categoryValueId: document.getElementById("categoryValueId"),
categoryValueCategory: document.getElementById("categoryValueCategory"),
categoryValuePurchase: document.getElementById("categoryValuePurchase"),
categoryValueSale: document.getElementById("categoryValueSale"),
categoryValueList: document.getElementById("categoryValueList"),
categoryValueSummary: document.getElementById("categoryValueSummary"),
categoryValueDetail: document.getElementById("categoryValueDetail"),
productPurchasePrice: document.getElementById("productPurchasePrice"),
productAverageSalePrice: document.getElementById("productAverageSalePrice"),
managementCategoryBrandSummary: document.getElementById("managementCategoryBrandSummary"),
managementCategoryBrandList: document.getElementById("managementCategoryBrandList"),
purchaseSupplier: document.getElementById("purchaseSupplier"), purchaseExpectedDate: document.getElementById("purchaseExpectedDate"), purchaseOrderNote: document.getElementById("purchaseOrderNote"), purchaseDraftList: document.getElementById("purchaseDraftList"), purchaseDraftTotal: document.getElementById("purchaseDraftTotal"), purchaseOrderList: document.getElementById("purchaseOrderList"), purchaseOrderBadge: document.getElementById("purchaseOrderBadge"), savePurchaseOrderBtn: document.getElementById("savePurchaseOrderBtn")
};

// Performans notu: Ürün arama ekranlarında sadece görünen/gerekli kolonları çekiyoruz.
// Böylece özellikle tablet/WebView tarafında gereksiz veri ve RAM tüketimi azalır.
const STOCK_IMAGE_BUCKET = "product-images";
const STOCK_IMAGE_MAX_SIZE = 1200;
const STOCK_IMAGE_QUALITY = 0.72;
const STOCK_PRODUCT_SELECT = "id,barcode,product_name,product_brand,category,vehicle_brand,vehicle_model,vehicle_type,vehicle_year,quantity,reserved_quantity,min_stock,location,note,image_url,image_thumb_url,purchase_price,average_sale_price,created_at";


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

// APK/WebView prompt da çoğu cihazda sorun çıkarabiliyor. Bu yüzden miktar/şifre girişlerini de uygulama içi pencereden alıyoruz.
function appPrompt(message, defaultValue = "", options = {}) {
  return new Promise((resolve) => {
    const overlay = document.getElementById("appConfirmOverlay");
    const titleEl = document.getElementById("appConfirmTitle");
    const msgEl = document.getElementById("appConfirmMessage");
    const okBtn = document.getElementById("appConfirmOk");
    const cancelBtn = document.getElementById("appConfirmCancel");
    if (!overlay || !msgEl || !okBtn || !cancelBtn) {
      resolve(window.prompt(String(message || "Değer gir:"), String(defaultValue ?? "")));
      return;
    }

    let input = document.getElementById("appPromptInput");
    if (!input) {
      input = document.createElement("input");
      input.id = "appPromptInput";
      input.className = "app-prompt-input";
      msgEl.insertAdjacentElement("afterend", input);
    }

    titleEl.textContent = options.title || "Bilgi gir";
    msgEl.textContent = String(message || "Değer gir:");
    input.type = options.type || "text";
    input.inputMode = options.inputMode || (options.type === "number" ? "numeric" : "text");
    input.value = String(defaultValue ?? "");
    input.placeholder = options.placeholder || "";
    input.classList.remove("hidden");
    okBtn.textContent = options.okText || "Tamam";
    cancelBtn.textContent = options.cancelText || "İptal";
    okBtn.className = "btn " + (options.danger ? "danger" : "primary");

    const cleanup = (value) => {
      overlay.classList.add("hidden");
      input.classList.add("hidden");
      okBtn.onclick = null;
      cancelBtn.onclick = null;
      overlay.onclick = null;
      input.onkeydown = null;
      document.onkeydown = null;
      resolve(value);
    };

    okBtn.onclick = () => cleanup(input.value);
    cancelBtn.onclick = () => cleanup(null);
    overlay.onclick = (e) => { if (e.target === overlay) cleanup(null); };
    input.onkeydown = (e) => {
      if (e.key === "Enter") cleanup(input.value);
      if (e.key === "Escape") cleanup(null);
    };
    document.onkeydown = (e) => { if (e.key === "Escape") cleanup(null); };
    overlay.classList.remove("hidden");
    setTimeout(() => { input.focus(); input.select(); }, 50);
  });
}


const SESSION_STORE_KEY = "garage_current_session_v2";
const STAFF_META_STORE_KEY = "garage_staff_meta_v2";
const ACTIVITY_STORE_KEY = "garage_activity_logs_v2";
const ROLE_PERMISSION_STORE_KEY = "garage_role_permissions_v1";
const TAB_DEFINITIONS = [
  { key: "operation", label: "İşlem" },
  { key: "add", label: "Ürün Ekle" },
  { key: "movements", label: "Hareketler" },
  { key: "critical", label: "Kritik Stok" },
  { key: "categoryValues", label: "Kategori Değerleri" },
  { key: "orderSuggestion", label: "Sipariş Önerisi" },
  { key: "purchaseOrders", label: "Verilen Siparişler" },
  { key: "surveys", label: "Müşteri Memnuniyeti" },
  { key: "management", label: "Yönetim" },
  { key: "users", label: "Kullanıcılar / Yetkiler" },
  { key: "logs", label: "Loglar" }
];
const ALL_TAB_KEYS = TAB_DEFINITIONS.map(t => t.key);
const DEFAULT_ROLE_PERMISSIONS = {
  admin: [...ALL_TAB_KEYS],
  depo: ["operation", "add", "movements", "critical", "categoryValues", "orderSuggestion", "purchaseOrders", "surveys"],
  kasa: ["operation", "movements", "critical", "categoryValues", "orderSuggestion", "purchaseOrders", "surveys"],
  satis: ["operation", "movements", "critical"],
  usta: ["operation", "movements", "critical"]
};
const ROLE_DEFAULT_TAB = { admin: "operation", depo: "operation", kasa: "operation", satis: "operation", usta: "operation" };
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
  supabaseClient
  .from("app_users")
  .update({
    last_seen_at: new Date().toISOString(),
    last_login_at: new Date().toISOString()
  })
  .eq("name", staff.name);
  return session;
}
async function setUserOffline() {
  try {
    const session = currentSession();
    if (!session?.name) return;

    await supabaseClient
      .from("app_users")
      .update({
        last_seen_at: null
      })
      .eq("name", session.name);

  } catch (err) {
    console.warn("Offline güncellenemedi:", err);
  }
}

function clearCurrentSession() {
  setUserOffline();
  localStorage.removeItem(SESSION_STORE_KEY);
  state.currentUser = null;
}
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
async function initAuthGate() {
  await loadRolePermissionsFromSupabase();
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
    const lastSeen = m.lastSeenAt ? new Date(m.lastSeenAt).getTime() : 0;
const online = lastSeen && (Date.now() - lastSeen < 2 * 60 * 1000);
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
        ${TAB_DEFINITIONS.filter(tab => !["users", "logs"].includes(tab.key)).map(tab => `
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
/* === Excel Aktarım Şelalesi === */

function createExcelProgress() {
  let box = document.getElementById("excelProgressBox");

  if (!box) {
    box = document.createElement("div");
    box.id = "excelProgressBox";
    box.className = "excel-progress-wrap";

    box.innerHTML = `
      <div class="excel-progress-title">Excel Aktarılıyor 🚀</div>

      <div class="excel-progress-bar">
        <div id="excelProgressFill" class="excel-progress-fill"></div>
      </div>

      <div id="excelProgressText" class="excel-progress-text">
        Hazırlanıyor...
      </div>

      <div id="excelProgressPercent" class="excel-progress-percent">
        0%
      </div>
    `;

    document.body.appendChild(box);
  }

  return box;
}

function updateExcelProgress(current, total, success = 0, error = 0) {
  const percent = total ? Math.round((current / total) * 100) : 0;

  createExcelProgress();

  const fill = document.getElementById("excelProgressFill");
  const text = document.getElementById("excelProgressText");
  const percentEl = document.getElementById("excelProgressPercent");

  if (fill) fill.style.width = percent + "%";

  if (text) {
    text.innerHTML = `
      Aktarılan: <b>${current}</b> / ${total}<br>
      Başarılı: <span class="excel-progress-success">${success}</span><br>
      Hatalı: <span class="excel-progress-error">${error}</span>
    `;
  }

  if (percentEl) {
    percentEl.textContent = percent + "%";
  }
}

function closeExcelProgress(delay = 1200) {
  setTimeout(() => {
    document.getElementById("excelProgressBox")?.remove();
  }, delay);
}

/* === Excel Aktarım Şelalesi SON === */
function notificationIcon(type) {
  return ({ stock_request: "📦", critical_stock: "⚠️", movement: "↔️", sale: "💳", system: "🔔" })[type] || "🔔";
}
function updateNotificationBadge() {
  const count = Number(state.unreadNotificationCount || 0);
  const text = count > 99 ? "99+" : String(count);
  if (el.notificationUnreadCount) {
    if (count > 0) {
      el.notificationUnreadCount.textContent = text;
      el.notificationUnreadCount.classList.remove("hidden");
      if (el.notificationBellBtn) el.notificationBellBtn.classList.add("has-unread");
    } else {
      el.notificationUnreadCount.classList.add("hidden");
      if (el.notificationBellBtn) el.notificationBellBtn.classList.remove("has-unread");
    }
  }
  const navCount = document.getElementById("navNotificationCount");
  if (navCount) {
    navCount.textContent = text;
    navCount.classList.toggle("hidden", count <= 0);
  }
}
function updateRequestBadge() {
  const count = (state.stockRequests || []).filter(r => ["bekliyor", "rezerve_edildi", "teslim_edildi"].includes(String(r.status || ""))).length;
  const badge = document.getElementById("requestPendingCount");
  if (!badge) return;
  badge.textContent = count > 99 ? "99+" : String(count);
  badge.classList.toggle("hidden", count <= 0);
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
function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/\s+/g, " ")
    .trim();
}
function searchIncludes(text, query) {
  const t = normalizeText(text);
  const q = normalizeText(query);

  return (
    t.includes(q) ||
    t.replace(/\s+/g, "").includes(q.replace(/\s+/g, ""))
  );
}
function formatDate(value) { if (!value) return "-"; const d = new Date(value); if (Number.isNaN(d.getTime())) return value; return d.toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" }); }
function buildProductName(row) { return [row.product_brand, row.category, row.vehicle_brand, row.vehicle_model, row.vehicle_type, row.vehicle_year].filter(Boolean).join(" ").replace(/\s+/g, " ").trim(); }
function extractImageUrlFromNote(note) {
  const m = String(note || "").match(/\[IMG:([^\]]+)\]/i);
  return m ? m[1].trim() : "";
}
function stripImageUrlFromNote(note) {
  return String(note || "").replace(/\s*\[IMG:[^\]]+\]\s*/ig, " ").replace(/\s+/g, " ").trim();
}
function publicUrlToStoragePath(url) {
  const value = String(url || "").trim();
  const marker = `/storage/v1/object/public/${STOCK_IMAGE_BUCKET}/`;
  const index = value.indexOf(marker);
  if (index < 0) return "";
  return decodeURIComponent(value.slice(index + marker.length).split("?")[0]);
}
function productImageHtml(p, sizeClass = "product-card-img") {
  const url = p?.imageThumbUrl || p?.imageUrl || "";
  return url
    ? `<img class="${sizeClass}" src="${escapeHtml(url)}" alt="Ürün resmi" loading="lazy" onclick="openProductImage('${escapeHtml(p.imageUrl || url)}')" />`
    : `<div class="${sizeClass} empty" title="Resim yok">📷</div>`;
}
function mapProduct(row) {
  const imageUrl = row.image_url || extractImageUrlFromNote(row.note || "");
  return { id: row.id || "", barcode: row.barcode || "", name: row.product_name || buildProductName(row), productBrand: row.product_brand || "", category: row.category || "", carBrand: row.vehicle_brand || "", carModel: row.vehicle_model || "", carType: row.vehicle_type || "", vehicleYear: row.vehicle_year || "", stock: Number(row.quantity || 0), reserved: Number(row.reserved_quantity || 0), minStock: Number(row.min_stock || 0), location: row.location || "", note: stripImageUrlFromNote(row.note || ""), imageUrl, imageThumbUrl: row.image_thumb_url || imageUrl, purchasePrice: Number(row.purchase_price || 0), averageSalePrice: Number(row.average_sale_price || 0), createdAt: row.created_at || "" };
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
  return { barcode: payload.barcode || null, product_name: productName || payload.category, product_brand: payload.productBrand || null, category: payload.category || null, vehicle_brand: payload.carBrand || null, vehicle_model: payload.carModel || null, vehicle_type: payload.carType || null, vehicle_year: payload.vehicleYear || null, quantity: Number(payload.stock || 0), min_stock: Number(payload.minStock || 0), location: payload.location || null, note: stripImageUrlFromNote(payload.note || "") || null, image_url: payload.imageUrl || null, image_thumb_url: payload.imageThumbUrl || payload.imageUrl || null, purchase_price: Number(payload.purchasePrice || 0), average_sale_price: Number(payload.averageSalePrice || 0) };
}
function formatRequestStatus(status) { return ({ bekliyor: "Bekliyor", rezerve_edildi: "Rezerve", teslim_edildi: "Teslim Edildi", montaj_bitti: "Tamamlandı", iptal: "İptal" })[status] || status || "-"; }

let productImageRemoveRequested = false;
let selectedProductImageBlob = null;
let selectedProductImageExt = "webp";

function updateProductImagePreview(url = "") {
  if (el.productImagePreview) {
    el.productImagePreview.innerHTML = url
      ? `<img src="${escapeHtml(url)}" alt="Ürün resmi" />`
      : `<div class="product-image-empty">📷<span>Resim yok</span></div>`;
  }
  if (el.productImageStatus) {
    el.productImageStatus.textContent = url ? "Resim hazır" : "Resim seçilmedi";
  }
  if (el.productImageViewBtn) el.productImageViewBtn.disabled = !url;
  if (el.productImageRemoveBtn) el.productImageRemoveBtn.disabled = !url && !selectedProductImageBlob;
}

function resetProductImageState() {
  productImageRemoveRequested = false;
  selectedProductImageBlob = null;
  selectedProductImageExt = "webp";
  if (el.productImageFile) el.productImageFile.value = "";
  if (el.productImage) el.productImage.value = "";
  updateProductImagePreview("");
}

function loadImageForCompression(file) {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file).catch(() => loadImageElementForCompression(file));
  }
  return loadImageElementForCompression(file);
}

function loadImageElementForCompression(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Resim okunamadı"));
    };
    img.src = url;
  });
}

async function compressProductImage(file) {
  const bitmap = await loadImageForCompression(file);
  const sourceWidth = bitmap.width || bitmap.naturalWidth || 1;
  const sourceHeight = bitmap.height || bitmap.naturalHeight || 1;
  const scale = Math.min(1, STOCK_IMAGE_MAX_SIZE / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.drawImage(bitmap, 0, 0, width, height);
  if (bitmap.close) bitmap.close();
  const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/webp", STOCK_IMAGE_QUALITY));
  if (blob) return { blob, ext: "webp" };
  const fallback = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", STOCK_IMAGE_QUALITY));
  if (!fallback) throw new Error("Resim küçültülemedi");
  return { blob: fallback, ext: "jpg" };
}

async function handleProductImageFile(event) {
  const file = event?.target?.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    showToast("Lütfen resim dosyası seç", true);
    event.target.value = "";
    return;
  }
  try {
    if (el.productImageStatus) el.productImageStatus.textContent = "Resim küçültülüyor...";
    const optimized = await compressProductImage(file);
    selectedProductImageBlob = optimized.blob;
    selectedProductImageExt = optimized.ext;
    productImageRemoveRequested = false;
    const previewUrl = URL.createObjectURL(selectedProductImageBlob);
    updateProductImagePreview(previewUrl);
    if (el.productImageStatus) {
      const kb = Math.round(selectedProductImageBlob.size / 1024);
      el.productImageStatus.textContent = `Resim hazır (${kb} KB)`;
    }
  } catch (err) {
    console.error(err);
    showToast(err.message || "Resim hazırlanamadı", true);
    if (event?.target) event.target.value = "";
  }
}
window.handleProductImageFile = handleProductImageFile;

async function uploadProductImageIfNeeded(productId) {
  if (productImageRemoveRequested) return { imageUrl: "", imageThumbUrl: "" };
  if (!selectedProductImageBlob) {
    const current = String(el.productImage?.value || "").trim();
    return { imageUrl: current, imageThumbUrl: current };
  }
  const safeId = String(productId || crypto.randomUUID()).replace(/[^a-zA-Z0-9_-]/g, "");
  const filePath = `${safeId}/main-${Date.now()}.${selectedProductImageExt || "webp"}`;
  if (el.productImageStatus) el.productImageStatus.textContent = "Resim yükleniyor...";
  const { error: uploadError } = await supabaseClient.storage
    .from(STOCK_IMAGE_BUCKET)
    .upload(filePath, selectedProductImageBlob, {
      cacheControl: "31536000",
      upsert: true,
      contentType: selectedProductImageBlob.type || "image/webp"
    });
  if (uploadError) throw uploadError;
  const { data } = supabaseClient.storage.from(STOCK_IMAGE_BUCKET).getPublicUrl(filePath);
  const publicUrl = data?.publicUrl || "";
  if (!publicUrl) throw new Error("Resim linki alınamadı");
  return { imageUrl: publicUrl, imageThumbUrl: publicUrl };
}

window.removeSelectedProductImage = async function() {
  productImageRemoveRequested = true;
  selectedProductImageBlob = null;
  if (el.productImageFile) el.productImageFile.value = "";
  if (el.productImage) el.productImage.value = "";
  updateProductImagePreview("");
  if (el.productImageStatus) el.productImageStatus.textContent = "Resim silinecek";
};

function ensureProductImageModal() {
  let modal = document.getElementById("productImageModal");
  if (modal) return modal;
  modal = document.createElement("div");
  modal.id = "productImageModal";
  modal.className = "product-image-modal hidden";
  modal.innerHTML = `
    <div class="product-image-modal-backdrop" onclick="closeProductImageModal()"></div>
    <div class="product-image-modal-card" role="dialog" aria-modal="true" aria-label="Ürün resmi">
      <button type="button" class="product-image-modal-close" onclick="closeProductImageModal()">×</button>
      <img id="productImageModalImg" src="" alt="Ürün resmi" />
    </div>
  `;
  document.body.appendChild(modal);
  return modal;
}

window.openProductImage = function(url) {
  const imageUrl = String(url || el.productImage?.value || "").trim();
  if (!imageUrl) return showToast("Bu üründe resim yok", true);
  const modal = ensureProductImageModal();
  const img = document.getElementById("productImageModalImg");
  if (img) img.src = imageUrl;
  modal.classList.remove("hidden");
  document.body.classList.add("image-modal-open");
  if (!history.state || !history.state.productImageModal) {
    history.pushState({ ...(history.state || {}), productImageModal: true }, "");
  }
};

window.closeProductImageModal = function(fromPopState = false) {
  const modal = document.getElementById("productImageModal");
  if (!modal || modal.classList.contains("hidden")) return;
  modal.classList.add("hidden");
  document.body.classList.remove("image-modal-open");
  const img = document.getElementById("productImageModalImg");
  if (img) img.src = "";
  if (!fromPopState && history.state?.productImageModal) {
    history.back();
  }
};

window.addEventListener("popstate", () => {
  const modal = document.getElementById("productImageModal");
  if (modal && !modal.classList.contains("hidden")) {
    closeProductImageModal(true);
  }
});

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
function setLoading(flag) { state.loading = flag; el.refreshBtn.disabled = flag; el.saveProductBtn.disabled = flag; if (el.movementSearchInput) {
  el.movementSearchInput.disabled = flag;
} el.refreshBtn.textContent = flag ? "Yükleniyor..." : "Yenile"; el.saveProductBtn.textContent = flag ? "Kaydediliyor..." : "Ürünü Kaydet"; }

async function loadDashboardStats() {
  // Önce Supabase SQL fonksiyonunu dener. Fonksiyon yoksa eski güvenli yönteme düşer.
  // Böylece SQL paketini çalıştırmadan da uygulama bozulmaz.
  try {
    const { data, error } = await supabaseClient.rpc("stock_dashboard_stats");
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) throw new Error("Sayaç sonucu boş geldi");

    if (el.totalProductCount) el.totalProductCount.textContent = Number(row.total_products || 0);
    if (el.totalStockCount) el.totalStockCount.textContent = Number(row.total_stock || 0);
    if (el.reservedStockCount) el.reservedStockCount.textContent = Number(row.reserved_stock || 0);
    if (el.criticalStockCount) el.criticalStockCount.textContent = Number(row.critical_stock || 0);
    return;
  } catch (rpcErr) {
    console.warn("stock_dashboard_stats RPC yok/çalışmadı, eski sayaç yöntemine düşüldü:", rpcErr?.message || rpcErr);
  }

  try {
    const { count, error: countError } = await supabaseClient
      .from("stock_products")
      .select("id", { count: "exact", head: true });
    if (countError) throw countError;

    let totalStock = 0;
    let reserved = 0;
    let critical = 0;
    let from = 0;
    const pageSize = 1000;

    while (true) {
      const to = from + pageSize - 1;
      const { data, error } = await supabaseClient
        .from("stock_products")
        .select("quantity,reserved_quantity,min_stock")
        .range(from, to);
      if (error) throw error;

      (data || []).forEach(row => {
        const qty = Number(row.quantity || 0);
        const res = Number(row.reserved_quantity || 0);
        const min = Number(row.min_stock || 0);
        totalStock += qty;
        reserved += res;
        if ((qty - res) <= min) critical += 1;
      });

      if (!data || data.length < pageSize) break;
      from += pageSize;
    }

    if (el.totalProductCount) el.totalProductCount.textContent = Number(count || 0);
    if (el.totalStockCount) el.totalStockCount.textContent = totalStock;
    if (el.reservedStockCount) el.reservedStockCount.textContent = reserved;
    if (el.criticalStockCount) el.criticalStockCount.textContent = critical;
  } catch (err) {
    console.warn("Sayaçlar alınamadı:", err?.message || err);
    if (state.products?.length) updateStats();
  }
}
window.loadDashboardStats = loadDashboardStats;

async function loadOperationFilterOptions() {
  if (state.operationFilterOptionsLoaded) {
    refreshOperationFilters();
    return;
  }
  let rows = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await supabaseClient
      .from("stock_products")
      .select("category,vehicle_brand")
      .range(from, to);
    if (error) throw error;
    rows = rows.concat(data || []);
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }
  state.operationCategories = uniqueCleanValues(rows.map(r => r.category));
  state.operationBrands = uniqueCleanValues(rows.map(r => r.vehicle_brand));
  state.operationFilterOptionsLoaded = true;
  refreshOperationFilters();
}
window.loadOperationFilterOptions = loadOperationFilterOptions;

async function loadProducts() {
  let allRows = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const to = from + pageSize - 1;

    const { data, error } = await supabaseClient
      .from("stock_products")
      .select("*")
      .order("product_name", { ascending: true })
      .range(from, to);

    if (error) throw error;

    allRows = allRows.concat(data || []);

    if (!data || data.length < pageSize) break;

    from += pageSize;
  }

  state.products = allRows.map(mapProduct);

  applySearch();
  updateStats();
  refreshProductQuickLists();
  refreshOperationFilters();
  if (state.activeTab === "operation" && (el.operationBrandFilter?.value || el.operationCategoryFilter?.value || String(el.operationSearchInput?.value || "").trim().length >= 2)) {
    renderOperationResults();
  }

  if (typeof renderSaleProducts === "function") {
    renderSaleProducts();
  }
  if (state.activeTab === "management") renderCategoryBrandManagement();
  if (state.activeTab === "categoryValues") renderCategoryValues();
}
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
  state.stockRequests.forEach((r) => state.seenRequestIds.add(r.id));
  updateRequestBadge();
  renderStockRequests();
}

window.loadStockRequests = loadStockRequests;
async function loadAll() { try { setLoading(true); await Promise.all([loadDashboardStats(), loadMovements()]); } catch (err) { console.error(err); showToast(err.message || "Veriler yüklenemedi", true); } finally { setLoading(false); } }
function updateStats() {
  const totalProduct = state.products.length;
  const totalStock = state.products.reduce((sum, p) => sum + Number(p.stock || 0), 0);
  const reserved = state.products.reduce((sum, p) => sum + Number(p.reserved || 0), 0);
  const critical = state.products.filter((p) => (Number(p.stock || 0) - Number(p.reserved || 0)) <= Number(p.minStock || 0)).length;
  if (el.totalProductCount) el.totalProductCount.textContent = totalProduct;
  if (el.totalStockCount) el.totalStockCount.textContent = totalStock;
  if (el.reservedStockCount) el.reservedStockCount.textContent = reserved;
  if (el.criticalStockCount) el.criticalStockCount.textContent = critical;
}
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
  setDatalistOptions("productBrandList", getSuggestionValues("productBrand"));
  setDatalistOptions("categoryList", getSuggestionValues("category"));
  setDatalistOptions("carBrandList", getSuggestionValues("carBrand"));
  setDatalistOptions("carModelList", getSuggestionValues("carModel"));
  setDatalistOptions("carTypeList", getSuggestionValues("carType"));
  setDatalistOptions("vehicleYearList", getSuggestionValues("vehicleYear"));
  setDatalistOptions("locationList", getSuggestionValues("location"));
  refreshExcelFilters();
}

const PRODUCT_RECENT_SUGGESTIONS_KEY = "garage_product_recent_suggestions_v1";
const PRODUCT_SUGGESTION_FIELDS = {
  productBrand: { label: "Ürün Markası", inputId: "productBrand", getter: p => p.productBrand },
  category: { label: "Ürün Kategorisi", inputId: "category", getter: p => p.category },
  carBrand: { label: "Araç Markası", inputId: "carBrand", getter: p => p.carBrand },
  carModel: { label: "Araç Modeli", inputId: "carModel", getter: p => p.carModel },
  carType: { label: "Araç Tipi", inputId: "carType", getter: p => p.carType },
  vehicleYear: { label: "Model Yılı", inputId: "vehicleYear", getter: p => p.vehicleYear },
  location: { label: "Raf / Konum", inputId: "location", getter: p => p.location }
};

function readRecentProductSuggestions() {
  try { return JSON.parse(localStorage.getItem(PRODUCT_RECENT_SUGGESTIONS_KEY) || "{}"); }
  catch { return {}; }
}
function writeRecentProductSuggestions(data) {
  localStorage.setItem(PRODUCT_RECENT_SUGGESTIONS_KEY, JSON.stringify(data || {}));
}
function rememberProductSuggestions(payload = {}) {
  const recent = readRecentProductSuggestions();
  Object.keys(PRODUCT_SUGGESTION_FIELDS).forEach(field => {
    const value = String(payload[field] || "").trim();
    if (!value) return;
    const list = Array.isArray(recent[field]) ? recent[field] : [];
    recent[field] = uniqueCleanValues([value, ...list]).slice(0, 80);
  });
  writeRecentProductSuggestions(recent);
}
function getSuggestionValues(field) {
  const cfg = PRODUCT_SUGGESTION_FIELDS[field];
  const recent = readRecentProductSuggestions();
  const productValues = cfg ? state.products.map(cfg.getter) : [];
  return uniqueCleanValues([...(recent[field] || []), ...productValues]);
}
function closeProductSuggestBoxes(exceptBox = null) {
  document.querySelectorAll(".custom-suggest-box").forEach(box => {
    if (box !== exceptBox) box.remove();
  });
}
function showProductSuggestions(field) {
  const cfg = PRODUCT_SUGGESTION_FIELDS[field];
  if (!cfg) return;
  const input = document.getElementById(cfg.inputId);
  if (!input) return;

  const query = normalizeText(input.value);
  const values = getSuggestionValues(field)
    .filter(v => !query || normalizeText(v).includes(query))
    .slice(0, 10);

  closeProductSuggestBoxes();
  if (!values.length) return;

  const box = document.createElement("div");
  box.className = "custom-suggest-box";
  box.innerHTML = values.map(v => `<button type="button" data-value="${escapeHtml(v)}">${escapeHtml(v)}</button>`).join("");
  input.insertAdjacentElement("afterend", box);

  box.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      input.value = btn.dataset.value || "";
      closeProductSuggestBoxes();
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  });
}
function initProductSuggestionInputs() {
  Object.keys(PRODUCT_SUGGESTION_FIELDS).forEach(field => {
    const input = document.getElementById(PRODUCT_SUGGESTION_FIELDS[field].inputId);
    if (!input || input.dataset.suggestReady === "1") return;
    input.dataset.suggestReady = "1";
    input.addEventListener("focus", () => showProductSuggestions(field));
    input.addEventListener("input", () => showProductSuggestions(field));
    input.addEventListener("blur", () => setTimeout(() => closeProductSuggestBoxes(), 160));
  });
}

function setSelectOptions(selectEl, values, allText) {
  if (!selectEl) return;
  const current = selectEl.value;
  selectEl.innerHTML = `<option value="">${escapeHtml(allText || "Tümü")}</option>` +
    uniqueCleanValues(values).map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
  if ([...selectEl.options].some(opt => opt.value === current)) selectEl.value = current;
}
function getExcelFilterValues() {
  return {
    productBrand: el.excelProductBrandFilter?.value || "",
    category: el.excelCategoryFilter?.value || "",
    carBrand: el.excelCarBrandFilter?.value || ""
  };
}
function productMatchesExcelFilters(p, filters = getExcelFilterValues()) {
  return (!filters.productBrand || p.productBrand === filters.productBrand) &&
    (!filters.category || p.category === filters.category) &&
    (!filters.carBrand || p.carBrand === filters.carBrand);
}
function getFilteredProductsForExcel() {
  return state.products.filter(p => productMatchesExcelFilters(p));
}
function updateExcelFilterSummary() {
  if (!el.excelFilterSummary) return;
  const filters = getExcelFilterValues();
  const active = Object.values(filters).filter(Boolean);
  const count = getFilteredProductsForExcel().length;
  el.excelFilterSummary.textContent = active.length
    ? `${count} ürün seçili. Aktif filtre: ${active.join(" / ")}`
    : `${count} ürün seçili. Tüm stok listesi.`;
}
function refreshExcelFilters() {
  setSelectOptions(el.excelProductBrandFilter, state.products.map(p => p.productBrand), "Tüm ürün markaları");
  setSelectOptions(el.excelCategoryFilter, state.products.map(p => p.category), "Tüm kategoriler");
  setSelectOptions(el.excelCarBrandFilter, state.products.map(p => p.carBrand), "Tüm araç markaları");
  updateExcelFilterSummary();
}
window.clearExcelFilters = function() {
  [el.excelProductBrandFilter, el.excelCategoryFilter, el.excelCarBrandFilter]
    .filter(Boolean).forEach(select => select.value = "");
  updateExcelFilterSummary();
};

function productSearchText(p) { return normalizeText([p.name, p.productBrand, p.category, p.carBrand, p.carModel, p.carType, p.vehicleYear, p.location, p.note].join(" ")); }
function productSmartSearch(p, rawQuery) {
  const q = normalizeText(rawQuery);
  if (!q) return true;

  const haystack = productSearchText(p);
  const haystackCompact = haystack.replace(/\s+/g, "");
  const tokens = q.split(" ").filter(Boolean);

  // Örn: "yarasa 207" yazınca "Yarasa Ayna Kapağı Peugeot 207" bulunsun.
  return tokens.every(token => {
    const compactToken = token.replace(/\s+/g, "");
    return haystack.includes(token) || haystackCompact.includes(compactToken);
  });
}
function barcodeSmartSearch(p, rawQuery) {
  const q = normalizeText(rawQuery).replace(/\s+/g, "");
  if (!q) return false;
  return normalizeText(p.barcode).replace(/\s+/g, "").includes(q);
}
function applySearch() {
  const q = el.searchInput?.value || "";

  state.filteredProducts = q
    ? state.products.filter((p) => productSmartSearch(p, q))
    : state.products;

  renderProducts();
}
function renderProducts() {
  if (!el.productTableBody) return;
  if (!state.filteredProducts.length) { el.productTableBody.innerHTML = `<tr><td colspan="13" class="empty-cell">Kayıt bulunamadı</td></tr>`; return; }
  el.productTableBody.innerHTML = state.filteredProducts.map((p) => {
    const available = Number(p.stock || 0) - Number(p.reserved || 0);
    const isLow = available <= Number(p.minStock || 0);
    return `<tr><td>${productImageHtml(p, "product-thumb")}</td><td>${escapeHtml(p.productBrand || "-")}</td><td>${escapeHtml(p.category || "-")}</td><td>${escapeHtml(p.carBrand || "-")}</td><td>${escapeHtml(p.carModel || "-")}</td><td>${escapeHtml(p.carType || "-")}</td><td>${escapeHtml(p.vehicleYear || "-")}</td><td>${Number(p.stock || 0)}</td><td>${Number(p.reserved || 0)}</td><td class="${isLow ? "low-stock" : ""}">${available}</td><td>${Number(p.minStock || 0)}</td><td>${escapeHtml(p.location || "-")}</td><td><div class="action-group"><button class="action-btn edit" onclick="editProduct('${p.id}')">Düzenle</button><button class="btn danger" onclick="deleteProduct('${p.id}')">Sil</button></div></td></tr>`;
  }).join("");
}
function renderMovements() {
  if (!state.movements.length) { el.movementList.innerHTML = `<div class="empty-state">Henüz hareket yok</div>`; return; }
  el.movementList.innerHTML = state.movements.map((m) => { const productName = m.stock_products?.product_name || m.description || "-"; const type = String(m.movement_type || "").toLowerCase(); const typeClass = type.includes("giris") || type.includes("iade") || (type.includes("rezerv") && !type.includes("iptal")) ? "giris" : "cikis"; return `<div class="movement-item"><div class="movement-top"><div><strong>${escapeHtml(productName)}</strong><div class="muted">${escapeHtml(m.description || "-")}</div></div><span class="badge ${typeClass}">${escapeHtml(m.movement_type || "-")}</span></div><div>Miktar: <strong>${Number(m.quantity || 0)}</strong></div><div>Plaka: <strong>${escapeHtml(m.plate || "-")}</strong></div><div>Kayıt No: <strong>${escapeHtml(m.record_no || "-")}</strong></div><div>Tarih: <strong>${formatDate(m.created_at)}</strong></div></div>`; }).join("");
}
function getQuickQty(productId) {
  const value = Number(state.quickQty[productId] || 1);
  return value > 0 ? value : 1;
}
function setQuickQty(productId, value) {
  const qty = Math.max(1, Number(value || 1));
  state.quickQty[productId] = qty;
  renderMovementCards(state.movementResults || []);
}
window.setQuickQty = setQuickQty;
window.stepQuickQty = function(productId, step) {
  setQuickQty(productId, getQuickQty(productId) + Number(step || 0));
};
function renderMovementCards(results) {
  if (!el.movementSearchList) return;
  if (!results.length) { el.movementSearchList.innerHTML = `<div class="empty-state">Eşleşen ürün bulunamadı</div>`; return; }
  el.movementSearchList.innerHTML = results.slice(0, 60).map((p) => {
    const available = Number(p.stock || 0) - Number(p.reserved || 0);
    const qty = getQuickQty(p.id);
    const vehicle = [p.carBrand, p.carModel, p.carType, p.vehicleYear].filter(Boolean).join(" ");
    return `<div class="movement-search-item">
      ${productImageHtml(p, "product-card-img")}
      <div class="movement-search-info">
        <strong>${escapeHtml(p.name || p.category || "-")}</strong>
        <div class="muted">Ürün Marka: <strong>${escapeHtml(p.productBrand || "-")}</strong> · Kategori: <strong>${escapeHtml(p.category || "-")}</strong></div>
        <div class="muted">Araç: <strong>${escapeHtml(vehicle || "-")}</strong> · Raf: <strong>${escapeHtml(p.location || "-")}</strong>${p.barcode ? ` · Barkod: <strong>${escapeHtml(p.barcode)}</strong>` : ""}</div>
        ${p.note ? `<div class="muted">Açıklama/Renk: <strong>${escapeHtml(p.note)}</strong></div>` : ""}
        <div class="muted">Stok: <strong>${p.stock}</strong> | Rezerve: <strong>${p.reserved}</strong> | Kullanılabilir: <strong>${available}</strong></div>
        <div class="operation-price-line">Satış Fiyatı: <strong>${formatTL(p.averageSalePrice || 0)}</strong></div>
      </div>
      <div class="movement-search-actions">
        <div class="operation-qty-row quick-qty-row">
          <button type="button" class="btn secondary mini" onclick="stepQuickQty('${p.id}', -1)">-</button>
          <input type="number" min="1" value="${qty}" inputmode="numeric" onchange="setQuickQty('${p.id}', this.value)" />
          <button type="button" class="btn secondary mini" onclick="stepQuickQty('${p.id}', 1)">+</button>
        </div>
        ${p.imageUrl ? `<button type="button" class="btn secondary" onclick="openProductImage('${escapeHtml(p.imageUrl)}')">Resmi Gör</button>` : ""}
        <button type="button" class="btn success" onclick="quickStockAction('${p.id}', 'giris', getQuickQty('${p.id}'))">Giriş</button>
        <button type="button" class="btn danger" onclick="quickStockAction('${p.id}', 'cikis', getQuickQty('${p.id}'))" ${available <= 0 ? "disabled" : ""}>Çıkış</button>
      </div>
    </div>`;
  }).join("");
}
function renderMovementSearchResults() {
  if (!el.movementSearchInput || !el.movementSearchList) return;
  const rawSearch = String(el.movementSearchInput.value || "").trim();
  const q = normalizeText(rawSearch);
  clearTimeout(state.movementSearchTimer);

  if (!q) {
    state.movementResults = [];
    el.movementSearchList.innerHTML = `<div class="empty-state">Arama yaparak ürün seç</div>`;
    return;
  }
  if (q.length < 2) {
    state.movementResults = [];
    el.movementSearchList.innerHTML = `<div class="empty-state">En az 2 karakter yaz</div>`;
    return;
  }

  const seq = ++state.movementQuerySeq;
  el.movementSearchList.innerHTML = `<div class="empty-state">Ürünler aranıyor...</div>`;

  state.movementSearchTimer = setTimeout(async () => {
    try {
      const rows = await searchStockProducts({ search: rawSearch, limit: 80 });
      if (seq !== state.movementQuerySeq) return;
      const results = rows.map(mapProduct).filter(p =>
        productSmartSearch(p, rawSearch) || barcodeSmartSearch(p, rawSearch)
      );
      state.movementResults = results;
      renderMovementCards(results);
    } catch (err) {
      if (seq !== state.movementQuerySeq) return;
      console.error(err);
      el.movementSearchList.innerHTML = `<div class="empty-state">Ürünler alınamadı: ${escapeHtml(err.message || err)}</div>`;
    }
  }, 250);
}

function getOperationQty(productId) {
  const value = Number(state.operationQty[productId] || 1);
  return value > 0 ? value : 1;
}
function setOperationQty(productId, value) {
  const qty = Math.max(1, Number(value || 1));
  state.operationQty[productId] = qty;
  // Miktar değişince Supabase'e tekrar sorgu atma; sadece mevcut kartları yeniden çiz.
  renderOperationCards(state.operationResults || []);
}
window.setOperationQty = setOperationQty;
window.stepOperationQty = function(productId, step) {
  setOperationQty(productId, getOperationQty(productId) + Number(step || 0));
};
function operationFilterOptions() {
  return {
    brands: state.operationFilterOptionsLoaded ? state.operationBrands : uniqueCleanValues(state.products.map(p => p.carBrand)),
    categories: state.operationFilterOptionsLoaded ? state.operationCategories : uniqueCleanValues(state.products.map(p => p.category))
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
  if (q && !productSmartSearch(p, q)) return false;
  return true;
}
function renderOperationCards(results) {
  if (!el.operationResultBox) return;
  if (!results.length) {
    el.operationResultBox.innerHTML = `<div class="empty-state">Eşleşen ürün bulunamadı</div>`;
    return;
  }
  el.operationResultBox.innerHTML = results.slice(0, 120).map((p) => {
    const available = Number(p.stock || 0) - Number(p.reserved || 0);
    const qty = getOperationQty(p.id);
    const detailLine = [
      p.productBrand ? `Ürün Marka: <strong>${escapeHtml(p.productBrand)}</strong>` : "",
      p.category ? `Kategori: <strong>${escapeHtml(p.category)}</strong>` : "",
      p.carBrand ? `Araç: <strong>${escapeHtml([p.carBrand, p.carModel, p.carType, p.vehicleYear].filter(Boolean).join(" "))}</strong>` : "",
      p.location ? `Raf: <strong>${escapeHtml(p.location)}</strong>` : "",
      p.barcode ? `Barkod: <strong>${escapeHtml(p.barcode)}</strong>` : ""
    ].filter(Boolean).join(" · ");

    return `<div class="operation-card">
      ${productImageHtml(p, "product-card-img")}
      <div class="operation-main">
        <div class="operation-title">${escapeHtml(p.name || p.category || "Ürün")}</div>
        <div class="operation-meta">${detailLine || "-"}</div>
        ${p.note ? `<div class="operation-meta operation-note">Açıklama/Renk: <strong>${escapeHtml(p.note)}</strong></div>` : ""}
        <div class="operation-stock-row">
          <span>Stok: <b>${Number(p.stock || 0)}</b></span>
          <span>Rezerve: <b>${Number(p.reserved || 0)}</b></span>
          <span>Kullanılabilir: <b class="${available <= 0 ? "stock-warning" : ""}">${available}</b></span>
          <span>Min: <b>${Number(p.minStock || 0)}</b></span>
        </div>
        <div class="operation-price-line">Satış Fiyatı: <strong>${formatTL(p.averageSalePrice || 0)}</strong></div>
      </div>
      <div class="operation-actions">
        <div class="operation-qty-row">
          <button class="btn secondary mini" onclick="stepOperationQty('${p.id}', -1)">-</button>
          <input type="number" min="1" value="${qty}" onchange="setOperationQty('${p.id}', this.value)" />
          <button class="btn secondary mini" onclick="stepOperationQty('${p.id}', 1)">+</button>
        </div>
        <button class="btn success" onclick="operationStockAction('${p.id}', 'giris')">Giriş</button>
        <button class="btn danger" onclick="operationStockAction('${p.id}', 'cikis')" ${available <= 0 ? "disabled" : ""}>Çıkış</button>
        <button class="btn primary" onclick="addProductToPurchaseOrder('${p.id}')">📦 Siparişe Ekle</button>
        ${p.imageUrl ? `<button class="btn secondary" onclick="openProductImage('${escapeHtml(p.imageUrl)}')">Resmi Gör</button>` : ""}
        <button class="btn secondary" onclick="editProduct('${p.id}')">Düzenle</button>
        <button class="btn danger" onclick="deleteProduct('${p.id}')">Sil</button>
      </div>
    </div>`;
  }).join("");
}

function escapeIlikeValue(value) {
  return String(value || "").replace(/[%_,]/g, "");
}

async function fetchOperationProductRows({ brand = "", category = "", token = "", limit = 600 } = {}) {
  let query = supabaseClient
    .from("stock_products")
    .select(STOCK_PRODUCT_SELECT)
    .order("product_name", { ascending: true })
    .limit(limit);

  if (brand) query = query.eq("vehicle_brand", brand);
  if (category) query = query.eq("category", category);

  const safeToken = escapeIlikeValue(token);
  if (safeToken) {
    const columns = ["barcode", "product_name", "product_brand", "category", "vehicle_brand", "vehicle_model", "vehicle_type", "vehicle_year", "location", "note"];
    query = query.or(columns.map(col => `${col}.ilike.%${safeToken}%`).join(","));
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

function uniqueRowsById(rows) {
  const map = new Map();
  (rows || []).forEach(row => {
    if (!row?.id) return;
    map.set(String(row.id), row);
  });
  return [...map.values()];
}

async function searchStockProducts({ brand = "", category = "", search = "", limit = 120 } = {}) {
  const rawSearch = String(search || "").trim();

  // SQL paketindeki search_stock_products fonksiyonu varsa tek sorgu ile hızlı arar.
  // Fonksiyon henüz kurulmadıysa catch içinde mevcut güvenli JS/Supabase arama mantığı devam eder.
  try {
    const { data, error } = await supabaseClient.rpc("search_stock_products", {
      p_brand: brand || null,
      p_category: category || null,
      p_search: rawSearch || null,
      p_limit: Number(limit || 120)
    });
    if (error) throw error;
    const rpcRows = data || [];
    const needsFullPriceRows = rpcRows.some(row =>
      row && !(Object.prototype.hasOwnProperty.call(row, "average_sale_price") || Object.prototype.hasOwnProperty.call(row, "purchase_price"))
    );
    if (needsFullPriceRows && rpcRows.length) {
      const ids = rpcRows.map(row => row.id).filter(Boolean);
      if (ids.length) {
        const { data: fullRows, error: fullError } = await supabaseClient
          .from("stock_products")
          .select(STOCK_PRODUCT_SELECT)
          .in("id", ids);
        if (!fullError && fullRows) {
          const order = new Map(ids.map((id, index) => [String(id), index]));
          return fullRows.sort((a, b) => (order.get(String(a.id)) ?? 999999) - (order.get(String(b.id)) ?? 999999));
        }
      }
    }
    return rpcRows;
  } catch (rpcErr) {
    console.warn("search_stock_products RPC yok/çalışmadı, eski arama yöntemine düşüldü:", rpcErr?.message || rpcErr);
  }

  const q = normalizeText(rawSearch);
  const tokens = q.split(" ").filter(t => t.length >= 2).slice(0, 6);
  if (tokens.length) {
    const searches = tokens.map(token =>
      fetchOperationProductRows({ brand, category, token, limit: Math.max(Number(limit || 120) * 4, 400) })
    );
    return uniqueRowsById((await Promise.all(searches)).flat()).slice(0, Math.max(Number(limit || 120) * 4, 400));
  }
  return fetchOperationProductRows({ brand, category, token: "", limit });
}

async function queryOperationProducts() {
  if (!el.operationResultBox) return;

  const brand = el.operationBrandFilter?.value || "";
  const category = el.operationCategoryFilter?.value || "";
  const rawSearch = String(el.operationSearchInput?.value || "").trim();
  const q = normalizeText(rawSearch);
  const tokens = q.split(" ").filter(t => t.length >= 2).slice(0, 6);

  if (!brand && !category && tokens.length === 0) {
    state.operationResults = [];
    state.operationCacheKey = "";
    el.operationResultBox.innerHTML = `<div class="empty-state">Filtre seç veya en az 2 karakter ürün ara</div>`;
    return;
  }

  const cacheKey = [brand, category, q].join("|");
  if (state.operationCacheKey === cacheKey && state.operationResults?.length) {
    renderOperationCards(state.operationResults);
    return;
  }

  const seq = ++state.operationQuerySeq;
  el.operationResultBox.innerHTML = `<div class="empty-state">Ürünler aranıyor...</div>`;

  try {
    // Öncelik SQL tarafındaki hızlı arama fonksiyonunda; yoksa searchStockProducts eski yönteme düşer.
    let rows = await searchStockProducts({ brand, category, search: rawSearch, limit: 160 });

    if (seq !== state.operationQuerySeq) return;

    let results = rows.map(mapProduct).filter(p =>
      operationProductMatches(p, brand, category, rawSearch) ||
      barcodeSmartSearch(p, rawSearch)
    );

    // Daha anlaşılır sıralama: tüm kelimeleri adı/kategori/model içinde yakalayanlar üstte.
    if (tokens.length) {
      results.sort((a, b) => {
        const at = productSearchText(a);
        const bt = productSearchText(b);
        const as = tokens.reduce((sum, token) => sum + (at.includes(token) ? 2 : 0), 0);
        const bs = tokens.reduce((sum, token) => sum + (bt.includes(token) ? 2 : 0), 0);
        return bs - as || String(a.name || "").localeCompare(String(b.name || ""), "tr");
      });
    }

    state.operationResults = results;
    state.operationCacheKey = cacheKey;
    renderOperationCards(results);
  } catch (err) {
    if (seq !== state.operationQuerySeq) return;
    console.error(err);
    el.operationResultBox.innerHTML = `<div class="empty-state">Ürünler alınamadı: ${escapeHtml(err.message || err)}</div>`;
  }
}

function renderOperationResults() {
  clearTimeout(state.operationSearchTimer);
  state.operationSearchTimer = setTimeout(queryOperationProducts, 250);
}
window.clearOperationFilters = function() {
  if (el.operationBrandFilter) el.operationBrandFilter.value = "";
  if (el.operationCategoryFilter) el.operationCategoryFilter.value = "";
  if (el.operationSearchInput) el.operationSearchInput.value = "";
  clearTimeout(state.operationSearchTimer);
  state.operationResults = [];
  state.operationCacheKey = "";
  if (el.operationResultBox) el.operationResultBox.innerHTML = `<div class="empty-state">Filtre seç veya en az 2 karakter ürün ara</div>`;
};
window.operationStockAction = async function(id, type) { if (!requireRoleAction(["admin", "depo"], "Stok giriş/çıkış yetkisi sadece Admin/Depo")) return;
  const product = [...(state.operationResults || []), ...(state.products || [])].find((p) => String(p.id) === String(id));
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
    // Ekranı anında güncelle; stok işlemi sonrası tekrar büyük sorgu bekleme.
    product.stock = newQty;
    const idx = state.operationResults.findIndex(p => String(p.id) === String(id));
    if (idx >= 0) state.operationResults[idx] = product;
    const allIdx = state.products.findIndex(p => String(p.id) === String(id));
    if (allIdx >= 0) state.products[allIdx].stock = newQty;
    renderOperationCards(state.operationResults || []);
    loadDashboardStats().catch(() => updateStats());
    showToast(`${quantity} adet ${label} kaydedildi ✅`);
    loadMovements().catch(err => console.warn("Hareketler yenilenemedi:", err));
    renderMovementSearchResults();
  } catch (err) {
    console.error(err);
    showToast(err.message || "İşlem kaydedilemedi", true);
  } finally {
    setLoading(false);
  }
};

function renderStockRequests() {
  updateRequestBadge();
  if (!el.stockRequestsBox) return;
  let list = state.stockRequests || []; if (state.requestFilter !== "all") list = list.filter(req => req.status === state.requestFilter);
  if (!list.length) { el.stockRequestsBox.innerHTML = `<div class="empty-state">Bu filtrede talep yok</div>`; return; }
  el.stockRequestsBox.innerHTML = list.map((req) => `<div class="movement-item ${state.highlightRequestIds.has(req.id) ? "new-request-glow" : ""}"><div class="movement-top"><div><strong>${escapeHtml(req.plate || "Plaka yok")}</strong><div class="muted">${escapeHtml(req.customer_name || "-")}</div></div><span class="badge status-${escapeHtml(req.status || "bos")}">${formatRequestStatus(req.status)}</span></div><div>Usta: <strong>${escapeHtml(req.technician_name || "-")}</strong></div><div>İstenen: <strong>${escapeHtml(req.requested_text || "-")}</strong></div><div>Araç: <strong>${escapeHtml([
  req.vehicle_brand,
  req.vehicle_model,
  req.vehicle_type
].filter(Boolean).join(" ") || "-")}</strong></div><div>Tarih: <strong>${formatDate(req.created_at)}</strong></div><div class="row-gap" style="margin-top:10px;"><button class="btn primary" onclick="openReservationPanel('${req.id}')">Ürün Eşleştir</button>${req.status === "rezerve_edildi" ? `<button class="btn danger" onclick="cancelReservation('${req.id}')">Rezervi İptal Et</button>` : ""}</div></div>`).join("");
}
window.setRequestFilter = function(status) { state.requestFilter = status; renderStockRequests(); };
function clearProductForm() { [el.productId, el.barcode, el.productBrand, el.category, el.carBrand, el.carModel, el.carType, el.vehicleYear, el.stock, el.minStock, el.productPurchasePrice, el.productAverageSalePrice, el.location, el.note].filter(Boolean).forEach((x) => x.value = ""); resetProductImageState(); }
function fillProductForm(product) { el.productId.value = product.id || ""; el.barcode.value = product.barcode || ""; el.productBrand.value = product.productBrand || ""; el.category.value = product.category || ""; el.carBrand.value = product.carBrand || ""; el.carModel.value = product.carModel || ""; el.carType.value = product.carType || ""; el.vehicleYear.value = product.vehicleYear || ""; el.stock.value = product.stock ?? ""; el.minStock.value = product.minStock ?? ""; if (el.productPurchasePrice) el.productPurchasePrice.value = product.purchasePrice || ""; if (el.productAverageSalePrice) el.productAverageSalePrice.value = product.averageSalePrice || ""; el.location.value = product.location || ""; productImageRemoveRequested = false; selectedProductImageBlob = null; if (el.productImageFile) el.productImageFile.value = ""; if (el.productImage) el.productImage.value = product.imageUrl || ""; updateProductImagePreview(product.imageUrl || ""); el.note.value = product.note || ""; switchTab("add"); window.scrollTo({ top: 0, behavior: "smooth" }); }
window.editProduct = function(id) { if (!requireRoleAction(["admin", "depo"], "Ürün düzenleme yetkisi sadece Admin/Depo")) return; const product = [...(state.operationResults || []), ...(state.movementResults || []), ...(state.products || [])].find((p) => String(p.id) === String(id)); if (!product) return showToast("Ürün bulunamadı", true); fillProductForm(product); };
window.deleteProduct = async function(id) { if (!requireRoleAction(["admin"], "Ürün silme yetkisi sadece Admin")) return; const product = [...(state.operationResults || []), ...(state.movementResults || []), ...(state.products || [])].find((p) => String(p.id) === String(id)); if (!(await appConfirm("Bu ürünü silmek istediğine emin misin?", { danger: true, okText: "Sil" }))) return; try { setLoading(true); const { error } = await supabaseClient.from("stock_products").delete().eq("id", id); if (error) throw error; await logActivity("product_delete", `Ürün silindi: ${product?.name || id}`, "stock_products", id); showToast("Ürün silindi"); state.operationFilterOptionsLoaded = false; await loadDashboardStats(); if (state.activeTab === "operation") { await queryOperationProducts(); await loadMovements(); } else { await loadMovements(); } } catch (err) { console.error(err); showToast(err.message || "Ürün silinemedi", true); } finally { setLoading(false); } };
window.quickStockAction = async function(id, type, fixedQty = null) { if (!requireRoleAction(["admin", "depo"], "Stok giriş/çıkış yetkisi sadece Admin/Depo")) return;
  const product = [...(state.movementResults || []), ...(state.operationResults || []), ...(state.products || [])].find((p) => String(p.id) === String(id)); if (!product) return showToast("Ürün bulunamadı", true);
  const quantity = Number(fixedQty || getQuickQty(id) || 1); if (!quantity || quantity <= 0) return showToast("Geçerli miktar gir", true);
  const available = Number(product.stock || 0) - Number(product.reserved || 0); if (type === "cikis" && available < quantity) return showToast(`Yeterli kullanılabilir stok yok. Kullanılabilir: ${available}`, true);
  if (!(await appConfirm(`${product.category || product.name} için ${quantity} adet ${type === "giris" ? "giriş" : "çıkış"} yapılsın mı?`, { okText: "İşlemi Yap" }))) return;
  try { setLoading(true); const newQty = type === "giris" ? Number(product.stock) + quantity : Number(product.stock) - quantity; const { error: updateError } = await supabaseClient.from("stock_products").update({ quantity: newQty }).eq("id", id); if (updateError) throw updateError; const { error: movementError } = await supabaseClient.from("stock_movements").insert({ product_id: id, movement_type: type, quantity, description: `Ürün ekle ekranı manuel ${type === "giris" ? "stok giriş" : "stok çıkış"}${actorSuffix()}` }); if (movementError) throw movementError; if (type === "cikis") { const minStock = Number(product.minStock || 0); const willAvailable = newQty - Number(product.reserved || 0); if (willAvailable <= minStock) { await createNotification({ title: "Kritik stok uyarısı", message: `${product.name || product.category || "Ürün"} kritik seviyede. Kullanılabilir: ${willAvailable}, Min: ${minStock}`, type: "critical_stock", target_role: "depo", source_table: "stock_products", source_id: id }); } } product.stock = newQty;
    const midx = state.movementResults.findIndex(p => String(p.id) === String(id));
    if (midx >= 0) state.movementResults[midx].stock = newQty;
    const oidx = state.operationResults.findIndex(p => String(p.id) === String(id));
    if (oidx >= 0) state.operationResults[oidx].stock = newQty;
    const pidx = state.products.findIndex(p => String(p.id) === String(id));
    if (pidx >= 0) state.products[pidx].stock = newQty;
    showToast(`${quantity} adet ${type === "giris" ? "giriş" : "çıkış"} kaydedildi ✅`);
    loadDashboardStats().catch(() => updateStats());
    loadMovements().catch(err => console.warn("Hareketler yenilenemedi:", err));
    renderMovementCards(state.movementResults || []); } catch (err) { console.error(err); showToast(err.message || "Hareket kaydedilemedi", true); } finally { setLoading(false); }
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
      .select("name, role, password, is_active, last_seen_at, last_login_at")
      .eq("is_active", true)
      .order("name", { ascending: true });
    if (error) throw error;
    if (Array.isArray(data) && data.length) {
      const mapped = data.map(row => ({
  name: row.name,
  role: row.role,
  password: row.password,
  lastSeenAt: row.last_seen_at,
  lastLoginAt: row.last_login_at
}));
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
    const names = rows.map(r => r.name);
    const { error: upsertError } = await supabaseClient.from("app_users").upsert(rows, { onConflict: "name" });
    if (upsertError) throw upsertError;
    if (names.length) {
      const { error: inactiveError } = await supabaseClient.from("app_users").update({ is_active: false, updated_at: new Date().toISOString() }).not("name", "in", `(${names.map(n => `\"${String(n).replace(/\"/g, '\\\"')}\"`).join(",")})`);
      if (inactiveError) console.warn("Pasif kullanıcı güncelleme uyarısı:", inactiveError.message);
    }
    return true;
  } catch (err) {
    console.warn("Personel Supabase'e yazılamadı:", err?.message || err);
    showToast("Personel Supabase'e yazılamadı: " + (err?.message || err), true);
    return false;
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

async function verifyStaffPassword(targetName) {
  const staff = readStaffList();
  const target = staff.find(s => s.name === targetName);
  if (!target) {
    showToast("Personel bulunamadı", true);
    return false;
  }

  const admin = adminStaff();
  const entered = await appPrompt(`${target.name} hesabına geçmek için şifre gir:\n(Admin şifresi de geçerlidir.)`, "", { title: "Personel şifresi", type: "password", okText: "Giriş" });

  if (entered === null) return false;

  const pass = String(entered || "").trim();
  const targetPass = normalizeStaffPassword(target.password, defaultPasswordForRole(target.role));
  const adminPass = normalizeStaffPassword(admin.password, "0000");

  if (pass === targetPass || pass === adminPass) return true;

  showToast("Personel şifresi hatalı", true);
  return false;
}

async function verifyAdminPassword() {
  const admin = adminStaff();
  const entered = await appPrompt("Bu işlem için Admin şifresi gerekli:", "", { title: "Admin onayı", type: "password", okText: "Onayla" });
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

window.setCurrentStaff = async function(name) {
  if (!name) return;

  const current = currentStaffName();
  if (name === current) {
    renderStaffSelector();
    return;
  }

  if (!(await verifyStaffPassword(name))) {
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

window.openStaffEditor = async function() {
  if (!requireRoleAction(["admin"], "Personel yönetimi sadece Admin")) return;
  if (!el.staffEditor || !el.staffEditorBody) return;
  if (!(await verifyAdminPassword())) return;

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
  const syncOk = await saveStaffListToSupabase(saved);
  if (!syncOk) return;
  if (!saved.some(s => s.name === currentStaffName())) localStorage.setItem(CURRENT_STAFF_STORE_KEY, saved.find(s => s.role === "kasa")?.name || saved[0]?.name || "Kasa");
  renderStaffSelector();
  closeStaffEditor();
  showToast("Personel listesi ve şifreler kaydedildi ✅");
};

window.resetStaffEditor = async function() {
  if (!(await appConfirm("Personel listesi ve şifreler varsayılana dönsün mü?", { danger: true }))) return;
  localStorage.removeItem(STAFF_STORE_KEY);
  localStorage.removeItem(CURRENT_STAFF_STORE_KEY);
  const syncOk = await saveStaffListToSupabase(DEFAULT_STAFF_LIST);
  if (!syncOk) return;
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
    .filter((p) => productSmartSearch(p, q) || barcodeSmartSearch(p, q))
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

function ensureSaleDiscountUi() {
  if (!el.saleDiscount) el.saleDiscount = document.getElementById("saleDiscount");
  if (!el.saleFinalTotal) el.saleFinalTotal = document.getElementById("saleFinalTotal");
  if (el.saleDiscount && el.saleFinalTotal) return;

  const summary = el.saleTotal?.closest(".sale-summary") || el.saleTotal?.parentElement;
  if (!summary || !summary.parentElement) return;

  const label = summary.querySelector("div");
  if (label) label.textContent = "Ara Toplam";

  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="sale-discount-box">
      <label>İndirim Tutarı</label>
      <input id="saleDiscount" type="number" min="0" step="1" value="0" placeholder="0" oninput="updateSaleTotal()" />
    </div>
    <div class="sale-final-total">
      <span>Genel Toplam</span>
      <strong id="saleFinalTotal">₺0,00</strong>
    </div>
  `.trim();

  while (wrap.firstChild) {
    summary.insertAdjacentElement("afterend", wrap.lastChild || wrap.firstChild);
  }

  el.saleDiscount = document.getElementById("saleDiscount");
  el.saleFinalTotal = document.getElementById("saleFinalTotal");
}

function saleDiscountAmount() {
  ensureSaleDiscountUi();
  const subtotal = saleCartTotal();
  const discount = Math.max(0, Number(el.saleDiscount?.value || 0));
  return Math.min(discount, subtotal);
}

function saleFinalTotal() {
  return Math.max(0, saleCartTotal() - saleDiscountAmount());
}

function updateSaleTotalDisplay() {
  ensureSaleDiscountUi();
  const subtotal = saleCartTotal();
  const discount = saleDiscountAmount();
  const finalTotal = Math.max(0, subtotal - discount);

  if (el.saleTotal) el.saleTotal.textContent = formatSaleMoney(subtotal);
  if (el.saleFinalTotal) el.saleFinalTotal.textContent = formatSaleMoney(finalTotal);

  state.saleDiscountAmount = discount;
  state.saleFinalTotal = finalTotal;
}

window.updateSaleTotal = updateSaleTotalDisplay;

function renderSaleCart() {
  if (!el.saleCartList) return;

  if (!state.saleCart.length) {
    el.saleCartList.innerHTML = `<div class="empty-state">Sepet boş</div>`;
    updateSaleTotalDisplay();
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

  updateSaleTotalDisplay();
}

window.clearSaleCart = function() {
  state.saleCart = [];
  ensureSaleDiscountUi();
  if (el.saleDiscount) el.saleDiscount.value = "0";
  state.saleDiscountAmount = 0;
  state.saleFinalTotal = 0;
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
  ensureSaleDiscountUi();
  updateSaleTotalDisplay();

  const staff = currentStaff();
  const subtotal = saleCartTotal();
  const discount = saleDiscountAmount();
  const total = saleFinalTotal();

  return {
    saleNo: "HS-" + Date.now().toString().slice(-8),
    createdAt: new Date().toISOString(),
    staffName: staff.name,
    staffRole: roleLabel(staff.role),
    paymentType: el.salePaymentType?.value || "Nakit",
    note: String(el.saleCustomerNote?.value || "").trim(),
    customerName: String(el.saleCustomerName?.value || "").trim(),
    customerPhone: String(el.saleCustomerPhone?.value || "").trim(),
    subtotal,
    discount,
    total,
    items: state.saleCart.map(item => {
      const qty = Number(item.qty || 0);
      const price = Number(item.price || 0);
      const lineTotal = qty * price;
      const discountShare = subtotal > 0 ? (lineTotal / subtotal) * discount : 0;
      const netLineTotal = Math.max(0, lineTotal - discountShare);
      return {
        productId: item.productId,
        name: item.name,
        detail: item.detail,
        qty,
        price,
        lineTotal,
        discountShare,
        netLineTotal
      };
    })
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
            <div class="box"><b>Müşteri</b><br>${escapeHtml(sale.customerName || "-")}</div>
<div class="box"><b>Telefon</b><br>${escapeHtml(sale.customerPhone || "-")}</div>
          </div>
          <table>
            <thead><tr><th>Ürün</th><th>Ad.</th><th>Birim</th><th>Tutar</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          ${Number(sale.discount || 0) > 0 ? `
            <div class="total" style="font-size:12px;background:#fff"><span>ARA TOPLAM</span><span>${formatSaleMoney(sale.subtotal || 0)}</span></div>
            <div class="total" style="font-size:12px;background:#fff"><span>İNDİRİM</span><span>-${formatSaleMoney(sale.discount || 0)}</span></div>
          ` : ""}
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

  const reason = await appPrompt(`Son satış iptal edilecek.
Fiş: ${sale.saleNo}
Toplam: ${formatSaleMoney(sale.total)}

İade/iptal nedeni:`, "Müşteri iadesi", { title: "Satış iptali", okText: "Devam" });
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

      const customerInfo = [
  saleSnapshot.customerName ? "Müşteri: " + saleSnapshot.customerName : "",
  saleSnapshot.customerPhone ? "Telefon: " + saleSnapshot.customerPhone : ""
].filter(Boolean).join(" - ");

const discountInfo = Number(saleSnapshot.discount || 0) > 0
  ? ` - Ara Toplam: ${formatSaleMoney(saleSnapshot.subtotal)} - İndirim: ${formatSaleMoney(saleSnapshot.discount)} - Satır İndirim Payı: ${formatSaleMoney(item.discountShare || 0)}`
  : "";

const desc = `Hızlı satış (${paymentType}) - Personel: ${staff.name} (${roleLabel(staff.role)}) - Fiş: ${saleSnapshot.saleNo} - Birim: ${formatSaleMoney(item.price)} - Toplam: ${formatSaleMoney(item.netLineTotal ?? (Number(item.qty || 0) * Number(item.price || 0)))}${discountInfo}${customerInfo ? " - " + customerInfo : ""}${note ? " - Not: " + note : ""}`;

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

  const rawQuery = String(query || "").trim();
  const q = softText(rawQuery);

  if (!state.products.length) {
    el.productMatchBox.innerHTML = `<div class="empty-state">Stok listesi yükleniyor...</div>`;
    try {
      await loadProducts();
    } catch (err) {
      console.error("Rezerve ürün arama için stoklar yüklenemedi:", err);
      el.productMatchBox.innerHTML = `<div class="empty-state">Stok listesi alınamadı: ${escapeHtml(err.message || err)}</div>`;
      return;
    }
  }

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
    .map(w => w.replace(/ligi$|liği$|lik$|lık$|luk$|lük$/g, ""));

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
        p.note,
        p.barcode
      ].join(" "));

      const manualMatch = !autoSuggest && rawQuery
        ? (productSmartSearch(p, rawQuery) || barcodeSmartSearch(p, rawQuery))
        : false;

      let score = manualMatch ? 80 : 0;

      words.forEach(w => {
        if (text.includes(w)) score += 6;
      });

      if (q && text.includes(q)) score += 20;

      // Araç kabulden gelen araç bilgisi sonuç sıralamasını güçlendirir,
      // ama manuel aramada tek başına alakasız ürünleri öne çıkarmaz.
      if (reqBrand && softText(p.carBrand).includes(reqBrand)) score += 12;
      if (reqModel && softText(p.carModel).includes(reqModel)) score += 18;
      if (reqType && softText(p.carType).includes(reqType)) score += 8;
      if (reqYear && softText(p.vehicleYear).includes(reqYear)) score += 4;

      return { p, score, manualMatch };
    })
    .filter(x => autoSuggest ? x.score > 0 : x.manualMatch)
    .sort((a, b) => b.score - a.score)
    .slice(0, 50)
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

async function loadCustomerSurveyStats() {
  const box = document.getElementById("customerSurveyPanel");
  if (!box) return;
  box.innerHTML = `<div class="empty-state">Anket verileri yükleniyor...</div>`;

  try {
    const { data, error } = await supabaseClient
      .from("customer_surveys")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw error;
    const rows = data || [];
    const avg = (arr) => arr.length ? (arr.reduce((a, b) => a + Number(b || 0), 0) / arr.length).toFixed(2) : "0.00";
    const scoreKeys = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"];
    const allScores = rows.flatMap(r => scoreKeys.map(k => Number(r[k] || 0)).filter(Boolean));
    const problemRows = rows.filter(r => scoreKeys.some(k => Number(r[k] || 0) <= 2));
    const contactRows = rows.filter(r => r.contact_allowed && r.phone);

    const questionNames = [
      "Karşılama biçimi ve nezaket",
      "İhtiyaçların anlaşılması / bilgilendirme",
      "Montaj kalitesi ve işçilik",
      "Söz verilen zamanda teslim",
      "Teslimat anındaki temizlik",
      "Fiyat / Performans",
      "Tavsiye etme olasılığı",
      "Muhatap bulabilme"
    ];

    const averagesHtml = questionNames.map((name, i) => {
      const key = `q${i + 1}`;
      const value = avg(rows.map(r => Number(r[key] || 0)).filter(Boolean));
      return `<tr><td>${escapeHtml(name)}</td><td><strong>${value}</strong> / 5</td></tr>`;
    }).join("");

    const commentsHtml = rows
      .filter(r => r.suggestion || (r.contact_allowed && r.phone))
      .slice(0, 30)
      .map(r => {
        const low = scoreKeys.some(k => Number(r[k] || 0) <= 2);
        const scores = scoreKeys.map(k => Number(r[k] || 0)).filter(Boolean);
        return `<div class="survey-comment ${low ? "danger" : ""}">
          <strong>${formatDate(r.created_at)} · Ortalama: ${avg(scores)} / 5 ${low ? "⚠️" : ""}</strong>
          ${r.suggestion ? `<p>${escapeHtml(r.suggestion)}</p>` : `<p class="muted">Yorum yazılmamış.</p>`}
          ${r.contact_allowed && r.phone ? `<small>Geri dönüş izni var: ${escapeHtml(r.phone)}</small>` : `<small>Anonim değerlendirme</small>`}
        </div>`;
      }).join("") || `<div class="empty-state">Henüz yorum yok.</div>`;

    box.innerHTML = `
      <div class="survey-stats">
        <div class="stat-card"><b>${rows.length}</b><span>Toplam Anket</span></div>
        <div class="stat-card"><b>${avg(allScores)}</b><span>Genel Ortalama</span></div>
        <div class="stat-card"><b>${problemRows.length}</b><span>Düşük Puanlı Kayıt</span></div>
        <div class="stat-card"><b>${contactRows.length}</b><span>Geri Dönüş İsteyen</span></div>
      </div>
      <h3>Kriter Ortalamaları</h3>
      <table class="survey-table"><thead><tr><th>Kriter</th><th>Ortalama</th></tr></thead><tbody>${averagesHtml}</tbody></table>
      <h3>Son Yorumlar</h3>
      ${commentsHtml}
    `;
  } catch (err) {
    console.error(err);
    box.innerHTML = `<div class="empty-state">Anket verileri alınamadı: ${escapeHtml(err.message || err)}</div>`;
  }
}
window.loadCustomerSurveyStats = loadCustomerSurveyStats;


function formatTL(value) {
  return Number(value || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 });
}
function normalizeCategoryKey(value) {
  return normalizeText(value || "");
}
function categoryValueMap() {
  const map = new Map();
  (state.categoryValues || []).forEach(v => map.set(normalizeCategoryKey(v.category), v));
  return map;
}
async function loadCategoryValues() {
  if (!state.products.length) {
    try { await loadProducts(); } catch (err) { console.warn("Ürünler alınamadı:", err?.message || err); }
  }
  // Yeni sistem: fiyatlar kategori tablosundan değil ürün kartlarındaki
  // alış_fiyati / ortalama_satis_fiyati alanlarından hesaplanır.
  state.categoryValues = [];
  renderCategoryValues();
}
window.loadCategoryValues = loadCategoryValues;
function computeCategoryValueRows() {
  const grouped = new Map();
  (state.products || []).forEach(p => {
    const category = String(p.category || "Kategorisiz").trim() || "Kategorisiz";
    const key = normalizeCategoryKey(category);
    const old = grouped.get(key) || { category, qty: 0, totalPurchase: 0, totalSale: 0, pricedProductCount: 0 };
    const qty = Number(p.stock || 0);
    const purchase = Number(p.purchasePrice || 0);
    const sale = Number(p.averageSalePrice || 0);
    old.qty += qty;
    old.totalPurchase += qty * purchase;
    old.totalSale += qty * sale;
    if (purchase > 0 || sale > 0) old.pricedProductCount += 1;
    grouped.set(key, old);
  });
  return [...grouped.values()]
    .map(row => ({
      ...row,
      purchase: row.qty ? row.totalPurchase / row.qty : 0,
      sale: row.qty ? row.totalSale / row.qty : 0,
      estimatedDiff: row.totalSale - row.totalPurchase,
      hasPrice: row.pricedProductCount > 0
    }))
    .sort((a,b) => a.category.localeCompare(b.category, "tr"));
}
function renderCategoryValues() {
  const rows = computeCategoryValueRows();
  state.categoryValueRows = rows;
  const totalPurchase = rows.reduce((s,r) => s + r.totalPurchase, 0);
  const totalSale = rows.reduce((s,r) => s + r.totalSale, 0);
  const totalDiff = totalSale - totalPurchase;
  const missing = rows.filter(r => !r.hasPrice).length;
  if (el.categoryValueSummary) {
    el.categoryValueSummary.innerHTML = `
      <div class="value-stat"><span>Toplam Alış Değeri</span><strong>${formatTL(totalPurchase)}</strong></div>
      <div class="value-stat"><span>Ort. Satış Değeri</span><strong>${formatTL(totalSale)}</strong></div>
      <div class="value-stat"><span>Tahmini Brüt Fark</span><strong>${formatTL(totalDiff)}</strong></div>
      <div class="value-stat ${missing ? "warning" : ""}"><span>Fiyat Girilmeyen Kategori</span><strong>${missing}</strong></div>
    `;
  }
  if (el.categoryValueList) {
    el.categoryValueList.innerHTML = `<div class="empty-state">Fiyatlar artık ürün kartından giriliyor. Kategori toplamları aşağıda otomatik hesaplanıyor.</div>`;
  }
  if (el.categoryValueDetail) {
    el.categoryValueDetail.innerHTML = rows.length ? `
      <div class="table-wrap"><table class="category-value-table">
        <thead><tr><th>Kategori</th><th>Stok</th><th>Ort. Alış</th><th>Ort. Satış</th><th>Alış Toplam</th><th>Satış Toplam</th><th>Fark</th></tr></thead>
        <tbody>${rows.map(r => `<tr class="${r.hasPrice ? "" : "missing-price"}"><td>${escapeHtml(r.category)}${r.hasPrice ? "" : " <span class='muted'>(fiyat yok)</span>"}</td><td>${r.qty}</td><td>${formatTL(r.purchase)}</td><td>${formatTL(r.sale)}</td><td>${formatTL(r.totalPurchase)}</td><td>${formatTL(r.totalSale)}</td><td>${formatTL(r.estimatedDiff)}</td></tr>`).join("")}</tbody>
      </table></div>
    ` : `<div class="empty-state">Hesaplanacak stok bulunamadı.</div>`;
  }
}
window.renderCategoryValues = renderCategoryValues;
window.editCategoryValue = function(id) {
  const row = (state.categoryValues || []).find(v => String(v.id) === String(id));
  if (!row) return;
  if (el.categoryValueId) el.categoryValueId.value = row.id;
  if (el.categoryValueCategory) el.categoryValueCategory.value = row.category || "";
  if (el.categoryValuePurchase) el.categoryValuePurchase.value = row.purchase_price || 0;
  if (el.categoryValueSale) el.categoryValueSale.value = row.average_sale_price || 0;
  el.categoryValueCategory?.focus();
};
window.clearCategoryValueForm = function() {
  if (el.categoryValueId) el.categoryValueId.value = "";
  if (el.categoryValueCategory) el.categoryValueCategory.value = "";
  if (el.categoryValuePurchase) el.categoryValuePurchase.value = "";
  if (el.categoryValueSale) el.categoryValueSale.value = "";
};
async function saveCategoryValueFromForm(e) {
  e?.preventDefault?.();
  const category = String(el.categoryValueCategory?.value || "").trim();
  if (!category) return showToast("Kategori adı boş olamaz", true);
  const payload = {
    category,
    purchase_price: Number(el.categoryValuePurchase?.value || 0),
    average_sale_price: Number(el.categoryValueSale?.value || 0)
  };
  const id = el.categoryValueId?.value || "";
  let error;
  if (id) {
    ({ error } = await supabaseClient.from("category_values").update(payload).eq("id", id));
  } else {
    ({ error } = await supabaseClient.from("category_values").upsert(payload, { onConflict: "category" }));
  }
  if (error) return showToast(error.message || "Kategori değeri kaydedilemedi", true);
  clearCategoryValueForm();
  await loadCategoryValues();
  showToast("Kategori değeri kaydedildi ✅");
}
window.saveCategoryValueFromForm = saveCategoryValueFromForm;
window.deleteCategoryValue = async function(id) {
  if (!(await appConfirm("Bu kategori fiyat kaydı silinsin mi? Stok ürünleri silinmez, sadece fiyat tanımı gider.", { danger: true }))) return;
  const { error } = await supabaseClient.from("category_values").delete().eq("id", id);
  if (error) return showToast(error.message || "Silinemedi", true);
  await loadCategoryValues();
  showToast("Kategori fiyatı silindi");
};



function uniqueProductFieldValues(field, fallbackLabel) {
  return [...new Set((state.products || [])
    .map(p => String(p?.[field] || fallbackLabel).trim() || fallbackLabel))]
    .sort((a, b) => a.localeCompare(b, "tr"));
}
function fillStockFilterSelect(selectId, values, selectedValue = "all", allLabel = "Tümü") {
  const select = document.getElementById(selectId);
  if (!select) return;
  const safeSelected = values.includes(selectedValue) ? selectedValue : "all";
  select.innerHTML = `<option value="all">${escapeHtml(allLabel)}</option>` + values.map(value =>
    `<option value="${escapeHtml(value)}" ${value === safeSelected ? "selected" : ""}>${escapeHtml(value)}</option>`
  ).join("");
}
function refreshStockCategoryFilters() {
  const categories = uniqueProductFieldValues("category", "Kategorisiz");
  const productBrands = uniqueProductFieldValues("productBrand", "Markasız");
  const carBrands = uniqueProductFieldValues("carBrand", "Araç Markası Yok");
  fillStockFilterSelect("criticalCategoryFilter", categories, state.criticalCategoryFilter || "all", "Tüm Kategoriler");
  fillStockFilterSelect("criticalProductBrandFilter", productBrands, state.criticalProductBrandFilter || "all", "Tüm Ürün Markaları");
  fillStockFilterSelect("criticalCarBrandFilter", carBrands, state.criticalCarBrandFilter || "all", "Tüm Araç Markaları");
  fillStockFilterSelect("orderSuggestionCategoryFilter", categories, state.orderSuggestionCategoryFilter || "all", "Tüm Kategoriler");
  fillStockFilterSelect("orderSuggestionProductBrandFilter", productBrands, state.orderSuggestionProductBrandFilter || "all", "Tüm Ürün Markaları");
  fillStockFilterSelect("orderSuggestionCarBrandFilter", carBrands, state.orderSuggestionCarBrandFilter || "all", "Tüm Araç Markaları");
}
window.setCriticalCategoryFilter = function(value) { state.criticalCategoryFilter = value || "all"; renderCriticalStock(); };
window.setCriticalProductBrandFilter = function(value) { state.criticalProductBrandFilter = value || "all"; renderCriticalStock(); };
window.setCriticalCarBrandFilter = function(value) { state.criticalCarBrandFilter = value || "all"; renderCriticalStock(); };
window.setOrderSuggestionCategoryFilter = function(value) { state.orderSuggestionCategoryFilter = value || "all"; renderOrderSuggestionRows(); };
window.setOrderSuggestionProductBrandFilter = function(value) { state.orderSuggestionProductBrandFilter = value || "all"; renderOrderSuggestionRows(); };
window.setOrderSuggestionCarBrandFilter = function(value) { state.orderSuggestionCarBrandFilter = value || "all"; renderOrderSuggestionRows(); };

function isOutgoingMovementType(type) {
  const t = normalizeText(type || "");
  if (!t) return false;
  if (t.includes("iade") || t.includes("giris") || t.includes("rezerv")) return false;
  return t.includes("cikis") || t.includes("satis") || t.includes("satıs") || t.includes("montaj") || t === "cikis";
}
function orderProductLabel(p = {}) {
  return [p.productBrand, p.category, p.carBrand, p.carModel, p.carType, p.vehicleYear]
    .filter(Boolean).join(" ").replace(/\s+/g, " ").trim() || p.name || "-";
}
async function fetchRecentOutgoingMovements(days = 7) {
  const start = new Date();
  start.setDate(start.getDate() - Number(days || 7));
  let rows = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await supabaseClient
      .from("stock_movements")
      .select("product_id,quantity,movement_type,created_at,description,stock_products(product_name,product_brand,category,vehicle_brand,vehicle_model,vehicle_type,vehicle_year,quantity,location)")
      .gte("created_at", start.toISOString())
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) throw error;
    rows = rows.concat(data || []);
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }
  return rows.filter(m => isOutgoingMovementType(m.movement_type));
}
function buildOrderSuggestionRows(movements) {
  const productMap = new Map((state.products || []).map(p => [String(p.id), p]));
  const grouped = new Map();
  (movements || []).forEach(m => {
    const productId = String(m.product_id || "");
    if (!productId) return;
    const qty = Number(m.quantity || 0);
    if (qty <= 0) return;
    const current = grouped.get(productId) || { productId, outQty: 0, lastDate: "", movementCount: 0 };
    current.outQty += qty;
    current.movementCount += 1;
    if (!current.lastDate || String(m.created_at || "") > String(current.lastDate || "")) current.lastDate = m.created_at || "";
    const localProduct = productMap.get(productId);
    const joined = m.stock_products || {};
    current.product = localProduct || {
      id: productId,
      name: joined.product_name || "-",
      productBrand: joined.product_brand || "",
      category: joined.category || "",
      carBrand: joined.vehicle_brand || "",
      carModel: joined.vehicle_model || "",
      carType: joined.vehicle_type || "",
      vehicleYear: joined.vehicle_year || "",
      stock: Number(joined.quantity || 0),
      location: joined.location || ""
    };
    grouped.set(productId, current);
  });
  return [...grouped.values()].map(row => {
    const p = row.product || {};
    const currentStock = Number(p.stock || 0);
    const suggestedQty = Math.max(0, Number(row.outQty || 0) - currentStock);
    return {
      productId: row.productId,
      productName: orderProductLabel(p),
      productBrand: p.productBrand || "",
      category: p.category || "",
      carBrand: p.carBrand || "",
      carModel: p.carModel || "",
      carType: p.carType || "",
      vehicleYear: p.vehicleYear || "",
      location: p.location || "",
      outQty: Number(row.outQty || 0),
      currentStock,
      suggestedQty,
      lastDate: row.lastDate || "",
      movementCount: row.movementCount || 0
    };
  }).sort((a, b) => (b.suggestedQty - a.suggestedQty) || (b.outQty - a.outQty) || a.productName.localeCompare(b.productName, "tr"));
}
function renderOrderSuggestionRows() {
  const box = document.getElementById("orderSuggestionList");
  const summary = document.getElementById("orderSuggestionSummary");
  if (!box) return;
  refreshStockCategoryFilters();
  const selectedCategory = state.orderSuggestionCategoryFilter || "all";
  const selectedProductBrand = state.orderSuggestionProductBrandFilter || "all";
  const selectedCarBrand = state.orderSuggestionCarBrandFilter || "all";
  const allRows = state.orderSuggestionRows || [];
  const rows = allRows.filter(r =>
    (selectedCategory === "all" || String(r.category || "Kategorisiz") === selectedCategory) &&
    (selectedProductBrand === "all" || String(r.productBrand || "Markasız") === selectedProductBrand) &&
    (selectedCarBrand === "all" || String(r.carBrand || "Araç Markası Yok") === selectedCarBrand)
  );
  const needRows = rows.filter(r => Number(r.suggestedQty || 0) > 0);
  const totalOut = rows.reduce((s, r) => s + Number(r.outQty || 0), 0);
  const totalSuggested = needRows.reduce((s, r) => s + Number(r.suggestedQty || 0), 0);
  if (summary) {
    summary.innerHTML = `
      <div class="value-stat"><span>Son 7 Gün Çıkış</span><strong>${totalOut}</strong></div>
      <div class="value-stat"><span>Sipariş Önerilen Ürün</span><strong>${needRows.length}</strong></div>
      <div class="value-stat"><span>Önerilen Toplam Adet</span><strong>${totalSuggested}</strong></div>
      <div class="value-stat"><span>Kategori</span><strong>${escapeHtml(selectedCategory === "all" ? "Tümü" : selectedCategory)}</strong></div>
      <div class="value-stat"><span>Ürün Markası</span><strong>${escapeHtml(selectedProductBrand === "all" ? "Tümü" : selectedProductBrand)}</strong></div>
      <div class="value-stat"><span>Araç Markası</span><strong>${escapeHtml(selectedCarBrand === "all" ? "Tümü" : selectedCarBrand)}</strong></div>
      <div class="value-stat"><span>Hesap</span><strong>Çıkış - Stok</strong></div>
    `;
  }
  if (!rows.length) {
    box.innerHTML = `<div class="empty-state">Son 7 günde çıkış hareketi bulunamadı.</div>`;
    return;
  }
  const categoryMap = new Map();
  rows.forEach(r => {
    const key = String(r.category || "Kategorisiz");
    const old = categoryMap.get(key) || { category: key, outQty: 0, currentStock: 0, suggestedQty: 0, productCount: 0 };
    old.outQty += Number(r.outQty || 0);
    old.currentStock += Number(r.currentStock || 0);
    old.suggestedQty += Number(r.suggestedQty || 0);
    old.productCount += 1;
    categoryMap.set(key, old);
  });
  const categoryRows = [...categoryMap.values()].sort((a,b) => (b.suggestedQty-a.suggestedQty) || (b.outQty-a.outQty));
  const categoryHtml = categoryRows.length ? `
    <div class="category-order-grid">${categoryRows.map(c => `
      <button type="button" class="category-order-card ${c.suggestedQty > 0 ? "need" : "ok"}" onclick="document.getElementById('orderSuggestionCategoryFilter').value='${escapeHtml(c.category)}'; setOrderSuggestionCategoryFilter('${escapeHtml(c.category)}')">
        <strong>${escapeHtml(c.category)}</strong>
        <span>${c.productCount} ürün · ${c.outQty} çıkış</span>
        <b>${c.suggestedQty} adet öneri</b>
      </button>`).join("")}</div>` : "";
  box.innerHTML = categoryHtml + `
    <div class="table-wrap"><table class="order-suggestion-table">
      <thead><tr><th>Ürün</th><th>Kategori</th><th>Araç</th><th>Son 7 Gün Çıkış</th><th>Mevcut Stok</th><th>Önerilen Sipariş</th><th>Raf</th><th>Son Çıkış</th></tr></thead>
      <tbody>${rows.map(r => `<tr class="${r.suggestedQty > 0 ? "need-order" : "no-order"}">
        <td><strong>${escapeHtml(r.productName)}</strong><div class="muted">${escapeHtml(r.productBrand || "-")}</div></td>
        <td>${escapeHtml(r.category || "-")}</td>
        <td>${escapeHtml([r.carBrand, r.carModel, r.carType, r.vehicleYear].filter(Boolean).join(" ") || "-")}</td>
        <td><strong>${Number(r.outQty || 0)}</strong></td>
        <td>${Number(r.currentStock || 0)}</td>
        <td><strong class="${r.suggestedQty > 0 ? "stock-warning" : ""}">${Number(r.suggestedQty || 0)}</strong></td>
        <td>${escapeHtml(r.location || "-")}</td>
        <td>${r.lastDate ? formatDate(r.lastDate) : "-"}</td>
      </tr>`).join("")}</tbody>
    </table></div>
  `;
}
async function loadOrderSuggestions() {
  const box = document.getElementById("orderSuggestionList");
  if (box) box.innerHTML = `<div class="empty-state">Son 7 günlük çıkışlar hesaplanıyor...</div>`;
  if (!state.products.length) {
    try { await loadProducts(); } catch (err) { console.warn("Ürünler alınamadı:", err?.message || err); }
  }
  const movements = await fetchRecentOutgoingMovements(7);
  state.orderSuggestionRows = buildOrderSuggestionRows(movements);
  renderOrderSuggestionRows();
}
window.loadOrderSuggestions = loadOrderSuggestions;
window.downloadOrderSuggestionExcel = function() {
  const selectedCategory = state.orderSuggestionCategoryFilter || "all";
  const selectedProductBrand = state.orderSuggestionProductBrandFilter || "all";
  const selectedCarBrand = state.orderSuggestionCarBrandFilter || "all";
  const rows = (state.orderSuggestionRows || []).filter(r =>
    Number(r.suggestedQty || 0) > 0 &&
    (selectedCategory === "all" || String(r.category || "Kategorisiz") === selectedCategory) &&
    (selectedProductBrand === "all" || String(r.productBrand || "Markasız") === selectedProductBrand) &&
    (selectedCarBrand === "all" || String(r.carBrand || "Araç Markası Yok") === selectedCarBrand)
  );
  if (!rows.length) return showToast("Excel'e aktarılacak sipariş önerisi yok", true);
  const sheetRows = rows.map(r => ({
    "Ürün": r.productName,
    "Ürün Markası": r.productBrand,
    "Kategori": r.category,
    "Araç Markası": r.carBrand,
    "Araç Modeli": r.carModel,
    "Araç Tipi": r.carType,
    "Model Yılı": r.vehicleYear,
    "Son 7 Gün Çıkış": r.outQty,
    "Mevcut Stok": r.currentStock,
    "Önerilen Sipariş": r.suggestedQty,
    "Raf/Konum": r.location,
    "Son Çıkış": r.lastDate ? formatDate(r.lastDate) : ""
  }));
  const ws = XLSX.utils.json_to_sheet(sheetRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sipariş Önerisi");
  const d = new Date().toLocaleDateString("tr-TR").replaceAll(".", "-");
  XLSX.writeFile(wb, `Siparis_Onerisi_${d}.xlsx`);
};


function computeCategoryBrandRows() {
  const grouped = new Map();
  (state.products || []).forEach(p => {
    const category = String(p.category || "Kategorisiz").trim() || "Kategorisiz";
    const productBrand = String(p.productBrand || "Markasız").trim() || "Markasız";
    const key = `${normalizeCategoryKey(category)}||${normalizeCategoryKey(productBrand)}`;
    const old = grouped.get(key) || { category, productBrand, productCount: 0, stockQty: 0, totalPurchase: 0, totalSale: 0 };
    const qty = Number(p.stock || 0);
    old.productCount += 1;
    old.stockQty += qty;
    old.totalPurchase += qty * Number(p.purchasePrice || 0);
    old.totalSale += qty * Number(p.averageSalePrice || 0);
    grouped.set(key, old);
  });
  return [...grouped.values()].sort((a,b) =>
    a.category.localeCompare(b.category, "tr") || a.productBrand.localeCompare(b.productBrand, "tr")
  );
}
function renderCategoryBrandManagement() {
  const rows = computeCategoryBrandRows();
  const totalProductCards = rows.reduce((s,r) => s + Number(r.productCount || 0), 0);
  const totalStockQty = rows.reduce((s,r) => s + Number(r.stockQty || 0), 0);
  const totalPurchase = rows.reduce((s,r) => s + Number(r.totalPurchase || 0), 0);
  const totalSale = rows.reduce((s,r) => s + Number(r.totalSale || 0), 0);
  if (el.managementCategoryBrandSummary) {
    el.managementCategoryBrandSummary.innerHTML = `
      <div class="value-stat"><span>Kategori/Marka Satırı</span><strong>${rows.length}</strong></div>
      <div class="value-stat"><span>Ürün Kartı</span><strong>${totalProductCards}</strong></div>
      <div class="value-stat"><span>Toplam Stok</span><strong>${totalStockQty}</strong></div>
      <div class="value-stat"><span>Ort. Satış Değeri</span><strong>${formatTL(totalSale)}</strong></div>
    `;
  }
  if (el.managementCategoryBrandList) {
    el.managementCategoryBrandList.innerHTML = rows.length ? `
      <div class="table-wrap"><table class="category-value-table">
        <thead><tr><th>Kategori</th><th>Ürün Markası</th><th>Ürün Kartı</th><th>Stok Adedi</th><th>Alış Toplam</th><th>Satış Toplam</th></tr></thead>
        <tbody>${rows.map(r => `<tr><td>${escapeHtml(r.category)}</td><td>${escapeHtml(r.productBrand)}</td><td>${Number(r.productCount || 0)}</td><td><strong>${Number(r.stockQty || 0)}</strong></td><td>${formatTL(r.totalPurchase)}</td><td>${formatTL(r.totalSale)}</td></tr>`).join("")}</tbody>
      </table></div>
    ` : `<div class="empty-state">Liste için stok ürünü bulunamadı.</div>`;
  }
}
window.renderCategoryBrandManagement = renderCategoryBrandManagement;

const DELETE_MARK_TEXT = "SİLİNECEK";
const DELETE_MARK_VARIANTS = ["SİLİNECEK", "SILINECEK", "Silinecek", "silinecek"];

async function loadDeleteMarkedCount() {
  const countEl = document.getElementById("deleteMarkedCount");
  const infoEl = document.getElementById("deleteMarkedInfo");
  const deleteBtn = document.getElementById("deleteMarkedProductsBtn");
  if (countEl) countEl.textContent = "...";
  if (infoEl) infoEl.textContent = "Sayı kontrol ediliyor...";
  if (deleteBtn) deleteBtn.disabled = true;

  try {
    const { count, error } = await supabaseClient
      .from("stock_products")
      .select("id", { count: "exact", head: true })
      .in("vehicle_brand", DELETE_MARK_VARIANTS);

    if (error) throw error;

    const total = Number(count || 0);
    if (countEl) countEl.textContent = String(total);
    if (infoEl) infoEl.textContent = total
      ? `${total} ürün kalıcı silmeye hazır. Araç Markası alanı "${DELETE_MARK_TEXT}" olanlar silinecek.`
      : `Araç Markası alanı "${DELETE_MARK_TEXT}" olan ürün bulunamadı.`;
    if (deleteBtn) deleteBtn.disabled = total <= 0;
    return total;
  } catch (err) {
    console.error(err);
    if (countEl) countEl.textContent = "!";
    if (infoEl) infoEl.textContent = err.message || "Silinecek ürün sayısı alınamadı.";
    showToast(err.message || "Silinecek ürün sayısı alınamadı", true);
    return 0;
  }
}
window.loadDeleteMarkedCount = loadDeleteMarkedCount;

async function fetchDeleteMarkedProductIds() {
  const ids = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabaseClient
      .from("stock_products")
      .select("id")
      .in("vehicle_brand", DELETE_MARK_VARIANTS)
      .range(from, from + pageSize - 1);

    if (error) throw error;
    const batch = data || [];
    ids.push(...batch.map(row => row.id).filter(Boolean));
    if (batch.length < pageSize) break;
    from += pageSize;
  }

  return ids;
}

async function deleteMarkedProducts() {
  if (!requireRoleAction(["admin"], "Toplu silme işlemini sadece Admin yapabilir")) return;

  const count = await loadDeleteMarkedCount();
  if (!count) return;

  const ok = await appConfirm(
    `${count} ürün kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam edilsin mi?`,
    { title: "Toplu Ürün Silme", okText: "Kalıcı Olarak Sil", cancelText: "Vazgeç", danger: true }
  );
  if (!ok) return;

  const secondOk = await appConfirm(
    `Son kontrol knk: Araç Markası "${DELETE_MARK_TEXT}" olan ${count} ürün tamamen silinsin mi?`,
    { title: "Son Onay", okText: "Evet, Sil", cancelText: "İptal", danger: true }
  );
  if (!secondOk) return;

  const deleteBtn = document.getElementById("deleteMarkedProductsBtn");
  const infoEl = document.getElementById("deleteMarkedInfo");
  try {
    if (deleteBtn) deleteBtn.disabled = true;
    if (infoEl) infoEl.textContent = "Silinecek ürünler hazırlanıyor...";

    const ids = await fetchDeleteMarkedProductIds();
    if (!ids.length) {
      showToast("Silinecek ürün bulunamadı");
      await loadDeleteMarkedCount();
      return;
    }

    const chunkSize = 500;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      if (infoEl) infoEl.textContent = `Hareket kayıtları temizleniyor: ${Math.min(i + chunk.length, ids.length)} / ${ids.length}`;
      await supabaseClient.from("stock_movements").delete().in("product_id", chunk);
    }

    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      if (infoEl) infoEl.textContent = `Ürünler siliniyor: ${Math.min(i + chunk.length, ids.length)} / ${ids.length}`;
      const { error } = await supabaseClient.from("stock_products").delete().in("id", chunk);
      if (error) throw error;
    }

    state.products = state.products.filter(p => !ids.includes(p.id));
    state.operationFilterOptionsLoaded = false;
    await Promise.all([
      loadDashboardStats().catch(() => {}),
      loadMovements().catch(() => {}),
      loadOperationFilterOptions().catch(() => {})
    ]);
    updateStats();
    refreshProductQuickLists();
    refreshOperationFilters();
    renderOperationResults();
    await loadDeleteMarkedCount();

    logActivity("bulk_delete", `${ids.length} ürün Araç Markası ${DELETE_MARK_TEXT} olduğu için kalıcı silindi`, "stock_products", DELETE_MARK_TEXT);
    showToast(`${ids.length} ürün kalıcı olarak silindi ✅`);
  } catch (err) {
    console.error(err);
    showToast(err.message || "Toplu silme başarısız oldu", true);
    await loadDeleteMarkedCount();
  } finally {
    if (deleteBtn) deleteBtn.disabled = false;
  }
}
window.deleteMarkedProducts = deleteMarkedProducts;


// ==================== SATIN ALMA / VERİLEN SİPARİŞLER ====================
function purchaseProductById(id) {
  return [...(state.operationResults || []), ...(state.products || [])].find(p => String(p.id) === String(id));
}
function renderPurchaseOrderDraft() {
  if (!el.purchaseDraftList) return;
  const rows = state.purchaseOrderDraft || [];
  if (!rows.length) {
    el.purchaseDraftList.innerHTML = `<div class="empty-state">Henüz siparişe ürün eklenmedi</div>`;
    if (el.purchaseDraftTotal) el.purchaseDraftTotal.textContent = "0";
    return;
  }
  el.purchaseDraftList.innerHTML = rows.map(item => `<div class="purchase-draft-item">
    <div><strong>${escapeHtml(item.name)}</strong><div class="muted">${escapeHtml(item.detail || "-")}</div></div>
    <input type="number" min="1" value="${Number(item.quantity || 1)}" onchange="setPurchaseOrderItemQty('${item.productId}', this.value)" aria-label="Sipariş miktarı"/>
    <button class="btn danger mini remove-order-item" type="button" onclick="removePurchaseOrderItem('${item.productId}')">Kaldır</button>
  </div>`).join("");
  if (el.purchaseDraftTotal) el.purchaseDraftTotal.textContent = rows.reduce((sum, i) => sum + Number(i.quantity || 0), 0);
}
window.addProductToPurchaseOrder = function(productId) {
  if (!requireRoleAction(["admin", "depo", "kasa"], "Sipariş oluşturma yetkin yok")) return;
  const p = purchaseProductById(productId);
  if (!p) return showToast("Ürün bulunamadı", true);
  const qty = getOperationQty(productId);
  const existing = state.purchaseOrderDraft.find(i => String(i.productId) === String(productId));
  if (existing) existing.quantity += qty;
  else state.purchaseOrderDraft.push({
    productId: p.id,
    name: p.name || p.category || "Ürün",
    detail: [p.productBrand, p.category, p.carBrand, p.carModel, p.carType, p.vehicleYear].filter(Boolean).join(" · "),
    quantity: qty
  });
  renderPurchaseOrderDraft();
  showToast(`${p.name || p.category || "Ürün"} sipariş listesine eklendi ✅`);
};
window.setPurchaseOrderItemQty = function(productId, value) {
  const row = state.purchaseOrderDraft.find(i => String(i.productId) === String(productId));
  if (!row) return;
  row.quantity = Math.max(1, Number(value || 1));
  renderPurchaseOrderDraft();
};
window.removePurchaseOrderItem = function(productId) {
  state.purchaseOrderDraft = state.purchaseOrderDraft.filter(i => String(i.productId) !== String(productId));
  renderPurchaseOrderDraft();
};
window.clearPurchaseOrderDraft = async function() {
  if (!state.purchaseOrderDraft.length) return;
  if (!(await appConfirm("Hazırladığın sipariş listesi temizlensin mi?", { danger: true, okText: "Temizle" }))) return;
  state.purchaseOrderDraft = [];
  renderPurchaseOrderDraft();
};
function purchaseOrderNo() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  return `TS${yy}${mm}${String(Date.now()).slice(-6)}`;
}
window.savePurchaseOrder = async function() {
  if (!requireRoleAction(["admin", "depo", "kasa"], "Sipariş oluşturma yetkin yok")) return;
  if (!state.purchaseOrderDraft.length) return showToast("Önce siparişe ürün ekle", true);
  const supplier = String(el.purchaseSupplier?.value || "").trim();
  if (!supplier) return showToast("Tedarikçi adını yaz", true);
  if (!(await appConfirm(`${supplier} için ${state.purchaseOrderDraft.length} kalem sipariş kaydedilsin mi?`, { okText: "Kaydet" }))) return;
  try {
    setLoading(true);
    const orderNo = purchaseOrderNo();
    const { data: order, error: orderError } = await supabaseClient.from("purchase_orders").insert({
      order_no: orderNo, supplier, expected_date: el.purchaseExpectedDate?.value || null,
      note: String(el.purchaseOrderNote?.value || "").trim() || null,
      status: "bekleniyor", created_by: currentStaff().name
    }).select("id").single();
    if (orderError) throw orderError;
    const items = state.purchaseOrderDraft.map(i => ({ order_id: order.id, product_id: i.productId, ordered_quantity: Number(i.quantity), received_quantity: 0 }));
    const { error: itemError } = await supabaseClient.from("purchase_order_items").insert(items);
    if (itemError) throw itemError;
    await logActivity("purchase_order_create", `${orderNo} - ${supplier} - ${items.length} kalem`, "purchase_orders", order.id);
    state.purchaseOrderDraft = [];
    if (el.purchaseSupplier) el.purchaseSupplier.value = "";
    if (el.purchaseExpectedDate) el.purchaseExpectedDate.value = "";
    if (el.purchaseOrderNote) el.purchaseOrderNote.value = "";
    renderPurchaseOrderDraft();
    await loadPurchaseOrders();
    showToast(`Sipariş kaydedildi: ${orderNo} ✅`);
  } catch (err) {
    console.error(err); showToast(err.message || "Sipariş kaydedilemedi. SQL dosyasını çalıştırdın mı?", true);
  } finally { setLoading(false); }
};
function purchaseOrderStatusLabel(status) {
  return status === "tamamlandi" ? "Tamamlandı" : status === "iptal" ? "İptal" : "Bekleniyor";
}
function renderPurchaseOrders() {
  if (!el.purchaseOrderList) return;
  const rows = state.purchaseOrders || [];
  const waiting = rows.filter(o => o.status === "bekleniyor");
  if (el.purchaseOrderBadge) {
    el.purchaseOrderBadge.textContent = String(waiting.length);
    el.purchaseOrderBadge.classList.toggle("hidden", waiting.length === 0);
  }
  if (!rows.length) { el.purchaseOrderList.innerHTML = `<div class="empty-state">Henüz kayıtlı sipariş yok</div>`; return; }
  el.purchaseOrderList.innerHTML = rows.map(o => {
    const items = o.purchase_order_items || [];
    return `<div class="purchase-order-card">
      <div class="movement-top"><div><strong>${escapeHtml(o.order_no || "Sipariş")}</strong><div class="muted">${escapeHtml(o.supplier || "-")} · ${formatDate(o.created_at)}</div></div><span class="badge ${o.status === "tamamlandi" ? "giris" : "status-bekliyor"}">${purchaseOrderStatusLabel(o.status)}</span></div>
      ${o.expected_date ? `<div>Tahmini geliş: <strong>${escapeHtml(o.expected_date)}</strong></div>` : ""}
      ${o.note ? `<div>Not: <strong>${escapeHtml(o.note)}</strong></div>` : ""}
      <div class="order-items">${items.map(i => `<div class="order-line"><span>${escapeHtml(i.stock_products?.product_name || "Ürün")}</span><strong>${Number(i.ordered_quantity || 0)} adet</strong></div>`).join("")}</div>
      ${o.status === "bekleniyor" ? `<div class="purchase-order-actions"><button class="btn success" onclick="receivePurchaseOrder('${o.id}')">📦 Tamamını Stoğa İşle</button><button class="btn danger" onclick="cancelPurchaseOrder('${o.id}')">İptal Et</button></div>` : ""}
    </div>`;
  }).join("");
}
window.loadPurchaseOrders = async function() {
  if (!el.purchaseOrderList) return;
  try {
    const { data, error } = await supabaseClient.from("purchase_orders")
      .select("id,order_no,supplier,expected_date,note,status,created_at,completed_at,purchase_order_items(id,product_id,ordered_quantity,received_quantity,stock_products(product_name,category,vehicle_brand,vehicle_model))")
      .order("created_at", { ascending: false }).limit(100);
    if (error) throw error;
    state.purchaseOrders = data || [];
    renderPurchaseOrders();
  } catch (err) {
    console.error(err);
    el.purchaseOrderList.innerHTML = `<div class="empty-state">Siparişler alınamadı. Önce paket içindeki SQL dosyasını Supabase'de çalıştır.</div>`;
  }
};
window.receivePurchaseOrder = async function(orderId) {
  const order = state.purchaseOrders.find(o => String(o.id) === String(orderId));
  if (!order) return;
  const total = (order.purchase_order_items || []).reduce((s, i) => s + Number(i.ordered_quantity || 0), 0);
  if (!(await appConfirm(`${order.order_no} içindeki toplam ${total} ürün stoklara eklensin mi? Bu işlem yalnızca bir kez yapılabilir.`, { okText: "Stoğa İşle" }))) return;
  try {
    setLoading(true);
    const { error } = await supabaseClient.rpc("receive_purchase_order", { p_order_id: orderId, p_actor: currentStaff().name });
    if (error) throw error;
    await logActivity("purchase_order_receive", `${order.order_no} stoğa işlendi`, "purchase_orders", orderId);
    state.operationCacheKey = "";
    await Promise.all([loadPurchaseOrders(), loadDashboardStats(), loadMovements()]);
    if (state.activeTab === "operation") await queryOperationProducts();
    showToast(`${order.order_no} tamamen stoğa işlendi ✅`);
  } catch (err) { console.error(err); showToast(err.message || "Sipariş stoğa işlenemedi", true); }
  finally { setLoading(false); }
};
window.cancelPurchaseOrder = async function(orderId) {
  const order = state.purchaseOrders.find(o => String(o.id) === String(orderId));
  if (!order || !(await appConfirm(`${order.order_no} iptal edilsin mi? Stok değişmeyecek.`, { danger: true, okText: "İptal Et" }))) return;
  try {
    const { error } = await supabaseClient.from("purchase_orders").update({ status: "iptal" }).eq("id", orderId).eq("status", "bekleniyor");
    if (error) throw error;
    await logActivity("purchase_order_cancel", `${order.order_no} iptal edildi`, "purchase_orders", orderId);
    await loadPurchaseOrders(); showToast("Sipariş iptal edildi");
  } catch (err) { showToast(err.message || "Sipariş iptal edilemedi", true); }
};

function switchTab(tab) {
  const staff = currentStaff();
  if (!canAccessTab(tab, staff.role)) {
    showToast(`${roleLabel(staff.role)} yetkisi bu sayfayı açamaz`, true);
    tab = ROLE_DEFAULT_TAB[staff.role] || "operation";
  }
  state.activeTab = tab;
  ["search", "add", "requests", "operation", "movements", "sale", "reports", "critical", "categoryValues", "orderSuggestion", "purchaseOrders", "surveys", "management", "notifications", "history", "users", "logs"].forEach((key) => {
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
if (tab === "operation") {
  loadOperationFilterOptions().catch(err => console.warn("İşlem filtreleri alınamadı:", err?.message || err));
  refreshOperationFilters();
  if (el.operationResultBox && !(el.operationBrandFilter?.value || el.operationCategoryFilter?.value || String(el.operationSearchInput?.value || "").trim())) {
    state.operationResults = [];
    el.operationResultBox.innerHTML = `<div class="empty-state">Filtre seç veya en az 2 karakter ürün ara</div>`;
  } else {
    renderOperationResults();
  }
}
if (["add", "critical", "management"].includes(tab) && !state.products.length) { loadProducts().catch(err => showToast(err.message || "Ürünler yüklenemedi", true)); }
if (tab === "management") {
  const ready = state.products.length ? Promise.resolve() : loadProducts();
  ready.then(() => { renderCategoryBrandManagement(); loadDeleteMarkedCount(); }).catch(err => showToast(err.message || "Yönetim verileri yüklenemedi", true));
}
if (tab === "sale") {
  renderSaleFavorites();
  renderSaleProducts();
  renderSaleCart();
  renderSaleDashboard();
}
if (tab === "requests") { clearNewRequestAlert(); loadStockRequests(); }
if (tab === "reports") renderReports();
if (tab === "critical") renderCriticalStock();
if (tab === "categoryValues") loadCategoryValues().catch(err => showToast(err.message || "Kategori değerleri alınamadı", true));
if (tab === "orderSuggestion") loadOrderSuggestions().catch(err => showToast(err.message || "Sipariş önerisi alınamadı", true));
if (tab === "purchaseOrders") { renderPurchaseOrderDraft(); loadPurchaseOrders(); }
if (tab === "surveys") loadCustomerSurveyStats();
if (tab === "management") loadDeleteMarkedCount();
if (tab === "notifications") { loadNotifications(); }
if (tab === "history") renderPlateHistory();
if (tab === "users") { renderUsersList(); renderRolePermissionEditor(); }
if (tab === "logs") { loadActivityLogs(); }
}
window.switchTab = switchTab;
function showUpdateNotice(newVersion) {
  if (document.getElementById("updateNotice")) return;

  const notice = document.createElement("div");
  notice.id = "updateNotice";
  notice.className = "update-notice";
  notice.innerHTML = `
    <div class="update-notice-text">
      <strong>⚡ Yeni sürüm hazır</strong>
      <span>${escapeHtml(newVersion || "")}</span>
    </div>
    <button type="button" id="updateNowBtn" class="update-now-btn">Güncelle</button>
  `;

  const runUpdate = async () => {
    notice.classList.add("is-updating");
    notice.innerHTML = `<strong>⚡ Güncelleniyor...</strong>`;

    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
      }

      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
      }

      localStorage.setItem("stok_app_version", String(newVersion || Date.now()));
    } catch (err) {
      console.warn("Güncelleme temizliği yapılamadı:", err);
    }

    window.location.reload(true);
  };

  notice.querySelector("#updateNowBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    runUpdate();
  });

  notice.addEventListener("click", runUpdate);
  document.body.appendChild(notice);
  showToast("Yeni sürüm mevcut ⚡ Güncelle butonuna basabilirsin.");
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
  refreshStockCategoryFilters();
  const q = normalizeText(document.getElementById("criticalSearchInput")?.value || "");
  const selectedCategory = state.criticalCategoryFilter || "all";
  const selectedProductBrand = state.criticalProductBrandFilter || "all";
  const selectedCarBrand = state.criticalCarBrandFilter || "all";
  let items = (state.products || []).filter(p => (Number(p.stock || 0) - Number(p.reserved || 0)) <= Number(p.minStock || 0));
  if (selectedCategory !== "all") items = items.filter(p => String(p.category || "Kategorisiz") === selectedCategory);
  if (selectedProductBrand !== "all") items = items.filter(p => String(p.productBrand || "Markasız") === selectedProductBrand);
  if (selectedCarBrand !== "all") items = items.filter(p => String(p.carBrand || "Araç Markası Yok") === selectedCarBrand);
  if (q) items = items.filter(p => productSmartSearch(p, q));
  items.sort((a, b) => (saleAvailable(a) - Number(a.minStock || 0)) - (saleAvailable(b) - Number(b.minStock || 0)));
  box.innerHTML = items.length ? items.map(p => {
    const available = saleAvailable(p);
    return `<div class="sale-product-item critical-card"><div><div class="sale-product-title">${escapeHtml(p.category || p.name || "-")}</div><div class="sale-product-meta">${escapeHtml(p.productBrand || "-")} / ${escapeHtml(p.carBrand || "-")} ${escapeHtml(p.carModel || "")} ${escapeHtml(p.carType || "")}<br>Mevcut: ${p.stock} · Rezerve: ${p.reserved} · Kullanılabilir: <strong class="stock-warning">${available}</strong> · Min: ${p.minStock} · Raf: ${escapeHtml(p.location || "-")}</div></div><button class="btn primary" onclick="editProduct('${p.id}')">Düzenle</button></div>`;
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

el.productForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!requireRoleAction(["admin", "depo"], "Ürün kaydetme yetkisi sadece Admin/Depo")) return;

  const payload = {
    id: el.productId.value.trim(),
    barcode: el.barcode.value.trim(),
    productBrand: el.productBrand.value.trim(),
    category: el.category.value.trim(),
    carBrand: el.carBrand.value.trim(),
    carModel: el.carModel.value.trim(),
    carType: el.carType.value.trim(),
    vehicleYear: el.vehicleYear.value.trim(),
    stock: el.stock.value.trim(),
    minStock: el.minStock.value.trim(),
    purchasePrice: el.productPurchasePrice?.value?.trim() || "0",
    averageSalePrice: el.productAverageSalePrice?.value?.trim() || "0",
    location: el.location.value.trim(),
    note: el.note.value.trim(),
    imageUrl: el.productImage?.value?.trim() || "",
    imageThumbUrl: el.productImage?.value?.trim() || ""
  };

  if (!payload.category || !payload.carBrand || !payload.carModel) {
    return showToast("Zorunlu alanlar: Ürün Kategorisi, Araç Markası, Araç Modeli", true);
  }

  try {
    setLoading(true);
    rememberProductSuggestions(payload);

    if (payload.id) {
      const uploaded = await uploadProductImageIfNeeded(payload.id);
      payload.imageUrl = uploaded.imageUrl;
      payload.imageThumbUrl = uploaded.imageThumbUrl;
      const { error } = await supabaseClient.from("stock_products").update(toProductRow(payload)).eq("id", payload.id);
      if (error) throw error;
      await logActivity("product_update", `Ürün güncellendi: ${payload.category} ${payload.carBrand} ${payload.carModel}`, "stock_products", payload.id);
      showToast("Ürün güncellendi");
    } else {
      const tempImageId = crypto.randomUUID();
      const uploaded = await uploadProductImageIfNeeded(tempImageId);
      payload.imageUrl = uploaded.imageUrl;
      payload.imageThumbUrl = uploaded.imageThumbUrl;
      const { data, error } = await supabaseClient.from("stock_products").insert(toProductRow(payload)).select("id").single();
      if (error) throw error;
      await logActivity("product_insert", `Ürün eklendi: ${payload.category} ${payload.carBrand} ${payload.carModel}`, "stock_products", data?.id);
      showToast("Ürün kaydedildi");
    }

    clearProductForm();
    state.operationFilterOptionsLoaded = false;
    await Promise.all([loadDashboardStats(), loadOperationFilterOptions().catch(() => {})]);
  } catch (err) {
    console.error(err);
    showToast(err.message || "Ürün kaydedilemedi", true);
  } finally {
    setLoading(false);
  }
});
if (el.clearProductBtn) el.clearProductBtn.addEventListener("click", clearProductForm);
if (el.productImageFile) el.productImageFile.addEventListener("change", handleProductImageFile);
if (el.productImageRemoveBtn) el.productImageRemoveBtn.addEventListener("click", removeSelectedProductImage);
if (el.productImageViewBtn) el.productImageViewBtn.addEventListener("click", () => openProductImage());
async function smartRefresh() {
  if (state.activeTab === "requests") { await loadStockRequests(); return; }
  if (state.activeTab === "notifications") { await loadNotifications(); return; }
  if (state.activeTab === "operation") {
    await Promise.all([loadDashboardStats(), loadMovements()]);
    renderOperationResults();
    return;
  }
  if (["add", "critical", "search", "orderSuggestion", "management"].includes(state.activeTab)) {
    await Promise.all([loadProducts(), loadMovements()]);
    return;
  }
  await loadAll();
}
if (el.refreshBtn) el.refreshBtn.addEventListener("click", smartRefresh);
if (el.enableNotifyBtn) el.enableNotifyBtn.addEventListener("click", enablePushNotifications);
if (el.searchInput) el.searchInput.addEventListener("input", applySearch);
if (el.movementSearchInput) el.movementSearchInput.addEventListener("input", renderMovementSearchResults);
if (el.productSearchInput) el.productSearchInput.addEventListener("input", () => searchProductsForRequest(el.productSearchInput.value));
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
[el.excelProductBrandFilter, el.excelCategoryFilter, el.excelCarBrandFilter]
  .filter(Boolean).forEach(select => select.addEventListener("change", updateExcelFilterSummary));
if (el.categoryValueForm) el.categoryValueForm.addEventListener("submit", saveCategoryValueFromForm);
initProductSuggestionInputs();
if ("serviceWorker" in navigator) { window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(console.error)); }
async function bootApp() {
  await Promise.all([loadStaffListFromSupabase(), loadRolePermissionsFromSupabase()]);
  initAuthGate();
  renderStaffSelector();
  switchTab(canAccessTab("operation") ? "operation" : (ROLE_DEFAULT_TAB[currentStaff().role] || "operation"));
  loadActivityLogs();
  loadDashboardStats().catch(err => console.error(err));
  loadMovements().catch(err => console.error(err));
  // Araç kabul entegrasyonu askıda: talepler/bildirimler arka planda yüklenmiyor.
  initUpdateChecker();
}
bootApp();
async function heartbeatCurrentUser() {
  try {
    const session = currentSession();

    if (!session?.name) return;

    await supabaseClient
      .from("app_users")
      .update({
        last_seen_at: new Date().toISOString()
      })
      .eq("name", session.name);

  } catch (err) {
    console.warn("Heartbeat hatası:", err);
  }
}

setInterval(heartbeatCurrentUser, 30000);

heartbeatCurrentUser();
async function fetchProductsForExcel() {
  const filters = getExcelFilterValues();
  let allRows = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const to = from + pageSize - 1;
    let query = supabaseClient
      .from("stock_products")
      .select(STOCK_PRODUCT_SELECT)
      .order("product_name", { ascending: true })
      .range(from, to);

    if (filters.productBrand) query = query.eq("product_brand", filters.productBrand);
    if (filters.category) query = query.eq("category", filters.category);
    if (filters.carBrand) query = query.eq("vehicle_brand", filters.carBrand);

    const { data, error } = await query;
    if (error) throw error;
    allRows = allRows.concat(data || []);
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }

  return allRows.map(mapProduct);
}

async function downloadStockExcel() {
  try {
    const selectedProducts = await fetchProductsForExcel();
    if (!selectedProducts.length) {
      showToast("Bu filtrede indirilecek ürün yok", true);
      return;
    }

    showToast(`${selectedProducts.length} ürün için Excel hazırlanıyor...`);

    const rows = selectedProducts.map(p => ({
      id: p.id,
      urun_markasi: p.productBrand || "",
      kategori: p.category || "",
      arac_markasi: p.carBrand || "",
      arac_modeli: p.carModel || "",
      arac_tipi: p.carType || "",
      model_yili: p.vehicleYear || "",
      mevcut_stok: p.stock || 0,
      minimum_stok: p.minStock || 0,
      alis_fiyati: p.purchasePrice || 0,
      ortalama_satis_fiyati: p.averageSalePrice || 0,
      raf_konum: p.location || "",
      aciklama: p.note || "",
      resim_url: p.imageUrl || ""
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Stok");

    const filters = getExcelFilterValues();
    const fileSuffix = Object.values(filters).filter(Boolean).join("-")
      .replace(/[^a-zA-Z0-9ğüşöçıİĞÜŞÖÇ-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "tum-stok";

    const fileName = `stok-listesi-${fileSuffix}.xlsx`;
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 1500);

    showToast(`Excel indirildi ✅ (${selectedProducts.length} ürün)`);

  } catch (err) {
    console.error(err);
    showToast("Excel indirilemedi", true);
  }
}

function normalizeExcelCell(value) {
  return String(value ?? "").trim();
}
function excelNumber(value, fallback = 0) {
  if (value === "" || value === null || value === undefined) return fallback;
  const normalized = String(value).replace(",", ".").trim();
  const num = Number(normalized);
  return Number.isFinite(num) ? num : fallback;
}

async function uploadStockExcel(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const activeFilters = getExcelFilterValues();
    const activeFilterText = Object.values(activeFilters).filter(Boolean).join(" / ");
    const confirmed = await appConfirm(
      activeFilterText
        ? `Excel yüklenecek. Aktif filtre: ${activeFilterText}\n\nID olan satırlar güncellenecek, ID boş olan satırlar yeni ürün olarak eklenecek. Devam edilsin mi?`
        : "Excel yüklenecek. ID olan satırlar güncellenecek, ID boş olan satırlar yeni ürün olarak eklenecek. Devam edilsin mi?",
      { title: "Excel yükleme onayı", okText: "Yükle", cancelText: "Vazgeç" }
    );
    if (!confirmed) {
      event.target.value = "";
      return;
    }

    showToast("Excel okunuyor...");

    const buffer = await file.arrayBuffer();

    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

    let success = 0;
    let failed = 0;
    let skipped = 0;
    createExcelProgress();
updateExcelProgress(0, rows.length, success, failed);

    for (const r of rows) {
      const payload = {
        barcode: normalizeExcelCell(r.barkod) || null,
        product_brand: normalizeExcelCell(r.urun_markasi) || null,
        category: normalizeExcelCell(r.kategori) || null,
        vehicle_brand: normalizeExcelCell(r.arac_markasi) || null,
        vehicle_model: normalizeExcelCell(r.arac_modeli) || null,
        vehicle_type: normalizeExcelCell(r.arac_tipi) || null,
        vehicle_year: normalizeExcelCell(r.model_yili) || null,
        quantity: excelNumber(r.mevcut_stok, 0),
        min_stock: excelNumber(r.minimum_stok, 0),
        purchase_price: excelNumber(r.alis_fiyati ?? r.purchase_price, 0),
        average_sale_price: excelNumber(r.ortalama_satis_fiyati ?? r.average_sale_price, 0),
        location: normalizeExcelCell(r.raf_konum) || null,
        note: normalizeExcelCell(r.aciklama) || null,
        image_url: normalizeExcelCell(r.resim_url || r.image_url || r.gorsel_url) || null,
        image_thumb_url: normalizeExcelCell(r.resim_url || r.image_url || r.gorsel_url) || null
      };

      payload.product_name = [
        payload.product_brand,
        payload.category,
        payload.vehicle_brand,
        payload.vehicle_model,
        payload.vehicle_type,
        payload.vehicle_year
      ].filter(Boolean).join(" ").replace(/\s+/g, " ").trim() || payload.category || "Ürün";

      if (!payload.category && !payload.vehicle_brand && !payload.vehicle_model) {
  skipped++;
  updateExcelProgress(success + failed + skipped, rows.length, success, failed);
  await new Promise(resolve => setTimeout(resolve, 0));
  continue;
}

      rememberProductSuggestions({
        productBrand: payload.product_brand,
        category: payload.category,
        carBrand: payload.vehicle_brand,
        carModel: payload.vehicle_model,
        carType: payload.vehicle_type,
        vehicleYear: payload.vehicle_year,
        location: payload.location
      });

      let result;
      const id = normalizeExcelCell(r.id);
      if (id) {
        result = await supabaseClient.from("stock_products").update(payload).eq("id", id);
      } else {
        result = await supabaseClient.from("stock_products").insert(payload);
      }

      if (result.error) {
        console.error(result.error);
        failed++;
      } else {
        success++;
      }
      updateExcelProgress(success + failed + skipped, rows.length, success, failed);
await new Promise(resolve => setTimeout(resolve, 0));
    }
closeExcelProgress();
    await loadProducts();

    showToast(`Yükleme tamamlandı ✅ Başarılı: ${success} Hatalı: ${failed} Atlanan: ${skipped}`);
    event.target.value = "";

  } catch (err) {
    console.error(err);
    showToast(err.message || "Excel yüklenemedi", true);
    event.target.value = "";
  }
}

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


// === v3.4 Akıllı Tema Sistemi ===
const STOCK_THEME_KEY = 'garage_stock_theme';
const STOCK_THEME_NAMES = {
  'garage-dark': 'Garage Dark',
  'garage-exclusive': 'Garage Exclusive',
  'midnight-blue': 'Midnight Blue',
  'emerald': 'Emerald',
  'carbon-orange': 'Carbon Orange',
  'light': 'Light'
};

function setStockTheme(themeName, showMessage = true) {
  const safeTheme = STOCK_THEME_NAMES[themeName] ? themeName : 'garage-dark';
  document.documentElement.setAttribute('data-theme', safeTheme);
  try { localStorage.setItem(STOCK_THEME_KEY, safeTheme); } catch (err) { console.warn(err); }

  const themeColor = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#08101d';
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.setAttribute('content', themeColor);

  document.querySelectorAll('.theme-option').forEach(btn => {
    const active = btn.dataset.themeValue === safeTheme;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });

  const text = document.getElementById('themeCurrentText');
  if (text) text.textContent = `Seçili tema: ${STOCK_THEME_NAMES[safeTheme]}`;
  if (showMessage && typeof showToast === 'function') showToast(`${STOCK_THEME_NAMES[safeTheme]} teması uygulandı ✅`);
}

function initializeStockTheme() {
  let saved = 'garage-dark';
  try { saved = localStorage.getItem(STOCK_THEME_KEY) || 'garage-dark'; } catch (err) { console.warn(err); }
  setStockTheme(saved, false);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeStockTheme, { once: true });
} else {
  initializeStockTheme();
}
