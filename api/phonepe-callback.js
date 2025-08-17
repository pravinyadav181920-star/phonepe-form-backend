export default async function handler(req, res) {
  try {
    const { txnId, status } = req.body;

    // Update Google Sheet row to mark as Paid
    await fetch("YOUR_GOOGLE_APPS_SCRIPT_URL", {
      method: "POST",
      body: JSON.stringify({ txnId, status }),
      headers: { "Content-Type": "application/json" }
    });

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Callback failed" });
  }
}
