export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, phone, pincode, qualification, age } = req.body;

    // Save to Google Sheet
    await fetch("YOUR_GOOGLE_APPS_SCRIPT_URL", {
      method: "POST",
      body: JSON.stringify({ name, phone, pincode, qualification, age, status: "Pending" }),
      headers: { "Content-Type": "application/json" }
    });

    // PhonePe Payment Integration
    const merchantId = process.env.PHONEPE_MERCHANT_ID;
    const saltKey = process.env.PHONEPE_SALT_KEY;
    const saltIndex = process.env.PHONEPE_SALT_INDEX;

    const payload = {
      merchantId,
      transactionId: "TXN_" + Date.now(),
      amount: 10000, // 100 INR (in paise)
      redirectUrl: process.env.BASE_URL + "/api/success",
      callbackUrl: process.env.BASE_URL + "/api/phonepe-callback",
    };

    // TODO: encrypt payload + hit PhonePe (this is placeholder)
    res.status(200).json({
      success: true,
      paymentUrl: "https://api-preprod.phonepe.com/fake-payment-page"
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
}
