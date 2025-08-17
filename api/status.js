import crypto from "crypto";

function setCORS(res) {
  const origin = process.env.FRONTEND_ORIGIN || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  setCORS(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const mtid =
      req.query?.mtid ||
      (req.method === "POST" ? req.body?.mtid : null);

    if (!mtid) return res.status(400).json({ error: "Missing mtid" });

    const {
      PHONEPE_BASE_URL,
      PHONEPE_MERCHANT_ID,
      PHONEPE_SALT_KEY,
      PHONEPE_SALT_INDEX,
      GOOGLE_SCRIPT_URL
    } = process.env;

    const path = `/pg/v1/status/${PHONEPE_MERCHANT_ID}/${mtid}`;
    const xVerify =
      crypto.createHash("sha256").update(path + PHONEPE_SALT_KEY).digest("hex") +
      "###" + PHONEPE_SALT_INDEX;

    const resp = await fetch(PHONEPE_BASE_URL + path, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": xVerify,
        "X-MERCHANT-ID": PHONEPE_MERCHANT_ID,
        "accept": "application/json"
      }
    });

    const data = await resp.json();
    const state = data?.data?.state || "UNKNOWN";

    if (state === "COMPLETED" || state === "SUCCESS") {
      // Update sheet to Paid
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txnId: mtid, paymentStatus: "Paid" })
      });
      return res.status(200).json({ success: true, status: "Paid" });
    } else {
      return res.status(200).json({ success: false, status: state, raw: data });
    }
  } catch (err) {
    console.error("status error:", err);
    return res.status(500).json({ error: "Internal server error", message: err.message });
  }
}
