// Satın alma / verilen siparişler
// ==================== SATIN ALMA / SİPARİŞ HAVUZU ====================
let purchaseDraftRealtimeChannel = null;
function purchaseProductById(id) {
  return [...(state.operationResults || []), ...(state.products || [])].find(p => String(p.id) === String(id));
}
async function loadSharedPurchaseOrderDraft() { throw new Error("VDS API yüklenmeden sipariş taslağı alınamaz."); }
function subscribeSharedPurchaseOrderDraft() { return null; }
function renderPurchaseOrderDraft() {
  if (!el.purchaseDraftList) return;
  const rows = state.purchaseOrderDraft || [];
  if (!rows.length) {
    el.purchaseDraftList.innerHTML = `<div class="empty-state">Sipariş havuzunda ürün yok</div>`;
    if (el.purchaseDraftTotal) el.purchaseDraftTotal.textContent = "0";
    return;
  }
  el.purchaseDraftList.innerHTML = rows.map(item => `<div class="purchase-draft-item">
    <div><strong>${escapeHtml(item.name)}</strong><div class="muted">${escapeHtml(item.detail || "-")}</div></div>
    <input type="number" min="1" value="${Number(item.quantity || 1)}" onchange="setPurchaseOrderItemQty('${item.productId}', this.value)" aria-label="Sipariş miktarı"/>
    <input class="draft-supplier" type="text" value="${escapeHtml(item.supplierHint || "")}" placeholder="Tedarikçi / marka" onchange="setPurchaseDraftSupplier('${item.productId}', this.value)"/>
    <button class="btn success mini create-order-item" type="button" onclick="openPurchaseOrderGroupModal('${item.productId}')">Sipariş Oluştur</button>
    <button class="btn danger mini remove-order-item" type="button" onclick="removePurchaseOrderItem('${item.productId}')">Kaldır</button>
  </div>`).join("");
  if (el.purchaseDraftTotal) el.purchaseDraftTotal.textContent = rows.reduce((sum, i) => sum + Number(i.quantity || 0), 0);
}
window.addProductToPurchaseOrder = async function() { throw new Error("VDS API yüklenmeden sipariş işlemi yapılamaz."); };
window.setPurchaseOrderItemQty = async function() { throw new Error("VDS API yüklenmeden sipariş işlemi yapılamaz."); };
window.setPurchaseDraftSupplier = async function() { throw new Error("VDS API yüklenmeden sipariş işlemi yapılamaz."); };
window.removePurchaseOrderItem = async function() { throw new Error("VDS API yüklenmeden sipariş işlemi yapılamaz."); };
window.clearPurchaseOrderDraft = async function() { throw new Error("VDS API yüklenmeden sipariş işlemi yapılamaz."); };
function purchaseOrderNo() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  return `TS${yy}${mm}${String(Date.now()).slice(-6)}`;
}
function selectedPurchaseGroupIds() {
  return [...document.querySelectorAll('[data-purchase-group-item]:checked')].map(x => x.value);
}
function updatePurchaseGroupSelectedCount() {
  if (el.purchaseGroupSelectedCount) el.purchaseGroupSelectedCount.textContent = String(selectedPurchaseGroupIds().length);
}
window.selectAllPurchaseItems = function(checked = true) {
  document.querySelectorAll('[data-purchase-group-item]').forEach(x => { x.checked = !!checked; });
  updatePurchaseGroupSelectedCount();
};
window.selectSameSupplierPurchaseItems = function() {
  const supplier = String(el.purchaseGroupSupplier?.value || "").trim().toLocaleLowerCase("tr-TR");
  const seed = state.purchaseOrderDraft.find(x => String(x.productId) === String(state.purchaseGroupSeedProductId));
  document.querySelectorAll('[data-purchase-group-item]').forEach(box => {
    const row = state.purchaseOrderDraft.find(x => String(x.productId) === String(box.value));
    const hint = String(row?.supplierHint || row?.productBrand || "").trim().toLocaleLowerCase("tr-TR");
    box.checked = !!supplier && hint === supplier;
  });
  if (seed) {
    const seedBox = document.querySelector(`[data-purchase-group-item][value="${seed.productId}"]`);
    if (seedBox) seedBox.checked = true;
  }
  updatePurchaseGroupSelectedCount();
};
window.openPurchaseOrderGroupModal = async function(seedProductId = null) {
  await loadSharedPurchaseOrderDraft();
  if (!state.purchaseOrderDraft.length) return showToast("Sipariş havuzunda ürün yok", true);
  state.purchaseGroupSeedProductId = seedProductId || null;
  const seed = state.purchaseOrderDraft.find(x => String(x.productId) === String(seedProductId));
  const suggestedSupplier = seed?.supplierHint || seed?.productBrand || "";
  if (el.purchaseGroupSupplier) el.purchaseGroupSupplier.value = suggestedSupplier;
  if (el.purchaseGroupExpectedDate) el.purchaseGroupExpectedDate.value = el.purchaseExpectedDate?.value || "";
  if (el.purchaseGroupNote) el.purchaseGroupNote.value = el.purchaseOrderNote?.value || "";
  if (el.purchaseGroupItemList) {
    el.purchaseGroupItemList.innerHTML = state.purchaseOrderDraft.map(item => {
      const sameSupplier = suggestedSupplier && String(item.supplierHint || item.productBrand || "").toLocaleLowerCase("tr-TR") === String(suggestedSupplier).toLocaleLowerCase("tr-TR");
      const checked = !seedProductId || String(item.productId) === String(seedProductId) || sameSupplier;
      return `<label class="purchase-group-row"><input data-purchase-group-item type="checkbox" value="${item.productId}" ${checked ? "checked" : ""} onchange="updatePurchaseGroupSelectedCount()"/><div><strong>${escapeHtml(item.name)}</strong><div class="muted">${escapeHtml(item.detail || "-")}</div></div><strong>${Number(item.quantity)} adet</strong></label>`;
    }).join("");
  }
  updatePurchaseGroupSelectedCount();
  el.purchaseGroupModal?.classList.remove("hidden");
};
window.closePurchaseOrderGroupModal = function() { el.purchaseGroupModal?.classList.add("hidden"); };
window.updatePurchaseGroupSelectedCount = updatePurchaseGroupSelectedCount;
window.createGroupedPurchaseOrder = async function() { throw new Error("VDS API yüklenmeden sipariş oluşturulamaz."); };
window.savePurchaseOrder = window.createGroupedPurchaseOrder;
function purchaseOrderStatusLabel(status) {
  return status === "tamamlandi" ? "Tamamlandı" : status === "kismi" ? "Kısmi Geldi" : status === "iptal" ? "İptal" : "Sipariş Verildi";
}
function renderPurchaseOrders() {
  if (!el.purchaseOrderList) return;
  const rows = state.purchaseOrders || [];
  const waiting = rows.filter(o => ["bekleniyor", "kismi"].includes(o.status));
  if (el.purchaseOrderBadge) { el.purchaseOrderBadge.textContent = String(waiting.length); el.purchaseOrderBadge.classList.toggle("hidden", waiting.length === 0); }
  if (!rows.length) { el.purchaseOrderList.innerHTML = `<div class="empty-state">Henüz oluşturulmuş sipariş yok</div>`; return; }
  el.purchaseOrderList.innerHTML = rows.map(o => {
    const items = o.purchase_order_items || [];
    const active = ["bekleniyor", "kismi"].includes(o.status);
    return `<div class="purchase-order-card">
      <div class="movement-top"><div><strong>${escapeHtml(o.order_no || "Sipariş")}</strong><div class="muted">${escapeHtml(o.supplier || "-")} · ${formatDate(o.created_at)}</div></div><span class="badge ${o.status === "tamamlandi" ? "giris" : "status-bekliyor"}">${purchaseOrderStatusLabel(o.status)}</span></div>
      ${o.expected_date ? `<div>Tahmini geliş: <strong>${escapeHtml(o.expected_date)}</strong></div>` : ""}
      ${o.note ? `<div>Not: <strong>${escapeHtml(o.note)}</strong></div>` : ""}
      <div class="partial-receive-grid">${items.map(i => { const ordered=Number(i.ordered_quantity||0), received=Number(i.received_quantity||0), remaining=Math.max(ordered-received,0); return `<div class="partial-receive-row"><span>${escapeHtml(i.stock_products?.product_name || "Ürün")}<div class="order-progress">Sipariş: ${ordered} · Gelen: ${received} · Kalan: ${remaining}</div></span>${active && remaining>0 ? `<div class="partial-input-wrap"><input type="number" min="0" max="${remaining}" value="0" data-receive-order="${o.id}" data-receive-item="${i.id}" aria-label="Gelen adet"/><button class="btn ghost mini" type="button" onclick="fillPurchaseReceiveRemaining('${o.id}','${i.id}',${remaining})">Kalanı Yaz</button></div>` : ""}<strong>${remaining} kalan</strong></div>`; }).join("")}</div>
      ${active ? `<div class="purchase-order-actions"><button class="btn success" onclick="receivePurchaseOrderPartial('${o.id}')">Gelenleri Stoğa İşle</button><button class="btn primary" onclick="receivePurchaseOrderAll('${o.id}')">📦 Tamamını Al</button><button class="btn danger" onclick="cancelPurchaseOrder('${o.id}')">İptal Et</button></div>` : ""}
    </div>`;
  }).join("");
}
window.loadPurchaseOrders = async function() { throw new Error("VDS API yüklenmeden siparişler alınamaz."); };
window.fillPurchaseReceiveRemaining = function(orderId, itemId, remaining) {
  const input = document.querySelector(`[data-receive-order="${orderId}"][data-receive-item="${itemId}"]`);
  if (input) input.value = Math.max(0, Number(remaining || 0));
};
window.receivePurchaseOrderPartial = async function() { throw new Error("VDS API yüklenmeden sipariş girişi yapılamaz."); };
window.receivePurchaseOrderAll = async function() { throw new Error("VDS API yüklenmeden sipariş girişi yapılamaz."); };
window.receivePurchaseOrder = window.receivePurchaseOrderAll;
window.cancelPurchaseOrder = async function() { throw new Error("VDS API yüklenmeden sipariş iptal edilemez."); };

