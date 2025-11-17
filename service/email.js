import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.APP_PASSWORD,
  },
});

// ---------------------------------------------------------
// 1) EMAIL VERIFICATION (HealSync)
// ---------------------------------------------------------
async function mail(name, link, toEmail) {
  try {
    const info = await transporter.sendMail({
      from: '"HealSync Support" <no-reply@healsync.com>',
      to: toEmail,
      subject: "Verify Your Email – HealSync",
      text: `Hello ${name},\n\nWelcome to HealSync!\n\nPlease verify your email using the link below:\n${link}\n\nIf this was not you, please ignore this email.\n\n– HealSync Team`,
      html: `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verify Email | HealSync</title>

    <style>
        body {
            margin: 0;
            padding: 0;
            background: #f8f9fb;
            font-family: Arial, sans-serif;
        }

        .container {
            max-width: 550px;
            margin: auto;
            background: #ffffff;
            border-radius: 12px;
            padding: 25px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
        }

        h1 {
            color: #2563eb;
            text-align: center;
            font-size: 26px;
            margin-bottom: 15px;
        }

        p {
            color: #444;
            font-size: 16px;
            line-height: 1.5;
        }

        .button {
    display: block;
    width: 100%;               /* <— FULL WIDTH IN MOBILE */
    max-width: 260px;          /* <— LIMIT SIZE ON DESKTOP */
    margin: 22px auto;
    padding: 14px 20px;
    background: #2563eb;
    color: #fff !important;
    text-decoration: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: bold;
    text-align: center;        /* <— CENTER TEXT ALWAYS */
    box-sizing: border-box;    /* <— PREVENT OVERFLOW */
}


        .button:hover {
            background: #1e4fcf;
        }

        .footer {
            margin-top: 28px;
            text-align: center;
            color: #666;
            font-size: 12px;
        }

        @media(max-width: 480px) {
            .container {
                padding: 18px;
            }
            h1 {
                font-size: 22px;
            }
            .button {
                width: 100%;
                text-align: center;
            }
        }
    </style>
</head>

<body>
    <div class="container">
        <h1>Welcome to HealSync, ${name}! 🎉</h1>

        <p>We're excited to have you on board. To activate your HealSync account, please verify your email by clicking the button below:</p>

        <a href="${link}" class="button">Verify Email</a>

        <p style="margin-top: 20px;">If you didn’t create an account, you can safely ignore this email.</p>

        <div class="footer">
            Need help? Contact us at <a href="mailto:support@healsync.com">support@healsync.com</a><br />
            © ${new Date().getFullYear()} HealSync. All rights reserved.
        </div>
    </div>
</body>

</html>
            `,
    });
  } catch (error) {
    return error;
  }
}

// ---------------------------------------------------------
// 2) PASSWORD RESET EMAIL (HealSync)
// ---------------------------------------------------------
async function mailForgotPassword(name, link, toEmail) {
  try {
    const info = await transporter.sendMail({
      from: '"HealSync Support" <no-reply@healsync.com>',
      to: toEmail,
      subject: "Reset Your Password – HealSync",
      text: `Hello ${name},\n\nClick the link below to reset your HealSync password:\n${link}\n\nThis link is valid for 10 minutes.\nIf this wasn't you, please ignore the email.\n\n– HealSync Team`,
      html: `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Password Reset | HealSync</title>

    <style>
        body {
            margin: 0;
            padding: 0;
            background: #f8f9fb;
            font-family: Arial, sans-serif;
        }

        .container {
            max-width: 550px;
            margin: auto;
            background: #ffffff;
            border-radius: 12px;
            padding: 25px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
        }

        h1 {
            color: #ef4444;
            text-align: center;
            font-size: 26px;
            margin-bottom: 15px;
        }

        p {
            color: #444;
            font-size: 16px;
            line-height: 1.5;
        }

        .button {
    display: block;
    width: 100%;               /* <— FULL WIDTH IN MOBILE */
    max-width: 260px;          /* <— LIMIT SIZE ON DESKTOP */
    margin: 22px auto;
    padding: 14px 20px;
    background: #2563eb;
    color: #fff !important;
    text-decoration: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: bold;
    text-align: center;        /* <— CENTER TEXT ALWAYS */
    box-sizing: border-box;    /* <— PREVENT OVERFLOW */
}


        .button:hover {
            background: #d63333;
        }

        .footer {
            margin-top: 28px;
            text-align: center;
            color: #666;
            font-size: 12px;
        }

        @media(max-width: 480px) {
            .container {
                padding: 18px;
            }
            h1 {
                font-size: 22px;
            }
            .button {
                width: 100%;
                text-align: center;
            }
        }
    </style>

</head>

<body>
    <div class="container">
        <h1>Password Reset Request</h1>

        <p>Hello <strong>${name}</strong>,</p>

        <p>We received a request to reset your password for your <strong>HealSync</strong> account.</p>

        <a href="${link}" class="button">Reset Password</a>

        <p>If you did not request this change, simply ignore this email.</p>

        <div class="footer">
            This link is valid for <strong>10 minutes</strong>.<br /><br />
            Need help? Contact <a href="mailto:support@healsync.com">support@healsync.com</a><br />
            © ${new Date().getFullYear()} HealSync. All rights reserved.
        </div>
    </div>
</body>

</html>
            `,
    });
  } catch (error) {
    return error;
  }
}

export default mail;
export { mailForgotPassword };
