import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import Doctor from "../models/hospital/doctorModel.js";

const JWT_SECRET = process.env.JWT_SECRET || "changeme";
export default async function identifyActor(req, res, next) {
  try {
    const auth = req.headers.authorization || req.headers.Authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ status: "failed", message: "Missing or invalid Authorization header." });
    }

    const token = auth.split(" ")[1];
    let payload;
    try {
      
      
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ status: "failed", message: "Invalid or expired token." });
    }

    const userId = payload.id || payload._id || payload.userId || payload.sub;
    if (!userId) {
      return res.status(401).json({ status: "failed", message: "Token missing id claim." });
    }

    // Try find User first
    let actorDoc = await User.findById(userId).select("+password +token");
    if (actorDoc) {
      req.actor = { type: "user", doc: actorDoc };
      return next();
    }

    // Try Doctor
    actorDoc = await Doctor.findById(userId).populate("hospitalId").select("+password +token");
    if (actorDoc) {
      req.actor = { type: "doctor", doc: actorDoc };
      return next();
    }

    return res.status(401).json({ status: "failed", message: "User or Doctor not found for provided token." });
  } catch (err) {
    console.error("identifyActor error:", err);
    return res.status(500).json({ status: "error", message: "Internal server error." });
  }
}