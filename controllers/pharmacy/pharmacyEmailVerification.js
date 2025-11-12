import Pharmacy from "../../models/medical/pharmacy.js";

async function verifyPharmacyEmail(req, res) {
  const { token } = req.params;

  try {
    // 🧩 Step 1: Find valid pharmacy (token not expired)
    const pharmacy = await Pharmacy.findOne({
      token,
      tokenExpires: { $gt: Date.now() },
    });

    // 🧩 Step 2: If token invalid or expired
    if (!pharmacy) {
      return res
        .status(400)
        .send(`
          <html>
            <head>
              <title>Verification Failed</title>
              <style>
                body {
                  background-color: #0d1117;
                  color: #fff;
                  font-family: 'Poppins', sans-serif;
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  text-align: center;
                }
                .box {
                  background: rgba(255, 255, 255, 0.1);
                  border: 1px solid rgba(255, 255, 255, 0.2);
                  padding: 30px 40px;
                  border-radius: 20px;
                  backdrop-filter: blur(12px);
                  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
                }
                h1 { color: #ff6961; margin-bottom: 10px; }
                p { font-size: 1.1rem; }
              </style>
            </head>
            <body>
              <div class="box">
                <h1>❌ Verification Failed</h1>
                <p>Your verification link is invalid or has expired.<br>
                Please register again to continue.</p>
              </div>
            </body>
          </html>
        `);
    }

    // 🧩 Step 3: Already verified
    if (pharmacy.verified) {
      return res
        .status(200)
        .send(`
          <html>
            <head>
              <title>Already Verified</title>
              <style>
                body {
                  background-color: #0d1117;
                  color: #fff;
                  font-family: 'Poppins', sans-serif;
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  text-align: center;
                }
                .box {
                  background: rgba(255, 255, 255, 0.1);
                  border: 1px solid rgba(255, 255, 255, 0.2);
                  padding: 30px 40px;
                  border-radius: 20px;
                  backdrop-filter: blur(12px);
                  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
                }
                h1 { color: #FFD700; margin-bottom: 10px; }
                p { font-size: 1.1rem; }
              </style>
            </head>
            <body>
              <div class="box">
                <h1>⚡ Already Verified</h1>
                <p>Your pharmacy email has already been verified.<br>
                You can safely close this tab.</p>
              </div>
            </body>
          </html>
        `);
    }

    // 🧩 Step 4: Verify pharmacy and clear token
    pharmacy.verified = true;
    pharmacy.token = null;
    pharmacy.tokenExpires = null;
    await pharmacy.save();

    // 🧩 Step 5: Send success page
    return res
      .status(200)
      .send(`
        <html>
          <head>
            <title>Verification Successful</title>
            <style>
              body {
                background-color: #0d1117;
                color: #fff;
                font-family: 'Poppins', sans-serif;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                height: 100vh;
                text-align: center;
              }
              .box {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                padding: 30px 40px;
                border-radius: 20px;
                backdrop-filter: blur(12px);
                box-shadow: 0 8px 32px rgba(0,0,0,0.4);
              }
              h1 { color: #4CAF50; margin-bottom: 10px; }
              p { font-size: 1.1rem; }
              button {
                margin-top: 20px;
                background: #4CAF50;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 10px;
                cursor: pointer;
                font-size: 1rem;
                transition: background 0.3s ease;
              }
              button:hover {
                background: #45a049;
              }
            </style>
          </head>
          <body>
            <div class="box">
              <h1>✅ Verification Successful</h1>
              <p>Your pharmacy account has been successfully verified.<br>
              You can now log in and start using your dashboard.</p>
              <button onclick="window.close()">Close</button>
            </div>
          </body>
        </html>
      `);
  } catch (error) {
    console.error("Pharmacy verification error:", error.message);
    res
      .status(500)
      .send(`
        <html>
          <head>
            <title>Server Error</title>
            <style>
              body {
                background-color: #0d1117;
                color: #fff;
                font-family: 'Poppins', sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                text-align: center;
              }
              h1 { color: #ff6961; }
            </style>
          </head>
          <body>
            <h1>⚠️ Server Error</h1>
            <p>Something went wrong while verifying your email.<br>
            Please try again later.</p>
          </body>
        </html>
      `);
  }
}

export default verifyPharmacyEmail;
