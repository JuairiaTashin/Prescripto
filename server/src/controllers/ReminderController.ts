import { Request, Response } from "express";
import mongoose from "mongoose";
import Reminder from "../models/Reminder";
import Appointment from "../models/Appointment";
import User from "../models/User";
import { createReminderNotification } from "./NotificationController";
import { AuthRequest } from "../middleware/auth";


// Create reminders for a new appointment
export const createAppointmentReminders = async (appointmentId: mongoose.Types.ObjectId): Promise<void> => {
    try {
        const appointment = await Appointment.findById(appointmentId).populate("patient doctor");
        if (!appointment) return;


        const appointmentDateTime = new Date(appointment.appointmentDate);
        appointmentDateTime.setHours(parseInt(appointment.appointmentTime.split(':')[0]));
        appointmentDateTime.setMinutes(parseInt(appointment.appointmentTime.split(':')[1]));


        // Only create reminders for future appointments
        const now = new Date();
        if (appointmentDateTime <= now) {
            return;
        }


        const reminders = [];


        // 24 hours before reminder
        const reminder24h = new Date(appointmentDateTime.getTime() - 24 * 60 * 60 * 1000);
        if (reminder24h > now) {
            reminders.push({
                appointment: appointmentId,
                patient: appointment.patient,
                doctor: appointment.doctor,
                reminderTime: reminder24h,
                type: "24h" as const,
            });
        }


        // 1 hour before reminder
        const reminder1h = new Date(appointmentDateTime.getTime() - 60 * 60 * 1000);
        if (reminder1h > now) {
            reminders.push({
                appointment: appointmentId,
                patient: appointment.patient,
                doctor: appointment.doctor,
                reminderTime: reminder1h,
                type: "1h" as const,
            });
        }


        // 5 minutes before reminder
        const reminder5min = new Date(appointmentDateTime.getTime() - 5 * 60 * 1000);
        if (reminder5min > now) {
            reminders.push({
                appointment: appointmentId,
                patient: appointment.patient,
                doctor: appointment.doctor,
                reminderTime: reminder5min,
                type: "5min" as const,
            });
        }


        if (reminders.length > 0) {
            await Reminder.insertMany(reminders);
        }
    } catch (error) {
        console.error("Error creating appointment reminders:", error);
    }
};


// Process scheduled reminders (this would be called by a cron job every minute)
export const processScheduledReminders = async (): Promise<void> => {
    try {
        const now = new Date();


        // Find reminders that are due to be sent (within the current minute)
        const dueReminders = await Reminder.find({
            reminderTime: { $lte: now },
            isSent: false,
        }).populate("appointment patient doctor");


        for (const reminder of dueReminders) {
            if (reminder.appointment && reminder.patient && reminder.doctor) {
                // Create notification for this reminder
                await createReminderNotification(reminder._id as mongoose.Types.ObjectId);
            }
        }
    } catch (error) {
        console.error("Error processing scheduled reminders:", error);
    }
};


// Get reminders for a user
export const getUserReminders = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        const { page = 1, limit = 20, includeProcessed = false } = req.query;


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


        const query: any = { patient: userId };
       
        // By default, show all reminders, but allow filtering
        if (includeProcessed === "false") {
            query.isSent = false;
        }


        const reminders = await Reminder.find(query)
            .populate("appointment", "appointmentDate appointmentTime reason status")
            .populate("doctor", "name specialty")
            .sort({ reminderTime: 1 })
            .skip(skip)
            .limit(limitNum);


        const total = await Reminder.countDocuments(query);


        res.status(200).json({
            success: true,
            message: "Reminders retrieved successfully",
            data: {
                reminders,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(total / limitNum),
                    totalReminders: total,
                    hasNext: pageNum < Math.ceil(total / limitNum),
                    hasPrev: pageNum > 1,
                },
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to get reminders",
            error: error.message,
        });
    }
};


// Delete a reminder (only if not sent yet)
export const deleteReminder = async (req: AuthRequest, res: Response): Promise<void> => {
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


        // Find the reminder first
        const reminder = await Reminder.findOne({ _id: id, patient: userId });


        if (!reminder) {
            res.status(404).json({
                success: false,
                message: "Reminder not found",
            });
            return;
        }


        // Prevent deletion if reminder has already been sent
        if (reminder.isSent) {
            res.status(400).json({
                success: false,
                message: "Cannot delete a reminder that has already been sent",
            });
            return;
        }


        await Reminder.findOneAndDelete({ _id: id, patient: userId });


        res.status(200).json({
            success: true,
            message: "Reminder deleted successfully",
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to delete reminder",
            error: error.message,
        });
    }
};


// Cancel reminders when appointment is cancelled
export const cancelAppointmentReminders = async (appointmentId: mongoose.Types.ObjectId): Promise<void> => {
    try {
        await Reminder.deleteMany({
            appointment: appointmentId,
            isSent: false // Only delete unsent reminders
        });
    } catch (error) {
        console.error("Error cancelling appointment reminders:", error);
    }
};


// Update reminders when appointment is rescheduled
export const updateAppointmentReminders = async (appointmentId: mongoose.Types.ObjectId): Promise<void> => {
    try {
        // Delete old reminders (only unsent ones)
        await Reminder.deleteMany({
            appointment: appointmentId,
            isSent: false
        });
       
        // Create new reminders for the rescheduled appointment
        await createAppointmentReminders(appointmentId);
    } catch (error) {
        console.error("Error updating appointment reminders:", error);
    }
};


// Get upcoming reminders (for dashboard or quick view)
export const getUpcomingReminders = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;


        if (!userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }


        const now = new Date();
        const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);


        const upcomingReminders = await Reminder.find({
            patient: userId,
            reminderTime: { $gte: now, $lte: next24Hours },
            isSent: false
        })
        .populate("appointment", "appointmentDate appointmentTime reason")
        .populate("doctor", "name specialty")
        .sort({ reminderTime: 1 })
        .limit(5);


        res.status(200).json({
            success: true,
            message: "Upcoming reminders retrieved successfully",
            data: upcomingReminders,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to get upcoming reminders",
            error: error.message,
        });
    }
};
