// Excel indirme/yükleme ve toplu stok raporu
async function fetchProductsForExcel() { throw new Error("VDS Excel katmanı yüklenmeden ürünler alınamaz."); }

async function downloadStockExcel() {
  try {
    const selectedProducts = await fetchProductsForExcel();
    if (!selectedProducts.length) {
      showToast("Bu filtrede indirilecek ürün yok", true);
      return;
    }

    showToast(`${selectedProducts.length} ürün için Excel hazırlanıyor...`);

    const rows = selectedProducts.map(p => ({
      id: p.id,
      barkod: String(p.barcode || ""),
      urun_markasi: p.productBrand || "",
      kategori: p.category || "",
      arac_markasi: p.carBrand || "",
      arac_modeli: p.carModel || "",
      arac_tipi: p.carType || "",
      model_yili: p.vehicleYear || "",
      mevcut_stok: p.stock || 0,
      minimum_stok: p.minStock || 0,
      alis_fiyati: p.purchasePrice || 0,
      ortalama_satis_fiyati: p.averageSalePrice || 0,
      raf_konum: p.location || "",
      aciklama: p.note || "",
      resim_url: p.imageUrl || ""
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 38 }, { wch: 20 }, { wch: 18 }, { wch: 24 }, { wch: 18 },
      { wch: 22 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 12 },
      { wch: 14 }, { wch: 20 }, { wch: 18 }, { wch: 32 }, { wch: 42 }
    ];

    // Barkodları metin olarak tut; baştaki sıfırlar Excel'de kaybolmasın.
    for (let rowIndex = 1; rowIndex <= rows.length; rowIndex++) {
      const address = XLSX.utils.encode_cell({ r: rowIndex, c: 1 });
      if (!ws[address]) ws[address] = { t: "s", v: "", z: "@" };
      else {
        ws[address].t = "s";
        ws[address].v = String(ws[address].v ?? "");
        ws[address].z = "@";
      }
    }
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Stok");

    const filters = getExcelFilterValues();
    const fileSuffix = Object.values(filters).filter(Boolean).join("-")
      .replace(/[^a-zA-Z0-9ğüşöçıİĞÜŞÖÇ-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "tum-stok";

    const fileName = `stok-listesi-${fileSuffix}.xlsx`;
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 1500);

    showToast(`Excel indirildi ✅ (${selectedProducts.length} ürün)`);

  } catch (err) {
    console.error(err);
    showToast("Excel indirilemedi", true);
  }
}


function buildGroupedStockRows(products) {
  return buildGroupedStockProductGroups(products)
    .map(group => {
      const p = group.first;
      const locationDetails = group.members
        .slice()
        .sort((a, b) => String(a.location || "").localeCompare(String(b.location || ""), "tr"))
        .map(item => {
          const location = String(item.location || "Konum yok").trim() || "Konum yok";
          const stock = Number(item.stock || 0);
          const reserved = Number(item.reserved || 0);
          const barcode = String(item.barcode || "").trim();
          return `${location}: ${stock} stok / ${reserved} rezerve${barcode ? ` / ${barcode}` : ""}`;
        })
        .join(" | ");

      return {
        barkodlar: [...group.barcodes].join(" / "),
        urun_markasi: p.productBrand || "",
        kategori: p.category || "",
        arac_markasi: p.carBrand || "",
        arac_modeli: p.carModel || "",
        arac_tipi: p.carType || "",
        model_yili: p.vehicleYear || "",
        toplam_stok: group.totalStock,
        toplam_rezerve: group.totalReserved,
        kullanilabilir_stok: group.totalStock - group.totalReserved,
        minimum_stok_toplami: group.minStockTotal,
        raf_konumlari: locationDetails,
        birlesen_kayit_sayisi: group.members.length
      };
    })
    .sort((a, b) => {
      const left = `${a.kategori} ${a.arac_markasi} ${a.arac_modeli} ${a.arac_tipi}`;
      const right = `${b.kategori} ${b.arac_markasi} ${b.arac_modeli} ${b.arac_tipi}`;
      return left.localeCompare(right, "tr");
    });
}

async function downloadGroupedStockExcel() {
  try {
    if (!window.XLSX) return showToast("Excel modülü yüklenemedi", true);

    const selectedProducts = await fetchProductsForExcel();
    if (!selectedProducts.length) return showToast("Bu filtrede indirilecek ürün yok", true);

    const rows = buildGroupedStockRows(selectedProducts);
    showToast(`${selectedProducts.length} kayıt ${rows.length} toplu üründe birleştiriliyor...`);

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 28 }, { wch: 20 }, { wch: 25 }, { wch: 20 }, { wch: 24 },
      { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 18 },
      { wch: 20 }, { wch: 35 }, { wch: 18 }
    ];

    // Barkodları metin tut; baştaki sıfırlar kaybolmasın.
    for (let rowIndex = 1; rowIndex <= rows.length; rowIndex++) {
      const address = XLSX.utils.encode_cell({ r: rowIndex, c: 0 });
      if (ws[address]) {
        ws[address].t = "s";
        ws[address].v = String(ws[address].v ?? "");
        ws[address].z = "@";
      }
    }

    const infoRows = [
      ["Garage İstanbul - Toplu Stok Raporu"],
      ["Açıklama", "Aynı ürün kartları; ürün markası, kategori ve araç marka/model/tip/yıl bilgilerine göre tek satırda birleştirilir."],
      ["Toplam Stok", "Birleşen tüm ürün kartlarının mevcut stok toplamıdır."],
      ["Raf Konumları", "Aynı ürünün bulunduğu tüm raf/konumlar listelenir."],
      ["Barkodlar", "Birleşen kartlarda birden fazla barkod varsa hepsi gösterilir."],
      ["Not", "Bu dosya rapor amaçlıdır. Toplu veri güncellemek için Barkodlu Excel İndir dosyasını kullan."]
    ];
    const infoWs = XLSX.utils.aoa_to_sheet(infoRows);
    infoWs["!cols"] = [{ wch: 24 }, { wch: 100 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Toplu Stok");
    XLSX.utils.book_append_sheet(wb, infoWs, "Bilgi");

    const filters = getExcelFilterValues();
    const fileSuffix = Object.values(filters).filter(Boolean).join("-")
      .replace(/[^a-zA-Z0-9ğüşöçıİĞÜŞÖÇ-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "tum-stok";

    XLSX.writeFile(wb, `toplu-stok-${fileSuffix}.xlsx`);
    showToast(`Toplu stok Excel indirildi ✅ (${selectedProducts.length} kayıt → ${rows.length} ürün)`);
  } catch (err) {
    console.error(err);
    showToast(err.message || "Toplu stok Excel indirilemedi", true);
  }
}
window.downloadGroupedStockExcel = downloadGroupedStockExcel;

function normalizeExcelCell(value) {
  return String(value ?? "").trim();
}
function excelNumber(value, fallback = 0) {
  if (value === "" || value === null || value === undefined) return fallback;
  const normalized = String(value).replace(",", ".").trim();
  const num = Number(normalized);
  return Number.isFinite(num) ? num : fallback;
}

async function uploadStockExcel() { throw new Error("VDS Excel katmanı yüklenmeden Excel yüklenemez."); }

