import handelAsyncFunction from "../../utils/asyncFunctionHandler.js";
import CustomError from "../../utils/customError.js";
import { Notification } from "../../models/models.js";

/**
 * @route GET /api/notifications?page=&limit=&unreadOnly=
 * @access Patient
 */
export const listNotifications = handelAsyncFunction(async (req, res) => {
  const userId = req.user._id;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const filter = { userId, ...(req.query.unreadOnly === "true" ? { readStatus: false } : {}) };

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ sentAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId, readStatus: false }),
  ]);

  res.status(200).json({
    status: "success",
    data: notifications,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    unreadCount,
  });
});

/**
 * @route PATCH /api/notifications/:id/read
 * @access Patient
 */
export const markNotificationRead = handelAsyncFunction(async (req, res, next) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { readStatus: true },
    { new: true }
  );
  if (!notification) return next(new CustomError(404, "Notification not found."));
  res.status(200).json({ status: "success", data: notification });
});

/**
 * @route PATCH /api/notifications/read-all
 * @access Patient
 */
export const markAllNotificationsRead = handelAsyncFunction(async (req, res) => {
  await Notification.updateMany({ userId: req.user._id, readStatus: false }, { readStatus: true });
  res.status(200).json({ status: "success", message: "All notifications marked as read." });
});

/**
 * @route DELETE /api/notifications/:id
 * @access Patient
 */
export const deleteNotification = handelAsyncFunction(async (req, res, next) => {
  const deleted = await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!deleted) return next(new CustomError(404, "Notification not found."));
  res.status(200).json({ status: "success", message: "Notification deleted." });
});
