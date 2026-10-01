// Manual sales reservation queue: persistent in VDS, separate from vehicle requests.
const manualReservationState = {
  rows: [], selected: new Map(), filter: 'active', search: '', total: 0,
  stats: {}, busy: false, loading: false, sequence: 0, searchTimer: null
};
const MANUAL_PENDING_KEY = 'garage_manual_reservation_pending_v1';
function manualRequestId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  if (!globalThis.crypto?.getRandomValues) throw new Error('Güvenli işlem kimliği oluşturulamadı');
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
    (Number(c) ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> Number(c) / 4).toString(16));
}
function manualPendingRequests() {
  try { return JSON.parse(localStorage.getItem(MANUAL_PENDING_KEY) || '{}'); } catch { return {}; }
}
function manualPendingKey(payload) {
  return JSON.stringify({ user: currentStaff().authUserId || currentStaff().username || currentStaff().name, payload });
}
function manualPendingId(payload) {
  const entries = manualPendingRequests();
  const key = manualPendingKey(payload);
  if (!entries[key]) {
    entries[key] = manualRequestId();
    // Store before sending: a lost response can be retried without reserving twice.
    localStorage.setItem(MANUAL_PENDING_KEY, JSON.stringify(entries));
  }
  return entries[key];
}
function clearManualPending(payload) {
  const entries = manualPendingRequests();
  delete entries[manualPendingKey(payload)];
  try { localStorage.setItem(MANUAL_PENDING_KEY, JSON.stringify(entries)); } catch {}
}
async function createManualStockReservation(productId, quantity, note = '') {
  const payload = { product_id: String(productId), quantity: Number(quantity), note: String(note).trim().slice(0, 300) };
  const requestId = manualPendingId(payload);
  try {
    const response = await apiFetch('/api/stock/manual-reservations', { method: 'POST', body: { ...payload, request_id: requestId } });
    clearManualPending(payload);
    return response;
  } catch (error) {
    if ([400,403,404,409].includes(error.status)) clearManualPending(payload);
    throw error;
  }
}
async function confirmManualStockReservation(product, quantity) {
  const value = await appPrompt(`${product.name || product.category} için ${quantity} adet ayrılacak.\nMüşteri / plaka / not (isteğe bağlı):`, '',
    { title: 'Rezerve et', okText: 'Rezerve et', placeholder: 'Örn. Ahmet · 34 ABC 123' });
  return value === null ? null : String(value).trim();
}
const manualStockActionsBusy = new Set();
async function performManualStockAction(product, direction, quantity, source) {
  const id = String(product.id);
  if (globalLoading || manualStockActionsBusy.has(id)) return;
  if (!['giris','cikis'].includes(direction)) return showToast('Hareket tipi belirlenemedi', true);
  if (!canAccessCategory(product.category)) return showToast('Bu ürün kategorisine yetkin yok', true);
  if (!requireUserAction(direction === 'giris' ? 'stockIn' : 'stockOut', 'Bu stok işlemi için yetkin yok')) return;
  if (!Number.isSafeInteger(quantity) || quantity < 1) return showToast('Adet pozitif tam sayı olmalı', true);
  const available = Number(product.stock || 0) - Number(product.reserved || 0);
  if (direction === 'cikis' && available < quantity) return showToast(`Yeterli kullanılabilir stok yok. Kullanılabilir: ${available}`, true);
  manualStockActionsBusy.add(id);
  let note = '';
  const label = direction === 'giris' ? 'giriş' : 'rezerve';
  try {
    if (direction === 'cikis') {
      note = await confirmManualStockReservation(product, quantity);
      if (note === null) return;
    } else if (!(await appConfirm(`${product.name || product.category} için ${quantity} adet giriş yapılsın mı?`, { okText: 'Giriş yap' }))) return;
    setLoading(true);
    const payload = await migrationStockMovement(id, direction, quantity, `${source} manuel ${label}${actorSuffix()}`, note);
    await refreshMigrationProductState(id, payload);
    await logActivity(direction === 'giris' ? 'stock_giris' : 'stock_rezerv', `${product.name || product.category} için ${quantity} adet ${label}`, 'stock_products', id).catch(() => {});
    await Promise.allSettled([loadMovements(), loadDashboardStats()]);
    showToast(direction === 'giris' ? `${quantity} adet giriş kaydedildi ✅` : `${quantity} adet rezerve edildi ✅`);
  } catch (error) { showToast(error.message || 'İşlem kaydedilemedi', true); }
  finally { manualStockActionsBusy.delete(id); setLoading(false); }
}
function manualReservationDate(value) {
  try { return new Date(value).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', dateStyle: 'short', timeStyle: 'short' }); }
  catch { return ''; }
}
function renderManualReservations() {
  const s = manualReservationState;
  const box = document.getElementById('manualReservationList');
  const stats = document.getElementById('manualReservationStats');
  if (stats) stats.textContent = `${Number(s.stats.active_count || 0)} açık kayıt · ${Number(s.stats.active_quantity || 0)} adet rezerve`;
  if (!box) return;
  const disabled = s.busy || s.loading ? 'disabled' : '';
  box.innerHTML = s.rows.length ? s.rows.map(row => {
    const remaining = Number(row.remaining_quantity || 0);
    const sold = Number(row.completed_quantity || 0);
    const cancelled = Number(row.cancelled_quantity || 0);
    const id = escapeHtml(row.id);
    const selected = s.selected.has(row.id);
    const status = remaining > 0 ? 'Satış bekliyor' : sold > 0 && cancelled > 0 ? 'Kapatıldı' : sold > 0 ? 'Satıldı' : 'İptal edildi';
    return `<article class="manual-reservation-row ${selected ? 'is-selected' : ''}">
      <div class="manual-reservation-choice">${remaining > 0 ? `<input type="checkbox" aria-label="${escapeHtml(row.product_name)} rezervasyonunu seç" ${selected ? 'checked' : ''} ${disabled} onchange="toggleManualReservation('${id}', this.checked)">` : '<span aria-hidden="true">✓</span>'}</div>
      <div class="manual-reservation-details"><strong>${escapeHtml(row.product_name || row.category || 'Ürün')}</strong>
        <div class="muted">${escapeHtml(row.location || 'Raf belirtilmedi')} · ${escapeHtml(row.created_by)} · ${escapeHtml(manualReservationDate(row.created_at))}</div>
        ${row.note ? `<div class="manual-reservation-note">${escapeHtml(row.note)}</div>` : ''}
        <div class="manual-reservation-counts">Ayrılan: <b>${Number(row.quantity)}</b> · Bekleyen: <b>${remaining}</b> · Satılan: <b>${sold}</b> · İptal: <b>${cancelled}</b></div>
        ${row.last_action_by ? `<div class="muted">Son işlem: ${escapeHtml(row.last_action_by)} · ${escapeHtml(manualReservationDate(row.updated_at))}</div>` : ''}
      </div><div class="manual-reservation-amount"><span class="manual-reservation-status">${status}</span>
        ${remaining > 0 ? `<label>İşlenecek adet<input type="number" inputmode="numeric" min="1" max="${remaining}" step="1" value="${s.selected.get(row.id) || remaining}" ${disabled} onchange="setManualReservationQuantity('${id}', this.value)"></label>` : ''}
      </div></article>`;
  }).join('') : '<div class="empty-state">Bu filtrede rezervasyon yok.</div>';
  const summary = document.getElementById('manualReservationSelection');
  if (summary) summary.textContent = `${s.selected.size} kayıt · ${[...s.selected.values()].reduce((a,b) => a + b, 0)} adet seçili`;
  for (const id of ['manualCompleteBtn', 'manualCancelBtn']) {
    const button = document.getElementById(id);
    if (button) button.disabled = s.busy || s.loading || !s.selected.size;
  }
  document.querySelectorAll('#page-reservations [data-reservation-control]').forEach(node => { node.disabled = s.busy || s.loading; });
  const more = document.getElementById('manualReservationMoreBtn');
  if (more) { more.classList.toggle('hidden', s.rows.length >= s.total); more.disabled = s.busy || s.loading; }
  document.querySelectorAll('[data-reservation-filter]').forEach(node => {
    node.classList.toggle('primary', node.dataset.reservationFilter === s.filter);
    node.classList.toggle('ghost', node.dataset.reservationFilter !== s.filter);
  });
}
async function loadManualReservations(append = false) {
  if (currentStaff().role !== 'admin') return;
  const s = manualReservationState;
  if (s.busy || (append && s.loading)) return;
  const sequence = ++s.sequence;
  s.loading = true;
  s.selected.clear();
  if (!append) s.rows = [];
  renderManualReservations();
  const box = document.getElementById('manualReservationList');
  if (!append && box) box.innerHTML = '<div class="empty-state">Rezerveler yükleniyor...</div>';
  const params = new URLSearchParams({ status: s.filter, q: s.search, offset: append ? s.rows.length : 0, limit: 100 });
  try {
    const response = await apiFetch('/api/stock/manual-reservations?' + params);
    if (sequence !== s.sequence) return;
    s.rows = append ? [...s.rows, ...(response.reservations || [])] : response.reservations || [];
    s.total = Number(response.total || 0);
    s.stats = response.stats || {};
  } catch (error) {
    if (sequence !== s.sequence) return;
    showToast(error.message || 'Rezerveler alınamadı', true);
    if (box && !append) box.innerHTML = `<div class="empty-state">Rezerveler alınamadı. VDS rezervasyon yamasının kurulu olduğunu kontrol edip Yenile düğmesine basın.</div>`;
    s.loading = false;
    renderManualReservationControls();
    return;
  } finally {
    if (sequence === s.sequence) s.loading = false;
  }
  if (sequence === s.sequence) renderManualReservations();
}
function renderManualReservationControls() {
  document.querySelectorAll('#page-reservations [data-reservation-control]').forEach(n => { n.disabled = manualReservationState.busy || manualReservationState.loading; });
  document.getElementById('manualCompleteBtn').disabled = true;
  document.getElementById('manualCancelBtn').disabled = true;
}
window.setManualReservationFilter = function(value) {
  if (manualReservationState.busy || !['active','closed','all'].includes(value)) return;
  manualReservationState.filter = value;
  loadManualReservations();
};
window.searchManualReservations = function(value) {
  clearTimeout(manualReservationState.searchTimer);
  manualReservationState.search = String(value || '').trim();
  manualReservationState.searchTimer = setTimeout(() => loadManualReservations(), 300);
};
window.toggleManualReservation = function(id, checked) {
  const s = manualReservationState;
  if (s.busy || s.loading) return;
  const row = s.rows.find(x => x.id === id);
  if (!row || Number(row.remaining_quantity) < 1) return;
  if (checked) s.selected.set(id, Number(row.remaining_quantity)); else s.selected.delete(id);
  renderManualReservations();
};
window.setManualReservationQuantity = function(id, value) {
  const s = manualReservationState;
  const row = s.rows.find(x => x.id === id);
  if (s.busy || s.loading || !row) return;
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 1 || n > Number(row.remaining_quantity)) {
    showToast('Adet 1 ile bekleyen rezerve adedi arasında olmalı', true);
  } else s.selected.set(id, n);
  renderManualReservations();
};
window.selectAllManualReservations = function() {
  const s = manualReservationState;
  if (s.busy || s.loading) return;
  const rows = s.rows.filter(x => Number(x.remaining_quantity) > 0).slice(0, 100);
  const allSelected = rows.length && rows.every(x => s.selected.has(x.id));
  s.selected.clear();
  if (!allSelected) rows.forEach(x => s.selected.set(x.id, Number(x.remaining_quantity)));
  renderManualReservations();
};
window.resolveManualReservations = async function(action) {
  const s = manualReservationState;
  if (s.busy || s.loading || !s.selected.size || !['complete','cancel'].includes(action)) return;
  if (!requireRoleAction(['admin'], 'Rezerveleri yalnızca Admin yönetebilir')) return;
  const items = [...s.selected.entries()].map(([id, quantity]) => ({ id, quantity })).sort((a,b) => a.id.localeCompare(b.id));
  if (items.length > 100) return showToast('Tek seferde en fazla 100 kayıt işleyebilirsiniz', true);
  const total = items.reduce((n,x) => n + x.quantity, 0);
  s.busy = true;
  renderManualReservations();
  let submitted = false;
  try {
    const yes = await appConfirm(action === 'complete'
      ? `${items.length} kayıttaki ${total} adet satıldı olarak stoktan düşülsün mü?`
      : `${items.length} kayıttaki ${total} adet rezerve iptal edilip kullanılabilir stoğa açılsın mı?`,
      { title: action === 'complete' ? 'Satışı tamamla' : 'Rezerveyi iptal et', okText: action === 'complete' ? 'Satılanları stoktan düş' : 'Rezerveyi iptal et', danger: action === 'complete' });
    if (!yes) return;
    const payload = { action, items };
    const requestId = manualPendingId(payload);
    submitted = true;
    let response;
    try { response = await apiFetch('/api/stock/manual-reservations/resolve', { method: 'POST', body: { ...payload, request_id: requestId } }); }
    catch (error) { if ([400,403,404,409].includes(error.status)) clearManualPending(payload); throw error; }
    clearManualPending(payload);
    const fresh = new Map((response.products || []).map(p => [String(p.id), mapProduct(p)]));
    for (const key of ['products','filteredProducts','operationResults','movementResults']) {
      state[key] = (state[key] || []).map(p => fresh.has(String(p.id)) ? { ...p, ...fresh.get(String(p.id)) } : p);
    }
    state.operationCacheKey = '';
    renderOperationCards(state.operationResults || []);
    renderMovementCards(state.movementResults || []);
    await Promise.allSettled([loadDashboardStats(), loadMovements()]);
    showToast(action === 'complete' ? `${total} adet stoktan düşüldü ✅` : `${total} adet yeniden kullanılabilir ✅`);
  } catch (error) {
    showToast(error.message || 'İşlem sonucu alınamadı. Listeyi yenileyin.', true);
  } finally {
    s.busy = false;
    if (submitted) await loadManualReservations(); else renderManualReservations();
  }
};
window.loadManualReservations = loadManualReservations;
