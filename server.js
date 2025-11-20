import connectDB from "./configure/mongoDB.js";
import http from "http";
import dotenv from "dotenv/config";

import app from "./app.js";
import { initializeSocket } from "./service/socket.js";
import { initializeScheduler } from "./service/reminderScheduler.js";
import sendBPSugarReminder from "./utils/cronJobs/BPSugarReminder.js";

process.on("unhandledRejection", (err) => {
  console.error("❌ UNHANDLED REJECTION:", err);
});
process.on("uncaughtException", (err) => {
  console.error("❌ UNCAUGHT EXCEPTION:", err);
});

const PORT = process.env.PORT || 5050;

const startServer = async () => {
  try {
    await connectDB();

    const server = http.createServer(app);

    initializeSocket(server);
    initializeScheduler();
    sendBPSugarReminder();

    server.listen(PORT, () => {
      console.log(`🚀 HealSync server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to connect to the database. Server not started.", err);
  }
};

startServer();
