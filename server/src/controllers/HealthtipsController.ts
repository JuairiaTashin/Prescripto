import { Request, Response } from "express";
import mongoose from "mongoose";
import HealthTip from "../models/Healthtips";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth";

// Create a new health tip (doctors only)
export const createHealthTip = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { title, content, category, tags, isPublished } = req.body;
        const doctorId = req.user?._id;

        if (!doctorId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }

        // Check if user is a doctor
        const doctor = await User.findById(doctorId);
        if (!doctor || doctor.role !== "doctor") {
            res.status(403).json({
                success: false,
                message: "Only doctors can create health tips",
            });
            return;
        }

        // Validate required fields
        if (!title || !content || !category) {
            res.status(400).json({
                success: false,
                message: "Title, content, and category are required",
            });
            return;
        }

        // Create health tip
        const healthTip = new HealthTip({
            doctor: doctorId,
            title: title.trim(),
            content: content.trim(),
            category,
            tags: tags || [],
            isPublished: isPublished || false,
            publishedAt: isPublished ? new Date() : undefined,
        });

        await healthTip.save();

        // Populate doctor details for response
        await healthTip.populate("doctor", "name specialty");

        res.status(201).json({
            success: true,
            message: "Health tip created successfully",
            data: healthTip,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to create health tip",
            error: error.message,
        });
    }
};

// Get all published health tips
export const getPublishedHealthTips = async (req: Request, res: Response): Promise<void> => {
    try {
        const { page = 1, limit = 10, category, search, sortBy = "publishedAt" } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        // Build query for published tips only
        const query: any = { isPublished: true };

        // Filter by category if provided
        if (category && category !== "all") {
            query.category = category;
        }

        // Text search if provided
        if (search) {
            query.$text = { $search: search as string };
        }

        // Build sort object
        let sort: any = {};
        switch (sortBy) {
            case "views":
                sort = { views: -1 };
                break;
            case "likes":
                sort = { likes: -1 };
                break;
            case "publishedAt":
            default:
                sort = { publishedAt: -1 };
                break;
        }

        const healthTips = await HealthTip.find(query)
            .populate("doctor", "name specialty")
            .sort(sort)
            .skip(skip)
            .limit(limitNum);

        const total = await HealthTip.countDocuments(query);

        res.status(200).json({
            success: true,
            message: "Health tips retrieved successfully",
            data: {
                healthTips,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(total / limitNum),
                    totalHealthTips: total,
                    hasNext: pageNum < Math.ceil(total / limitNum),
                    hasPrev: pageNum > 1,
                },
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to get health tips",
            error: error.message,
        });
    }
};

// Get health tip by ID
export const getHealthTipById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const healthTip = await HealthTip.findById(id)
            .populate("doctor", "name specialty");

        if (!healthTip) {
            res.status(404).json({
                success: false,
                message: "Health tip not found",
            });
            return;
        }

        // Increment view count
        healthTip.views += 1;
        await healthTip.save();

        res.status(200).json({
            success: true,
            message: "Health tip retrieved successfully",
            data: healthTip,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to get health tip",
            error: error.message,
        });
    }
};

// Get doctor's health tips (published and draft)
export const getDoctorHealthTips = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const doctorId = req.user?._id;
        const { page = 1, limit = 10, status = "all" } = req.query;

        if (!doctorId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }

        // Check if user is a doctor
        const doctor = await User.findById(doctorId);
        if (!doctor || doctor.role !== "doctor") {
            res.status(403).json({
                success: false,
                message: "Only doctors can access this endpoint",
            });
            return;
        }

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        // Build query
        const query: any = { doctor: doctorId };
        if (status === "published") {
            query.isPublished = true;
        } else if (status === "draft") {
            query.isPublished = false;
        }

        const healthTips = await HealthTip.find(query)
            .populate("doctor", "name specialty")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await HealthTip.countDocuments(query);

        res.status(200).json({
            success: true,
            message: "Health tips retrieved successfully",
            data: {
                healthTips,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(total / limitNum),
                    totalHealthTips: total,
                    hasNext: pageNum < Math.ceil(total / limitNum),
                    hasPrev: pageNum > 1,
                },
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to get health tips",
            error: error.message,
        });
    }
};

// Update health tip
export const updateHealthTip = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { title, content, category, tags, isPublished } = req.body;
        const doctorId = req.user?._id;

        if (!doctorId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }

        // Check if user is a doctor
        const doctor = await User.findById(doctorId);
        if (!doctor || doctor.role !== "doctor") {
            res.status(403).json({
                success: false,
                message: "Only doctors can update health tips",
            });
            return;
        }

        // Find health tip and check ownership
        const healthTip = await HealthTip.findById(id);
        if (!healthTip) {
            res.status(404).json({
                success: false,
                message: "Health tip not found",
            });
            return;
        }

        if (healthTip.doctor.toString() !== doctorId.toString()) {
            res.status(403).json({
                success: false,
                message: "You can only update your own health tips",
            });
            return;
        }

        // Update fields
        if (title !== undefined) healthTip.title = title.trim();
        if (content !== undefined) healthTip.content = content.trim();
        if (category !== undefined) healthTip.category = category;
        if (tags !== undefined) healthTip.tags = tags;
        if (isPublished !== undefined) {
            healthTip.isPublished = isPublished;
            healthTip.publishedAt = isPublished ? new Date() : undefined;
        }

        await healthTip.save();

        // Populate doctor details for response
        await healthTip.populate("doctor", "name specialty");

        res.status(200).json({
            success: true,
            message: "Health tip updated successfully",
            data: healthTip,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to update health tip",
            error: error.message,
        });
    }
};

// Delete health tip
export const deleteHealthTip = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const doctorId = req.user?._id;

        if (!doctorId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }

        // Check if user is a doctor
        const doctor = await User.findById(doctorId);
        if (!doctor || doctor.role !== "doctor") {
            res.status(403).json({
                success: false,
                message: "Only doctors can delete health tips",
            });
            return;
        }

        // Find health tip and check ownership
        const healthTip = await HealthTip.findById(id);
        if (!healthTip) {
            res.status(404).json({
                success: false,
                message: "Health tip not found",
            });
            return;
        }

        if (healthTip.doctor.toString() !== doctorId.toString()) {
            res.status(403).json({
                success: false,
                message: "You can only delete your own health tips",
            });
            return;
        }

        await HealthTip.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Health tip deleted successfully",
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to delete health tip",
            error: error.message,
        });
    }
};

// Like/unlike health tip
export const toggleLike = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }

        const healthTip = await HealthTip.findById(id);
        if (!healthTip) {
            res.status(404).json({
                success: false,
                message: "Health tip not found",
            });
            return;
        }

        // For now, just increment likes (in a real app, you'd track individual user likes)
        healthTip.likes += 1;
        await healthTip.save();

        res.status(200).json({
            success: true,
            message: "Health tip liked successfully",
            data: { likes: healthTip.likes },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to like health tip",
            error: error.message,
        });
    }
};

// Get health tip categories
export const getHealthTipCategories = async (req: Request, res: Response): Promise<void> => {
    try {
        const categories = [
            "General Health",
            "Nutrition",
            "Exercise",
            "Mental Health",
            "Preventive Care",
            "Disease Management",
            "Lifestyle",
            "Pediatrics",
            "Women's Health",
            "Men's Health",
            "Senior Health",
            "Other"
        ];

        res.status(200).json({
            success: true,
            message: "Categories retrieved successfully",
            data: categories,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to get categories",
            error: error.message,
        });
    }
};
