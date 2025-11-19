import express from "express";
import cors from "cors";        // Added from feature branch
import userRoute from "./routes/userRoute.js";
import globalErrorHandler from "./controllers/Error/globalErrorhandler.js";
import CustomError from "./utils/customError.js";
import pharmacyRouter from "./routes/pharmacyRoute.js";
import medicineRouter from "./routes/medicineRoute.js";   // KEEP this from main
import hospitalRouter from "./routes/hospitalRoute.js";
import doctorRouter from "./routes/doctorRoute.js";
import formEntryRouter from "./routes/formEntryRoute.js";
import accessRouter from "./routes/accessRoute.js";

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

// Pharmacy routes
app.use("/api/pharmacy", pharmacyRouter);

// Medicine routes (exists only in MAIN – preserved here)
app.use("/api/medicine", medicineRouter);

app.use("/api/hospital", hospitalRouter);
app.use("/api/doctor", doctorRouter);

app.use("/api/access", accessRouter);

// Register the form entry routes:
app.use("/api/form", formEntryRouter);

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
