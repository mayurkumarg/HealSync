/* backend/utils/otpService.js */

import crypto from "crypto";
import twilio from "twilio";

const TWILIO_SID = process.env.TWILIO_SID || "";
const TWILIO_AUTH = process.env.TWILIO_AUTH || "";
const WHATSAPP_FROM = process.env.WHATSAPP_FROM || "";

const useWhatsApp = TWILIO_SID && TWILIO_AUTH && WHATSAPP_FROM;

let client = null;
if (useWhatsApp) {
  try {
    client = twilio(TWILIO_SID, TWILIO_AUTH);
    console.log("\n🟢 ═══════════════════════════════════════");
    console.log("✅ Twilio WhatsApp Service Initialized");
    console.log("📱 WhatsApp From Number:", WHATSAPP_FROM);
    console.log("🔐 Account SID:", TWILIO_SID.substring(0, 10) + "...");
    console.log("═══════════════════════════════════════\n");
  } catch (err) {
    console.error("\n🔴 ═══════════════════════════════════════");
    console.error("❌ Failed to initialize Twilio client");
    console.error("Error:", err.message);
    console.error("═══════════════════════════════════════\n");
  }
} else {
  console.warn("\n🟡 ═══════════════════════════════════════");
  console.warn("⚠️  Twilio WhatsApp Service NOT Configured");
  console.warn("Missing credentials in .env file:");
  if (!TWILIO_SID) console.warn("  - TWILIO_SID");
  if (!TWILIO_AUTH) console.warn("  - TWILIO_AUTH");
  if (!WHATSAPP_FROM) console.warn("  - WHATSAPP_FROM");
  console.warn("OTP will be logged to console only");
  console.warn("═══════════════════════════════════════\n");
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

  const msg = `Your HealSync OTP for ${purpose.replace(/-/g, ' ')} is: ${code}. Valid for ${
    Math.floor(ttlSeconds / 60)
  } minutes.`;

  // Format phone number - remove any non-digits
  let formattedPhone = phone.replace(/\D/g, '');
  
  // If phone doesn't start with country code and is 10 digits, assume India (+91)
  if (formattedPhone.length === 10) {
    formattedPhone = '91' + formattedPhone;
  }
  
  // Add + prefix if not present
  if (!formattedPhone.startsWith('+')) {
    formattedPhone = '+' + formattedPhone;
  }

  if (useWhatsApp && client) {
    try {
      console.log('═══════════════════════════════════════');
      console.log('📤 Sending WhatsApp OTP via Twilio');
      console.log('From:', `whatsapp:${WHATSAPP_FROM}`);
      console.log('To:', `whatsapp:${formattedPhone}`);
      console.log('Message:', msg);
      console.log('Code:', code);
      console.log('═══════════════════════════════════════');
      
      const result = await client.messages.create({
        from: `whatsapp:${WHATSAPP_FROM}`,
        to: `whatsapp:${formattedPhone}`,
        body: msg,
      });

      console.log('✅ WhatsApp message sent successfully!');
      console.log('Message SID:', result.sid);
      console.log('Status:', result.status);
      console.log('═══════════════════════════════════════');
      
      return { ok: true, via: "whatsapp", code, sid: result.sid };
    } catch (err) {
      console.error('═══════════════════════════════════════');
      console.error('❌ WhatsApp OTP Error:');
      console.error('Error Code:', err.code);
      console.error('Error Message:', err.message);
      console.error('More Info:', err.moreInfo);
      console.error('Status:', err.status);
      console.error('═══════════════════════════════════════');
      
      // Return code even on error so it can be used as fallback
      return { ok: false, via: "whatsapp-error", code, error: err.message };
    }
  }

  // fallback console logging (if no Twilio env set)
  console.log('═══════════════════════════════════════');
  console.log('⚠️  Twilio not configured - OTP FALLBACK MODE');
  console.log('Phone:', formattedPhone);
  console.log('Message:', msg);
  console.log('🔑 OTP CODE:', code);
  console.log('═══════════════════════════════════════');
  
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
