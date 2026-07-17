import { rateLimit } from "express-rate-limit";

/** Shared rate-limiter factory + named limiters. Kept in one place so every endpoint that needs
 * tighter-than-global throttling (auth brute-force targets, paid-API-backed endpoints) uses the
 * same config vocabulary as app.js's global limiter, instead of each route file reinventing it. */
function makeLimiter({ windowMs, max, message }) {
  return rateLimit({
    windowMs,
    limit: max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: "failed", message },
  });
}

/** Password reset — unchanged from the original inline limiter in userRoute.js. */
export const passwordResetLimiter = makeLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: "Too many attempts, try after sometime.",
});

/** Login/signup — the actual brute-force/credential-stuffing target. Only the loose global
 * 300-req/15-min limiter covered these before; this is meaningfully tighter. */
export const authLimiter = makeLimiter({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: "Too many attempts. Please wait a few minutes and try again.",
});

/** AI chat — every request behind this is a billable Groq API call. Generous enough for a real
 * back-and-forth conversation, tight enough to bound per-user cost exposure. */
export const chatLimiter = makeLimiter({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: "You're sending messages too quickly. Please wait a moment before asking again.",
});

/** Document AI upload — each request is a billable OCR.space + Groq classification call, same
 * cost-exposure shape as chatLimiter but keyed to how often someone realistically uploads
 * documents in one sitting rather than sends chat messages. */
export const documentUploadLimiter = makeLimiter({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: "You're uploading documents too quickly. Please wait a moment and try again.",
});

/** Public medicine search — unauthenticated, so it needs its own bound independent of the
 * per-account limiters above; generous enough for real browsing, tight enough to deter scraping. */
export const publicSearchLimiter = makeLimiter({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: "Too many searches. Please wait a moment and try again.",
});
