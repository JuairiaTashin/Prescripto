import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";
import { AuthRequest } from "../middleware/auth";

const generateToken = (userId: string): string => {
	return jwt.sign({ userId }, process.env.JWT_SECRET as string, {
		expiresIn: "7d",
	});
};

export const register = async (req: Request, res: Response): Promise<void> => {
	try {
		const {
			name,
			email,
			password,
			role,
			phone,
			address,
			dateOfBirth,
			gender,
			specialty,
			experience,
			degree,
			bmdc,
			consultationFee,
			bio,
			availableHours,
		} = req.body;

		const isValidEmail = (e?: string) =>
			!!e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

		if (!name || !email || !password || !role || !phone || !address) {
			res.status(400).json({
				success: false,
				message: "Missing required fields",
			});
			return;
		}

		if (!isValidEmail(email)) {
			res.status(400).json({
				success: false,
				message: "Invalid email address",
			});
			return;
		}

		if (typeof password !== "string" || password.length < 6) {
			res.status(400).json({
				success: false,
				message: "Password must be at least 6 characters",
			});
			return;
		}

		const allowedRoles = ["patient", "doctor", "admin"];
		if (!allowedRoles.includes(role)) {
			res.status(400).json({ success: false, message: "Invalid role" });
			return;
		}
		if (!req.file) {
			res.status(400).json({
				success: false,
				message: "Profile picture is required",
			});
			return;
		}

		const existingUser = await User.findOne({ email });
		if (existingUser) {
			res.status(400).json({
				success: false,
				message: "User already exists with this email",
			});
			return;
		}

		if (role === "doctor") {
			if (
				!specialty ||
				!experience ||
				!degree ||
				!bmdc ||
				!consultationFee
			) {
				res.status(400).json({
					success: false,
					message: "Missing doctor specific fields",
				});
				return;
			}

			const existingDoctor = await User.findOne({ bmdc });
			if (existingDoctor) {
				res.status(400).json({
					success: false,
					message: "Doctor already exists with this BMDC number",
				});
				return;
			}
		}

		const saltRounds = 12;
		const hashedPassword = await bcrypt.hash(password, saltRounds);

		const userData: any = {
			name,
			email,
			password: hashedPassword,
			role,
			phone,
			address,
			profilePicture: req.file.path,
			dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
			gender,
		};

		if (role === "doctor") {
			userData.specialty = specialty;
			userData.experience = parseInt(experience);
			userData.degree = degree;
			userData.bmdc = bmdc;
			userData.consultationFee = parseInt(consultationFee);
			userData.bio = bio;
			userData.availableHours = availableHours
				? JSON.parse(availableHours)
				: undefined;
		}

		const user = new User(userData);
		await user.save();

		const token = generateToken((user._id as any).toString());

		const userResponse: any = user.toObject();
		delete userResponse.password;

		res.status(201).json({
			success: true,
			message: "User registered successfully",
			data: {
				user: userResponse,
				token,
			},
		});
	} catch (error: any) {
		res.status(500).json({
			success: false,
			message: "Registration failed",
			error: error.message,
		});
	}
};

export const login = async (req: Request, res: Response): Promise<void> => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			res.status(400).json({
				success: false,
				message: "Email and password are required",
			});
			return;
		}

		const user = await User.findOne({ email });
		if (!user) {
			res.status(401).json({
				success: false,
				message: "Invalid credentials",
			});
			return;
		}

		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) {
			res.status(401).json({
				success: false,
				message: "Invalid credentials",
			});
			return;
		}

		const token = generateToken((user._id as any).toString());

		const userResponse: any = user.toObject();
		delete userResponse.password;

		res.status(200).json({
			success: true,
			message: "Login successful",
			data: {
				user: userResponse,
				token,
			},
		});
	} catch (error: any) {
		res.status(500).json({
			success: false,
			message: "Login failed",
			error: error.message,
		});
	}
};

export const getProfile = async (
	req: AuthRequest,
	res: Response
): Promise<void> => {
	try {
		const user = await User.findById(req.user?._id).select("-password");

		if (!user) {
			res.status(404).json({
				success: false,
				message: "User not found",
			});
			return;
		}

		res.status(200).json({
			success: true,
			message: "Profile retrieved successfully",
			data: user,
		});
	} catch (error: any) {
		res.status(500).json({
			success: false,
			message: "Failed to get profile",
			error: error.message,
		});
	}
};

export const updateProfile = async (
	req: AuthRequest,
	res: Response
): Promise<void> => {
	try {
		const {
			name,
			phone,
			address,
			dateOfBirth,
			gender,
			specialty,
			experience,
			degree,
			consultationFee,
			bio,
			availableHours,
		} = req.body;

		const updateData: any = {
			name,
			phone,
			address,
			dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
			gender,
		};

		if (req.file) {
			updateData.profilePicture = req.file.path;
		}

		if (req.user?.role === "doctor") {
			if (specialty) updateData.specialty = specialty;
			if (experience) updateData.experience = parseInt(experience);
			if (degree) updateData.degree = degree;
			if (consultationFee)
				updateData.consultationFee = parseInt(consultationFee);
			if (bio) updateData.bio = bio;
			if (availableHours)
				updateData.availableHours = JSON.parse(availableHours);
		}

		const user = await User.findByIdAndUpdate(req.user?._id, updateData, {
			new: true,
			runValidators: true,
		}).select("-password");

		if (!user) {
			res.status(404).json({
				success: false,
				message: "User not found",
			});
			return;
		}

		res.status(200).json({
			success: true,
			message: "Profile updated successfully",
			data: user,
		});
	} catch (error: any) {
		res.status(500).json({
			success: false,
			message: "Failed to update profile",
			error: error.message,
		});
	}
};

export const getDoctors = async (
	req: Request,
	res: Response
): Promise<void> => {
	try {
		const { specialty, search, page = 1, limit = 10 } = req.query;

		const query: any = { role: "doctor" };

		if (specialty && specialty !== "all") {
			query.specialty = specialty;
		}

		if (search) {
			query.$or = [
				{ name: { $regex: search, $options: "i" } },
				{ specialty: { $regex: search, $options: "i" } },
				{ degree: { $regex: search, $options: "i" } },
			];
		}

		const pageNum = parseInt(page as string);
		const limitNum = parseInt(limit as string);
		const skip = (pageNum - 1) * limitNum;

		const doctors = await User.find(query)
			.select("-password")
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limitNum);

		const total = await User.countDocuments(query);

		res.status(200).json({
			success: true,
			message: "Doctors retrieved successfully",
			data: {
				doctors,
				pagination: {
					currentPage: pageNum,
					totalPages: Math.ceil(total / limitNum),
					totalDoctors: total,
					hasNext: pageNum < Math.ceil(total / limitNum),
					hasPrev: pageNum > 1,
				},
			},
		});
	} catch (error: any) {
		res.status(500).json({
			success: false,
			message: "Failed to get doctors",
			error: error.message,
		});
	}
};

export const getDoctorById = async (
	req: Request,
	res: Response
): Promise<void> => {
	try {
		const { id } = req.params;

		const doctor = await User.findOne({ _id: id, role: "doctor" }).select(
			"-password"
		);

		if (!doctor) {
			res.status(404).json({
				success: false,
				message: "Doctor not found",
			});
			return;
		}

		res.status(200).json({
			success: true,
			message: "Doctor retrieved successfully",
			data: doctor,
		});
	} catch (error: any) {
		res.status(500).json({
			success: false,
			message: "Failed to get doctor",
			error: error.message,
		});
	}
};

export const adminCreateDoctor = async (
	req: Request,
	res: Response
): Promise<void> => {
	try {
		const {
			name,
			email,
			password,
			phone,
			address,
			dateOfBirth,
			gender,
			specialty,
			experience,
			degree,
			bmdc,
			consultationFee,
			bio,
			availableHours,
		} = req.body;

		const isValidEmail = (e?: string) =>
			!!e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

		if (
			!name ||
			!email ||
			!password ||
			!phone ||
			!address ||
			!specialty ||
			!experience ||
			!degree ||
			!bmdc ||
			!consultationFee
		) {
			res.status(400).json({
				success: false,
				message: "Missing required fields for doctor",
			});
			return;
		}

		if (!isValidEmail(email)) {
			res.status(400).json({
				success: false,
				message: "Invalid email address",
			});
			return;
		}

		if (typeof password !== "string" || password.length < 6) {
			res.status(400).json({
				success: false,
				message: "Password must be at least 6 characters",
			});
			return;
		}

		if (isNaN(Number(experience)) || isNaN(Number(consultationFee))) {
			res.status(400).json({
				success: false,
				message: "Experience and consultationFee must be numbers",
			});
			return;
		}

		if (!req.file) {
			res.status(400).json({
				success: false,
				message: "Profile picture is required",
			});
			return;
		}

		const existingUser = await User.findOne({ email });
		if (existingUser) {
			res.status(400).json({
				success: false,
				message: "User already exists with this email",
			});
			return;
		}

		const existingDoctor = await User.findOne({ bmdc });
		if (existingDoctor) {
			res.status(400).json({
				success: false,
				message: "Doctor already exists with this BMDC number",
			});
			return;
		}

		const saltRounds = 12;
		const hashedPassword = await bcrypt.hash(password, saltRounds);

		const userData: any = {
			name,
			email,
			password: hashedPassword,
			role: "doctor",
			phone,
			address,
			profilePicture: req.file.path,
			dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
			gender,
			specialty,
			experience: experience ? parseInt(experience) : undefined,
			degree,
			bmdc,
			consultationFee: consultationFee
				? parseInt(consultationFee)
				: undefined,
			bio,
			availableHours: availableHours
				? JSON.parse(availableHours)
				: undefined,
		};

		const user = new User(userData);
		await user.save();

		const userResponse: any = user.toObject();
		delete userResponse.password;

		res.status(201).json({
			success: true,
			message: "Doctor created successfully",
			data: userResponse,
		});
	} catch (error: any) {
		res.status(500).json({
			success: false,
			message: "Failed to create doctor",
			error: error.message,
		});
	}
};

export const adminDeleteDoctor = async (
	req: Request,
	res: Response
): Promise<void> => {
	try {
		const { id } = req.params;
		const doctor = await User.findOneAndDelete({ _id: id, role: "doctor" });
		if (!doctor) {
			res.status(404).json({
				success: false,
				message: "Doctor not found",
			});
			return;
		}
		res.status(200).json({
			success: true,
			message: "Doctor deleted permanently",
		});
	} catch (error: any) {
		res.status(500).json({
			success: false,
			message: "Failed to delete doctor",
			error: error.message,
		});
	}
};
