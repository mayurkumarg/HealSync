// backend/controllers/access/revokeToken.js
import AccessToken from "../../models/AccessToken.js";

/**
 * POST /api/access/revoke-token
 * Body: { token } OR { shortCode }
 * Auth: patient (req.actor.type === 'User')
 * Marks token used so scanning becomes invalid.
 */
export default async function revokeToken(req, res) {
  try {
    const actor = req.actor;
    if (!actor || actor.type.toLowerCase() !== "user") return res.status(401).json({ status: "failed", message: "Only patient may revoke tokens." });

    const { token, shortCode } = req.body;
    if (!token && !shortCode) return res.status(400).json({ status: "failed", message: "token or shortCode required." });

    const filter = token ? { token, patientId: actor.doc._id } : { shortCode, patientId: actor.doc._id };
    const at = await AccessToken.findOne(filter);
    if (!at) return res.status(404).json({ status: "failed", message: "Token not found." });

    at.used = true;
    at.expiresAt = new Date();
    await at.save();

    return res.status(200).json({ status: "success", message: "Token revoked." });
  } catch (err) {
    console.error("revokeToken:", err);
    return res.status(500).json({ status: "error", message: "Could not revoke token." });
  }
}
