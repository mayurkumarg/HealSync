// backend/controllers/access/grantAccessByPhone.js
import Doctor from "../../models/hospital/doctorModel.js";
import PatientAccess from "../../models/hospital/patientAccessModel.js";
import AccessToken from "../../models/AccessToken.js";
import { logAccessActivity } from "../../utils/activityLogger.js";
import crypto from "crypto";

/**
 * Patient grants access to a doctor using doctor's phone number
 * POST /api/access/grant-by-phone
 * Body: { doctorPhone, accessType, expiryDuration }
 * Auth: patient (identifyActor)
 */
export default async function grantAccessByPhone(req, res) {
  try {
    const actor = req.actor;
    if (!actor || actor.type.toLowerCase() !== "user") {
      return res.status(401).json({ status: "failed", message: "Only patients can grant access." });
    }

    const { doctorPhone, accessType = 'view', expiryDuration = '7days' } = req.body;
    
    if (!doctorPhone) {
      return res.status(400).json({ status: "failed", message: "Doctor's phone number is required." });
    }

    if (!['view', 'edit', 'full'].includes(accessType)) {
      return res.status(400).json({ status: "failed", message: "Invalid access type." });
    }

    // Find doctor by phone
    const doctor = await Doctor.findOne({ phone_no: doctorPhone });
    if (!doctor) {
      return res.status(404).json({ 
        status: "failed", 
        message: "Doctor not found with this phone number. Make sure the doctor is registered." 
      });
    }

    // Check if access already exists
    const existingAccess = await PatientAccess.findOne({
      patientId: actor.doc._id,
      doctorId: doctor._id,
      isActive: true
    });

    if (existingAccess) {
      return res.status(400).json({ 
        status: "failed", 
        message: `Dr. ${doctor.name} already has active access to your records.` 
      });
    }

    // Calculate expiry
    let expiresAt = null;
    if (expiryDuration !== 'until_revoked') {
      expiresAt = new Date(Date.now() + parseDuration(expiryDuration));
    }

    // Create PatientAccess directly (active)
    const access = await PatientAccess.create({
      patientId: actor.doc._id,
      doctorId: doctor._id,
      hospitalId: doctor.hospitalId || null,
      grantedBy: actor.doc._id,
      accessType,
      expiryDuration,
      expiresAt,
      isActive: true
    });

    // Generate a short code for reference
    const shortCode = Math.floor(100000 + Math.random() * 900000).toString();
    const token = crypto.randomBytes(32).toString("hex");

    // Create AccessToken for tracking
    await AccessToken.create({
      shortCode,
      token,
      patientId: actor.doc._id,
      accessType,
      expiryDuration,
      expiresAt,
      used: true,
      claimedBy: doctor._id,
      claimedAt: new Date()
    });

    // Log activity
    await logAccessActivity({
      patientId: actor.doc._id,
      doctorId: doctor._id,
      accessId: access._id,
      action: 'access_granted',
      details: {
        method: 'phone_grant',
        grantedVia: 'phone_number',
        doctorPhone: maskPhone(doctorPhone)
      },
      req
    });

    return res.status(201).json({
      status: "success",
      message: `Access granted to Dr. ${doctor.name}`,
      data: {
        doctorName: doctor.name,
        doctorEmail: doctor.email,
        doctorSpecialization: doctor.specialization,
        accessType,
        expiresAt,
        shortCode,
        accessId: access._id
      }
    });
  } catch (err) {
    console.error("grantAccessByPhone:", err);
    return res.status(500).json({ status: "error", message: "Could not grant access." });
  }
}

// Helper to parse duration string to milliseconds
function parseDuration(duration) {
  const map = {
    '1hour': 1 * 60 * 60 * 1000,
    '6hours': 6 * 60 * 60 * 1000,
    '12hours': 12 * 60 * 60 * 1000,
    '24hours': 24 * 60 * 60 * 1000,
    '3days': 3 * 24 * 60 * 60 * 1000,
    '7days': 7 * 24 * 60 * 60 * 1000,
    '30days': 30 * 24 * 60 * 60 * 1000
  };
  return map[duration] || map['7days'];
}

// Helper to mask phone number
function maskPhone(phone) {
  if (!phone || phone.length < 4) return phone;
  return phone.slice(0, -4).replace(/./g, '*') + phone.slice(-4);
}
