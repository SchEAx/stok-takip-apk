import admin from "firebase-admin";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function getFirebaseApp() {
  if (admin.apps.length) return admin.app();

  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false });

  const incomingSecret = req.headers["x-notify-secret"];
  if (process.env.NOTIFY_SECRET && incomingSecret !== process.env.NOTIFY_SECRET) {
    return res.status(401).json({ ok: false, message: "Yetkisiz istek" });
  }

  const record = req.body?.record || req.body || {};

  const plate = record.plate || record.plaka || "Plaka yok";
  const customer = record.customer_name || record.MusteriAdi || "";
  const requested = record.requested_text || record.YapilacakIslem || "Yeni ürün talebi";

  const title = "Yeni depo talebi";
  const body = `${plate} - ${requested}${customer ? " / " + customer : ""}`;

  const { data: tokens, error } = await supabase
    .from("fcm_tokens")
    .select("token")
    .in("role", ["depo", "admin"])
    .eq("is_active", true);

  if (error) return res.status(500).json({ ok: false, message: error.message });

  if (!tokens?.length) {
    return res.status(200).json({ ok: false, message: "Kayıtlı depo cihazı yok" });
  }

  getFirebaseApp();

  const results = await Promise.allSettled(
    tokens.map((row) =>
      admin.messaging().send({
        token: row.token,
        notification: { title, body },
        data: {
          type: "stock_request",
          plate: String(plate),
          requested: String(requested)
        },
        android: { priority: "high" }
      })
    )
  );

  return res.status(200).json({
    ok: true,
    sent: results.filter(r => r.status === "fulfilled").length,
    failed: results.filter(r => r.status === "rejected").length
  });
}