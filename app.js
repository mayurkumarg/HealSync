import express from "express";
import cors from "cors";        // Added from feature branch
import userRoute from "./routes/userRoute.js";
import globalErrorHandler from "./controllers/Error/globalErrorhandler.js";
import CustomError from "./utils/customError.js";
import pharmacyRouter from "./routes/pharmacyRoute.js";
import medicineRouter from "./routes/medicineRoute.js";   // KEEP this from main
import reminderRouter from "./routes/reminderRoute.js";
import userFuncRoutes from "./routes/userFuncRoutes.js"; // Added from feature branch

const app = express();

// ------------------------------------------------------
// ENABLE CORS BEFORE ANY OTHER MIDDLEWARE
// ------------------------------------------------------
app.use(
    cors({
        origin: "http://localhost:3000",
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization"]
    })
);

// ------------------------------------------------------
// REQUIRED MIDDLEWARE FOR JSON BODY
// ------------------------------------------------------
app.use(express.json());

// ------------------------------------------------------
// ROUTES
// ------------------------------------------------------

// Authentication routes
app.use("/api/auth", userRoute);

// User functionality routes
app.use("/api/user", userFuncRoutes);

// Pharmacy routes
app.use("/api/pharmacy", pharmacyRouter);

// Medicine routes (exists only in MAIN – preserved here)
app.use("/api/medicine", medicineRouter);

// Reminder routes
app.use("/api/reminders", reminderRouter);

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is running",
        timestamp: new Date(),
    });
});

// ------------------------------------------------------
// 404 NOT FOUND HANDLER
// ------------------------------------------------------
app.use("*", (req, res, next) => {
    next(new CustomError(404, `${req.baseUrl} not found in our server.`));
});

// ------------------------------------------------------
// GLOBAL ERROR HANDLER
// ------------------------------------------------------
app.use(globalErrorHandler);

export default app;
