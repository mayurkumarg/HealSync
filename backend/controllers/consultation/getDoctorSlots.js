import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import CustomError from "../../utils/customError.js";
import Doctor from "../../models/hospital/doctorModel.js";
import Consultation from "../../models/consultationModel.js";

const WORK_START_HOUR = 9;
const WORK_END_HOUR = 18;

/**
 * @route  GET /api/consultations/doctors/:doctorId/slots?date=YYYY-MM-DD
 * @desc   Compute open appointment slots for a doctor on a given date, from a fixed 9am-6pm
 *         working window in slots of the doctor's avgConsultationMinutes, minus any slot that
 *         overlaps an existing non-cancelled booking that day.
 * @access Patient
 */
const getDoctorSlots = handelAsyncFunction(async (req, res, next) => {
  const { doctorId } = req.params;
  const { date } = req.query;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return next(new CustomError(400, "date query param (YYYY-MM-DD) is required."));
  }

  const doctor = await Doctor.findById(doctorId).select("consultation verified");
  if (!doctor || !doctor.verified || !doctor.consultation?.enabled) {
    return next(new CustomError(404, "Doctor not found or not open for consultations."));
  }

  const duration = doctor.consultation.avgMinutes || 20;
  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);

  const booked = await Consultation.find({
    doctorId,
    scheduledAt: { $gte: dayStart, $lte: dayEnd },
    status: { $in: ["requested", "confirmed"] },
  })
    .select("scheduledAt durationMinutes")
    .lean();

  const slots = [];
  const now = new Date();
  let cursor = new Date(dayStart);
  cursor.setUTCHours(WORK_START_HOUR, 0, 0, 0);
  const windowEnd = new Date(dayStart);
  windowEnd.setUTCHours(WORK_END_HOUR, 0, 0, 0);

  while (cursor.getTime() + duration * 60000 <= windowEnd.getTime()) {
    const slotStart = new Date(cursor);
    const slotEnd = new Date(cursor.getTime() + duration * 60000);

    const isPast = slotStart <= now;
    const overlaps = booked.some((b) => {
      const bStart = new Date(b.scheduledAt);
      const bEnd = new Date(bStart.getTime() + (b.durationMinutes || duration) * 60000);
      return slotStart < bEnd && slotEnd > bStart;
    });

    if (!isPast && !overlaps) slots.push(slotStart.toISOString());
    cursor = slotEnd;
  }

  res.status(200).json({ status: "success", data: slots, durationMinutes: duration });
});

export default getDoctorSlots;
