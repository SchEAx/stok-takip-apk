// Navigasyon, şifre değişimi, güncelleme ve realtime olayları
function switchTab(tab, options = {}) {
  const staff = currentStaff();
  if (!canAccessTab(tab, staff.role)) {
    showToast(`${roleLabel(staff.role)} yetkisi bu sayfayı açamaz`, true);
    tab = ROLE_DEFAULT_TAB[staff.role] || "operation";
  }
  state.activeTab = tab;
  ["search", "add", "requests", "reservations", "operation", "movements", "sale", "reports", "critical", "categoryValues", "orderSuggestion", "purchaseOrders", "surveys", "management", "notifications", "history", "users", "settings", "logs"].forEach((key) => {
    const page = document.getElementById("page-" + key);
    const nav = document.getElementById("nav-" + key);
    if (page) page.classList.add("hidden");
    if (nav) nav.classList.remove("active");
  });
  const activePage = document.getElementById("page-" + tab);
  const activeNav = document.getElementById("nav-" + tab);
  if (activePage) activePage.classList.remove("hidden");
  if (activeNav) activeNav.classList.add("active");

  const activeSectionLabel = document.getElementById("activeSectionLabel");
  if (activeSectionLabel) {
    const rawLabel = String(activeNav?.textContent || tab || "İşlem")
      .replace(/\d+/g, "")
      .replace(/\s+/g, " ")
      .trim();
    activeSectionLabel.textContent = rawLabel || "İşlem";
  }

  if (activePage) {
    activePage.classList.remove("flow-page-enter");
    void activePage.offsetWidth;
    activePage.classList.add("flow-page-enter");
  }

  // Geniş içerikten kalan yatay body scroll sabit GarageFlow menüsünü bozmasın.
  document.documentElement.scrollLeft = 0;
  document.body.scrollLeft = 0;
  updateStaffMeta(staff.name, { lastSeenAt: new Date().toISOString(), role: staff.role });
  renderUsersList();
if (tab === "operation") {
  loadOperationFilterOptions().catch(err => console.warn("İşlem filtreleri alınamadı:", err?.message || err));
  refreshOperationFilters();
  if (options.showSavedProduct && state.operationResults?.length) {
    renderOperationCards(state.operationResults);
  } else if (el.operationResultBox && !(el.operationBrandFilter?.value || el.operationCategoryFilter?.value || String(el.operationSearchInput?.value || "").trim())) {
    state.operationResults = [];
    el.operationResultBox.innerHTML = `<div class="empty-state">Filtre seç veya en az 2 karakter ürün ara</div>`;
  } else {
    renderOperationResults();
  }
}
if (["add", "management"].includes(tab) && !state.products.length) { loadProducts().catch(err => showToast(err.message || "Ürünler yüklenemedi", true)); }
if (tab === "add" && typeof loadMigrationExcelFilterOptions === "function") {
  loadMigrationExcelFilterOptions().catch(err =>
    showToast(err?.message || "Excel filtreleri alınamadı", true)
  );
}
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
if (tab === "reservations") loadManualReservations();
if (tab === "reports") renderReports();
if (tab === "critical") loadCriticalStock().catch(err => showToast(err.message || "Kritik stok alınamadı", true));
if (tab === "categoryValues") loadCategoryValues().catch(err => showToast(err.message || "Kategori değerleri alınamadı", true));
if (tab === "orderSuggestion") loadOrderSuggestions().catch(err => showToast(err.message || "Sipariş önerisi alınamadı", true));
if (tab === "purchaseOrders") { loadSharedPurchaseOrderDraft(); loadPurchaseOrders(); subscribeSharedPurchaseOrderDraft(); }
if (tab === "surveys") loadCustomerSurveyStats();
if (tab === "management") loadDeleteMarkedCount();
if (tab === "notifications") { loadNotifications(); }
if (tab === "history") renderPlateHistory();
if (tab === "users") {
  renderUsersList();
  renderRolePermissionEditor();
  renderUserCategoryPermissions();

  // Personel izinleri ile kategori kaynaklarını birlikte tazele. Eski /api/users
  // cevabı bazı alanları atlıyorsa migration-api cache guard mevcut seçimleri korur.
  const staffLoader = typeof loadStaffListFromServer === "function"
    ? loadStaffListFromServer()
    : Promise.resolve();
  const categoryLoader = typeof loadUserPermissionCategorySources === "function"
    ? loadUserPermissionCategorySources()
    : loadOperationFilterOptions();

  Promise.allSettled([staffLoader, categoryLoader]).then(results => {
    const rejected = results.find(result => result.status === "rejected");
    renderUsersList();
    renderRolePermissionEditor();
    renderUserCategoryPermissions();
    if (rejected) {
      console.warn("Yetki ekranı yenileme uyarısı:", rejected.reason?.message || rejected.reason);
      showToast(rejected.reason?.message || "Yetki bilgileri tam yenilenemedi", true);
    }
  });
}
if (tab === "settings") initializeStockTheme();
if (tab === "logs") { loadActivityLogs(); }
}
window.switchTab = switchTab;

// Android geri tuşu WebView geçmişini kullanır. Tek bir koruma kaydı tutarak
// açık pencereleri kapatır, sonra işlem ekranına ve çıkış onayına döneriz.
let garageBackGuardReady = false;
let garageExitConfirmOpen = false;
let garageBackGuardActive = false;
let garageExiting = false;

function armGarageBackGuard() {
  history.pushState({ garageBackGuard: true }, "", location.href);
  garageBackGuardActive = true;
}

function initGarageBackGuard() {
  if (garageBackGuardReady) return;
  garageBackGuardReady = true;
  // Yenilemede eski geçici pencere kaydını taşımayalım.
  history.replaceState({ garageBackBase: true }, "", location.href);
  armGarageBackGuard();
}

window.addEventListener("popstate", () => {
  if (!garageBackGuardReady) return;
  garageBackGuardActive = false;
  const locationModal = document.getElementById('productLocationModal');
  if (locationModal && !locationModal.classList.contains('hidden')) {
    closeProductLocationModal();
    armGarageBackGuard();
    return;
  }

  if (garageExiting) {
    // Önce başlangıç geçmişi, varsa onun da öncesi kapanır.
    window.close();
    history.back();
    return;
  }

  if (garageExitConfirmOpen) {
    // Çıkış sorusu açıkken bir kez daha geri: uygulamadan çık.
    document.getElementById("appConfirmOk")?.click();
    return;
  }

  const visible = id => {
    const node = document.getElementById(id);
    return node && !node.classList.contains("hidden");
  };

  if (visible("appConfirmOverlay")) {
    document.getElementById("appConfirmCancel")?.click();
  } else if (visible("operationBarcodeScannerModal")) {
    window.closeOperationBarcodeScanner?.();
  } else if (visible("operationBarcodeActionModal")) {
    window.closeBarcodeActionModal?.();
  } else if (visible("productCameraModal")) {
    window.closeProductCamera?.();
  } else if (visible("productImageModal")) {
    window.closeProductImageModal?.(true);
  } else if (state.activeTab !== "operation") {
    switchTab("operation");
  } else {
    armGarageBackGuard();
    garageExitConfirmOpen = true;
    appConfirm("Uygulamadan çıkmak istiyor musun? Geri tuşuna tekrar basarak da çıkabilirsin.", {
      title: "Çıkış onayı", okText: "Çık", cancelText: "Kal"
    }).then(confirmed => {
      garageExitConfirmOpen = false;
      if (confirmed) {
        garageExiting = true;
        window.close();
        history.back();
      }
    });
    return;
  }

  armGarageBackGuard();
});
async function changeOwnPassword() {
  const currentInput = document.getElementById("currentPasswordInput");
  const newInput = document.getElementById("newPasswordInput");
  const repeatInput = document.getElementById("repeatPasswordInput");
  const button = document.getElementById("changePasswordBtn");

  const currentPassword = String(currentInput?.value || "");
  const newPassword = String(newInput?.value || "");
  const repeatPassword = String(repeatInput?.value || "");

  if (!currentPassword || !newPassword || !repeatPassword) {
    return showToast("Şifre alanlarının tamamını doldur", true);
  }
  if (newPassword.length < 4) {
    return showToast("Yeni şifre en az 4 karakter olmalı", true);
  }
  if (newPassword.length > 128) {
    return showToast("Yeni şifre çok uzun", true);
  }
  if (newPassword !== repeatPassword) {
    return showToast("Yeni şifreler aynı değil", true);
  }
  if (currentPassword === newPassword) {
    return showToast("Yeni şifre mevcut şifreden farklı olmalı", true);
  }

  try {
    if (button) button.disabled = true;
    setLoading(true);

    await apiFetch("/api/auth/change-password", {
      method: "POST",
      body: {
        current_password: currentPassword,
        new_password: newPassword
      }
    });

    if (currentInput) currentInput.value = "";
    if (newInput) newInput.value = "";
    if (repeatInput) repeatInput.value = "";

    await logActivity(
      "password_change",
      "Kullanıcı kendi GarageFlow şifresini değiştirdi",
      "app_users",
      null
    ).catch(() => {});

    showToast("Şifre güncellendi ✅ Yeni şifrenle tekrar giriş yap");

    setTimeout(() => {
      logoutCurrentUser().catch(() => {
        setMigrationToken("");
        state.currentUser = null;
        showLogin();
      });
    }, 900);
  } catch (err) {
    console.error(err);
    showToast(err?.message || "Şifre değiştirilemedi", true);
  } finally {
    setLoading(false);
    if (button) button.disabled = false;
  }
}
window.changeOwnPassword = changeOwnPassword;

const PWA_BUILD_VERSION = String(
  window.GARAGE_BUILD_VERSION
  || document.querySelector('meta[name="garage-build-version"]')?.getAttribute('content')
  || APP_VERSION
).trim();
let deferredPwaInstallPrompt = null;
let pwaUpdateCheckRunning = false;

function isStandalonePwa() {
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches
    || window.navigator.standalone === true
  );
}

function setPwaInstallButtonVisible(visible) {
  const button = document.getElementById("pwaInstallBtn");
  if (!button) return;
  button.classList.toggle("hidden", !visible || isStandalonePwa());
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPwaInstallPrompt = event;
  setPwaInstallButtonVisible(true);
});

window.addEventListener("appinstalled", () => {
  deferredPwaInstallPrompt = null;
  setPwaInstallButtonVisible(false);
  showToast("Garage Stok cihaza yüklendi ✅");
});

async function installPwaApp() {
  if (isStandalonePwa()) {
    showToast("Uygulama zaten yüklü ✅");
    return;
  }

  if (!deferredPwaInstallPrompt) {
    showToast("Yükleme seçeneği şu an tarayıcı tarafından sunulmuyor.", true);
    return;
  }

  const prompt = deferredPwaInstallPrompt;
  deferredPwaInstallPrompt = null;
  setPwaInstallButtonVisible(false);

  await prompt.prompt();
  const choice = await prompt.userChoice;

  if (choice?.outcome === "accepted") {
    showToast("Uygulama yükleniyor ✅");
  } else {
    showToast("Yükleme iptal edildi");
  }
}
window.installPwaApp = installPwaApp;

function normalizeBuildVersion(value) {
  const raw = String(value || "").replace(/\s+/g, "").trim();
  const legacy = raw.match(/MIGRATION-TEST-JWT-([0-9]+(?:\.[0-9]+)*)$/i);
  const version = legacy ? legacy[1] : raw.replace(/^v(?=\d)/i, "");
  if (!/^\d+(?:\.\d+)*$/.test(version) || version.length > 64) return "";
  return version.split(".").every(part => Number.isSafeInteger(Number(part))) ? version : "";
}

function compareBuildVersions(left, right) {
  const a = normalizeBuildVersion(left);
  const b = normalizeBuildVersion(right);
  if (!a || !b) return null;
  const aParts = a.split(".").map(Number);
  const bParts = b.split(".").map(Number);
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const difference = (aParts[i] || 0) - (bParts[i] || 0);
    if (difference) return difference > 0 ? 1 : -1;
  }
  return 0;
}

function readHtmlBuildVersion(html) {
  const text = String(html || "");
  const meta = (text.match(/<meta\b[^>]*>/gi) || []).find(tag =>
    /\bname\s*=\s*["']garage-build-version["']/i.test(tag)
  );
  const metaVersion = normalizeBuildVersion(meta?.match(/\bcontent\s*=\s*["']([^"']*)["']/i)?.[1]);
  const scriptVersion = normalizeBuildVersion(text.match(/\bwindow\.GARAGE_BUILD_VERSION\s*=\s*(["'])([0-9]+(?:\.[0-9]+)*)\1\s*;/)?.[2]);
  // Bir yorumda veya eski dosya adında sürümün geçmesi yeterli değildir.
  return metaVersion && compareBuildVersions(metaVersion, scriptVersion) === 0 ? metaVersion : "";
}

function setPwaVersionMetadata(key, value) {
  try { localStorage.setItem(key, value); } catch {}
}

function hasAttemptedPwaUpdate(targetVersion) {
  let savedTarget = "";
  try { savedTarget = sessionStorage.getItem("garage_auto_update_target") || ""; } catch {}
  const urlTarget = new URL(window.location.href).searchParams.get("__garage_update_target");
  return compareBuildVersions(savedTarget, targetVersion) === 0
    || compareBuildVersions(urlTarget, targetVersion) === 0;
}

function finishPwaBuildUpdate() {
  const runtime = normalizeBuildVersion(PWA_BUILD_VERSION);
  setPwaVersionMetadata("stok_app_version", runtime);
  try {
    const target = sessionStorage.getItem("garage_auto_update_target");
    if (compareBuildVersions(runtime, target) >= 0 && normalizeBuildVersion(target)) {
      sessionStorage.removeItem("garage_auto_update_target");
    }
    localStorage.removeItem("stok_app_update_target");
  } catch {}
  const url = new URL(window.location.href);
  const target = url.searchParams.get("__garage_update_target");
  if (normalizeBuildVersion(target) && compareBuildVersions(runtime, target) >= 0) {
    url.searchParams.delete("__garage_update_target");
    try { history.replaceState(history.state, "", url.href); } catch {}
  }
}

async function hardLoadFreshBuild(targetVersion) {
  const target = normalizeBuildVersion(targetVersion);
  if (compareBuildVersions(target, PWA_BUILD_VERSION) !== 1) return false;
  if (hasAttemptedPwaUpdate(target)) return false;

  const freshUrl = new URL("./index.html", window.location.href);
  freshUrl.searchParams.set("__garage_build", target);
  freshUrl.searchParams.set("__garage_ts", String(Date.now()));
  freshUrl.searchParams.set("__garage_update_target", target);
  const response = await fetch(freshUrl.href, {
    method: "GET",
    cache: "no-store",
    credentials: "same-origin",
    headers: { "Cache-Control": "no-cache, no-store, must-revalidate", "Pragma": "no-cache" }
  });
  if (!response.ok) throw new Error(`Yeni uygulama dosyası alınamadı (${response.status})`);
  const actualVersion = readHtmlBuildVersion(await response.text());
  if (compareBuildVersions(actualVersion, target) !== 0) {
    throw new Error("Güncelleme henüz hazır değil; mevcut uygulama açık tutuluyor.");
  }

  // Gecikmiş yayınlarda aynı sekmeyi aynı hedefe ikinci kez yönlendirmeyiz.
  // sessionStorage engelliyse URL işareti de döngüyü durdurur.
  try { sessionStorage.setItem("garage_auto_update_target", target); } catch {}
  // Gerçek navigation temiz bir document ve JS ortamı açar. Mevcut sayfanın
  // içine HTML yazıp uygulamayı aynı ortamda yeniden başlatmayız.
  // JWT, kullanıcı bilgisi ve tema localStorage'da korunur.
  window.location.replace(freshUrl.href);
  return true;
}

let pwaWorkerRegistrationPromise = null;
async function registerPwaServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  if (!pwaWorkerRegistrationPromise) {
    pwaWorkerRegistrationPromise = (async () => {
      const registration = await navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" });
      try { await registration.update(); }
      catch (err) { console.warn("Service worker kontrolü yapılamadı:", err); }
      return registration;
    })().catch(err => { pwaWorkerRegistrationPromise = null; throw err; });
  }
  return pwaWorkerRegistrationPromise;
}
window.registerPwaServiceWorker = registerPwaServiceWorker;

let pwaAutoUpdateInProgress = false;
async function applyRemoteAppVersion(newVersion) {
  const remote = normalizeBuildVersion(newVersion);
  if (compareBuildVersions(remote, PWA_BUILD_VERSION) !== 1 || pwaAutoUpdateInProgress) return false;
  if (hasAttemptedPwaUpdate(remote)) return false;
  pwaAutoUpdateInProgress = true;
  let navigating = false;
  try {
    navigating = await hardLoadFreshBuild(remote);
    if (navigating) {
      document.getElementById("updateNotice")?.remove();
      if (typeof showToast === "function") showToast(`Yeni sürüm ${remote} yükleniyor…`);
    }
    return navigating;
  } finally {
    if (!navigating) pwaAutoUpdateInProgress = false;
  }
}

async function fetchRemoteAppVersion() {
  const response = await fetch("./version.json?_=" + Date.now(), {
    cache: "no-store", headers: { "Cache-Control": "no-cache" }
  });
  if (!response.ok) throw new Error(`Sürüm dosyası alınamadı (${response.status})`);
  const data = await response.json();
  return String(data.version || "").trim();
}

async function checkAppVersion({ silent = true } = {}) {
  if (pwaUpdateCheckRunning || pwaAutoUpdateInProgress) return false;
  pwaUpdateCheckRunning = true;
  try {
    const remote = normalizeBuildVersion(await fetchRemoteAppVersion());
    const runtime = normalizeBuildVersion(PWA_BUILD_VERSION);
    if (!remote) return false;
    setPwaVersionMetadata("stok_app_remote_version", remote);
    if (compareBuildVersions(remote, runtime) === 1) {
      return await applyRemoteAppVersion(remote);
    }
    // Eski veya aynı version.json asla yenileme/downgrade başlatmaz.
    document.getElementById("updateNotice")?.remove();
    finishPwaBuildUpdate();
    if (!silent && typeof showToast === "function") showToast(`Uygulama güncel ✅ ${runtime}`);
    return false;
  } catch (err) {
    console.warn("Sürüm kontrolü yapılamadı:", err?.message || err);
    if (!silent && typeof showToast === "function") showToast(err?.message || "Güncelleme kontrolü yapılamadı", true);
    return false;
  } finally { pwaUpdateCheckRunning = false; }
}

async function forceCheckAppUpdate() {
  const button = document.getElementById("checkUpdateBtn");
  const oldText = button?.textContent;
  if (button) { button.disabled = true; button.textContent = "Kontrol..."; }
  try {
    const registration = await registerPwaServiceWorker().catch(() => null);
    try { await registration?.update?.(); } catch {}
    await checkAppVersion({ silent: false });
  } finally {
    if (button) { button.disabled = false; button.textContent = oldText || "Güncelleme Kontrol"; }
  }
}
window.forceCheckAppUpdate = forceCheckAppUpdate;

let pwaUpdateCheckerInitialized = false;
function initUpdateChecker() {
  if (pwaUpdateCheckerInitialized) return;
  pwaUpdateCheckerInitialized = true;
  finishPwaBuildUpdate();
  checkAppVersion({ silent: true });
  window.setInterval(() => checkAppVersion({ silent: true }), 5 * 60 * 1000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") checkAppVersion({ silent: true });
  });
  window.addEventListener("online", () => checkAppVersion({ silent: true }));
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
  setInterval(async () => {
    try { if (document.visibilityState === "visible") await loadStockRequests(); }
    catch (err) { console.warn("Talep yenileme başarısız:", err?.message || err); }
  }, 15000);
}




// ============================================================
// v15.8 - Kalabalık açıklamaları ! bilgi balonuna çevir
// ============================================================
(function initGarageInfoPopovers() {
  const nodes = [...document.querySelectorAll('.collapsible-info')];
  nodes.forEach((node, index) => {
    if (node.dataset.infoReady === '1') return;
    node.dataset.infoReady = '1';

    const text = String(node.innerText || node.textContent || '').trim();
    if (!text) return;

    node.classList.add('garage-info-source');
    node.setAttribute('aria-hidden', 'true');

    const wrap = document.createElement('span');
    wrap.className = 'garage-info-wrap';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'garage-info-btn';
    btn.setAttribute('aria-label', node.dataset.infoTitle || 'Bilgi');
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = '!';

    const bubble = document.createElement('div');
    bubble.className = 'garage-info-bubble hidden';
    bubble.setAttribute('role', 'status');
    bubble.innerHTML = `<strong>${escapeHtml(node.dataset.infoTitle || 'Bilgi')}</strong><div>${escapeHtml(text).replace(/\n+/g, '<br>')}</div>`;

    let timer = null;
    const close = () => {
      bubble.classList.add('hidden');
      btn.setAttribute('aria-expanded', 'false');
      if (timer) clearTimeout(timer);
      timer = null;
    };
    const open = () => {
      document.querySelectorAll('.garage-info-bubble:not(.hidden)').forEach(x => x.classList.add('hidden'));
      bubble.classList.remove('hidden');
      btn.setAttribute('aria-expanded', 'true');
      if (timer) clearTimeout(timer);
      timer = setTimeout(close, 4000);
    };

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (bubble.classList.contains('hidden')) open(); else close();
    });
    wrap.addEventListener('mouseleave', () => { if (!bubble.classList.contains('hidden')) close(); });
    wrap.append(btn, bubble);
    node.parentNode.insertBefore(wrap, node);
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('.garage-info-wrap')) return;
    document.querySelectorAll('.garage-info-bubble:not(.hidden)').forEach(x => x.classList.add('hidden'));
  });
})();
