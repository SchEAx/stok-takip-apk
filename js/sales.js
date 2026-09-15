// Satış: favoriler, sepet, hızlı satış, fiş ve iade
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
  const matches = state.products.filter(p => String(p.barcode || "").trim() === q);
  if (!matches.length) return null;
  // Aynı barkod farklı raflarda kullanılıyorsa stoğu en müsait olan konumu seç.
  return matches.sort((a, b) => saleAvailable(b) - saleAvailable(a))[0] || null;
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

window.cancelLastQuickSale = async function() { showToast("Hızlı satış VDS geçişi henüz tamamlanmadı", true); };

async function completeQuickSale() { showToast("Hızlı satış VDS geçişi henüz tamamlanmadı", true); }

window.openReservationPanel = function(requestId) {
  const req = state.stockRequests.find((r) => String(r.id) === String(requestId));
  if (!req) return showToast("Talep bulunamadı", true);

  state.selectedStockRequestId = requestId;
  el.reservationPanel.classList.remove("hidden");

  renderSelectedRequestDetail(req);

el.productSearchInput.value = req.requested_text || "";
searchProductsForRequest(req.requested_text || "", true);
};

