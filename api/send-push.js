import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    const payload = req.body;

    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("*");

    const message = JSON.stringify({
      title: "Depo Talebi",
      body: `Yeni sipariş\n${payload.plate || "-"}\n${payload.requested_text || "-"}`,
      url: "/"
    });

    await Promise.all(
      (subs || []).map(s =>
        webpush.sendNotification(s.subscription, message)
      )
    );

    res.json({ ok: true });

  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
}
