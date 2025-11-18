import { Server } from "socket.io";

let io;
const connectedUsers = new Map();

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true,
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // User joins with their userId
    socket.on("user-connect", (userId) => {
      connectedUsers.set(userId, socket.id);
      socket.join(`user-${userId}`);
      console.log(`User ${userId} connected with socket ${socket.id}`);

      // Notify user that they're connected
      socket.emit("connection-success", {
        message: "Connected to notification server",
        userId,
      });
    });

    // Handle reminder acknowledgment
    socket.on("reminder-acknowledged", (data) => {
      console.log(`Reminder acknowledged by user: ${data.userId}`, data.reminderId);
      socket.broadcast.to(`user-${data.userId}`).emit("reminder-ack-received", {
        reminderId: data.reminderId,
        acknowledgedAt: new Date(),
      });
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(userId);
          console.log(`User ${userId} disconnected`);
          break;
        }
      }
    });

    // Error handling
    socket.on("error", (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
};

export const sendReminderNotification = (userId, reminderData) => {
  if (!io) return;

  io.to(`user-${userId}`).emit("reminder-notification", {
    reminderId: reminderData._id,
    title: reminderData.title,
    description: reminderData.description,
    reminderType: reminderData.reminderType,
    reminderDateTime: reminderData.reminderDateTime,
    priority: reminderData.priority,
    location: reminderData.location,
    sentAt: new Date(),
  });

  console.log(`Reminder notification sent to user ${userId}`);
};

export const isUserConnected = (userId) => {
  return connectedUsers.has(userId);
};

export const getConnectedUsersCount = () => {
  return connectedUsers.size;
};
