// Müşteri memnuniyeti / anket yönetimi
function customerSurveyRowAverage(row) {
  const values = [1,2,3,4,5,6,7,8]
    .map(i => Number(row?.[`q${i}`] || 0))
    .filter(v => Number.isFinite(v) && v > 0);
  if (!values.length) return "0.00";
  return (values.reduce((a,b) => a+b, 0) / values.length).toFixed(2);
}

function customerSurveyAdminDeleteButton(id) {
  const liveRole = String(
    state?.currentUser?.role ||
    (typeof currentStaff === "function" ? currentStaff()?.role : "") ||
    ""
  ).trim().toLowerCase();

  if (liveRole !== "admin") {
    return `<span class="muted">-</span>`;
  }

  return `<button class="btn danger mini survey-delete-btn" type="button" onclick="deleteCustomerSurvey('${escapeHtml(String(id || ""))}')">Sil</button>`;
}

async function deleteCustomerSurvey() { showToast("Anket silme VDS endpointi henüz bağlı değil", true); }
window.deleteCustomerSurvey = deleteCustomerSurvey;

async function loadCustomerSurveyStats() { throw new Error("VDS API yüklenmeden anketler alınamaz."); }
window.loadCustomerSurveyStats = loadCustomerSurveyStats;
