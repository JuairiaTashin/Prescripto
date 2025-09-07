import { Request, Response } from "express";
import mongoose from "mongoose";
import Notification, { INotification } from "../models/Notification";
import Reminder from "../models/Reminder";
import Appointment from "../models/Appointment";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth";


export const createNotification = async (
    recipientId: mongoose.Types.ObjectId,
    type: "reminder" | "appointment_completed" | "appointment_cancelled" | "appointment_rescheduled" | "appointment_booked" | "consultation_started" | "consultation_completed",
    title: string,
    message: string,
    appointmentId?: mongoose.Types.ObjectId,
    scheduledFor?: Date
): Promise<INotification> => {
    const notification = new Notification({
        recipient: recipientId,
        type,
        appointment: appointmentId,
        title,
        message,
        scheduledFor,
    });


    return await notification.save();
};


// Create notification from reminder
export const createReminderNotification = async (
    reminderId: mongoose.Types.ObjectId
): Promise<void> => {
    try {
        const reminder = await Reminder.findById(reminderId)
            .populate("appointment")
            .populate("patient")
            .populate("doctor");


        if (!reminder || !reminder.appointment || !reminder.patient || !reminder.doctor) {
            return;
        }


        const apt = reminder.appointment as any;
        const patient = reminder.patient as any;
        const doctor = reminder.doctor as any;


        const title = getReminderTitle(reminder.type);
        const message = getReminderMessage(reminder.type, doctor.name, apt.appointmentDate, apt.appointmentTime, apt.reason);


        // Create notification for the reminder
        await createNotification(
            reminder.patient as mongoose.Types.ObjectId,
            "reminder",
            title,
            message,
            reminder.appointment as mongoose.Types.ObjectId
        );


        // Mark reminder as sent
        reminder.isSent = true;
        await reminder.save();
    } catch (error) {
        console.error("Error creating reminder notification:", error);
    }
};


// Get reminder title based on type
const getReminderTitle = (type: string): string => {
    switch (type) {
        case "24h":
            return "Appointment Reminder - 24 Hours";
        case "1h":
            return "Appointment Reminder - 1 Hour";
        case "5min":
            return "Appointment Starting Soon";
        default:
            return "Appointment Reminder";
    }
};


// Get reminder message based on type
const getReminderMessage = (type: string, doctorName: string, appointmentDate: Date, appointmentTime: string, reason: string): string => {
    const dateStr = new Date(appointmentDate).toLocaleDateString();
    const baseMessage = `Your appointment with Dr. ${doctorName} is scheduled for ${dateStr} at ${appointmentTime} (Reason: ${reason}).`;
   
    switch (type) {
        case "24h":
            return `${baseMessage} Please ensure you have all necessary documents and arrive 10 minutes early.`;
        case "1h":
            return `${baseMessage} Please prepare for your consultation and ensure you have a stable internet connection.`;
        case "5min":
            return `${baseMessage} Your consultation is about to begin. Please join the waiting room.`;
        default:
            return baseMessage;
    }
};


// Get notifications for a user
export const getUserNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        const { page = 1, limit = 20, unreadOnly = false } = req.query;


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


        const query: any = { recipient: userId };
        if (unreadOnly === "true") {
            query.isRead = false;
        }


        const notifications = await Notification.find(query)
            .populate("appointment", "appointmentDate appointmentTime reason")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);


        const total = await Notification.countDocuments(query);
        const unreadCount = await Notification.countDocuments({ recipient: userId, isRead: false });


        res.status(200).json({
            success: true,
            message: "Notifications retrieved successfully",
            data: {
                notifications,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(total / limitNum),
                    totalNotifications: total,
                    hasNext: pageNum < Math.ceil(total / limitNum),
                    hasPrev: pageNum > 1,
                },
                unreadCount,
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to get notifications",
            error: error.message,
        });
    }
};


// Mark notification as read
export const markNotificationAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
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


        const notification = await Notification.findOneAndUpdate(
            { _id: id, recipient: userId },
            { isRead: true },
            { new: true }
        );


        if (!notification) {
            res.status(404).json({
                success: false,
                message: "Notification not found",
            });
            return;
        }


        res.status(200).json({
            success: true,
            message: "Notification marked as read",
            data: notification,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to mark notification as read",
            error: error.message,
        });
    }
};


// Mark all notifications as read
export const markAllNotificationsAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;


        if (!userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }


        await Notification.updateMany(
            { recipient: userId, isRead: false },
            { isRead: true }
        );


        res.status(200).json({
            success: true,
            message: "All notifications marked as read",
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to mark notifications as read",
            error: error.message,
        });
    }
};


// Delete a notification
export const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
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


        const notification = await Notification.findOneAndDelete({ _id: id, recipient: userId });


        if (!notification) {
            res.status(404).json({
                success: false,
                message: "Notification not found",
            });
            return;
        }


        res.status(200).json({
            success: true,
            message: "Notification deleted successfully",
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to delete notification",
            error: error.message,
        });
    }
};


// Get notification count for unread notifications
export const getNotificationCount = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;


        if (!userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }


        const unreadCount = await Notification.countDocuments({ recipient: userId, isRead: false });


        res.status(200).json({
            success: true,
            message: "Notification count retrieved successfully",
            data: { unreadCount },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to get notification count",
            error: error.message,
        });
    }
};
