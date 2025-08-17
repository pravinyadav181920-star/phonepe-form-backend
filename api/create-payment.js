import crypto from "crypto";

function setCORS(res) {
  const origin = process.env.FRONTEND_ORIGIN || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  setCORS(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST required" });

  try {
    const { name, phone, pincode, qualification, age } = req.body || {};
    if (!name || !phone || !pincode || !qualification || !age) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const {
      GOOGLE_SCRIPT_URL,
      PHONEPE_BASE_URL,
      PHONEPE_MERCHANT_ID,
      PHONEPE_SALT_KEY,
      PHONEPE_SALT_INDEX,
      BASE_URL
    } = process.env;

    if (!GOOGLE_SCRIPT_URL || !PHONEPE_BASE_URL || !PHONEPE_MERCHANT_ID || !PHONEPE_SALT_KEY || !PHONEPE_SALT_INDEX || !BASE_URL) {
      return res.status(500).json({ error: "Server missing env vars" });
    }

    // 1) Create a unique transaction id
    const merchantTransactionId = "txn_" + Date.now();

    // 2) Write "Pending" row to Google Sheet
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phone,
        pincode,
        qualification,
        age,
        paymentStatus: "Pending",
        txnId: merchantTransactionId
      })
    });

    // 3) Build PhonePe payload (₹100 = 10000 paise)
    const payloadObj = {
      merchantId: PHONEPE_MERCHANT_ID,
      merchantTransactionId,
      merchantUserId: "user_" + phone,
      amount: 10000,
      redirectUrl: `${BASE_URL}/api/success?mtid=${merchantTransactionId}`,
      redirectMode: "POST",
      callbackUrl: `${BASE_URL}/api/phonepe-callback`,
      mobileNumber: phone,
      paymentInstrument: { type: "PAY_PAGE" }
    };

    const payload = Buffer.from(JSON.stringify(payloadObj)).toString("base64");
    const path = "/pg/v1/pay";
    const xVerify =
      crypto.createHash("sha256").update(payload + path + PHONEPE_SALT_KEY).digest("hex") +
      "###" + PHONEPE_SALT_INDEX;

    const resp = await fetch(PHONEPE_BASE_URL + path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": xVerify,
        "X-MERCHANT-ID": PHONEPE_MERCHANT_ID
      },
      body: JSON.stringify({ request: payload })
    });

    const data = await resp.json();

    const redirectUrl =
      data?.data?.instrumentResponse?.redirectInfo?.url ||
      data?.data?.redirectInfo?.url;

    if (data?.success && redirectUrl) {
      return res.status(200).json({ redirectUrl, txnId: merchantTransactionId });
    } else {
      return res.status(400).json({ error: "PhonePe error", details: data });
    }
  } catch (err) {
    console.error("create-payment error:", err);
    return res.status(500).json({ error: "Internal server error", message: err.message });
  }
}
