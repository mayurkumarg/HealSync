/* backend/utils/otpService.js */

import crypto from "crypto";
import twilio from "twilio";

const TWILIO_SID = process.env.TWILIO_SID || "";
const TWILIO_AUTH = process.env.TWILIO_AUTH || "";
const WHATSAPP_FROM = process.env.WHATSAPP_FROM || "";

const useWhatsApp = TWILIO_SID && TWILIO_AUTH && WHATSAPP_FROM;

let client = null;
if (useWhatsApp) {
  client = twilio(TWILIO_SID, TWILIO_AUTH);
}

// In-memory OTP store (dev/MVP)
const otpStore = new Map(); // key -> { code, expiresAt }

function generateOTP(len = 6) {
  return Math.floor(Math.random() * 10 ** len)
    .toString()
    .padStart(len, "0");
}

/**
 * Sends OTP via WhatsApp (FREE using Twilio sandbox)
 */
export async function sendOtpToPhone(
  phone,
  purpose = "access",
  length = 6,
  ttlSeconds = 300
) {
  const code = generateOTP(length);
  const expiresAt = Date.now() + ttlSeconds * 1000;

  const key = `${purpose}:${phone.trim()}`;
  otpStore.set(key, { code, expiresAt });

  const msg = `Your HealSync OTP for ${purpose} is ${code}. Valid for ${
    ttlSeconds / 60
  } minutes.`;

  if (useWhatsApp) {
    try {
      await client.messages.create({
        from: `whatsapp:${WHATSAPP_FROM}`,
        to: `whatsapp:+91${phone}`,
        body: msg,
      });

      return { ok: true, via: "whatsapp" };
    } catch (err) {
      console.error("WhatsApp OTP error:", err);
      return { ok: false, via: "whatsapp-error" };
    }
  }

  // fallback console logging (if no Twilio env set)
  console.log("[OTP-FALLBACK]", phone, msg);
  return { ok: true, via: "console", code };
}

/**
 * Verifies OTP for a given phone & purpose
 */
export function verifyOtpForPhone(phone, code, purpose = "access") {
  const key = `${purpose}:${phone.trim()}`;
  const entry = otpStore.get(key);

  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(key);
    return false;
  }
  if (entry.code !== code) return false;

  otpStore.delete(key);
  return true;
}
