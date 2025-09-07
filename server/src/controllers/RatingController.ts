import { Request, Response } from "express";
import mongoose from "mongoose";
import Rating from "../models/Rating";
import Appointment from "../models/Appointment";
import User from "../models/User";
import ChatRoom from "../models/Livechat";
import { AuthRequest } from "../middleware/auth";
import { updateDoctorRatingStats } from "../services/ratingService";
import { canRateConsultation } from "../services/consultationService";

// Helper function to get appointments with completed consultations
const getAppointmentsWithConsultations = async (userId: string) => {
    // Get all appointments with completed consultations
    const appointments = await Appointment.find({ 
        patient: userId, 
        consultationStatus: "completed"
    }).populate("doctor", "name specialty");

    console.log("Found appointments with completed consultations:", appointments.length);
    return appointments;
};

// Create a rating and review
export const createRating = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { appointmentId, rating, review, isAnonymous = true } = req.body;
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }

        // Validate required fields
        if (!appointmentId || !rating) {
            res.status(400).json({
                success: false,
                message: "Appointment ID and rating are required",
            });
            return;
        }

        // Validate rating range
        if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
            res.status(400).json({
                success: false,
                message: "Rating must be an integer between 1 and 5",
            });
            return;
        }

        // Validate review length
        if (review && review.length > 1000) {
            res.status(400).json({
                success: false,
                message: "Review cannot exceed 1000 characters",
            });
            return;
        }

        // Check if appointment exists and user is the patient
        const appointment = await Appointment.findById(appointmentId).populate("patient doctor");
        if (!appointment) {
            res.status(404).json({
                success: false,
                message: "Appointment not found",
            });
            return;
        }

        // Verify user is the patient
        if (appointment.patient._id.toString() !== userId.toString()) {
            res.status(403).json({
                success: false,
                message: "Only patients can rate doctors",
            });
            return;
        }

        // Check if consultation is completed (3 minutes have passed)
        const canRate = await canRateConsultation(appointmentId);
        if (!canRate) {
            res.status(400).json({
                success: false,
                message: "You can only rate doctors after the consultation is completed (3 minutes)",
            });
            return;
        }

        // Check if rating already exists for this appointment
        const existingRating = await Rating.findOne({ appointment: appointmentId });
        if (existingRating) {
            res.status(400).json({
                success: false,
                message: "You have already rated this consultation",
            });
            return;
        }

        // Create rating
        const newRating = new Rating({
            patient: userId,
            doctor: appointment.doctor._id,
            appointment: appointmentId,
            rating,
            review: review?.trim() || undefined,
            isAnonymous,
        });

        await newRating.save();

        // Update doctor's rating statistics
        await updateDoctorRatingStats(appointment.doctor._id.toString());

        // Populate details for response
        await newRating.populate([
            { path: "doctor", select: "name specialty" },
            { path: "appointment", select: "appointmentDate appointmentTime reason" },
        ]);

        res.status(201).json({
            success: true,
            message: "Rating submitted successfully",
            data: newRating,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to create rating",
            error: error.message,
        });
    }
};

// Get ratings for a specific doctor
export const getDoctorRatings = async (req: Request, res: Response): Promise<void> => {
    try {
        const { doctorId } = req.params;
        const { page = 1, limit = 10, sortBy = "newest" } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        // Validate doctor exists
        const doctor = await User.findById(doctorId);
        if (!doctor || doctor.role !== "doctor") {
            res.status(404).json({
                success: false,
                message: "Doctor not found",
            });
            return;
        }

        // Build sort object
        let sortObject: any = { createdAt: -1 };
        if (sortBy === "oldest") {
            sortObject = { createdAt: 1 };
        } else if (sortBy === "highest") {
            sortObject = { rating: -1, createdAt: -1 };
        } else if (sortBy === "lowest") {
            sortObject = { rating: 1, createdAt: -1 };
        }

        // Get ratings with pagination
        const ratings = await Rating.find({ doctor: doctorId })
            .populate([
                { path: "patient", select: "name" },
                { path: "appointment", select: "appointmentDate appointmentTime reason" },
            ])
            .sort(sortObject)
            .skip(skip)
            .limit(limitNum);

        // Process ratings to handle anonymity
        const processedRatings = ratings.map(rating => {
            const ratingObj = rating.toObject() as any;
            // Always show as "Anonymous Patient" for public viewing
            ratingObj.patient = { name: "Anonymous Patient" };
            return ratingObj;
        });

        // Get total count and average rating
        const totalRatings = await Rating.countDocuments({ doctor: doctorId });
        const averageRating = await Rating.aggregate([
            { $match: { doctor: new mongoose.Types.ObjectId(doctorId) } },
            { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } }
        ]);

        const stats = averageRating.length > 0 ? averageRating[0] : { average: 0, count: 0 };

        res.status(200).json({
            success: true,
            message: "Doctor ratings retrieved successfully",
            data: {
                ratings: processedRatings,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(totalRatings / limitNum),
                    totalRatings,
                    hasNext: pageNum < Math.ceil(totalRatings / limitNum),
                    hasPrev: pageNum > 1,
                },
                stats: {
                    averageRating: Math.round(stats.average * 10) / 10, // Round to 1 decimal
                    totalRatings: stats.count,
                },
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to get doctor ratings",
            error: error.message,
        });
    }
};

// Get ratings for a specific doctor with user context (for authenticated users)
export const getDoctorRatingsWithUserContext = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { doctorId } = req.params;
        const { page = 1, limit = 10, sortBy = "newest" } = req.query;
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        // Validate doctor exists
        const doctor = await User.findById(doctorId);
        if (!doctor || doctor.role !== "doctor") {
            res.status(404).json({
                success: false,
                message: "Doctor not found",
            });
            return;
        }

        // Build sort object
        let sortObject: any = { createdAt: -1 };
        if (sortBy === "oldest") {
            sortObject = { createdAt: 1 };
        } else if (sortBy === "highest") {
            sortObject = { rating: -1, createdAt: -1 };
        } else if (sortBy === "lowest") {
            sortObject = { rating: 1, createdAt: -1 };
        }

        // Get ratings with pagination
        const ratings = await Rating.find({ doctor: doctorId })
            .populate([
                { path: "patient", select: "name" },
                { path: "appointment", select: "appointmentDate appointmentTime reason" },
            ])
            .sort(sortObject)
            .skip(skip)
            .limit(limitNum);

        // Process ratings to handle anonymity and user permissions
        const processedRatings = ratings.map(rating => {
            const ratingObj = rating.toObject() as any;
            // Show patient name only if it's the user's own rating, otherwise anonymous
            if (ratingObj.patient._id.toString() === userId.toString()) {
                ratingObj.canEdit = true;
                ratingObj.canDelete = true;
                // Keep original patient name for own ratings
            } else {
                ratingObj.patient = { name: "Anonymous Patient" };
                ratingObj.canEdit = false;
                ratingObj.canDelete = false;
            }
            return ratingObj;
        });

        // Get total count and average rating
        const totalRatings = await Rating.countDocuments({ doctor: doctorId });
        const averageRating = await Rating.aggregate([
            { $match: { doctor: new mongoose.Types.ObjectId(doctorId) } },
            { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } }
        ]);

        const stats = averageRating.length > 0 ? averageRating[0] : { average: 0, count: 0 };

        res.status(200).json({
            success: true,
            message: "Doctor ratings retrieved successfully",
            data: {
                ratings: processedRatings,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(totalRatings / limitNum),
                    totalRatings,
                    hasNext: pageNum < Math.ceil(totalRatings / limitNum),
                    hasPrev: pageNum > 1,
                },
                stats: {
                    averageRating: Math.round(stats.average * 10) / 10, // Round to 1 decimal
                    totalRatings: stats.count,
                },
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to get doctor ratings",
            error: error.message,
        });
    }
};

// Get patient's ratings
export const getPatientRatings = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        const { page = 1, limit = 10 } = req.query;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        // Get patient's ratings
        const ratings = await Rating.find({ patient: userId })
            .populate([
                { path: "doctor", select: "name specialty" },
                { path: "appointment", select: "appointmentDate appointmentTime reason" },
            ])
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const totalRatings = await Rating.countDocuments({ patient: userId });

        res.status(200).json({
            success: true,
            message: "Patient ratings retrieved successfully",
            data: {
                ratings,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(totalRatings / limitNum),
                    totalRatings,
                    hasNext: pageNum < Math.ceil(totalRatings / limitNum),
                    hasPrev: pageNum > 1,
                },
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to get patient ratings",
            error: error.message,
        });
    }
};

// Update a rating
export const updateRating = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { ratingId } = req.params;
        const { rating, review, isAnonymous } = req.body;
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }

        // Find the rating
        const existingRating = await Rating.findById(ratingId).populate("appointment");
        if (!existingRating) {
            res.status(404).json({
                success: false,
                message: "Rating not found",
            });
            return;
        }

        // Verify user is the patient who created this rating
        if (existingRating.patient.toString() !== userId.toString()) {
            res.status(403).json({
                success: false,
                message: "You can only update your own ratings",
            });
            return;
        }

        // Validate rating if provided
        if (rating !== undefined) {
            if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
                res.status(400).json({
                    success: false,
                    message: "Rating must be an integer between 1 and 5",
                });
                return;
            }
            existingRating.rating = rating;
        }

        // Validate review if provided
        if (review !== undefined) {
            if (review.length > 1000) {
                res.status(400).json({
                    success: false,
                    message: "Review cannot exceed 1000 characters",
                });
                return;
            }
            existingRating.review = review.trim() || undefined;
        }

        // Update anonymous status if provided
        if (isAnonymous !== undefined) {
            existingRating.isAnonymous = isAnonymous;
        }

        await existingRating.save();

        // Update doctor's rating statistics
        await updateDoctorRatingStats(existingRating.doctor.toString());

        // Populate details for response
        await existingRating.populate([
            { path: "doctor", select: "name specialty" },
            { path: "appointment", select: "appointmentDate appointmentTime reason" },
        ]);

        res.status(200).json({
            success: true,
            message: "Rating updated successfully",
            data: existingRating,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to update rating",
            error: error.message,
        });
    }
};

// Delete a rating
export const deleteRating = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { ratingId } = req.params;
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }

        // Find the rating
        const existingRating = await Rating.findById(ratingId);
        if (!existingRating) {
            res.status(404).json({
                success: false,
                message: "Rating not found",
            });
            return;
        }

        // Verify user is the patient who created this rating
        if (existingRating.patient.toString() !== userId.toString()) {
            res.status(403).json({
                success: false,
                message: "You can only delete your own ratings",
            });
            return;
        }

        const doctorId = existingRating.doctor.toString();
        await Rating.findByIdAndDelete(ratingId);

        // Update doctor's rating statistics
        await updateDoctorRatingStats(doctorId);

        res.status(200).json({
            success: true,
            message: "Rating deleted successfully",
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to delete rating",
            error: error.message,
        });
    }
};

// Get rating statistics for a doctor
export const getDoctorRatingStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const { doctorId } = req.params;

        // Validate doctor exists
        const doctor = await User.findById(doctorId);
        if (!doctor || doctor.role !== "doctor") {
            res.status(404).json({
                success: false,
                message: "Doctor not found",
            });
            return;
        }

        // Get rating statistics
        const stats = await Rating.aggregate([
            { $match: { doctor: new mongoose.Types.ObjectId(doctorId) } },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: "$rating" },
                    totalRatings: { $sum: 1 },
                    ratingDistribution: {
                        $push: "$rating"
                    }
                }
            }
        ]);

        if (stats.length === 0) {
            res.status(200).json({
                success: true,
                message: "No ratings found for this doctor",
                data: {
                    averageRating: 0,
                    totalRatings: 0,
                    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
                }
            });
            return;
        }

        const result = stats[0];
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        
        result.ratingDistribution.forEach((rating: number) => {
            distribution[rating as keyof typeof distribution]++;
        });

        res.status(200).json({
            success: true,
            message: "Doctor rating statistics retrieved successfully",
            data: {
                averageRating: Math.round(result.averageRating * 10) / 10,
                totalRatings: result.totalRatings,
                ratingDistribution: distribution
            }
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to get doctor rating statistics",
            error: error.message,
        });
    }
};

// Get all ratings globally for dashboard (visible to everyone)
export const getAllRatingsForDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { page = 1, limit = 10, sortBy = "newest" } = req.query;
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        // Build sort object
        let sortObject: any = { createdAt: -1 };
        if (sortBy === "oldest") {
            sortObject = { createdAt: 1 };
        } else if (sortBy === "highest") {
            sortObject = { rating: -1, createdAt: -1 };
        } else if (sortBy === "lowest") {
            sortObject = { rating: 1, createdAt: -1 };
        }

        // Get all ratings with pagination
        const ratings = await Rating.find({})
            .populate([
                { path: "patient", select: "name" },
                { path: "doctor", select: "name specialty" },
                { path: "appointment", select: "appointmentDate appointmentTime reason" },
            ])
            .sort(sortObject)
            .skip(skip)
            .limit(limitNum);

        // Process ratings to handle anonymity and user permissions
        const processedRatings = ratings.map(rating => {
            const ratingObj = rating.toObject() as any;
            // Show patient name only if it's the user's own rating, otherwise anonymous
            if (ratingObj.patient._id.toString() === userId.toString()) {
                ratingObj.canEdit = true;
                ratingObj.canDelete = true;
                // Keep original patient name for own ratings
            } else {
                ratingObj.patient = { name: "Anonymous Patient" };
                ratingObj.canEdit = false;
                ratingObj.canDelete = false;
            }
            return ratingObj;
        });

        // Get total count
        const totalRatings = await Rating.countDocuments({});

        res.status(200).json({
            success: true,
            message: "All ratings retrieved successfully",
            data: {
                ratings: processedRatings,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(totalRatings / limitNum),
                    totalRatings,
                    hasNext: pageNum < Math.ceil(totalRatings / limitNum),
                    hasPrev: pageNum > 1,
                },
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to get global ratings",
            error: error.message,
        });
    }
};

// Get appointments that can be rated (have consultations)
export const getRateableAppointments = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }

        const appointmentsWithConsultations = await getAppointmentsWithConsultations(userId as string);
        console.log("Found appointments with completed consultations:", appointmentsWithConsultations.length);

        // Get existing ratings to check which appointments are already rated
        const existingRatings = await Rating.find({ 
            patient: new mongoose.Types.ObjectId(userId as string)
        }).select("appointment");
        console.log("Existing ratings count:", existingRatings.length);

        const ratedAppointmentIds = existingRatings.map(rating => 
            rating.appointment.toString()
        );

        // Format response
        const rateableAppointments = appointmentsWithConsultations.map(appointment => ({
            _id: (appointment._id as mongoose.Types.ObjectId).toString(),
            doctor: appointment.doctor,
            appointmentDate: appointment.appointmentDate,
            appointmentTime: appointment.appointmentTime,
            reason: appointment.reason,
            status: appointment.status,
            hasRated: ratedAppointmentIds.includes((appointment._id as mongoose.Types.ObjectId).toString()),
        }));

        res.status(200).json({
            success: true,
            message: "Rateable appointments retrieved successfully",
            data: {
                appointments: rateableAppointments,
                total: rateableAppointments.length,
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to get rateable appointments",
            error: error.message,
        });
    }
};
