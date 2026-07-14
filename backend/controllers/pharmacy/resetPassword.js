import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import Pharmacy from "../../models/medical/pharmacy.js";
import CustomError from "../../utils/customError.js";

const getResetPage = (token) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Reset Password | HealSync Pharmacy</title>
<style>
  body {
    font-family: 'Poppins', sans-serif;
    background-color: #0d1117;
    color: #fff;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    margin: 0;
  }

  .container {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 30px;
    width: 350px;
    border-radius: 15px;
    text-align: center;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
  }

  h2 {
    color: #4CAF50;
    margin-bottom: 10px;
  }

  p {
    color: #bbb;
    font-size: 14px;
    margin-bottom: 20px;
  }

  label {
    display: block;
    text-align: left;
    margin-bottom: 5px;
    font-size: 13px;
    color: #ddd;
  }

  input {
    width: 100%;
    padding: 8px;
    border: none;
    border-radius: 8px;
    margin-bottom: 15px;
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
  }

  input::placeholder {
    color: #aaa;
  }

  button {
    width: 100%;
    background: #4CAF50;
    border: none;
    color: white;
    padding: 10px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    transition: 0.3s;
  }

  button:hover {
    background: #45a049;
  }

  #message {
    margin-top: 10px;
    font-size: 14px;
  }
</style>
</head>
<body>
  <div class="container">
    <h2>Reset Your Password</h2>
    <p>Enter your new password below to continue.</p>
    <form id="resetPasswordForm">
      <label for="password">New Password</label>
      <input type="password" id="password" name="password" placeholder="Enter new password" required>
      
      <label for="confirmPassword">Confirm Password</label>
      <input type="password" id="confirmPassword" name="confirmPassword" placeholder="Re-enter password" required>

      <button type="button" id="submit">Reset Password</button>
    </form>
    <p id="message"></p>
  </div>

  <script>
    async function handleSubmit(event) {
      event.preventDefault();

      const pass = document.getElementById("password").value;
      const conf = document.getElementById("confirmPassword").value;
      const message = document.getElementById("message");

      if (pass !== conf) {
        message.textContent = "Passwords do not match!";
        message.style.color = "red";
        return;
      }

      if (pass.length < 8) {
        message.textContent = "Password must be at least 8 characters!";
        message.style.color = "red";
        return;
      }

      try {
        const response = await fetch("/api/pharmacy/reset-password/${token}", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: pass })
        });

        const result = await response.json();

        if (response.ok) {
          message.textContent = "Password reset successfully!";
          message.style.color = "lightgreen";
        } else {
          message.textContent = result.message || "An error occurred!";
          message.style.color = "red";
        }
      } catch (error) {
        message.textContent = "An error occurred!";
        message.style.color = "red";
      }
    }

    document.getElementById("submit").addEventListener("click", handleSubmit);
  </script>
</body>
</html>`;
};

// ===========================================================
// GET Controller — Show Reset Password Page
// ===========================================================
const passwordResetClientPharmacy = handelAsyncFunction(async (req, res, next) => {
  const { token } = req.params;

  const pharmacy = await Pharmacy.findOne({
    token,
    tokenExpires: { $gt: Date.now() },
  });

  if (!pharmacy) {
    return res.send(`
      <html>
        <head>
          <title>Reset Password | HealSync</title>
          <style>
            body {
              background-color: #0d1117;
              color: #fff;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              font-family: 'Poppins', sans-serif;
            }
            .message {
              text-align: center;
              background: rgba(255,255,255,0.1);
              padding: 30px;
              border-radius: 12px;
              backdrop-filter: blur(10px);
            }
            h1 { color: #ff6961; }
          </style>
        </head>
        <body>
          <div class="message">
            <h1>Link Expired</h1>
            <p>Your password reset link has expired. Please request a new one.</p>
          </div>
        </body>
      </html>
    `);
  }

  res.send(getResetPage(token));
});

// ===========================================================
// POST Controller — Handle New Password Submission
// ===========================================================
const passwordResetServerPharmacy = handelAsyncFunction(async (req, res, next) => {
  const { token } = req.params;

  const pharmacy = await Pharmacy.findOne({
    token,
    tokenExpires: { $gt: Date.now() },
  });

  if (!pharmacy) {
    return next(
      new CustomError(
        401,
        "Link has expired. Please request a new password reset link."
      )
    );
  }

  const { password } = req.body;

  pharmacy.password = password; // hashed automatically by pre-save hook
  pharmacy.token = null;
  pharmacy.tokenExpires = null;

  await pharmacy.save();

  res.status(201).send({
    status: "success",
    message: "Password changed successfully!",
  });
});

export { passwordResetClientPharmacy, passwordResetServerPharmacy };
export default passwordResetServerPharmacy;
