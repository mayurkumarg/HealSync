import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import CustomError from "../../utils/customError.js";
import userModel from "../../models/userModel.js";

/**
 * @desc   Get the signed-in patient's own profile
 * @route  GET /api/auth/me
 * @access Patient (protected)
 */
export const getMyProfile = handelAsyncFunction(async (req, res) => {
  const user = await userModel.findById(req.user._id).select("-password -passwordHash -token -tokenExpires -accountHash -otp -otpExpires");
  res.status(200).json({ status: "success", data: user });
});

/**
 * @desc   Update the signed-in patient's own profile (name, phone, notification prefs)
 * @route  PATCH /api/auth/me
 * @access Patient (protected)
 */
export const updateMyProfile = handelAsyncFunction(async (req, res, next) => {
  const { name, phone_no, notificationPrefs } = req.body;

  const updateData = {};
  if (name) updateData.name = name;
  if (phone_no) updateData.phone_no = phone_no;
  if (notificationPrefs && typeof notificationPrefs === "object") {
    for (const key of ["email", "push", "sms"]) {
      if (typeof notificationPrefs[key] === "boolean") {
        updateData[`notificationPrefs.${key}`] = notificationPrefs[key];
      }
    }
  }

  const updated = await userModel
    .findByIdAndUpdate(req.user._id, updateData, { new: true, runValidators: true })
    .select("-password -passwordHash -token -tokenExpires -accountHash -otp -otpExpires");

  if (!updated) return next(new CustomError(404, "User not found."));

  res.status(200).json({ status: "success", message: "Profile updated.", data: updated });
});
