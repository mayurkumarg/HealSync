import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Please provide a reminder title"],
      trim: true,
      maxLength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxLength: 500,
    },
    reminderType: {
      type: String,
      enum: ["appointment", "prescription", "report", "medication", "lab-test", "follow-up", "other"],
      default: "appointment",
      required: true,
    },
    reminderDateTime: {
      type: Date,
      required: [true, "Please provide a reminder date and time"],
      index: true,
    },
    notificationTime: {
      type: String,
      enum: ["on-time", "15-minutes-before", "1-hour-before", "1-day-before", "custom"],
      default: "15-minutes-before",
    },
    customNotificationMinutes: {
      type: Number,
      min: 0,
      max: 10080, // 7 days
    },
    status: {
      type: String,
      enum: ["pending", "sent", "completed", "dismissed", "expired"],
      default: "pending",
      index: true,
    },
    notificationChannels: {
      email: {
        type: Boolean,
        default: true,
      },
      sms: {
        type: Boolean,
        default: false,
      },
      pushNotification: {
        type: Boolean,
        default: true,
      },
      inApp: {
        type: Boolean,
        default: true,
      },
    },
    recurringPattern: {
      isRecurring: {
        type: Boolean,
        default: false,
      },
      frequency: {
        type: String,
        enum: ["daily", "weekly", "bi-weekly", "monthly", "quarterly", "yearly"],
      },
      endDate: Date,
      daysOfWeek: [Number], // 0-6 for daily patterns
    },
    relatedItems: {
      pharmacyId: mongoose.Schema.Types.ObjectId,
      prescriptionId: mongoose.Schema.Types.ObjectId,
      appointmentId: mongoose.Schema.Types.ObjectId,
      medicalReportId: mongoose.Schema.Types.ObjectId,
    },
    sentNotifications: [
      {
        sentAt: Date,
        channel: String,
        status: String,
      },
    ],
    notes: {
      type: String,
      maxLength: 300,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    location: {
      type: String,
      maxLength: 200,
    },
    attachments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Attachment",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
reminderSchema.index({ userId: 1, status: 1, reminderDateTime: 1 });
reminderSchema.index({ reminderDateTime: 1, status: 1 });

// Virtual for checking if reminder is overdue
reminderSchema.virtual("isOverdue").get(function () {
  return this.reminderDateTime < new Date() && this.status === "pending";
});

// Methods
reminderSchema.methods.markAsSent = function () {
  this.status = "sent";
  return this.save();
};

reminderSchema.methods.markAsCompleted = function () {
  this.status = "completed";
  return this.save();
};

reminderSchema.methods.dismiss = function () {
  this.status = "dismissed";
  return this.save();
};

export default mongoose.model("Reminder", reminderSchema);
