import connectDB from "./configure/mongoDB.js";
import http from "http";
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
