export default async function handler(req, res) {
  const final = process.env.FINAL_REDIRECT_URL || "https://embroideryhub.in/";
  const mtid = (req.query?.mtid || "").toString();

  const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Verifying Payment…</title>
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;background:#f9fafb}
    .box{background:#fff;padding:24px;border-radius:16px;box-shadow:0 8px 30px rgba(0,0,0,.08);max-width:420px;text-align:center}
    .spin{width:22px;height:22px;border:3px solid #4f46e5;border-right-color:transparent;border-radius:50%;display:inline-block;animation:spin 1s linear infinite;margin-right:8px;vertical-align:-4px}
    @keyframes spin{to{transform:rotate(360deg)}}
  </style>
</head>
<body>
  <div class="box">
    <h2><span class="spin"></span> Verifying your payment…</h2>
    <p>Please wait. You’ll be redirected automatically.</p>
    <p id="msg" style="color:#6b7280"></p>
  </div>
  <script>
    (async () => {
      const mtid = ${JSON.stringify(mtid)};
      if(!mtid){ document.getElementById('msg').textContent = 'Missing transaction id.'; setTimeout(()=>location.href=${JSON.stringify(final)}, 1500); return; }
      try{
        const res = await fetch('/api/status?mtid=' + encodeURIComponent(mtid));
        const data = await res.json();
        if(data && data.success){ document.getElementById('msg').textContent='Payment confirmed. Redirecting…'; }
        else { document.getElementById('msg').textContent='Payment pending (' + (data.status || 'UNKNOWN') + '). Redirecting…'; }
      }catch(e){ document.getElementById('msg').textContent='Could not verify now. Redirecting…'; }
      setTimeout(()=>location.href=${JSON.stringify(final)}, 1200);
    })();
  </script>
</body>
</html>`;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}
