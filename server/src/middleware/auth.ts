import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";

export interface AuthRequest extends Request {
	user?: IUser;
}

export const authenticateToken = async (
	req: AuthRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const authHeader = req.headers.authorization;
		const token = authHeader && authHeader.split(" ")[1];

		if (!token) {
			res.status(401).json({
				success: false,
				message: "Access token required",
			});
			return;
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
			userId: string;
		};

		const user = await User.findById(decoded.userId).select("-password");
		if (!user) {
			res.status(401).json({
				success: false,
				message: "Invalid token",
			});
			return;
		}

		req.user = user;
		next();
	} catch (error) {
		res.status(403).json({
			success: false,
			message: "Invalid or expired token",
		});
	}
};

export const authorizeRole = (...roles: string[]) => {
	return (req: AuthRequest, res: Response, next: NextFunction): void => {
		if (!req.user || !roles.includes(req.user.role)) {
			res.status(403).json({
				success: false,
				message: "Access denied",
			});
			return;
		}
		next();
	};
};
