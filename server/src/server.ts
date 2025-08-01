import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import connectDB from "./config/database";
import userRoutes from "./routes/userRoutes";

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
});

export default app;
