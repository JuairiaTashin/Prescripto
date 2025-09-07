import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import connectDB from "./config/database";
import userRoutes from "./routes/userRoutes";
import appointmentRoutes from "./routes/appointmentRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import reminderRoutes from "./routes/reminderRoutes";
import cronRoutes from "./routes/cronRoutes";
import livechatRoutes from "./routes/LivechatRoutes";
import healthtipsRoutes from "./routes/healthtipsRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import ratingRoutes from "./routes/ratingRoutes";
import { startReminderProcessing } from "./services/reminderService";
import { startPaymentExpiryWatcher } from "./services/paymentExpiraryService";


const app: Application = express();


const PORT = process.env.PORT || 5000;


connectDB();


app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true,
    })
);


app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));


app.use("/uploads", express.static(path.join(__dirname, "../uploads")));


app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});


app.use("/api/users", userRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/cron", cronRoutes);
app.use("/api/livechat", livechatRoutes);
app.use("/api/healthtips", healthtipsRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/payments", paymentRoutes);


app.get("/", (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: "Welcome to Prescripto API Server! 🏥",
        version: "1.0.0",
        endpoints: {
            auth: {
                register: "POST /api/users/register",
                login: "POST /api/users/login",
            },
            profile: {
                get: "GET /api/users/profile",
                update: "PUT /api/users/profile",
            },
            doctors: {
                getAll: "GET /api/users/doctors",
                getById: "GET /api/users/doctors/:id",
            },
            appointments: {
                slots: "GET /api/appointments/slots",
                book: "POST /api/appointments/book",
                user: "GET /api/appointments/user",
                getById: "GET /api/appointments/:id",
                cancel: "PUT /api/appointments/:id/cancel",
                reschedule: "PUT /api/appointments/:id/reschedule",
                updateStatus: "PUT /api/appointments/:id/status",
            },
            notifications: {
                getUser: "GET /api/notifications",
                getCount: "GET /api/notifications/count",
                markRead: "PUT /api/notifications/:id/read",
                markAllRead: "PUT /api/notifications/read-all",
                delete: "DELETE /api/notifications/:id",
            },
            reminders: {
                getUser: "GET /api/reminders",
                delete: "DELETE /api/reminders/:id",
            },
            cron: {
                processReminders: "POST /api/cron/process-reminders",
                health: "GET /api/cron/health",
            },
            livechat: {
                create: "POST /api/livechat/create",
                getRoom: "GET /api/livechat/appointment/:id",
                sendMessage: "POST /api/livechat/appointment/:id/message",
                getUserRooms: "GET /api/livechat/user",
                endRoom: "PUT /api/livechat/appointment/:id/end",
            },
            healthtips: {
                create: "POST /api/healthtips",
                getPublished: "GET /api/healthtips/published",
                getById: "GET /api/healthtips/:id",
                getDoctorTips: "GET /api/healthtips/doctor",
                update: "PUT /api/healthtips/:id",
                delete: "DELETE /api/healthtips/:id",
                like: "POST /api/healthtips/:id/like",
                categories: "GET /api/healthtips/categories",
            },
            payments: {
                bkash: "POST /api/payments/appointment/:id/bkash",
                card: "POST /api/payments/appointment/:id/card",
                aamarPay: "POST /api/payments/appointment/:id/aamarpay",
                getDetails: "GET /api/payments/appointment/:id",
                checkStatus: "GET /api/payments/appointment/:id/status",
                history: "GET /api/payments/history",
            },
            ratings: {
                create: "POST /api/ratings",
                getDoctorRatings: "GET /api/ratings/doctor/:doctorId",
                getDoctorStats: "GET /api/ratings/doctor/:doctorId/stats",
                getPatientRatings: "GET /api/ratings/patient",
                getRateableAppointments: "GET /api/ratings/rateable-appointments",
                update: "PUT /api/ratings/:ratingId",
                delete: "DELETE /api/ratings/:ratingId",
            },
        },
    });
});


app.use("*", (req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
});


app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error("Global Error:", err.stack);


    res.status(500).json({
        success: false,
        message: "Something went wrong!",
        error:
            process.env.NODE_ENV === "development"
                ? err.message
                : "Internal server error",
    });
});


app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📍 Server URL: http://localhost:${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
    
    // Start the reminder processing service
    startReminderProcessing();
    console.log(`⏰ Reminder processing service started`);
    // Start payment expiry watcher
    startPaymentExpiryWatcher();
    console.log(`💳 Payment expiry watcher started`);
});


export default app;




