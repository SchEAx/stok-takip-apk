// GarageFlow v16.9 · Müşteri Memnuniyeti / VDS PostgreSQL yönetimi.
// Kimlik doğrulama ve ağ hataları merkezi apiFetch üzerinden yönetilir.
const SURVEY_PAGE_SIZE = 200;
const CUSTOMER_SURVEY_QUESTIONS = [
  "Karşılama biçimi ve nezaket",
  "İhtiyaçların anlaşılması ve bilgilendirme",
  "Montaj kalitesi ve işçilik",
  "Söz verilen zamanda teslim",
  "Teslimat anındaki temizlik",
  "Fiyat / Performans",
  "Tavsiye etme olasılığı",
  "Muhatap bulabilme"
];

let customerSurveyRows = [];
let customerSurveyTotal = 0;
let customerSurveyFilter = "all";
let customerSurveyLoading = false;
let customerSurveyRequestId = 0;

function customerSurveyScores(row) {
  return CUSTOMER_SURVEY_QUESTIONS.map((_, i) => Number(row?.[`q${i + 1}`]))
    .filter(v => Number.isFinite(v) && v >= 1 && v <= 5);
}

function customerSurveyRowAverage(row) {
  const values = customerSurveyScores(row);
  return values.length
    ? (values.reduce((sum, n) => sum + n, 0) / values.length).toFixed(2)
    : "-";
}

function customerSurveyHasLowScore(row) {
  return customerSurveyScores(row).some(score => score <= 2);
}

function customerSurveyIsAdmin() {
  return String(state?.currentUser?.role || "").trim().toLowerCase() === "admin";
}

function customerSurveyAdminDeleteButton(id) {
  if (!customerSurveyIsAdmin()) return '<span class="muted">-</span>';
  return `<button class="btn danger mini survey-delete-btn" type="button" onclick="deleteCustomerSurvey('${escapeHtml(String(id ?? ""))}')">Sil</button>`;
}

function customerSurveySafeDate(date) {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? "-"
    : parsed.toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });
}

function renderCustomerSurveyStats() {
  const panel = document.getElementById("customerSurveyPanel");
  if (!panel) return;

  const rows = customerSurveyRows;
  const low = rows.filter(customerSurveyHasLowScore);
  const contact = rows.filter(r => r.contact_allowed === true);
  const allScores = rows.flatMap(customerSurveyScores);
  const average = allScores.length
    ? (allScores.reduce((sum, v) => sum + v, 0) / allScores.length).toFixed(2)
    : "-";

  const questionRows = CUSTOMER_SURVEY_QUESTIONS.map((question, index) => {
    const values = rows.map(r => Number(r?.[`q${index + 1}`]))
      .filter(n => Number.isFinite(n) && n >= 1 && n <= 5);
    const avg = values.length
      ? (values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(2)
      : "-";
    return `<tr><td>${index + 1}. ${escapeHtml(question)}</td><td><strong>${avg}${values.length ? " / 5" : ""}</strong></td></tr>`;
  }).join("");

  const filters = [
    ["all", "Tümü", rows.length],
    ["low", "Düşük puanlı", low.length],
    ["contact", "İletişim izni", contact.length]
  ];
  const shown = rows.filter(row =>
    customerSurveyFilter === "low" ? customerSurveyHasLowScore(row)
    : customerSurveyFilter === "contact" ? row.contact_allowed === true
    : true
  );
  const buttons = filters.map(([key, label, count]) =>
    `<button type="button" class="btn ${customerSurveyFilter === key ? "primary" : "secondary"}" onclick="setCustomerSurveyFilter('${key}')">${label} (${count})</button>`
  ).join("");

  const entries = shown.map(row => {
    const lowRow = customerSurveyHasLowScore(row);
    const values = CUSTOMER_SURVEY_QUESTIONS.map((_, i) => {
      const score = Number(row?.[`q${i + 1}`]);
      return `<td>${Number.isInteger(score) && score >= 1 && score <= 5 ? score : "-"}</td>`;
    }).join("");
    const suggestion = String(row.suggestion || "").trim();
    const phone = row.contact_allowed === true && row.phone ? String(row.phone) : "";
    return `<tr class="${lowRow ? "survey-row-low" : ""}">
      <td>${escapeHtml(row.id)}</td>
      <td>${customerSurveyAdminDeleteButton(row.id)}</td>
      <td>${escapeHtml(customerSurveySafeDate(row.created_at))}</td>
      <td><strong>${customerSurveyRowAverage(row)}</strong></td>
      ${values}
      <td class="survey-table-comment">${suggestion ? escapeHtml(suggestion) : '<span class="muted">-</span>'}</td>
      <td>${row.contact_allowed === true ? "Evet" : "Hayır"}</td>
      <td>${phone ? escapeHtml(phone) : "-"}</td>
    </tr>`;
  }).join("");

  const remaining = Math.max(0, customerSurveyTotal - rows.length);
  panel.innerHTML = `
    <p class="muted">Veritabanında ${customerSurveyTotal} anket var. ${rows.length} kayıt yüklendi.${remaining ? " Aşağıdan diğer kayıtları da yükleyebilirsin." : ""} Ortalamalar ve filtreler yüklenen kayıtlara göre hesaplanır.</p>
    <div class="survey-stats">
      <div class="stat-card"><b>${customerSurveyTotal}</b><span>Toplam anket</span></div>
      <div class="stat-card"><b>${average}</b><span>Genel ortalama / 5 (yüklenen)</span></div>
      <div class="stat-card"><b>${low.length}</b><span>Düşük puanlı (yüklenen)</span></div>
      <div class="stat-card"><b>${contact.length}</b><span>İletişim izni (yüklenen)</span></div>
    </div>
    <h3>Soru bazında ortalama</h3>
    <div class="survey-table-scroll"><table class="survey-table survey-average-table"><thead><tr><th>Soru</th><th>Ortalama</th></tr></thead><tbody>${questionRows}</tbody></table></div>
    <div class="survey-record-head"><div><h3>Anket cevapları</h3><p class="muted">${shown.length} kayıt gösteriliyor. Düşük puanlı satırlar vurgulanır.</p></div></div>
    <div class="row-gap" style="display:flex;flex-wrap:wrap;gap:8px;margin:12px 0">${buttons}</div>
    ${shown.length ? `<div class="survey-table-scroll"><table class="survey-table survey-record-table"><thead><tr><th>ID</th><th>İşlem</th><th>Tarih</th><th>Ort.</th>${CUSTOMER_SURVEY_QUESTIONS.map((_, i) => `<th title="${escapeHtml(CUSTOMER_SURVEY_QUESTIONS[i])}">S${i + 1}</th>`).join("")}<th>Görüş / Öneri</th><th>İletişim izni</th><th>Telefon</th></tr></thead><tbody>${entries}</tbody></table></div>` : `<div class="empty-state">${rows.length ? "Bu filtrede anket bulunamadı." : "Henüz anket kaydı yok."}</div>`}
    ${remaining ? `<div style="margin:14px 0"><button class="btn secondary" type="button" onclick="loadMoreCustomerSurveys()" ${customerSurveyLoading ? "disabled" : ""}>${customerSurveyLoading ? "Yükleniyor..." : `Daha fazla yükle (${remaining} kayıt kaldı)`}</button></div>` : ""}
  `;
}

async function loadCustomerSurveyStats() {
  const panel = document.getElementById("customerSurveyPanel");
  if (!panel) return;
  const requestId = ++customerSurveyRequestId;
  customerSurveyLoading = true;
  panel.innerHTML = '<div class="empty-state">Anketler VDS üzerinden yükleniyor...</div>';
  try {
    const result = await apiFetch(`/api/customer-surveys?limit=${SURVEY_PAGE_SIZE}&offset=0`);
    if (requestId !== customerSurveyRequestId) return;
    if (!Array.isArray(result.surveys)) throw new Error("Anket API beklenen kayıt listesini döndürmedi");
    customerSurveyRows = result.surveys;
    customerSurveyTotal = Math.max(customerSurveyRows.length, Number(result.count) || 0);
    renderCustomerSurveyStats();
  } catch (error) {
    if (requestId !== customerSurveyRequestId) return;
    console.error("Customer surveys load error:", error);
    panel.innerHTML = `<div class="empty-state">Anket verileri alınamadı: ${escapeHtml(error?.message || "Bilinmeyen hata")}<br><button class="btn secondary" type="button" onclick="loadCustomerSurveyStats()">Tekrar dene</button></div>`;
    showToast(error?.message || "Anket verileri alınamadı", true);
  } finally {
    if (requestId === customerSurveyRequestId) customerSurveyLoading = false;
  }
}
window.loadCustomerSurveyStats = loadCustomerSurveyStats;

async function loadMoreCustomerSurveys() {
  if (customerSurveyLoading || customerSurveyRows.length >= customerSurveyTotal) return;
  customerSurveyLoading = true;
  renderCustomerSurveyStats();
  const requestId = customerSurveyRequestId;
  try {
    const offset = customerSurveyRows.length;
    const result = await apiFetch(`/api/customer-surveys?limit=${SURVEY_PAGE_SIZE}&offset=${offset}`);
    if (requestId !== customerSurveyRequestId) return;
    if (!Array.isArray(result.surveys)) throw new Error("Anket API beklenen kayıt listesini döndürmedi");
    const knownIds = new Set(customerSurveyRows.map(row => String(row.id)));
    customerSurveyRows.push(...result.surveys.filter(row => !knownIds.has(String(row.id))));
    customerSurveyTotal = Math.max(customerSurveyRows.length, Number(result.count) || 0);
    // Silinme/yeni eklenme sonucu sayfalama sınırı kaymış olabilir: sonsuz 'daha fazla' döngüsünü önle.
    if (!result.surveys.length) customerSurveyTotal = customerSurveyRows.length;
  } catch (error) {
    if (requestId === customerSurveyRequestId) {
      console.error("Customer surveys next page error:", error);
      showToast(error?.message || "Diğer anketler alınamadı", true);
    }
  } finally {
    if (requestId === customerSurveyRequestId) {
      customerSurveyLoading = false;
      renderCustomerSurveyStats();
    }
  }
}
window.loadMoreCustomerSurveys = loadMoreCustomerSurveys;

function setCustomerSurveyFilter(filter) {
  if (!["all", "low", "contact"].includes(filter)) return;
  customerSurveyFilter = filter;
  renderCustomerSurveyStats();
}
window.setCustomerSurveyFilter = setCustomerSurveyFilter;

async function deleteCustomerSurvey(id) {
  if (!customerSurveyIsAdmin()) {
    showToast("Anket silme işlemini sadece Admin yapabilir", true);
    return;
  }
  const surveyId = String(id ?? "").trim();
  if (!/^\d+$/.test(surveyId) || !customerSurveyRows.some(row => String(row.id) === surveyId)) {
    showToast("Silinecek anket bulunamadı", true);
    return;
  }
  if (!(await appConfirm(`${surveyId} numaralı anket kalıcı olarak silinsin mi?`, {
    title: "Anket silme onayı", danger: true, okText: "Anketi Sil"
  }))) return;
  if (!customerSurveyIsAdmin()) return;
  try {
    await apiFetch(`/api/customer-surveys/${encodeURIComponent(surveyId)}`, { method: "DELETE" });
    customerSurveyRequestId++;
    await loadCustomerSurveyStats();
    showToast("Anket silindi ✅");
  } catch (error) {
    console.error("Customer survey delete error:", error);
    showToast(error?.message || "Anket silinemedi", true);
  }
}
window.deleteCustomerSurvey = deleteCustomerSurvey;
