export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { txnId } = req.body;

    // Call PhonePe status API (placeholder)
    res.status(200).json({
      success: true,
      txnId,
      status: "SUCCESS"
    });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong" });
  }
}
