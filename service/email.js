import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  secure: false, // true for 465, false for other ports
  auth: {
    user: "b44eee34844f50",
    pass: "946ab7dfd277d8",
  },
});

// const transporter  = nodemailer.createTransport({
//     host: "sandbox.smtp.mailtrap.io",
//     port: 2525,
//     secure: false,
//     auth: {
//       user: "330131c7d98924",
//       pass: "24144cdc4b7a93"
//     }
//   });



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
    body { margin: 0; padding: 0; background: #f8f9fb; font-family: Arial, sans-serif; }
    .container { max-width: 550px; margin: auto; background: #ffffff; border-radius: 12px; padding: 25px; box-shadow: 0 5px 15px rgba(0,0,0,0.08); }
    h1 { color: #2563eb; text-align: center; font-size: 26px; margin-bottom: 15px; }
    p { color: #444; font-size: 16px; line-height: 1.5; }
    .button { display: block; width: 100%; max-width: 260px; margin: 22px auto; padding: 14px 20px; background: #2563eb; color: #fff !important; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; text-align: center; box-sizing: border-box; }
    .button:hover { background: #1e4fcf; }
    .footer { margin-top: 28px; text-align: center; color: #666; font-size: 12px; }
    @media(max-width: 480px) { .container { padding: 18px; } h1 { font-size: 22px; } .button { width: 100%; text-align: center; } }
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

    // Standardized success response
    return { success: true, info };
  } catch (error) {
    console.error("mail (verification) failed:", error);
    // Standardized failure response
    return { success: false, error: error && error.message ? error.message : error };
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
    body { margin: 0; padding: 0; background: #f8f9fb; font-family: Arial, sans-serif; }
    .container { max-width: 550px; margin: auto; background: #ffffff; border-radius: 12px; padding: 25px; box-shadow: 0 5px 15px rgba(0,0,0,0.08); }
    h1 { color: #ef4444; text-align: center; font-size: 26px; margin-bottom: 15px; }
    p { color: #444; font-size: 16px; line-height: 1.5; }
    .button { display: block; width: 100%; max-width: 260px; margin: 22px auto; padding: 14px 20px; background: #2563eb; color: #fff !important; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; text-align: center; box-sizing: border-box; }
    .button:hover { background: #d63333; }
    .footer { margin-top: 28px; text-align: center; color: #666; font-size: 12px; }
    @media(max-width: 480px) { .container { padding: 18px; } h1 { font-size: 22px; } .button { width: 100%; text-align: center; } }
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

    return { success: true, info };
  } catch (error) {
    console.error("mailForgotPassword failed:", error);
    return { success: false, error: error && error.message ? error.message : error };
  }
}

// ---------------------------------------------------------
// 3) REMINDER NOTIFICATION EMAIL
// ---------------------------------------------------------
async function sendReminderEmail(reminder) {
  try {
    const user = reminder.userId;
    const reminderTime = new Date(reminder.reminderDateTime).toLocaleString();
    const priorityColor = {
      low: "#3b82f6",
      medium: "#f59e0b",
      high: "#ef4444",
      critical: "#8b0000",
    }[reminder.priority] || "#f59e0b";

    const typeEmoji = {
      appointment: "📅",
      prescription: "💊",
      report: "📋",
      medication: "💉",
      "lab-test": "🧪",
      "follow-up": "👨‍⚕️",
      other: "📌",
    }[reminder.reminderType] || "📌";

    const info = await transporter.sendMail({
      from: '"HealSync Reminders" <reminders@healsync.com>',
      to: user.email,
      subject: `Reminder: ${reminder.title} - HealSync`,
      text: `Hello ${user.firstName},\n\nThis is a reminder for:\n\n${reminder.title}\n\nDate & Time: ${reminderTime}\nType: ${reminder.reminderType}\nPriority: ${reminder.priority}\n\nDescription: ${reminder.description || "No additional details"}\n\n${reminder.location ? `Location: ${reminder.location}\n` : ""}\n\nPlease take necessary action.\n\n– HealSync Team`,
      html: `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Reminder Notification | HealSync</title>

    <style>
        body {
            margin: 0;
            padding: 0;
            background: #f8f9fb;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
        }

        .header {
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            color: white;
            padding: 30px 25px;
            text-align: center;
        }

        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }

        .header p {
            margin: 8px 0 0 0;
            opacity: 0.9;
            font-size: 14px;
        }

        .content {
            padding: 30px 25px;
        }

        .greeting {
            color: #333;
            font-size: 16px;
            margin-bottom: 20px;
        }

        .reminder-card {
            background: #f3f4f6;
            border-left: 5px solid ${priorityColor};
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }

        .reminder-title {
            font-size: 20px;
            font-weight: bold;
            color: #1f2937;
            margin: 0 0 15px 0;
        }

        .reminder-details {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .reminder-details li {
            padding: 8px 0;
            color: #555;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
        }

        .reminder-details li:last-child {
            border-bottom: none;
        }

        .detail-label {
            font-weight: 600;
            color: #333;
        }

        .detail-value {
            color: #666;
            margin-left: 10px;
        }

        .priority-badge {
            display: inline-block;
            background: ${priorityColor};
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            margin-left: 10px;
        }

        .action-section {
            margin: 25px 0;
            text-align: center;
        }

        .button {
            display: inline-block;
            background: #2563eb;
            color: white !important;
            padding: 12px 28px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 15px;
        }

        .button:hover {
            background: #1e40af;
        }

        .footer {
            background: #f9fafb;
            padding: 20px 25px;
            text-align: center;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #e5e7eb;
        }

        .footer p {
            margin: 5px 0;
        }

        @media(max-width: 480px) {
            .container {
                margin: 10px;
            }
            .header {
                padding: 20px 15px;
            }
            .content {
                padding: 20px 15px;
            }
            .reminder-card {
                padding: 15px;
            }
        }
    </style>

</head>

<body>
    <div class="container">
        <div class="header">
            <h1>${typeEmoji} ${reminder.title}</h1>
            <p>You have a scheduled reminder</p>
        </div>

        <div class="content">
            <p class="greeting">Hello <strong>${user.firstName}</strong>,</p>

            <p>This is a timely reminder about your upcoming task:</p>

            <div class="reminder-card">
                <div class="reminder-title">
                    ${reminder.title}
                    <span class="priority-badge">${reminder.priority.toUpperCase()}</span>
                </div>

                <ul class="reminder-details">
                    <li>
                        <span class="detail-label">📅 Date & Time:</span>
                        <span class="detail-value">${reminderTime}</span>
                    </li>
                    <li>
                        <span class="detail-label">🏷️ Type:</span>
                        <span class="detail-value">${reminder.reminderType}</span>
                    </li>
                    ${reminder.description ? `
                    <li>
                        <span class="detail-label">📝 Details:</span>
                        <span class="detail-value">${reminder.description}</span>
                    </li>
                    ` : ""}
                    ${reminder.location ? `
                    <li>
                        <span class="detail-label">📍 Location:</span>
                        <span class="detail-value">${reminder.location}</span>
                    </li>
                    ` : ""}
                    ${reminder.notes ? `
                    <li>
                        <span class="detail-label">📌 Notes:</span>
                        <span class="detail-value">${reminder.notes}</span>
                    </li>
                    ` : ""}
                </ul>
            </div>

            <p style="color: #666; font-size: 14px; margin: 15px 0;">
                Please make sure to complete this task at the scheduled time. If you have any questions or need to reschedule, you can manage your reminders in the HealSync app.
            </p>

            <div class="action-section">
                <a href="${process.env.FRONTEND_URL}/reminders" class="button">View in HealSync</a>
            </div>
        </div>

        <div class="footer">
            <p>This is an automated reminder from <strong>HealSync</strong></p>
            <p>© ${new Date().getFullYear()} HealSync. All rights reserved.</p>
            <p>If you wish to stop receiving reminders, you can disable notifications in your account settings.</p>
        </div>
    </div>
</body>

</html>
            `,
    });

    return info;
  } catch (error) {
    console.error("Error sending reminder email:", error);
    throw error;
  }
}


const sendDrugRefillReminderEmail = async (userId, type, doc) => {
  try {
    const name = userId.name;
    const toEmail = userId.email;

    const { drugName, dosage, tabletsPerDay, stockAvailable, recentSuggestion } = doc;

    const subject = `Reminder: Your ${drugName} stock is running low`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Medicine Refill Reminder</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f7fa; font-family: Arial, sans-serif; }
    .container { max-width: 550px; margin: auto; background: #ffffff; padding: 25px; border-radius: 12px; box-shadow: 0 5px 15px rgba(0,0,0,0.08); }
    h1 { color: #2563eb; font-size: 22px; margin-bottom: 12px; }
    p { color: #444; font-size: 15px; line-height: 1.6; }
    .highlight { background: #fff3cd; padding: 12px; border-left: 4px solid #ffca28; border-radius: 6px; margin: 18px 0; }
    .info-box { background: #f0f4ff; padding: 12px; border-radius: 6px; margin-top: 12px; }
    .footer { margin-top: 28px; text-align: center; color: #777; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Hello ${name},</h1>

    <p>This is a friendly reminder from <strong>HealSync</strong>.</p>

    <div class="highlight">
      <strong>Your medicine stock is running low.</strong>  
      <br/>
      You currently have <strong>${stockAvailable}</strong> tablets left of <strong>${drugName}</strong>.
    </div>

    <div class="info-box">
      <p><strong>Medicine:</strong> ${drugName}</p>
      <p><strong>Dosage:</strong> ${dosage}</p>
      <p><strong>Tablets per day:</strong> ${tabletsPerDay}</p>
      <p><strong>Tracking Type:</strong> ${type === "BP" ? "Blood Pressure" : "Blood Sugar"}</p>
    </div>

    ${
      recentSuggestion
        ? `<p><strongLatest Suggestion:</strong> ${recentSuggestion}</p>`
        : ""
    }

    <p>
      Based on your current usage, we recommend refilling your medication soon to avoid missing your regular dose.
    </p>

    <p>
      Please contact your nearby pharmacy or order your medicines at the earliest.
    </p>

    <div class="footer">
      Stay healthy 💙<br/>
      HealSync — Smart Health Monitoring<br/>
      © ${new Date().getFullYear()} HealSync
    </div>
  </div>
</body>
</html>
`;

    const info = await transporter.sendMail({
      from: '"HealSync Alerts" <no-reply@healsync.com>',
      to: toEmail,
      subject,
      html
    });

    return { success: true, info };

  } catch (error) {
    console.error("Drug Refill Reminder Email Failed:", error);
    return { success: false, error: error.message || error };
  }
};

const notifyDoctorFormEntry = async (doctor, user, form, documentName = "Medical Form") => {
  try {
    const name = user.name;
    const toEmail = user.email;

    const formType = form.formType || "Unknown";
    const formData = form.data || {};

    const subject = `New ${documentName} uploaded by Dr. ${doctor.name}`;

    /* ---------------------------------------
     * Convert form.data key/value → HTML list
     * --------------------------------------*/
    const generateFormDetails = (data) => {
      return Object.entries(data)
        .map(
          ([key, value]) =>
            `<li><strong>${key.replace(/([A-Z])/g, " $1")}</strong>: ${value}</li>`
        )
        .join("");
    };

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${documentName} Uploaded</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f7fa; font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: auto; background: #ffffff; padding: 25px; border-radius: 12px;
                 box-shadow: 0 5px 15px rgba(0,0,0,0.08); }
    h1 { color: #2563eb; font-size: 22px; margin-bottom: 12px; }
    p { color: #444; font-size: 15px; line-height: 1.6; }
    .info-box { background: #f0f4ff; padding: 18px; border-radius: 6px; margin: 20px 0; }
    ul { padding-left: 18px; }
    li { margin: 6px 0; font-size: 15px; }
    .footer { margin-top: 28px; text-align: center; color: #777; font-size: 12px; }
  </style>
</head>

<body>
  <div class="container">
    <h1>Hello ${name},</h1>

    <p>Your doctor <strong>${doctor.name}</strong> has submitted a new medical form for you.</p>

    <div class="info-box">
      <p><strong>Form Type:</strong> ${formType}</p>
      <p><strong>Uploaded By:</strong> Dr. ${doctor.name}</p>

      <p><strong>Form Details:</strong></p>
      <ul>
        ${generateFormDetails(formData)}
      </ul>
    </div>

    <p>Please open your HealSync app to review the complete form details.</p>

    <div class="footer">
      Stay healthy 💙<br/>
      HealSync — Smart Health Monitoring<br/>
      © ${new Date().getFullYear()} HealSync
    </div>
  </div>
</body>
</html>
`;

    const info = await transporter.sendMail({
      from: '"HealSync Alerts" <no-reply@healsync.com>',
      to: toEmail,
      subject,
      html,
    });

    return { success: true, info };

  } catch (error) {
    console.error("Notify Doctor Form Entry Email Failed:", error);
    return { success: false, error: error.message || error };
  }
};




export default mail;
export { mailForgotPassword, sendReminderEmail,mail,sendDrugRefillReminderEmail,notifyDoctorFormEntry };
