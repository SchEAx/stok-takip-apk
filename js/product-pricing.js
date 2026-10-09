// Product-brand/category price suggestions and native cost currencies.
function formatPurchasePrice(amount, currency = "TRY") {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency", currency: currency === "USD" ? "USD" : "TRY"
  }).format(Number(amount || 0));
}

function purchaseTotalsText(tl, usd = 0, includeUsd = false) {
  return [formatPurchasePrice(tl), includeUsd ? formatPurchasePrice(usd, "USD") : ""]
    .filter(Boolean).join(" + ");
}

async function ensureProductPricingApi() {
  try {
    const health = await apiFetch("/api/product-pricing/health");
    if (health.version !== 1 || !health.currencies?.includes("USD")) throw new Error();
  } catch {
    throw new Error("Fiyat / döviz VDS yamasını kurduktan sonra tekrar kaydet.");
  }
}

const productPriceSuggestions = {
  seq: 0, timer: null, suggestion: null, currencyExplicit: false, lookupKey: null,
  autoPurchase: null, autoSale: null
};

function stopProductPriceSuggestions() {
  clearTimeout(productPriceSuggestions.timer);
  productPriceSuggestions.seq++;
}

function resetProductPricing(editing = false) {
  stopProductPriceSuggestions();
  productPriceSuggestions.suggestion = null;
  productPriceSuggestions.lookupKey = null;
  productPriceSuggestions.currencyExplicit = editing;
  productPriceSuggestions.autoPurchase = null;
  productPriceSuggestions.autoSale = null;
  if (el.productPriceHint) el.productPriceHint.textContent = "Ürün markası ve kategori seçince kayıtlı fiyatlar önerilir.";
  if (el.productPriceApplyBtn) el.productPriceApplyBtn.classList.add("hidden");
}

function clearAutoSuggestedPrice(field, marker) {
  if (field && productPriceSuggestions[marker] !== null
    && field.value === productPriceSuggestions[marker]) field.value = "";
  productPriceSuggestions[marker] = null;
}

function applyProductPriceSuggestion(force = false) {
  const suggestion = productPriceSuggestions.suggestion;
  if (!suggestion || state.loading) return;
  const isNew = !el.productId.value;
  const purchase = Number(suggestion.purchase_price);
  const sale = Number(suggestion.average_sale_price);
  const currency = suggestion.purchase_currency;
  const currencyMatches = !productPriceSuggestions.currencyExplicit || el.productPurchaseCurrency.value === currency;
  if (suggestion.purchase_price !== null && Number.isFinite(purchase) && purchase > 0
    && ["TRY", "USD"].includes(currency) && currencyMatches
    && (force || (isNew && el.productPurchasePrice.value === ""))) {
    el.productPurchaseCurrency.value = currency;
    el.productPurchasePrice.value = String(purchase);
    productPriceSuggestions.autoPurchase = el.productPurchasePrice.value;
  }
  if (suggestion.average_sale_price !== null && Number.isFinite(sale) && sale > 0
    && (force || (isNew && el.productAverageSalePrice.value === ""))) {
    el.productAverageSalePrice.value = String(sale);
    productPriceSuggestions.autoSale = el.productAverageSalePrice.value;
  }
}

async function loadProductPriceSuggestion(seq = productPriceSuggestions.seq) {
  const brand = String(el.productBrand.value || "").trim();
  const category = String(el.category.value || "").trim();
  if (!brand || !category || state.loading) return;
  productPriceSuggestions.lookupKey = productPriceLookupKey();
  const params = new URLSearchParams({ product_brand: brand, category });
  if (productPriceSuggestions.currencyExplicit) params.set("purchase_currency", el.productPurchaseCurrency.value);
  try {
    const payload = await apiFetch("/api/product-pricing/suggestion?" + params.toString());
    if (seq !== productPriceSuggestions.seq || state.loading) return;
    const suggestion = payload.suggestion;
    productPriceSuggestions.suggestion = suggestion || null;
    const labels = [];
    if (Number(suggestion?.purchase_price) > 0) {
      labels.push("Maliyet " + formatPurchasePrice(suggestion.purchase_price, suggestion.purchase_currency));
    }
    if (Number(suggestion?.average_sale_price) > 0) {
      labels.push("Satış " + formatPurchasePrice(suggestion.average_sale_price));
    }
    if (el.productPriceHint) el.productPriceHint.textContent = labels.length
      ? `Kayıtlı son fiyatlar: ${labels.join(" · ")}. Tutarları değiştirebilirsin.`
      : "Bu marka ve kategori için kayıtlı fiyat bulunamadı. İlk fiyatı sen girebilirsin.";
    if (el.productPriceApplyBtn) el.productPriceApplyBtn.classList.toggle("hidden", !labels.length);
    applyProductPriceSuggestion();
  } catch (error) {
    if (seq !== productPriceSuggestions.seq || state.loading) return;
    productPriceSuggestions.suggestion = null;
    if (el.productPriceHint) el.productPriceHint.textContent = error.status === 404
      ? "Fiyat önerisi için VDS fiyat / döviz yamasını kur."
      : "Fiyat önerisi alınamadı. Fiyatı elle girebilirsin.";
    if (el.productPriceApplyBtn) el.productPriceApplyBtn.classList.add("hidden");
  }
}

function productPriceLookupKey() {
  return JSON.stringify([el.productBrand.value.trim(), el.category.value.trim(),
    productPriceSuggestions.currencyExplicit ? el.productPurchaseCurrency.value : ""]);
}

function queueProductPriceSuggestion(currencyOnly = false) {
  const key = productPriceLookupKey();
  // input followed by blur/change for the same selection must keep filled prices.
  if (key === productPriceSuggestions.lookupKey) return;
  productPriceSuggestions.lookupKey = key;
  stopProductPriceSuggestions();
  clearAutoSuggestedPrice(el.productPurchasePrice, "autoPurchase");
  if (!currencyOnly) clearAutoSuggestedPrice(el.productAverageSalePrice, "autoSale");
  productPriceSuggestions.suggestion = null;
  if (el.productPriceApplyBtn) el.productPriceApplyBtn.classList.add("hidden");
  if (!el.productBrand.value.trim() || !el.category.value.trim()) {
    if (el.productPriceHint) el.productPriceHint.textContent = "Ürün markası ve kategori seçince kayıtlı fiyatlar önerilir.";
    return;
  }
  if (el.productPriceHint) el.productPriceHint.textContent = "Kayıtlı fiyatlar aranıyor…";
  const seq = productPriceSuggestions.seq;
  productPriceSuggestions.timer = setTimeout(() => loadProductPriceSuggestion(seq), 350);
}

function initProductPriceSuggestions() {
  if (!el.productPurchaseCurrency || el.productPurchaseCurrency.dataset.priceReady === "1") return;
  el.productPurchaseCurrency.dataset.priceReady = "1";
  [el.productBrand, el.category].forEach(input => {
    input.addEventListener("input", () => queueProductPriceSuggestion());
    input.addEventListener("change", () => queueProductPriceSuggestion());
  });
  el.productPurchasePrice.addEventListener("input", () => { productPriceSuggestions.autoPurchase = null; });
  el.productAverageSalePrice.addEventListener("input", () => { productPriceSuggestions.autoSale = null; });
  el.productPurchaseCurrency.addEventListener("change", () => {
    productPriceSuggestions.currencyExplicit = true;
    queueProductPriceSuggestion(true);
  });
  el.productPriceApplyBtn?.addEventListener("click", () => applyProductPriceSuggestion(true));
  resetProductPricing();
}
