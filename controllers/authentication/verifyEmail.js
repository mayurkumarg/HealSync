import { link } from "fs";
import userModel from "../../models/userModel.js";

async function verifyEmail(req, res) {
  const { token } = req.params;

  const user = await userModel.findOne({
    token,
    tokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    const linkExpire = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Link Expired</title>
  <style>
    :root{
      --bg:#fff5f5;
      --card:#ffffff;
      --accent:#dc2626; /* red-600 */
      --muted:#6b7280;
      --radius:14px;
    }
    *{margin:0;padding:0;box-sizing:border-box}
    body{
      height:100vh;
      display:flex;
      align-items:center;
      justify-content:center;
      background:linear-gradient(180deg,#ffe8e8 0%,var(--bg) 100%);
      font-family:Inter,system-ui,Arial;
      color:#0f172a;
      padding:20px;
    }
    .card{
      background:var(--card);
      border-radius:var(--radius);
      padding:34px;
      max-width:720px;
      width:100%;
      text-align:center;
      box-shadow:0 10px 25px rgba(0,0,0,0.06);
      border:1px solid rgba(0,0,0,0.05);
    }
    .icon{
      width:92px;height:92px;
      margin:0 auto 16px;
      border-radius:999px;
      display:flex;
      align-items:center;
      justify-content:center;
      background:rgba(220,38,38,0.1);
      color:var(--accent);
    }
    .icon svg{width:44px;height:44px}
    h1{font-size:22px;margin-bottom:8px}
    .sub{color:var(--muted);font-size:15px;margin-bottom:20px}
    .btn{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      padding:10px 18px;
      border-radius:10px;
      text-decoration:none;
      font-weight:600;
      font-size:14px;
      margin:6px;
    }
    .btn-primary{
      background:var(--accent);
      color:#fff;
      box-shadow:0 6px 16px rgba(220,38,38,0.25);
    }
    .btn-ghost{
      border:1px solid rgba(15,23,42,0.1);
      color:var(--muted);
      background:transparent;
    }
    @media(max-width:420px){
      .card{padding:22px}
      .icon{width:76px;height:76px}
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    </div>

    <h1>Link Expired</h1>
    <p class="sub">Your verification link has expired. Please sign up again to continue.</p>

    <a href="/signup" class="btn btn-primary">Sign Up Again</a>
    <a href="/" class="btn btn-ghost">Return Home</a>
  </div>
</body>
</html>`;

    res.status(400).send(linkExpire);

    return;
  }

  if (user.verified) {
    return res.status(400).send({
      status: "failed",
      html: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Email Already Verified</title>
  <style>
    body{
      margin:0;
      padding:0;
      font-family:Arial,Helvetica,sans-serif;
      background:#f0f9ff;
      display:flex;
      align-items:center;
      justify-content:center;
      height:100vh;
    }
    .card{
      background:white;
      padding:30px;
      max-width:420px;
      width:90%;
      text-align:center;
      border-radius:12px;
      box-shadow:0 8px 20px rgba(0,0,0,0.1);
    }
    .icon{
      width:80px;
      height:80px;
      margin:0 auto 15px;
      border-radius:50%;
      background:#e0f2fe;
      display:flex;
      align-items:center;
      justify-content:center;
      color:#0284c7;
    }
    .icon svg{
      width:40px;
      height:40px;
    }
    h1{
      font-size:22px;
      margin-bottom:8px;
      color:#0f172a;
    }
    p{
      font-size:14px;
      color:#475569;
      margin-bottom:20px;
    }
    a{
      display:inline-block;
      padding:10px 18px;
      background:#0284c7;
      color:white;
      border-radius:8px;
      text-decoration:none;
      font-weight:bold;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg fill="none" stroke="currentColor" stroke-width="2" 
        stroke-linecap="round" stroke-linejoin="round" 
        viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M9 12l2 2l4 -4"></path>
      </svg>
    </div>
    <h1>Email Already Verified</h1>
    <p>Your email address is already verified. You can safely log into your account.</p>
    <a href="/login">Go to Login</a>
  </div>
</body>
</html>`,
    });
  }

  user.verified = true;
  user.token = null;
  user.tokenExpires = null;

  await user.save();

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Account Verified</title>
  <style>
    :root{--bg:#f6fbf7;--card:#fff;--accent:#16a34a;--muted:#6b7280;--radius:14px}
    *{box-sizing:border-box;margin:0;padding:0}html,body{height:100%}
    body{font-family:Inter,system-ui,Arial;background:linear-gradient(180deg,#eefaf2 0%,var(--bg) 100%);display:flex;align-items:center;justify-content:center;padding:24px;color:#0f172a}
    .card{background:var(--card);border-radius:var(--radius);padding:36px;max-width:720px;text-align:center;box-shadow:0 10px 30px rgba(10,20,40,0.06);border:1px solid rgba(0,0,0,0.04)}
    .icon{width:92px;height:92px;margin:0 auto 14px;display:grid;place-items:center;border-radius:999px;background:linear-gradient(180deg, rgba(22,163,74,0.12), rgba(22,163,74,0.06));color:var(--accent)}
    .icon svg{width:44px;height:44px}
    h1{font-size:20px;margin-bottom:8px}
    .sub{color:var(--muted);margin-bottom:20px;font-size:14px}
    .actions{display:flex;gap:12px;justify-content:center;margin-bottom:14px;flex-wrap:wrap}
    .btn{display:inline-flex;align-items:center;justify-content:center;padding:10px 16px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px}
    .btn-primary{background:linear-gradient(180deg,var(--accent),#0ea35f);color:white;box-shadow:0 6px 20px rgba(16,185,129,0.12)}
    .btn-ghost{background:transparent;color:var(--muted);border:1px solid rgba(15,23,42,0.06)}
    .meta{font-size:13px;color:var(--muted)}
    .meta a{color:var(--accent);text-decoration:none;font-weight:600}
    @media(max-width:420px){.card{padding:22px}.icon{width:76px;height:76px}}
  </style>
</head>
<body>
  <main class="card">
    <div class="icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 6L9 17l-5-5"></path>
      </svg>
    </div>
    <h1>Account verified successfully</h1>
    <p class="sub">Your account is now active. You will be redirected to the login page shortly.</p>
    <div class="actions">
      <a class="btn btn-primary" href="/login">Go to Login</a>
      <a class="btn btn-ghost" href="/">Return Home</a>
    </div>  
    <p class="meta">Need help? <a href="/support">Contact support</a></p>
  </main>

  <script>
    setTimeout(() => { window.location.href = '/login'; }, 5000);
  </script>
</body>
</html>`;

  // then in your route handler:
  res.status(200).send(html);
}

export default verifyEmail;
