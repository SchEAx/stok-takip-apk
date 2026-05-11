import admin from "firebase-admin";

function getFirebaseApp() {
  if (admin.apps.length) return admin.app();

  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false });
  }

  const { token, title, body } = req.body || {};

  if (!token) {
    return res.status(400).json({
      ok: false,
      message: "Token yok"
    });
  }

  getFirebaseApp();

  const response = await admin.messaging().send({
    token,
    notification: {
      title: title || "Garage İstanbul",
      body: body || "Yeni bildirim var"
    },
    android: {
      priority: "high"
    }
  });

  return res.status(200).json({
    ok: true,
    response
  });
}