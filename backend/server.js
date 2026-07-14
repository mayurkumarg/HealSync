import connectDB from "./configure/mongoDB.js";
import http from "http";
import mongoose from "mongoose";
import dotenv from "dotenv/config";

import { validateEnv } from "./configure/validateEnv.js";

// unhandledRejection is deliberately non-fatal: many controllers in this codebase are not yet
// consistently wrapped in try/catch (see ARCHITECTURE.md known limitations), so a single missed
// .catch() shouldn't take the whole server down while there's no process supervisor (PM2/systemd)
// configured to auto-restart it. uncaughtException DOES exit — Node's own guidance is that after a
// truly uncaught synchronous exception the process is in an undefined state and should not continue.
process.on("unhandledRejection", (err) => {
  console.error("❌ UNHANDLED REJECTION:", err);
});
process.on("uncaughtException", (err) => {
  console.error("❌ UNCAUGHT EXCEPTION:", err);
  process.exit(1);
});

validateEnv();

const app = (await import("./app.js")).default;
const { initializeSocket } = await import("./service/socket.js");
const { initializeScheduler } = await import("./service/reminderScheduler.js");
const sendBPSugarReminder = (await import("./utils/cronJobs/BPSugarReminder.js")).default;
const { startPatientAccessCleanup } = await import("./utils/cronJobs/patientAccessCleanup.js");

const PORT = process.env.PORT || 5050;

let server;

const startServer = async () => {
  try {
    await connectDB();

    server = http.createServer(app);

    initializeSocket(server);
    initializeScheduler();
    sendBPSugarReminder();
    startPatientAccessCleanup();

    server.listen(PORT, () => {
      console.log(`🚀 HealSync server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to connect to the database. Server not started.", err);
  }
};

// Graceful shutdown: stop accepting new connections, close the DB connection, then exit.
// Falls back to a forced exit if something hangs (e.g. an in-flight request never resolves).
const shutdown = (signal) => {
  console.log(`\n${signal} received — shutting down gracefully...`);

  const forceExitTimer = setTimeout(() => {
    console.error("❌ Graceful shutdown timed out, forcing exit.");
    process.exit(1);
  }, 10000);
  forceExitTimer.unref();

  if (!server) {
    process.exit(0);
    return;
  }

  server.close(async () => {
    try {
      await mongoose.connection.close();
      console.log("✅ Server and database connection closed.");
      process.exit(0);
    } catch (err) {
      console.error("❌ Error during shutdown:", err);
      process.exit(1);
    }
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

startServer();
