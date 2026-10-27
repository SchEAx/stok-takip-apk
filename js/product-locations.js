// Ürün kartından raf ekleme, stok yerleştirme ve boş raf kaldırma.
const productLocationDialog = { productId: '', products: [], permissions: {}, busy: false, requestId: '', requestKey: '', returnFocus: null, openSequence: 0 };
const productLocationArchiveRequests = new Map();

function canManageProductLocations() { return ['admin', 'depo'].includes(currentStaff().role); }
function canArchiveProductLocation(product, count) {
  return currentStaff().role === 'admin' && count > 1 && Number(product.stock || 0) === 0 && Number(product.reserved || 0) === 0;
}
function productLocationNode(id) { return document.getElementById(id); }
function newProductLocationRequestId() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
  const hex = [...bytes].map(value => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
async function ensureProductLocationsApi() {
  const response = await apiFetch('/api/product-locations/health').catch(error => { if (error.status === 404) throw new Error('Konum yamasını önce VDS’ye kurmalısın'); throw error; });
  if (response.status !== 'ok' || response.version !== 1 || response.preserve_history !== true) throw new Error('Konum yamasını önce VDS’ye kurmalısın');
}
function productLocationPreview() {
  const dialog = productLocationDialog;
  const mode = productLocationNode('productLocationMode').value;
  const qtyNode = productLocationNode('productLocationQuantity');
  const source = dialog.products.find(row => row.id === productLocationNode('productLocationSource').value);
  const available = Number(source?.quantity || 0) - Number(source?.reserved_quantity || 0);
  const total = dialog.products.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
  const quantity = Number(qtyNode.value || 0);
  qtyNode.disabled = mode === 'empty' || dialog.busy;
  productLocationNode('productLocationSourceField').classList.toggle('hidden', mode !== 'transfer');
  productLocationNode('productLocationQuantityField').classList.toggle('hidden', mode === 'empty');
  qtyNode.max = mode === 'transfer' ? String(Math.max(0, available)) : '2147483647';
  const preview = productLocationNode('productLocationPreview');
  if (mode === 'empty') preview.textContent = `Boş raf eklenecek. Toplam stok ${total} olarak kalır.`;
  else if (mode === 'transfer') preview.textContent = `${source?.location || 'Konum yok'} rafından ${Number.isSafeInteger(quantity) && quantity > 0 ? quantity : '…'} adet taşınacak. Kullanılabilir: ${available}. Toplam stok ${total} olarak kalır; rezerve ürünler taşınmaz.`;
  else preview.textContent = `Yeni gelen ${Number.isSafeInteger(quantity) && quantity > 0 ? quantity : '…'} adet bu rafa eklenecek. Toplam stok ${Number.isSafeInteger(quantity) && quantity > 0 ? total + quantity : total} olacak.`;
  productLocationNode('productLocationSubmit').textContent = mode === 'transfer' ? 'Rafı ekle ve aktar' : mode === 'receive' ? 'Rafı ekle ve stok gir' : 'Konumu ekle';
}
function setProductLocationBusy(value) {
  productLocationDialog.busy = value;
  ['productLocationName', 'productLocationMode', 'productLocationSource', 'productLocationQuantity', 'productLocationSubmit', 'productLocationClose', 'productLocationCancel'].forEach(id => { const node = productLocationNode(id); if (node) node.disabled = value; });
  const quantity = productLocationNode('productLocationQuantity');
  if (quantity) quantity.disabled = value || productLocationNode('productLocationMode')?.value === 'empty';
}
function closeProductLocationModal() {
  if (productLocationDialog.busy) return;
  productLocationDialog.openSequence++;
  productLocationNode('productLocationModal')?.classList.add('hidden');
  productLocationDialog.returnFocus?.focus?.();
}
window.closeProductLocationModal = closeProductLocationModal;
window.openProductLocationModal = async function(id) {
  if (!canManageProductLocations()) return showToast('Konum ekleme yetkisi Admin / Depo kullanıcılarında', true);
  if (productLocationDialog.busy) return;
  const sequence = ++productLocationDialog.openSequence;
  try {
    await ensureProductLocationsApi();
    const payload = await apiFetch(`/api/products/${encodeURIComponent(id)}/locations`);
    if (sequence !== productLocationDialog.openSequence) return;
    if (!payload.can_manage) throw new Error('Konum ekleme yetkin yok');
    productLocationDialog.productId = String(id);
    productLocationDialog.products = payload.products || [];
    productLocationDialog.permissions = payload;
    productLocationDialog.requestId = '';
    productLocationDialog.requestKey = '';
    productLocationDialog.returnFocus = document.activeElement;
    const first = productLocationDialog.products.find(row => row.id === String(id)) || productLocationDialog.products[0];
    if (!first) throw new Error('Ürün bulunamadı');
    productLocationNode('productLocationProductName').textContent = first.product_name || 'Ürün';
    productLocationNode('productLocationName').value = '';
    const modes = [['empty', 'Şimdilik boş konum ekle'], ...(payload.can_transfer ? [['transfer', 'Mevcut raftan stok aktar']] : []), ...(payload.can_receive ? [['receive', 'Yeni gelen stoğu bu rafa gir']] : [])];
    productLocationNode('productLocationMode').innerHTML = modes.map(([value, text]) => `<option value="${value}">${text}</option>`).join('');
    productLocationNode('productLocationMode').value = 'empty';
    productLocationNode('productLocationSource').innerHTML = productLocationDialog.products.map(row => `<option value="${escapeHtml(row.id)}">${escapeHtml(row.location || 'Konum yok')} · Kullanılabilir: ${Number(row.quantity) - Number(row.reserved_quantity || 0)}</option>`).join('');
    productLocationNode('productLocationSource').value = productLocationDialog.products.find(row => Number(row.quantity) > Number(row.reserved_quantity || 0))?.id || first.id;
    productLocationNode('productLocationQuantity').value = '1';
    productLocationNode('productLocationMessage').textContent = '';
    productLocationNode('productLocationExisting').textContent = productLocationDialog.products.map(row => `${row.location || 'Konum yok'}: ${Number(row.quantity)} adet`).join(' · ');
    setProductLocationBusy(false);
    productLocationPreview();
    productLocationNode('productLocationModal').classList.remove('hidden');
    productLocationNode('productLocationName').focus();
  } catch (error) { showToast(error.message || 'Konumlar açılamadı', true); }
};
function applyProductLocationResult(rawProducts, anchorId, archivedId = '') {
  const products = (rawProducts || []).map(mapProduct);
  const old = [...(state.operationResults || []), ...(state.movementResults || []), ...(state.products || [])].find(row => String(row.id) === String(anchorId));
  const key = old ? groupedStockIdentityKey(old) : products[0] ? groupedStockIdentityKey(products[0]) : '';
  for (const name of ['products', 'filteredProducts', 'operationResults', 'movementResults']) {
    const rows = state[name] || [];
    const contains = rows.some(row => groupedStockIdentityKey(row) === key || String(row.id) === String(archivedId));
    state[name] = rows.filter(row => groupedStockIdentityKey(row) !== key && String(row.id) !== String(archivedId));
    if (contains) state[name].push(...products);
  }
  state.operationCacheKey = '';
  if (el.operationResultBox) renderOperationCards(state.operationResults || []);
  if (typeof renderMovementCards === 'function' && el.movementSearchList) renderMovementCards(state.movementResults || []);
  if (typeof renderProducts === 'function') renderProducts();
}
async function submitProductLocation(event) {
  event.preventDefault();
  const dialog = productLocationDialog;
  if (dialog.busy || !canManageProductLocations()) return;
  const mode = productLocationNode('productLocationMode').value;
  const location = productLocationNode('productLocationName').value.trim().replace(/\s+/g, ' ');
  const quantity = mode === 'empty' ? 0 : Number(productLocationNode('productLocationQuantity').value);
  const sourceId = mode === 'transfer' ? productLocationNode('productLocationSource').value : dialog.productId;
  const message = productLocationNode('productLocationMessage');
  if (!location || location.length > 200) { message.textContent = 'Raf / konum adını yaz'; return; }
  if (dialog.products.some(row => normalizeText(row.location) === normalizeText(location))) { message.textContent = 'Bu raf / konum zaten listede var'; return; }
  if (mode !== 'empty' && (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 2147483647)) { message.textContent = 'Adet pozitif tam sayı olmalı'; return; }
  if (mode === 'transfer') {
    const source = dialog.products.find(row => row.id === sourceId);
    if (!source || Number(source.quantity) - Number(source.reserved_quantity || 0) < quantity) { message.textContent = 'Kaynak rafta yeterli kullanılabilir stok yok'; return; }
  }
  const body = { mode, location, quantity, source_product_id: sourceId };
  const requestKey = JSON.stringify(body);
  if (requestKey !== dialog.requestKey) { dialog.requestId = newProductLocationRequestId(); dialog.requestKey = requestKey; }
  body.request_id = dialog.requestId;
  setProductLocationBusy(true);
  message.textContent = '';
  try {
    const payload = await apiFetch(`/api/products/${encodeURIComponent(dialog.productId)}/locations`, { method: 'POST', body });
    applyProductLocationResult(payload.products, dialog.productId);
    setProductLocationBusy(false);
    closeProductLocationModal();
    showToast(mode === 'transfer' ? 'Konum eklendi, stok raftan rafa aktarıldı ✅' : mode === 'receive' ? 'Konum eklendi, yeni stok girildi ✅' : 'Konum eklendi ✅');
    await Promise.allSettled([loadDashboardStats(), loadMovements()]);
  } catch (error) {
    if (error.status === 401) { setProductLocationBusy(false); closeProductLocationModal(); return; }
    message.textContent = error.message || 'Konum kaydedilemedi; tekrar deneyebilirsin';
  }
  finally { setProductLocationBusy(false); }
}
window.archiveProductLocation = async function(id) {
  if (currentStaff().role !== 'admin') return showToast('Konum kaldırma yetkisi sadece adminde', true);
  const product = [...(state.operationResults || []), ...(state.products || []), ...(state.movementResults || [])].find(row => row.id === String(id));
  if (!product || Number(product.stock) !== 0 || Number(product.reserved) !== 0) return showToast('Stoğu veya rezervesi bulunan konum kaldırılamaz', true);
  if (productLocationArchiveRequests.get(id)?.busy) return;
  const request = productLocationArchiveRequests.get(id) || { requestId: newProductLocationRequestId(), busy: false };
  request.busy = true;
  productLocationArchiveRequests.set(id, request);
  try {
    const confirmed = await appConfirm(`${product.location || 'Konum yok'} rafını bu ürünün listesinden kaldırmak istiyor musun? Geçmiş hareketler korunur.`, { title: 'Boş konumu kaldır', okText: 'Konumu kaldır', danger: true });
    if (!confirmed) return;
    await ensureProductLocationsApi();
    const payload = await apiFetch(`/api/product-locations/${encodeURIComponent(id)}/archive`, { method: 'POST', body: { request_id: request.requestId } });
    applyProductLocationResult(payload.products, id, id);
    productLocationArchiveRequests.delete(id);
    showToast('Boş konum kaldırıldı, geçmiş kayıtlar korundu ✅');
    await Promise.allSettled([loadDashboardStats(), loadMovements()]);
  } catch (error) { showToast(error.message || 'Konum kaldırılamadı', true); }
  finally { request.busy = false; }
};
productLocationNode('productLocationForm')?.addEventListener('submit', submitProductLocation);
['productLocationMode', 'productLocationSource', 'productLocationQuantity'].forEach(id => {
  productLocationNode(id)?.addEventListener('change', productLocationPreview);
  productLocationNode(id)?.addEventListener('input', productLocationPreview);
});
['productLocationClose', 'productLocationCancel'].forEach(id => productLocationNode(id)?.addEventListener('click', closeProductLocationModal));
productLocationNode('productLocationModal')?.addEventListener('click', event => { if (event.target === event.currentTarget) closeProductLocationModal(); });
document.addEventListener('keydown', event => {
  const modal = productLocationNode('productLocationModal');
  if (!modal || modal.classList.contains('hidden')) return;
  if (event.key === 'Escape') { event.preventDefault(); closeProductLocationModal(); }
  if (event.key === 'Tab') {
    const nodes = [...modal.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled)')].filter(node => node.offsetParent !== null);
    if (!nodes.length) return;
    const first = nodes[0], last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
