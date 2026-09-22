// Form olayları, UI event bağları, boot ve heartbeat
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
      const wasEdit = Boolean(payload.id);
      const result = await migrationSaveProduct(payload);
      const productId = result?.product?.id || payload.id;
      const savedProduct = productId
        ? await refreshMigrationProductState(productId, { product: result?.product }).catch(() => null)
        : null;
      await logActivity(
        wasEdit ? "product_update" : "product_insert",
        `${wasEdit ? "Ürün güncellendi" : "Ürün eklendi"}: ${payload.category} ${payload.carBrand} ${payload.carModel}`,
        "stock_products",
        productId
      ).catch(error => console.warn("Ürün etkinlik kaydı yazılamadı:", error));
      showToast(wasEdit ? "Ürün güncellendi ✅" : "Ürün kaydedildi ✅");
      clearProductForm();
      state.operationFilterOptionsLoaded = false;
      state.operationCacheKey = "";
      await Promise.allSettled([
        loadDashboardStats(),
        loadOperationFilterOptions(),
        loadMovements()
      ]);
      if (el.operationBrandFilter) el.operationBrandFilter.value = "";
      if (el.operationCategoryFilter) el.operationCategoryFilter.value = "";
      const product = savedProduct || (result?.product && mapProduct(result.product));
      if (product) {
        clearTimeout(state.operationSearchTimer);
        state.operationQuerySeq++;
        if (el.operationSearchInput) {
          el.operationSearchInput.value = String(product.barcode || product.carModel || product.category || "");
          el.operationSearchInput.blur();
        }
        state.operationResults = [product];
      }
      switchTab("operation", { showSavedProduct: Boolean(product) });
      if (product) renderOperationCards([product]);
      window.scrollTo({ top: 0, behavior: "smooth" });
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
if (el.checkUpdateBtn) el.checkUpdateBtn.addEventListener("click", forceCheckAppUpdate);
if (el.pwaInstallBtn) el.pwaInstallBtn.addEventListener("click", installPwaApp);

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
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => registerPwaServiceWorker().catch(console.error));
}
async function bootApp() {
  const authenticated = await initAuthGate();
  if (authenticated && state.currentUser) {
    renderStaffSelector();
    switchTab("operation");
    initGarageBackGuard();
    loadActivityLogs();
    await Promise.all([
      loadDashboardStats().catch(err => console.error(err)),
      loadMovements().catch(err => console.error(err)),
      loadOperationFilterOptions().catch(err => console.error(err))
    ]);
  }
  initUpdateChecker();
}
bootApp();
async function heartbeatCurrentUser() {
  if (!migrationToken() || !state.currentUser) return;
  try {
    const payload = await apiFetch("/api/auth/heartbeat", { method: "PATCH" });
    updateStaffMeta(state.currentUser.name, { lastSeenAt: payload.last_seen_at || new Date().toISOString(), role: state.currentUser.role });
  } catch (err) {
    console.warn("Heartbeat hatası:", err?.message || err);
  }
}
setInterval(heartbeatCurrentUser, 30000);
heartbeatCurrentUser();
