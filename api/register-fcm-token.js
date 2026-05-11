import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false });
  }

  const { token, role = "depo", device = "android" } = req.body || {};

  if (!token) {
    return res.status(400).json({
      ok: false,
      message: "Token yok"
    });
  }

  const { error } = await supabase
    .from("fcm_tokens")
    .upsert(
      {
        token,
        role,
        device,
        is_active: true,
        updated_at: new Date().toISOString()
      },
      {
        onConflict: "token"
      }
    );

  if (error) {
    return res.status(500).json({
      ok: false,
      message: error.message
    });
  }

  return res.status(200).json({
    ok: true
  });
}