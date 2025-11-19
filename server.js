import dotenv from "dotenv/config";
import connectDB from "./configure/mongoDB.js"
import http from "http";

import app from "./app.js"
import { initializeSocket } from "./service/socket.js";
import { initializeScheduler } from "./service/reminderScheduler.js";

// Add global error handlers
process.on("unhandledRejection", (err) => {
    console.error("❌ UNHANDLED REJECTION:", err);
});

process.on("uncaughtException", (err) => {
    console.error("❌ UNCAUGHT EXCEPTION:", err);
});

const PORT = process.env.PORT || 5050 ;

const startServer = async () => {
    try {
        await connectDB();
        
        // Create HTTP server for Socket.IO
        const server = http.createServer(app);
        
        // Initialize Socket.IO
        initializeSocket(server);
        
        // Initialize Reminder Scheduler
        initializeScheduler();
        
        server.listen(PORT,() => {
            console.log(`server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to connect to the database. Server not started.", error);
    }
};

startServer();
