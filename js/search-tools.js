// v16.18 - Android geri tuşu ve kamera oturumu yönetimi
(function(){
  const voiceBtn = document.getElementById("operationVoiceSearchBtn");
  const barcodeBtn = document.getElementById("operationBarcodeSearchBtn");
  const productBarcodeScanBtn = document.getElementById("productBarcodeScanBtn");
  const searchInput = document.getElementById("operationSearchInput");
  const scannerModal = document.getElementById("operationBarcodeScannerModal");
  const scannerVideo = document.getElementById("operationBarcodeScannerVideo");
  const scannerStatus = document.getElementById("operationBarcodeScannerStatus");
  const scannerCloseBtn = document.getElementById("operationBarcodeScannerCloseBtn");

  const actionModal = document.getElementById("operationBarcodeActionModal");
  const actionBackdrop = document.getElementById("operationBarcodeActionBackdrop");
  const actionCloseBtn = document.getElementById("operationBarcodeActionCloseBtn");
  const actionTitle = document.getElementById("operationBarcodeActionTitle");
  const actionMeta = document.getElementById("operationBarcodeActionMeta");
  const actionTotal = document.getElementById("operationBarcodeActionTotal");
  const locationWrap = document.getElementById("operationBarcodeLocationWrap");
  const locationList = document.getElementById("operationBarcodeLocationList");
  const selectedWrap = document.getElementById("operationBarcodeSelectedProduct");
  const selectedStock = document.getElementById("operationBarcodeSelectedStock");
  const qtyInput = document.getElementById("operationBarcodeQty");
  const qtyMinus = document.getElementById("operationBarcodeQtyMinus");
  const qtyPlus = document.getElementById("operationBarcodeQtyPlus");
  const stockInBtn = document.getElementById("operationBarcodeStockInBtn");
  const stockOutBtn = document.getElementById("operationBarcodeStockOutBtn");
  const notFoundWrap = document.getElementById("operationBarcodeNotFound");
  const notFoundBarcode = document.getElementById("operationBarcodeNotFoundValue");
  const addProductBtn = document.getElementById("operationBarcodeAddProductBtn");
  const linkProductBtn = document.getElementById("operationBarcodeLinkProductBtn");
  const notFoundCancelBtn = document.getElementById("operationBarcodeNotFoundCancelBtn");
  const editProductBtn = document.getElementById("operationBarcodeEditProductBtn");
  const linkerWrap = document.getElementById("operationBarcodeLinker");
  const linkerBarcode = document.getElementById("operationBarcodeLinkValue");
  const linkerBackBtn = document.getElementById("operationBarcodeLinkBackBtn");
  const linkerSearchInput = document.getElementById("operationBarcodeLinkSearchInput");
  const linkerResults = document.getElementById("operationBarcodeLinkResults");
  const linkerSelection = document.getElementById("operationBarcodeLinkSelection");
  const linkerSaveBtn = document.getElementById("operationBarcodeLinkSaveBtn");

  let speechRecognition = null;
  let speechActive = false;

  let scannerStream = null;
  let scannerFrameId = null;
  let scannerDetector = null;
  let scannerBusy = false;
  let scannerZxingReader = null;
  let scannerZxingControls = null;
  let scannerPurpose = "search";
  let scannerSession = 0;

  let barcodeMatches = [];
  let selectedBarcodeProduct = null;
  let barcodeActionBusy = false;
  let lastScannedBarcode = "";
  let keyboardGuardTimer = null;
  let linkerSearchTimer = null;
  let linkerQuerySequence = 0;
  let linkerCandidates = [];
  let selectedLinkProduct = null;
  let linkerBusy = false;

  function toast(message, isError = false){
    if (typeof showToast === "function") showToast(message, isError);
    else console[isError ? "error" : "log"](message);
  }

  function html(value){
    if (typeof escapeHtml === "function") return escapeHtml(String(value ?? ""));
    return String(value ?? "").replace(/[&<>'"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[ch]);
  }

  function cleanBarcode(value){
    return String(value || "").trim().replace(/\s+/g, "").toLocaleLowerCase("tr-TR");
  }

  function dismissAutomaticKeyboard(){
    const guardedInputs = [searchInput, qtyInput].filter(Boolean);

    guardedInputs.forEach(input => {
      input.dataset.autoKeyboardGuard = "1";
      input.readOnly = true;
      input.blur();
    });

    const active = document.activeElement;
    if (guardedInputs.includes(active) && typeof active?.blur === "function") {
      active.blur();
    }

    clearTimeout(keyboardGuardTimer);
    keyboardGuardTimer = setTimeout(() => {
      guardedInputs.forEach(input => {
        if (input.dataset.autoKeyboardGuard === "1") {
          input.blur();
          input.readOnly = false;
          delete input.dataset.autoKeyboardGuard;
          input.blur();
        }
      });
    }, 420);
  }

  function runOperationSearch(value){
    if (!searchInput) return;
    dismissAutomaticKeyboard();
    searchInput.value = String(value || "").trim();
    if (typeof state !== "undefined") state.operationCacheKey = "";
    searchInput.dispatchEvent(new Event("input", { bubbles: true }));
    // Sesli arama ve barkod sonucunda mobil klavye kendiliğinden açılmasın.
    // Kullanıcı metni düzenlemek isterse arama alanına dokunarak açabilir.
    dismissAutomaticKeyboard();
  }

  function setSearchInputWithoutDuplicateQuery(value){
    if (!searchInput) return;
    searchInput.value = String(value || "").trim();
    if (typeof state !== "undefined") state.operationCacheKey = "";
  }

  function setVoiceActive(active){
    speechActive = Boolean(active);
    if (!voiceBtn) return;
    voiceBtn.classList.toggle("is-active", speechActive);
    voiceBtn.setAttribute("aria-pressed", speechActive ? "true" : "false");
  }

  function stopVoiceSearch(){
    if (!speechRecognition) { setVoiceActive(false); return; }
    try { speechRecognition.stop(); } catch (_) {}
    setVoiceActive(false);
  }

  function startVoiceSearch(){
    dismissAutomaticKeyboard();

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition){
      toast("Bu tarayıcı sesle aramayı desteklemiyor.", true);
      return;
    }

    if (speechActive){
      stopVoiceSearch();
      return;
    }

    try{
      speechRecognition = new Recognition();
      speechRecognition.lang = "tr-TR";
      speechRecognition.interimResults = false;
      speechRecognition.continuous = false;
      speechRecognition.maxAlternatives = 1;

      speechRecognition.onstart = () => {
        dismissAutomaticKeyboard();
        setVoiceActive(true);
      };
      speechRecognition.onend = () => {
        setVoiceActive(false);
        // Android ses motoru kapanırken önceki metin alanının odağını
        // geri yükleyebiliyor. Olay tamamlandıktan sonra odağı tekrar temizle.
        dismissAutomaticKeyboard();
        setTimeout(dismissAutomaticKeyboard, 80);
      };
      speechRecognition.onerror = (event) => {
        setVoiceActive(false);
        dismissAutomaticKeyboard();
        const code = String(event?.error || "");
        if (code === "aborted" || code === "no-speech") return;
        if (code === "not-allowed" || code === "service-not-allowed") {
          toast("Mikrofon izni verilmedi.", true);
          return;
        }
        toast("Ses algılanamadı. Tekrar deneyebilirsin.", true);
      };
      speechRecognition.onresult = (event) => {
        const transcript = Array.from(event.results || [])
          .map(result => result?.[0]?.transcript || "")
          .join(" ")
          .replace(/[.,!?;:]+$/g, "")
          .trim();
        if (!transcript) return;
        runOperationSearch(transcript);
      };
      speechRecognition.start();
    }catch(error){
      console.error("Sesle arama başlatılamadı:", error);
      setVoiceActive(false);
      toast("Mikrofon başlatılamadı.", true);
    }
  }

  function isIOSDevice(){
    const ua = navigator.userAgent || "";
    return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }

  function scannerSetOpen(open){
    scannerModal?.classList.toggle("hidden", !open);
    barcodeBtn?.classList.toggle("is-scanning", open);
  }

  function setScannerStatus(text){
    if (scannerStatus) scannerStatus.textContent = text;
  }

  function stockNumbers(product){
    const stock = Number(product?.stock || 0);
    const reserved = Number(product?.reserved || 0);
    return { stock, reserved, available: stock - reserved };
  }

  function vehicleText(product){
    return [product?.carBrand, product?.carModel, product?.carType, product?.vehicleYear].filter(Boolean).join(" ");
  }

  function renderBarcodeTotals(matches){
    if (!actionTotal) return;
    const totalStock = matches.reduce((sum, p) => sum + Number(p.stock || 0), 0);
    const totalReserved = matches.reduce((sum, p) => sum + Number(p.reserved || 0), 0);
    const totalAvailable = totalStock - totalReserved;
    actionTotal.innerHTML = `
      <span class="badge">Toplam Stok: <strong>${totalStock}</strong></span>
      <span class="badge">Rezerve: <strong>${totalReserved}</strong></span>
      <span class="badge">Kullanılabilir: <strong>${totalAvailable}</strong></span>
      ${matches.length > 1 ? `<span class="badge">Konum: <strong>${matches.length}</strong></span>` : ""}
    `;
  }

  function renderLocationList(matches){
    if (!locationList) return;
    locationList.innerHTML = matches.map(product => {
      const nums = stockNumbers(product);
      const vehicle = vehicleText(product);
      return `<button type="button" class="barcode-location-option" data-barcode-product-id="${html(product.id)}">
        <span class="barcode-location-main">📍 ${html(product.location || "Konum yok")}</span>
        <span class="barcode-location-sub">${html(product.name || product.category || "Ürün")}${vehicle ? ` · ${html(vehicle)}` : ""}</span>
        <span class="barcode-location-stock">Stok ${nums.stock} · Uygun ${nums.available}</span>
      </button>`;
    }).join("");
  }

  function resetBarcodeQuantity(){
    if (qtyInput) qtyInput.value = "1";
  }

  function setActionButtonsEnabled(enabled){
    const stockInAllowed = typeof userActionAllowed === "function" ? userActionAllowed("stockIn") : true;
    const stockOutAllowed = typeof userActionAllowed === "function" ? userActionAllowed("stockOut") : true;
    if (stockInBtn) stockInBtn.disabled = !enabled || !stockInAllowed || barcodeActionBusy;
    if (stockOutBtn) stockOutBtn.disabled = !enabled || !stockOutAllowed || barcodeActionBusy;
    if (qtyInput) qtyInput.disabled = !enabled || barcodeActionBusy;
    if (qtyMinus) qtyMinus.disabled = !enabled || barcodeActionBusy;
    if (qtyPlus) qtyPlus.disabled = !enabled || barcodeActionBusy;
  }

  function canCurrentUserEditProduct(){
    const staff = typeof currentStaff === "function" ? currentStaff() : null;
    return ["admin", "depo"].includes(String(staff?.role || ""));
  }

  function selectBarcodeProduct(productId){
    const product = barcodeMatches.find(p => String(p.id) === String(productId));
    if (!product) return;
    selectedBarcodeProduct = product;
    resetBarcodeQuantity();

    const nums = stockNumbers(product);
    const vehicle = vehicleText(product);
    if (actionTitle) actionTitle.textContent = product.name || product.category || "Barkodlu Ürün";
    if (actionMeta) actionMeta.innerHTML = `
      <span class="barcode-action-code">Barkod: ${html(product.barcode || lastScannedBarcode || "-")}</span>
      <span class="barcode-action-location">📍 Raf: <strong>${html(product.location || "Konum yok")}</strong></span>
    `;
    if (selectedStock) selectedStock.innerHTML = `
      <div><strong>${html(product.productBrand || "-")}</strong> · ${html(product.category || "-")}</div>
      ${vehicle ? `<div class="muted">Araç: <strong>${html(vehicle)}</strong></div>` : ""}
      ${product.note ? `<div class="muted">Not: <strong>${html(product.note)}</strong></div>` : ""}
      <div>Stok: <strong>${nums.stock}</strong> · Rezerve: <strong>${nums.reserved}</strong> · Kullanılabilir: <strong>${nums.available}</strong></div>
    `;
    selectedWrap?.classList.remove("hidden");
    setActionButtonsEnabled(true);
    if (editProductBtn) {
      const allowed = canCurrentUserEditProduct();
      editProductBtn.disabled = !allowed;
      editProductBtn.title = allowed ? "" : "Ürün düzenleme yetkin yok";
    }

    locationList?.querySelectorAll("[data-barcode-product-id]").forEach(button => {
      button.classList.toggle("active", String(button.dataset.barcodeProductId) === String(product.id));
    });

    // Ürün/konum seçildiğinde adet alanını otomatik odaklama.
    // Böylece mobil klavye yalnızca kullanıcı adet alanına dokunursa açılır.
    dismissAutomaticKeyboard();
  }

  function closeBarcodeActionModal(){
    actionModal?.classList.add("hidden");
    barcodeMatches = [];
    selectedBarcodeProduct = null;
    barcodeActionBusy = false;
    lastScannedBarcode = "";
    if (locationList) locationList.innerHTML = "";
    locationWrap?.classList.add("hidden");
    selectedWrap?.classList.add("hidden");
    notFoundWrap?.classList.add("hidden");
    linkerWrap?.classList.add("hidden");
    if (notFoundBarcode) notFoundBarcode.textContent = "-";
    if (linkerBarcode) linkerBarcode.textContent = "-";
    if (linkerSearchInput) linkerSearchInput.value = "";
    if (linkerResults) linkerResults.innerHTML = `<div class="empty-state">Ürün bulmak için arama yapın.</div>`;
    clearTimeout(linkerSearchTimer);
    linkerQuerySequence++;
    linkerCandidates = [];
    selectedLinkProduct = null;
    linkerBusy = false;
    if (linkerSelection) linkerSelection.textContent = "Henüz ürün seçilmedi.";
    if (linkerSaveBtn) linkerSaveBtn.disabled = true;
    resetBarcodeQuantity();
    setActionButtonsEnabled(false);
  }

  function canCurrentUserAddProduct(){
    const staff = typeof currentStaff === "function" ? currentStaff() : null;
    const roleOk = ["admin", "depo"].includes(String(staff?.role || ""));
    const tabOk = typeof canAccessTab === "function" ? canAccessTab("add", staff?.role) : true;
    return roleOk && tabOk;
  }

  function openBarcodeNotFoundPrompt(){
    barcodeMatches = [];
    selectedBarcodeProduct = null;
    resetBarcodeQuantity();
    setActionButtonsEnabled(false);
    locationWrap?.classList.add("hidden");
    selectedWrap?.classList.add("hidden");
    linkerWrap?.classList.add("hidden");
    if (locationList) locationList.innerHTML = "";
    if (actionTitle) actionTitle.textContent = "Barkod Kayıtlı Değil";
    if (actionMeta) actionMeta.textContent = "Bu barkodla eşleşen ürün bulunamadı.";
    if (actionTotal) actionTotal.innerHTML = "";
    if (notFoundBarcode) notFoundBarcode.textContent = lastScannedBarcode || "-";
    notFoundWrap?.classList.remove("hidden");
    if (addProductBtn) {
      const allowed = canCurrentUserAddProduct();
      addProductBtn.disabled = !allowed;
      addProductBtn.title = allowed ? "" : "Ürün ekleme yetkin yok";
    }
    if (linkProductBtn) {
      const allowed = canCurrentUserEditProduct();
      linkProductBtn.disabled = !allowed;
      linkProductBtn.title = allowed ? "" : "Ürün eşleme yetkin yok";
    }
    actionModal?.classList.remove("hidden");
    setTimeout(() => (canCurrentUserAddProduct() ? addProductBtn : notFoundCancelBtn)?.focus(), 30);
  }

  function addScannedBarcodeAsProduct(){
    const barcode = String(lastScannedBarcode || "").trim();
    if (!barcode) return;
    if (!canCurrentUserAddProduct()) {
      toast("Ürün ekleme yetkin yok.", true);
      return;
    }

    closeBarcodeActionModal();
    try {
      if (typeof clearProductForm === "function") clearProductForm();
      if (typeof switchTab === "function") switchTab("add");
      const barcodeInput = document.getElementById("barcode");
      if (barcodeInput) {
        barcodeInput.value = barcode;
        barcodeInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
      setTimeout(() => {
        const firstInput = document.getElementById("productBrand") || document.getElementById("category") || barcodeInput;
        firstInput?.focus();
        firstInput?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 80);
      toast("Barkod hazır. Ürün bilgilerini doldurup kaydedebilirsin ✅");
    } catch (error) {
      console.error("Barkoddan ürün ekleme ekranı açılamadı:", error);
      toast("Ürün ekleme ekranı açılamadı.", true);
    }
  }

  function editSelectedBarcodeProduct(){
    const product = selectedBarcodeProduct;
    if (!product?.id) {
      toast("Önce düzenlenecek raf / konumu seç.", true);
      return;
    }
    if (!canCurrentUserEditProduct()) {
      toast("Ürün düzenleme yetkin yok.", true);
      return;
    }

    const productId = String(product.id);
    closeBarcodeActionModal();
    if (typeof window.editProduct === "function") {
      window.editProduct(productId);
    } else {
      toast("Ürün düzenleme ekranı açılamadı.", true);
    }
  }

  function openBarcodeLinker(){
    if (!canCurrentUserEditProduct()) {
      toast("Ürün eşleme yetkin yok.", true);
      return;
    }

    notFoundWrap?.classList.add("hidden");
    linkerWrap?.classList.remove("hidden");
    if (actionTitle) actionTitle.textContent = "Stoktaki Ürünle Eşle";
    if (actionMeta) actionMeta.textContent = "Okutulan barkodu doğru stok kartına bağlayın.";
    if (linkerBarcode) linkerBarcode.textContent = lastScannedBarcode || "-";
    if (linkerSearchInput) linkerSearchInput.value = "";
    if (linkerResults) linkerResults.innerHTML = `<div class="empty-state">Ürün bulmak için en az 2 karakter yazın.</div>`;
    linkerCandidates = [];
    selectedLinkProduct = null;
    if (linkerSelection) linkerSelection.textContent = "Henüz ürün seçilmedi.";
    if (linkerSaveBtn) linkerSaveBtn.disabled = true;
  }

  function returnToBarcodeNotFound(){
    linkerWrap?.classList.add("hidden");
    openBarcodeNotFoundPrompt();
  }

  function updateBarcodeLinkSelection(){
    if (linkerSelection) {
      linkerSelection.textContent = selectedLinkProduct
        ? `Seçilen ürün: ${selectedLinkProduct.name || selectedLinkProduct.category || "Ürün"} · ${selectedLinkProduct.location || "Konum yok"}`
        : "Henüz ürün seçilmedi.";
    }
    if (linkerSaveBtn) linkerSaveBtn.disabled = !selectedLinkProduct || linkerBusy;
  }

  function renderBarcodeLinkCandidates(rows){
    if (!linkerResults) return;
    linkerCandidates = rows.slice(0, 50);
    if (selectedLinkProduct && !linkerCandidates.some(product => String(product.id) === String(selectedLinkProduct.id))) {
      selectedLinkProduct = null;
    }
    updateBarcodeLinkSelection();

    if (!linkerCandidates.length) {
      linkerResults.innerHTML = `<div class="empty-state">Bu aramayla eşleşen stok ürünü bulunamadı.</div>`;
      return;
    }

    linkerResults.innerHTML = linkerCandidates.map(product => {
      const nums = stockNumbers(product);
      const vehicle = vehicleText(product);
      const currentBarcode = String(product.barcode || "").trim();
      const selected = selectedLinkProduct && String(selectedLinkProduct.id) === String(product.id);
      return `<button type="button" class="barcode-link-option${selected ? " active" : ""}" data-link-product-id="${html(product.id)}" aria-pressed="${selected ? "true" : "false"}" ${linkerBusy ? "disabled" : ""}>
        <span class="barcode-link-option-title">${html(product.name || product.category || "Ürün")}</span>
        <span class="barcode-link-option-meta">${html(product.productBrand || "Marka yok")} · ${html(product.category || "Kategori yok")}${vehicle ? ` · ${html(vehicle)}` : ""}</span>
        <span class="barcode-link-option-location">📍 ${html(product.location || "Konum yok")} · Stok ${nums.stock} · ${currentBarcode ? `Mevcut barkod: ${html(currentBarcode)}` : "Barkod yok"}</span>
      </button>`;
    }).join("");
  }

  function selectBarcodeLinkProduct(productId){
    const product = linkerCandidates.find(item => String(item.id) === String(productId));
    if (!product || linkerBusy) return;
    selectedLinkProduct = product;
    renderBarcodeLinkCandidates(linkerCandidates);
    requestAnimationFrame(() => linkerSaveBtn?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  }

  async function loadBarcodeLinkCandidates(){
    const query = String(linkerSearchInput?.value || "").trim();
    const sequence = ++linkerQuerySequence;

    if (query.length < 2) {
      linkerCandidates = [];
      if (linkerResults) linkerResults.innerHTML = `<div class="empty-state">Ürün bulmak için en az 2 karakter yazın.</div>`;
      return;
    }

    if (linkerResults) linkerResults.innerHTML = `<div class="empty-state">Stok ürünleri aranıyor...</div>`;

    try {
      const rows = await searchStockProducts({ search: query, limit: 100 });
      if (sequence !== linkerQuerySequence) return;
      const mapped = (rows || []).map(row => typeof mapProduct === "function" ? mapProduct(row) : row);
      const permitted = typeof filterProductsByCurrentUser === "function" ? filterProductsByCurrentUser(mapped) : mapped;
      const unique = [...new Map(permitted.filter(product => product?.id).map(product => [String(product.id), product])).values()];
      renderBarcodeLinkCandidates(unique);
    } catch (error) {
      if (sequence !== linkerQuerySequence) return;
      console.error("Barkod ürün eşleme araması başarısız:", error);
      linkerCandidates = [];
      if (linkerResults) linkerResults.innerHTML = `<div class="empty-state">Ürünler alınamadı: ${html(error?.message || error)}</div>`;
    }
  }

  function scheduleBarcodeLinkSearch(){
    clearTimeout(linkerSearchTimer);
    selectedLinkProduct = null;
    updateBarcodeLinkSelection();
    linkerSearchTimer = setTimeout(loadBarcodeLinkCandidates, 260);
  }

  async function linkScannedBarcodeToProduct(productId){
    if (linkerBusy) return;
    if (!canCurrentUserEditProduct()) {
      toast("Ürün eşleme yetkin yok.", true);
      return;
    }

    const product = linkerCandidates.find(item => String(item.id) === String(productId));
    const barcode = String(lastScannedBarcode || "").trim();
    if (!product || !barcode) {
      toast("Eşlenecek ürün veya barkod bulunamadı.", true);
      return;
    }

    const currentBarcode = String(product.barcode || "").trim();
    const productLabel = product.name || [product.productBrand, product.category, vehicleText(product)].filter(Boolean).join(" ") || "Seçilen ürün";
    const message = currentBarcode
      ? `${productLabel} ürününün mevcut barkodu ${currentBarcode}. Bu barkod ${barcode} ile değiştirilsin mi?`
      : `${barcode} barkodu ${productLabel} ürününe eklensin mi?`;

    const confirmed = typeof appConfirm === "function"
      ? await appConfirm(message, { title: "Barkodu Ürünle Eşle", okText: currentBarcode ? "Barkodu Değiştir" : "Barkodu Eşle" })
      : window.confirm(message);
    if (!confirmed) return;

    linkerBusy = true;
    updateBarcodeLinkSelection();
    renderBarcodeLinkCandidates(linkerCandidates);
    try {
      if (typeof setLoading === "function") setLoading(true);
      const result = await apiFetch(`/api/products/${encodeURIComponent(product.id)}`, {
        method: "PATCH",
        body: { barcode }
      });
      await refreshMigrationProductState(product.id, { product: result?.product }).catch(() => {});
      if (typeof logActivity === "function") {
        await logActivity(
          "product_barcode_link",
          `${productLabel} ürünü ${barcode} barkoduyla eşlendi${currentBarcode ? ` · Önceki barkod: ${currentBarcode}` : ""}`,
          "stock_products",
          product.id
        ).catch(() => {});
      }

      closeBarcodeActionModal();
      runOperationSearch(barcode);
      toast("Barkod ürünle eşlendi ✅");
    } catch (error) {
      console.error("Barkod ürünle eşlenemedi:", error);
      toast(error?.message || "Barkod ürünle eşlenemedi.", true);
    } finally {
      linkerBusy = false;
      updateBarcodeLinkSelection();
      if (typeof setLoading === "function") setLoading(false);
      if (!linkerWrap?.classList.contains("hidden")) renderBarcodeLinkCandidates(linkerCandidates);
    }
  }

  async function openBarcodeActionForCode(rawCode){
    const code = cleanBarcode(rawCode);
    if (!code) return;
    lastScannedBarcode = String(rawCode || "").trim();
    setSearchInputWithoutDuplicateQuery(lastScannedBarcode);

    try{
      const rows = await searchStockProducts({ search: lastScannedBarcode, limit: 100 });
      const mapped = (rows || []).map(row => typeof mapProduct === "function" ? mapProduct(row) : row);
      const exactMatches = mapped.filter(product => cleanBarcode(product?.barcode) === code);
      const permitted = typeof filterProductsByCurrentUser === "function" ? filterProductsByCurrentUser(exactMatches) : exactMatches;
      const matches = permitted;

      if (!exactMatches.length){
        setSearchInputWithoutDuplicateQuery(lastScannedBarcode);
        openBarcodeNotFoundPrompt();
        return;
      }

      if (!matches.length){
        runOperationSearch(lastScannedBarcode);
        toast("Bu barkoda kayıtlı ürün var ancak bu ürün kategorisine yetkin yok.", true);
        return;
      }

      barcodeMatches = matches.slice().sort((a, b) => String(a.location || "").localeCompare(String(b.location || ""), "tr", { numeric: true }));

      if (typeof state !== "undefined") {
        state.operationResults = barcodeMatches.slice();
        state.operationCacheKey = "";
        if (typeof renderOperationCards === "function") renderOperationCards(state.operationResults);
      }

      notFoundWrap?.classList.add("hidden");
      renderBarcodeTotals(barcodeMatches);
      resetBarcodeQuantity();
      selectedBarcodeProduct = null;
      selectedWrap?.classList.add("hidden");

      if (barcodeMatches.length > 1){
        if (actionTitle) actionTitle.textContent = `${barcodeMatches[0].name || barcodeMatches[0].category || "Barkodlu Ürün"} · ${barcodeMatches.length} konum`;
        if (actionMeta) actionMeta.textContent = `Barkod: ${lastScannedBarcode}`;
        locationWrap?.classList.remove("hidden");
        renderLocationList(barcodeMatches);
        setActionButtonsEnabled(false);
      }else{
        locationWrap?.classList.add("hidden");
        if (locationList) locationList.innerHTML = "";
        selectBarcodeProduct(barcodeMatches[0].id);
      }

      actionModal?.classList.remove("hidden");
      if (barcodeMatches.length > 1) setTimeout(() => locationList?.querySelector("button")?.focus(), 30);
    }catch(error){
      console.error("Barkod ürünü alınamadı:", error);
      runOperationSearch(lastScannedBarcode);
      toast(error?.message || "Barkod ürünü alınamadı.", true);
    }
  }

  function readBarcodeQty(){
    const raw = Number(qtyInput?.value || 1);
    const qty = Math.floor(raw);
    if (!Number.isFinite(qty) || qty < 1) return null;
    return qty;
  }

  function stepBarcodeQty(step){
    const current = readBarcodeQty() || 1;
    if (qtyInput) qtyInput.value = String(Math.max(1, current + Number(step || 0)));
  }

  async function performBarcodeStockAction(direction){
    if (barcodeActionBusy) return;
    const product = selectedBarcodeProduct;
    if (!product){
      toast("Önce işlem yapılacak raf / konumu seç.", true);
      return;
    }
    if (!["giris", "cikis"].includes(direction)) return;
    if (typeof canAccessCategory === "function" && !canAccessCategory(product.category)){
      toast("Bu ürün kategorisine yetkin yok.", true);
      return;
    }
    if (direction === "giris" && typeof requireUserAction === "function" && !requireUserAction("stockIn", "Stok giriş yetkin yok")) return;
    if (direction === "cikis" && typeof requireUserAction === "function" && !requireUserAction("stockOut", "Stok çıkış yetkin yok")) return;

    const quantity = readBarcodeQty();
    if (!quantity){
      toast("Adet 1 veya daha büyük tam sayı olmalı.", true);
      resetBarcodeQuantity();
      return;
    }

    const nums = stockNumbers(product);
    if (direction === "cikis" && nums.available < quantity){
      toast(`Yeterli kullanılabilir stok yok. Kullanılabilir: ${nums.available}`, true);
      return;
    }

    const label = direction === "giris" ? "giriş" : "çıkış";
    barcodeActionBusy = true;
    const clickedButton = direction === "giris" ? stockInBtn : stockOutBtn;
    const originalText = clickedButton?.textContent || "";
    if (clickedButton) clickedButton.textContent = "İşleniyor...";
    setActionButtonsEnabled(true);

    try{
      if (typeof setLoading === "function") setLoading(true);
      const suffix = typeof actorSuffix === "function" ? actorSuffix() : "";
      const payload = await migrationStockMovement(product.id, direction, quantity, `Barkod ile hızlı stok ${label}${suffix}`);
      const fresh = await refreshMigrationProductState(product.id, payload);
      if (typeof logActivity === "function") {
        await logActivity("stock_" + direction, `${product.name || product.category} için barkodla ${quantity} adet ${label}`, "stock_products", product.id);
      }
      await Promise.allSettled([
        typeof loadMovements === "function" ? loadMovements() : Promise.resolve(),
        typeof loadDashboardStats === "function" ? loadDashboardStats() : Promise.resolve()
      ]);

      if (fresh) selectedBarcodeProduct = fresh;
      closeBarcodeActionModal();
      toast(`${quantity} adet ${label} kaydedildi ✅`);
    }catch(error){
      console.error("Barkod stok işlemi hatası:", error);
      toast(error?.message || "Stok işlemi kaydedilemedi.", true);
    }finally{
      barcodeActionBusy = false;
      if (clickedButton) clickedButton.textContent = originalText;
      if (typeof setLoading === "function") setLoading(false);
      if (!actionModal?.classList.contains("hidden")) setActionButtonsEnabled(Boolean(selectedBarcodeProduct));
    }
  }

  function finishBarcodeScan(value){
    const barcode = String(value || "").trim();
    if (!barcode || scannerBusy) return;
    dismissAutomaticKeyboard();
    scannerBusy = true;
    const purpose = scannerPurpose;
    closeOperationBarcodeScanner();
    scannerPurpose = "search";

    if (purpose === "product-form") {
      const barcodeInput = document.getElementById("barcode");
      if (!barcodeInput) {
        toast("Barkod alanı bulunamadı.", true);
        return;
      }
      barcodeInput.value = barcode;
      barcodeInput.dispatchEvent(new Event("input", { bubbles: true }));
      barcodeInput.blur();
      barcodeInput.scrollIntoView({ behavior: "smooth", block: "center" });
      toast("Barkod ürün kartına aktarıldı ✅");
      return;
    }

    openBarcodeActionForCode(barcode);
  }

  async function scanNativeFrame(){
    if (!scannerStream || !scannerDetector || !scannerVideo || scannerModal?.classList.contains("hidden")) return;
    if (scannerVideo.readyState >= 2 && !scannerBusy){
      try{
        const codes = await scannerDetector.detect(scannerVideo);
        if (codes?.length){
          finishBarcodeScan(codes[0].rawValue);
          return;
        }
      }catch(_error){
        setScannerStatus("Barkodu yeşil çerçevenin ortasında sabit tut.");
      }
    }
    if (scannerStream && !scannerModal?.classList.contains("hidden")) scannerFrameId = requestAnimationFrame(scanNativeFrame);
  }

  async function startNativeScanner(session){
    scannerDetector = new BarcodeDetector();
    const stream = await navigator.mediaDevices.getUserMedia({
      video:{ facingMode:{ ideal:"environment" }, width:{ ideal:1280 }, height:{ ideal:720 } },
      audio:false
    });
    if (session !== scannerSession || scannerModal?.classList.contains("hidden")) {
      stream.getTracks().forEach(track => track.stop());
      return;
    }
    scannerStream = stream;
    scannerVideo.srcObject = scannerStream;
    await scannerVideo.play();
    if (session !== scannerSession) return;
    setScannerStatus("Barkodu yeşil çerçevenin ortasında tut.");
    scanNativeFrame();
  }

  async function startZxingScanner(session){
    if (!window.ZXingBrowser?.BrowserMultiFormatReader){
      throw new Error("ZXing barkod okuyucu yüklenemedi.");
    }
    const reader = new ZXingBrowser.BrowserMultiFormatReader(undefined, {
      delayBetweenScanAttempts: 90,
      delayBetweenScanSuccess: 400
    });
    scannerZxingReader = reader;
    const controls = await reader.decodeFromConstraints({
      video:{ facingMode:{ ideal:"environment" }, width:{ ideal:1280 }, height:{ ideal:720 } },
      audio:false
    }, scannerVideo, (result, _error, controls) => {
      if (result && !scannerBusy && session === scannerSession && !scannerModal?.classList.contains("hidden")){
        const value = typeof result.getText === "function" ? result.getText() : result.text;
        try { controls?.stop?.(); } catch (_) {}
        finishBarcodeScan(value);
      }
    });
    if (session !== scannerSession || scannerModal?.classList.contains("hidden")) {
      try { controls?.stop?.(); } catch (_) {}
      return;
    }
    scannerZxingControls = controls;
    setScannerStatus("Barkodu yeşil çerçevenin ortasında tut.");
  }

  async function openOperationBarcodeScanner(purpose = "search"){
    dismissAutomaticKeyboard();

    if (!navigator.mediaDevices?.getUserMedia){
      toast("Bu cihazda kamera erişimi kullanılamıyor.", true);
      return;
    }

    scannerPurpose = purpose === "product-form" ? "product-form" : "search";
    closeBarcodeActionModal();
    closeOperationBarcodeScanner();
    const session = scannerSession;
    scannerBusy = false;
    scannerSetOpen(true);
    setScannerStatus("Kamera hazırlanıyor...");

    if (scannerVideo){
      scannerVideo.setAttribute("playsinline", "");
      scannerVideo.setAttribute("webkit-playsinline", "");
      scannerVideo.muted = true;
      scannerVideo.autoplay = true;
    }

    try{
      if (isIOSDevice() || !("BarcodeDetector" in window)){
        await startZxingScanner(session);
      }else{
        try{
          await startNativeScanner(session);
        }catch(nativeError){
          if (session !== scannerSession) return;
          console.warn("Native barkod tarayıcı açılamadı, ZXing deneniyor:", nativeError);
          closeOperationBarcodeScanner();
          const fallbackSession = scannerSession;
          scannerBusy = false;
          scannerSetOpen(true);
          setScannerStatus("Kamera hazırlanıyor...");
          await startZxingScanner(fallbackSession);
        }
      }
    }catch(error){
      if (scannerModal?.classList.contains("hidden")) return;
      console.error("Barkod kamera hatası:", error);
      closeOperationBarcodeScanner();
      const name = String(error?.name || "");
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        toast("Kamera izni verilmedi.", true);
      } else {
        toast("Barkod kamerası açılamadı. Kamera iznini kontrol et.", true);
      }
    }
  }

  function openProductBarcodeScanner(){
    if (!canCurrentUserEditProduct()) {
      toast("Ürün barkodu düzenleme yetkin yok.", true);
      return;
    }
    document.getElementById("barcode")?.blur();
    openOperationBarcodeScanner("product-form");
  }

  function closeOperationBarcodeScanner(){
    scannerSession++;
    if (scannerFrameId) cancelAnimationFrame(scannerFrameId);
    scannerFrameId = null;
    try { scannerZxingControls?.stop?.(); } catch (_) {}
    scannerZxingControls = null;
    scannerZxingReader = null;
    try { scannerStream?.getTracks?.().forEach(track => track.stop()); } catch (_) {}
    scannerStream = null;
    scannerDetector = null;
    scannerBusy = false;
    if (scannerVideo){
      try { scannerVideo.pause(); } catch (_) {}
      scannerVideo.srcObject = null;
    }
    scannerSetOpen(false);
  }

  window.startOperationVoiceSearch = startVoiceSearch;
  window.openOperationBarcodeScanner = openOperationBarcodeScanner;
  window.openProductBarcodeScanner = openProductBarcodeScanner;
  window.closeOperationBarcodeScanner = closeOperationBarcodeScanner;
  window.openBarcodeActionForCode = openBarcodeActionForCode;
  window.closeBarcodeActionModal = closeBarcodeActionModal;

  voiceBtn?.addEventListener("click", startVoiceSearch);
  barcodeBtn?.addEventListener("click", () => openOperationBarcodeScanner("search"));
  productBarcodeScanBtn?.addEventListener("click", openProductBarcodeScanner);
  scannerCloseBtn?.addEventListener("click", closeOperationBarcodeScanner);
  actionCloseBtn?.addEventListener("click", closeBarcodeActionModal);
  actionBackdrop?.addEventListener("click", closeBarcodeActionModal);
  qtyMinus?.addEventListener("click", () => stepBarcodeQty(-1));
  qtyPlus?.addEventListener("click", () => stepBarcodeQty(1));
  qtyInput?.addEventListener("change", () => {
    const qty = readBarcodeQty();
    qtyInput.value = String(qty || 1);
  });
  stockInBtn?.addEventListener("click", () => performBarcodeStockAction("giris"));
  stockOutBtn?.addEventListener("click", () => performBarcodeStockAction("cikis"));
  addProductBtn?.addEventListener("click", addScannedBarcodeAsProduct);
  linkProductBtn?.addEventListener("click", openBarcodeLinker);
  editProductBtn?.addEventListener("click", editSelectedBarcodeProduct);
  notFoundCancelBtn?.addEventListener("click", closeBarcodeActionModal);
  linkerBackBtn?.addEventListener("click", returnToBarcodeNotFound);
  linkerSearchInput?.addEventListener("input", scheduleBarcodeLinkSearch);
  linkerResults?.addEventListener("click", event => {
    const button = event.target.closest("[data-link-product-id]");
    if (button) selectBarcodeLinkProduct(button.dataset.linkProductId);
  });
  linkerSaveBtn?.addEventListener("click", () => {
    if (selectedLinkProduct?.id) linkScannedBarcodeToProduct(selectedLinkProduct.id);
  });
  locationList?.addEventListener("click", event => {
    const button = event.target.closest("[data-barcode-product-id]");
    if (button) selectBarcodeProduct(button.dataset.barcodeProductId);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (actionModal && !actionModal.classList.contains("hidden")) {
      closeBarcodeActionModal();
      return;
    }
    if (scannerModal && !scannerModal.classList.contains("hidden")) closeOperationBarcodeScanner();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden){
      if (speechActive) stopVoiceSearch();
      if (scannerModal && !scannerModal.classList.contains("hidden")) closeOperationBarcodeScanner();
    }
  });
})();
