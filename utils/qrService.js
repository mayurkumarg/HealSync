// backend/utils/qrService.js
import QRCode from "qrcode";

/**
 * generateQRCodeDataURL(payload) -> dataURL string
 * payload can be any small JSON; you'll typically put the shortCode or token.
 */
export async function generateQRCodeDataURL(payload) {
  const s = typeof payload === "string" ? payload : JSON.stringify(payload);
  return QRCode.toDataURL(s, { errorCorrectionLevel: "M", type: "image/png" });
}
