// Stok: ürünler, arama, giriş/çıkış, talepler ve stok ekranları
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

async function loadDashboardStats() { throw new Error("VDS API yüklenmeden sayaçlar alınamaz."); }
window.loadDashboardStats = loadDashboardStats;

async function loadOperationFilterOptions() { throw new Error("VDS API yüklenmeden filtreler alınamaz."); }
window.loadOperationFilterOptions = loadOperationFilterOptions;

async function loadProducts() { throw new Error("VDS API yüklenmeden ürünler alınamaz."); }
async function loadMovements() { throw new Error("VDS API yüklenmeden hareketler alınamaz."); }
async function loadStockRequests() { throw new Error("VDS API yüklenmeden talepler alınamaz."); }

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

function productSearchText(p) { return normalizeText([p.name, p.productBrand, p.category, p.carBrand, p.carModel, p.carType, p.vehicleYear, p.note].join(" ")); }
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

  if (!q) {
    state.filteredProducts = state.products;
  } else {
    // Arama tek bir rafı eşleştirse bile aynı ürüne ait diğer rafları toplamdan düşürme.
    const matchingKeys = new Set(
      state.products.filter((p) => productSmartSearch(p, q) || barcodeSmartSearch(p, q)).map(groupedStockIdentityKey)
    );
    state.filteredProducts = state.products.filter((p) => matchingKeys.has(groupedStockIdentityKey(p)));
  }

  renderProducts();
}

function stockGroupLocationHtml(group) {
  return group.members
    .slice()
    .sort((a, b) => String(a.location || "").localeCompare(String(b.location || ""), "tr"))
    .map((p) => {
      const available = Number(p.stock || 0) - Number(p.reserved || 0);
      const details = [
        p.barcode ? `Barkod: <strong>${escapeHtml(p.barcode)}</strong>` : "Barkod yok",
        p.note ? `Not: <strong>${escapeHtml(p.note)}</strong>` : ""
      ].filter(Boolean).join(" · ");
      return `<div class="stock-location-line">
        <div><strong>${escapeHtml(p.location || "Konum yok")}</strong> · Stok: <strong>${Number(p.stock || 0)}</strong> · Rezerve: <strong>${Number(p.reserved || 0)}</strong> · Kullanılabilir: <strong>${available}</strong>${details ? `<div class="muted">${details}</div>` : ""}</div>
        <button class="action-btn edit mini" type="button" onclick="editProduct('${p.id}')">Düzenle</button>
      </div>`;
    }).join("");
}

function renderProducts() {
  if (!el.productTableBody) return;
  if (!state.filteredProducts.length) { el.productTableBody.innerHTML = `<tr><td colspan="14" class="empty-cell">Kayıt bulunamadı</td></tr>`; return; }

  const groups = buildGroupedStockProductGroups(state.filteredProducts)
    .sort((a, b) => String(a.first?.name || a.first?.category || "").localeCompare(String(b.first?.name || b.first?.category || ""), "tr"));

  el.productTableBody.innerHTML = groups.map((group) => {
    const p = group.first;
    const available = group.totalStock - group.totalReserved;
    const isLow = available <= Number(group.minStockTotal || 0);
    const barcodes = [...group.barcodes];
    const barcodeLabel = !barcodes.length ? "-" : barcodes.length === 1 ? barcodes[0] : `${barcodes.length} farklı barkod`;
    const groupCountText = group.members.length > 1 ? `<div class="muted grouped-stock-count">${group.members.length} kayıt birleşti</div>` : "";
    return `<tr class="grouped-stock-row">
      <td>${productImageHtml(p, "product-thumb")}</td>
      <td><strong>${escapeHtml(barcodeLabel)}</strong>${groupCountText}<button class="btn secondary mini grouped-barcode-btn" type="button" onclick="assignBarcodeToStockGroup('${p.id}')">Barkod Ver</button></td>
      <td>${escapeHtml(p.productBrand || "-")}</td>
      <td>${escapeHtml(p.category || "-")}</td>
      <td>${escapeHtml(p.carBrand || "-")}</td>
      <td>${escapeHtml(p.carModel || "-")}</td>
      <td>${escapeHtml(p.carType || "-")}</td>
      <td>${escapeHtml(p.vehicleYear || "-")}</td>
      <td><strong>${group.totalStock}</strong></td>
      <td>${group.totalReserved}</td>
      <td class="${isLow ? "low-stock" : ""}"><strong>${available}</strong></td>
      <td>${group.minStockTotal}</td>
      <td><div class="stock-location-stack">${stockGroupLocationHtml(group)}</div></td>
      <td><div class="action-group"><button class="action-btn edit" onclick="editProduct('${p.id}')">İlk Kaydı Düzenle</button></div></td>
    </tr>`;
  }).join("");
}

window.assignBarcodeToStockGroup = async function() { showToast("Toplu barkod işlemi VDS endpointine taşınmadı", true); };
function renderMovements() {
  if (!state.movements.length) { el.movementList.innerHTML = `<div class="empty-state">Henüz hareket yok</div>`; return; }
  el.movementList.innerHTML = state.movements.map((m) => {
    const productName = m.product_name || m.stock_products?.product_name || m.description || "-";
    const type = String(m.movement_type || "").toLowerCase();
    const typeClass = type.includes("giris") || type.includes("iade") || (type.includes("rezerv") && !type.includes("iptal")) ? "giris" : "cikis";
    // Hareket API'sinin kendi konumu önceliklidir. Ürünün güncel konumu
    // yalnızca yedek gösterilir; geçmişteki işlem rafıymış gibi sunulmaz.
    const recordedLocation = String(m.movement_location || m.location_at_movement || m.location || "").trim();
    const currentLocation = String(m.stock_products?.location || "").trim();
    const locationText = recordedLocation || currentLocation || "Konum bilgisi yok";
    const locationLabel = recordedLocation ? "İşlem rafı / konum" : currentLocation ? "Güncel ürün rafı" : "Raf / Konum";
    const categoryText = m.category || m.stock_products?.category || "";
    return `<div class="movement-item"><div class="movement-top"><div><strong>${escapeHtml(productName)}</strong><div class="muted">${escapeHtml(m.description || "-")}</div></div><span class="badge ${typeClass}">${escapeHtml(m.movement_type || "-")}</span></div>
      <div class="movement-detail-line">Miktar: <strong>${Number(m.quantity || 0)}</strong></div>
      <div class="movement-detail-line">Plaka: <strong>${escapeHtml(m.plate || "-")}</strong></div>
      <div class="movement-detail-line">Kayıt No: <strong>${escapeHtml(m.record_no || "-")}</strong></div>
      <div class="movement-location-row ${recordedLocation ? "has-location" : ""}"><span class="movement-location-label">📍 ${escapeHtml(locationLabel)}</span><strong>${escapeHtml(locationText)}</strong></div>
      ${categoryText ? `<div class="movement-detail-line">Kategori: <strong>${escapeHtml(categoryText)}</strong></div>` : ""}
      <div class="movement-detail-line">Tarih: <strong>${formatDate(m.created_at)}</strong></div></div>`;
  }).join("");
}
function productPriceWithCostHtml(product, members = [product]) {
  const costs = members.map(item => Number(item.purchasePrice || 0)).filter(Number.isFinite);
  const low = Math.min(...costs);
  const high = Math.max(...costs);
  const costText = low === high ? formatTL(low) : `${formatTL(low)} – ${formatTL(high)}`;
  const costLabel = low === high ? "Maliyet" : "Maliyet (konuma göre)";
  const cost = `${costLabel}: ${costText}`;
  return `<div class="operation-price-row">
    <div class="operation-price-line">Satış Fiyatı: <strong>${formatTL(product.averageSalePrice || 0)}</strong></div>
    <button class="operation-cost-toggle" type="button" onclick="toggleProductCost(this)" data-cost="${escapeHtml(cost)}" aria-pressed="false" aria-label="Maliyeti göster" title="Maliyeti göster">👁</button>
  </div>`;
}
window.toggleProductCost = function(button) {
  const visible = button.getAttribute("aria-pressed") !== "true";
  button.setAttribute("aria-pressed", String(visible));
  button.textContent = visible ? button.dataset.cost : "👁";
  button.setAttribute("aria-label", visible ? `${button.dataset.cost}. Gizlemek için dokun` : "Maliyeti göster");
  button.title = visible ? "Maliyeti gizle" : "Maliyeti göster";
};
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
        ${productPriceWithCostHtml(p)}
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
  // Miktar değişince eski veri katmanı'e tekrar sorgu atma; sadece mevcut kartları yeniden çiz.
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

  const groups = buildGroupedStockProductGroups(results)
    .sort((a, b) => String(a.first?.name || a.first?.category || "").localeCompare(String(b.first?.name || b.first?.category || ""), "tr"));

  el.operationResultBox.innerHTML = groups.slice(0, 120).map((group) => {
    const p = group.first;
    const totalAvailable = group.totalStock - group.totalReserved;
    const vehicle = [p.carBrand, p.carModel, p.carType, p.vehicleYear].filter(Boolean).join(" ");
    const barcodes = [...group.barcodes];
    const barcodeText = !barcodes.length ? "Barkod yok" : barcodes.length === 1 ? `Barkod: <strong>${escapeHtml(barcodes[0])}</strong>` : `<strong>${barcodes.length} farklı barkod</strong>`;

    const locationRows = group.members
      .slice()
      .sort((a, b) => String(a.location || "").localeCompare(String(b.location || ""), "tr"))
      .map(item => {
        const available = Number(item.stock || 0) - Number(item.reserved || 0);
        const qty = getOperationQty(item.id);
        return `<div class="operation-location-row">
          <div class="operation-location-info">
            <div class="operation-location-title"><span class="operation-location-badge">📍 ${escapeHtml(item.location || "Konum yok")}</span>${item.barcode ? `<span class="operation-location-badge subtle">Barkod: <strong>${escapeHtml(item.barcode)}</strong></span>` : ""}</div>
            <div class="muted">Stok: <strong>${Number(item.stock || 0)}</strong> · Rezerve: <strong>${Number(item.reserved || 0)}</strong> · Kullanılabilir: <strong class="${available <= 0 ? "stock-warning" : ""}">${available}</strong>${item.note ? ` · Not: <strong>${escapeHtml(item.note)}</strong>` : ""}</div>
          </div>
          <div class="operation-location-actions">
            <div class="operation-qty-row">
              <button class="btn secondary mini" onclick="stepOperationQty('${item.id}', -1)">-</button>
              <input type="number" min="1" value="${qty}" onchange="setOperationQty('${item.id}', this.value)" />
              <button class="btn secondary mini" onclick="stepOperationQty('${item.id}', 1)">+</button>
            </div>
            ${userActionAllowed("stockIn") ? `<button class="btn success" onclick="operationStockAction('${item.id}', 'giris')">Giriş</button>` : ""}
            ${userActionAllowed("stockOut") ? `<button class="btn danger" onclick="operationStockAction('${item.id}', 'cikis')" ${available <= 0 ? "disabled" : ""}>Çıkış</button>` : ""}
            ${userActionAllowed("addToOrderPool") ? `<button class="btn primary" onclick="addProductToPurchaseOrder('${item.id}')">📦 Sipariş</button>` : ""}
            <button class="btn secondary" onclick="editProduct('${item.id}')">Düzenle</button>
            <button class="btn danger" onclick="deleteProduct('${item.id}')">Sil</button>
          </div>
        </div>`;
      }).join("");

    const detailPills = [
      p.productBrand ? `<div class="operation-meta-pill"><span class="pill-label">Marka</span><strong>${escapeHtml(p.productBrand)}</strong></div>` : "",
      `<div class="operation-meta-pill operation-meta-category"><span class="pill-label">Kategori</span><strong>${escapeHtml(p.category || "-")}</strong></div>`,
      p.carBrand ? `<div class="operation-meta-pill"><span class="pill-label">Araç Markası</span><strong>${escapeHtml(p.carBrand)}</strong></div>` : "",
      p.carModel ? `<div class="operation-meta-pill"><span class="pill-label">Model</span><strong>${escapeHtml(p.carModel)}</strong></div>` : "",
      p.carType ? `<div class="operation-meta-pill"><span class="pill-label">Tip</span><strong>${escapeHtml(p.carType)}</strong></div>` : "",
      p.vehicleYear ? `<div class="operation-meta-pill"><span class="pill-label">Yıl</span><strong>${escapeHtml(p.vehicleYear)}</strong></div>` : "",
      `<div class="operation-meta-pill"><span class="pill-label">Barkod</span><strong>${barcodes.length ? (barcodes.length === 1 ? escapeHtml(barcodes[0]) : `${barcodes.length} farklı barkod`) : "Barkod yok"}</strong></div>`,
      `<div class="operation-meta-pill operation-meta-location-count"><span class="pill-label">Konum Sayısı</span><strong>${group.members.length}</strong></div>`
    ].filter(Boolean).join("");

    return `<div class="operation-card grouped-operation-card">
      ${productImageHtml(p, "product-card-img")}
      <div class="operation-main grouped-operation-main">
        <div class="operation-group-head">
          <div>
            <div class="operation-title">${escapeHtml(p.name || p.category || "Ürün")}</div>
            <div class="operation-meta-grid">${detailPills}</div>
          </div>
          <button class="btn secondary mini" type="button" onclick="assignBarcodeToStockGroup('${p.id}')">Barkod Ver</button>
        </div>
        <div class="operation-stock-row grouped-operation-total">
          <span>TOPLAM STOK: <b>${group.totalStock}</b></span>
          <span>Rezerve: <b>${group.totalReserved}</b></span>
          <span>Kullanılabilir: <b class="${totalAvailable <= 0 ? "stock-warning" : ""}">${totalAvailable}</b></span>
          <span class="operation-vehicle-summary">Araç Özeti: <b>${escapeHtml(vehicle || "-")}</b></span>
        </div>
        ${productPriceWithCostHtml(p, group.members)}
        <div class="operation-location-list">${locationRows}</div>
      </div>
    </div>`;
  }).join("");
}

function escapeIlikeValue(value) {
  return String(value || "").replace(/[%_,]/g, "");
}

async function fetchOperationProductRows() { return []; }

function uniqueRowsById(rows) {
  const map = new Map();
  (rows || []).forEach(row => {
    if (!row?.id) return;
    map.set(String(row.id), row);
  });
  return [...map.values()];
}

async function searchStockProducts() { throw new Error("VDS API yüklenmeden ürün aranamaz."); }

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

    let results = filterProductsByCurrentUser(rows.map(mapProduct)).filter(p =>
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
window.operationStockAction = async function() { throw new Error("VDS API yüklenmeden stok işlemi yapılamaz."); };

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
function fillProductForm(product) { el.productId.value = product.id || ""; el.barcode.value = product.barcode || ""; el.productBrand.value = product.productBrand || ""; el.category.value = product.category || ""; el.carBrand.value = product.carBrand || ""; el.carModel.value = product.carModel || ""; el.carType.value = product.carType || ""; el.vehicleYear.value = product.vehicleYear || ""; el.stock.value = product.stock ?? ""; el.minStock.value = product.minStock ?? ""; if (el.productPurchasePrice) el.productPurchasePrice.value = product.purchasePrice || ""; if (el.productAverageSalePrice) el.productAverageSalePrice.value = product.averageSalePrice || ""; el.location.value = product.location || ""; productImageRemoveRequested = false; selectedProductImageBlob = null; if (el.productImageFile) el.productImageFile.value = ""; if (el.productCameraFile) el.productCameraFile.value = ""; if (el.productImage) el.productImage.value = product.imageUrl || ""; updateProductImagePreview(product.imageUrl || ""); el.note.value = product.note || ""; switchTab("add"); window.scrollTo({ top: 0, behavior: "smooth" }); }
window.editProduct = function(id) { if (!requireRoleAction(["admin", "depo"], "Ürün düzenleme yetkisi sadece Admin/Depo")) return; const product = [...(state.operationResults || []), ...(state.movementResults || []), ...(state.products || [])].find((p) => String(p.id) === String(id)); if (!product) return showToast("Ürün bulunamadı", true); fillProductForm(product); };
window.deleteProduct = async function() { throw new Error("VDS API yüklenmeden ürün silinemez."); };
window.quickStockAction = async function() { throw new Error("VDS API yüklenmeden hızlı stok işlemi yapılamaz."); };
