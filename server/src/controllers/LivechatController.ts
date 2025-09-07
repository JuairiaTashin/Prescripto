import { Request, Response } from "express";
import mongoose from "mongoose";
import ChatRoom from "../models/Livechat";
import Appointment from "../models/Appointment";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth";
import { createNotification } from "./NotificationController";
import { startConsultation, isConsultationActive, getRemainingConsultationTime } from "../services/consultationService";

// Create a chat room when consultation starts
export const createChatRoom = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { appointmentId } = req.body;
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }

        if (!appointmentId) {
            res.status(400).json({
                success: false,
                message: "Appointment ID is required",
            });
            return;
        }

        // Check if appointment exists and user is part of it
        const appointment = await Appointment.findById(appointmentId).populate("patient doctor");
        if (!appointment) {
            res.status(404).json({
                success: false,
                message: "Appointment not found",
            });
            return;
        }

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }

        // Check if user is the patient or doctor for this appointment
        const isPatient = appointment.patient._id.toString() === userId.toString();
        const isDoctor = appointment.doctor._id.toString() === userId.toString();

        if (!isPatient && !isDoctor) {
            res.status(403).json({
                success: false,
                message: "You can only create chat rooms for your own appointments",
            });
            return;
        }

        // Check if appointment is confirmed and consultation time has started
        if (appointment.status !== "confirmed") {
            res.status(400).json({
                success: false,
                message: "Chat room can only be created for confirmed appointments",
            });
            return;
        }

        const appointmentDateTime = new Date(appointment.appointmentDate);
        appointmentDateTime.setHours(parseInt(appointment.appointmentTime.split(':')[0]));
        appointmentDateTime.setMinutes(parseInt(appointment.appointmentTime.split(':')[1]));

        const now = new Date();
        if (now < appointmentDateTime) {
            res.status(400).json({
                success: false,
                message: "Chat room can only be created when consultation time starts",
            });
            return;
        }

        // Check if chat room already exists
        const existingChatRoom = await ChatRoom.findOne({ appointment: appointmentId });
        if (existingChatRoom) {
            res.status(400).json({
                success: false,
                message: "Chat room already exists for this appointment",
            });
            return;
        }

        // Create chat room
        const chatRoom = new ChatRoom({
            appointment: appointmentId,
            patient: appointment.patient._id,
            doctor: appointment.doctor._id,
            startedAt: now,
        });

        await chatRoom.save();

        // Populate details for response
        await chatRoom.populate([
            { path: "patient", select: "name" },
            { path: "doctor", select: "name" },
        ]);

        res.status(201).json({
            success: true,
            message: "Chat room created successfully",
            data: chatRoom,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to create chat room",
            error: error.message,
        });
    }
};

// Get chat room for an appointment
export const getChatRoom = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { appointmentId } = req.params;
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }

        // Check if appointment exists and user is part of it
        const appointment = await Appointment.findById(appointmentId).populate("patient doctor");
        if (!appointment) {
            res.status(404).json({
                success: false,
                message: "Appointment not found",
            });
            return;
        }

        const isPatient = appointment.patient._id.toString() === userId.toString();
        const isDoctor = appointment.doctor._id.toString() === userId.toString();

        if (!isPatient && !isDoctor) {
            res.status(403).json({
                success: false,
                message: "You can only access chat rooms for your own appointments",
            });
            return;
        }

        // Find chat room
        const chatRoom = await ChatRoom.findOne({ appointment: appointmentId })
            .populate([
                { path: "patient", select: "name" },
                { path: "doctor", select: "name" },
                { path: "messages.sender", select: "name role" },
            ]);

        if (!chatRoom) {
            res.status(404).json({
                success: false,
                message: "Chat room not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Chat room retrieved successfully",
            data: chatRoom,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to get chat room",
            error: error.message,
        });
    }
};

// Send a message in chat room
export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { appointmentId } = req.params;
        const { content } = req.body;
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }

        if (!content || content.trim().length === 0) {
            res.status(400).json({
                success: false,
                message: "Message content is required",
            });
            return;
        }

        // Check if appointment exists and user is part of it
        const appointment = await Appointment.findById(appointmentId).populate("patient doctor");
        if (!appointment) {
            res.status(404).json({
                success: false,
                message: "Appointment not found",
            });
            return;
        }

        const isPatient = appointment.patient._id.toString() === userId.toString();
        const isDoctor = appointment.doctor._id.toString() === userId.toString();

        if (!isPatient && !isDoctor) {
            res.status(403).json({
                success: false,
                message: "You can only send messages in your own chat rooms",
            });
            return;
        }

        // Find chat room
        const chatRoom = await ChatRoom.findOne({ appointment: appointmentId });
        if (!chatRoom) {
            res.status(404).json({
                success: false,
                message: "Chat room not found",
            });
            return;
        }

        if (!chatRoom.isActive) {
            res.status(400).json({
                success: false,
                message: "Chat room is not active",
            });
            return;
        }

        // Add message to chat room
        chatRoom.messages.push({
            sender: new mongoose.Types.ObjectId(userId as any),
            content: content.trim(),
            timestamp: new Date(),
            isRead: false,
        } as any);
        await chatRoom.save();

        // Start consultation if this is the first message
        if (chatRoom.messages.length === 1) {
            await startConsultation(appointmentId);
        }

        // Mark other messages as read for the recipient
        const recipientId = isPatient ? appointment.doctor._id : appointment.patient._id;
        chatRoom.messages.forEach(msg => {
            if (msg.sender.toString() !== userId.toString()) {
                msg.isRead = true;
            }
        });
        await chatRoom.save();

        // Create notification for the recipient
        const sender = await User.findById(userId);
        const recipient = await User.findById(recipientId);
        
        if (sender && recipient) {
            await createNotification(
                recipientId as mongoose.Types.ObjectId,
                "reminder",
                "New Message in Chat",
                `You have a new message from ${sender.name} in your consultation chat.`,
                appointment._id as mongoose.Types.ObjectId
            );
        }

        // Populate message details for response
        await chatRoom.populate([
            { path: "messages.sender", select: "name role" },
        ]);

        const newMessage = chatRoom.messages[chatRoom.messages.length - 1];

        res.status(201).json({
            success: true,
            message: "Message sent successfully",
            data: newMessage,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to send message",
            error: error.message,
        });
    }
};

// Get user's chat rooms
export const getUserChatRooms = async (req: AuthRequest, res: Response): Promise<void> => {
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

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        // Find chat rooms where user is patient or doctor
        const query = {
            $or: [
                { patient: userId },
                { doctor: userId },
            ],
        };

        const chatRooms = await ChatRoom.find(query)
            .populate([
                { path: "appointment", select: "appointmentDate appointmentTime reason status" },
                { path: "patient", select: "name" },
                { path: "doctor", select: "name specialty" },
            ])
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await ChatRoom.countDocuments(query);

        res.status(200).json({
            success: true,
            message: "Chat rooms retrieved successfully",
            data: {
                chatRooms,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(total / limitNum),
                    totalChatRooms: total,
                    hasNext: pageNum < Math.ceil(total / limitNum),
                    hasPrev: pageNum > 1,
                },
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to get chat rooms",
            error: error.message,
        });
    }
};

// End chat room
export const endChatRoom = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { appointmentId } = req.params;
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }

        // Check if appointment exists and user is the doctor
        const appointment = await Appointment.findById(appointmentId).populate("patient doctor");
        if (!appointment) {
            res.status(404).json({
                success: false,
                message: "Appointment not found",
            });
            return;
        }

        if (appointment.doctor._id.toString() !== userId.toString()) {
            res.status(403).json({
                success: false,
                message: "Only doctors can end chat rooms",
            });
            return;
        }

        // Find and end chat room
        const chatRoom = await ChatRoom.findOne({ appointment: appointmentId });
        if (!chatRoom) {
            res.status(404).json({
                success: false,
                message: "Chat room not found",
            });
            return;
        }

        if (!chatRoom.isActive) {
            res.status(400).json({
                success: false,
                message: "Chat room is already ended",
            });
            return;
        }

        chatRoom.isActive = false;
        chatRoom.endedAt = new Date();
        await chatRoom.save();

        res.status(200).json({
            success: true,
            message: "Chat room ended successfully",
            data: chatRoom,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to end chat room",
            error: error.message,
        });
    }
};