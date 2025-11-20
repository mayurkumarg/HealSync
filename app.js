import express from "express";
import cors from "cors";

// Core feature routes
import userRoute from "./routes/userRoute.js";
import userFuncRoutes from "./routes/userFuncRoutes.js";
import reminderRouter from "./routes/reminderRoute.js";

// AI / ML routes
import documentAIRoutes from "./routes/documentAI.js";
import chatRoutes from "./routes/chatRoute.js";
import formEntryRoute from "./routes/formEntryRoute.js";
import documentRoute from "./routes/documentRoute.js";

// Error handlers
import globalErrorHandler from "./controllers/Error/globalErrorhandler.js";
import CustomError from "./utils/customError.js";
import pharmacyRouter from "./routes/pharmacyRoute.js";
import medicineRouter from "./routes/medicineRoute.js";   // KEEP this from main
import hospitalRouter from "./routes/hospitalRoute.js";
import doctorRouter from "./routes/doctorRoute.js";
import formEntryRouter from "./routes/formEntryRoute.js";
import accessRouter from "./routes/accessRoute.js";

const app = express();

/* ------------------------------------------------------
   CORS
------------------------------------------------------ */
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* ------------------------------------------------------
   JSON BODY PARSER
------------------------------------------------------ */
app.use(express.json());

/* ------------------------------------------------------
   CORE ROUTES
------------------------------------------------------ */
app.use("/api/auth", userRoute);
app.use("/api/user", userFuncRoutes);
app.use("/api/pharmacy", pharmacyRouter);
app.use("/api/medicine", medicineRouter);
app.use("/api/reminders", reminderRouter);

/* ------------------------------------------------------
   AI & ML ROUTES  (MUST BE BEFORE 404)
------------------------------------------------------ */

// AI document reader (OCR + Llama3 Classification)
app.use("/api/documents/ai", documentAIRoutes);

// AI Chat route
app.use("/api/chat", chatRoutes);

// Form entry (patient records)
app.use("/api/form-entry", formEntryRoute);
app.use("/api/documents", documentRoute);

/* ------------------------------------------------------
   HEALTH CHECK
------------------------------------------------------ */
app.get("/api/health", (req, res) =>
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date(),
  })
);

app.use("/api/hospital", hospitalRouter);
app.use("/api/doctor", doctorRouter);

app.use("/api/access", accessRouter);

// Register the form entry routes:
app.use("/api/form", formEntryRouter);

// ------------------------------------------------------
// 404 NOT FOUND HANDLER
// ------------------------------------------------------
/* ------------------------------------------------------
   404 HANDLER — MUST COME AFTER ALL ROUTES
------------------------------------------------------ */
app.use("*", (req, res, next) => {
  next(new CustomError(404, `${req.baseUrl} not found in our server.`));
});

/* ------------------------------------------------------
   GLOBAL ERROR HANDLER
------------------------------------------------------ */
app.use(globalErrorHandler);

export default app;
