import mongoose from "mongoose";
import Appointment from "../models/Appointment";
import ChatRoom from "../models/Livechat";
import { createNotification } from "../controllers/NotificationController";

// Start a consultation (when first message is sent)
export const startConsultation = async (appointmentId: string): Promise<void> => {
    try {
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            console.error("Appointment not found:", appointmentId);
            return;
        }

        // Only start if not already started
        if (appointment.consultationStatus === "not_started") {
            appointment.consultationStatus = "in_progress";
            appointment.consultationStartTime = new Date();
            await appointment.save();

            console.log(`Consultation started for appointment ${appointmentId}`);
            
            // Set a timeout to auto-complete after 3 minutes
            setTimeout(async () => {
                await completeConsultation(appointmentId);
            }, 3 * 60 * 1000); // 3 minutes in milliseconds

            // Create notification for both patient and doctor
            await createNotification(
                appointment.patient as mongoose.Types.ObjectId,
                "consultation_started",
                "Consultation Started",
                "Your consultation with the doctor has begun. You have 3 minutes for your consultation.",
                appointment._id as mongoose.Types.ObjectId
            );

            await createNotification(
                appointment.doctor as mongoose.Types.ObjectId,
                "consultation_started",
                "Consultation Started",
                "Your consultation with the patient has begun. You have 3 minutes for the consultation.",
                appointment._id as mongoose.Types.ObjectId
            );
        }
    } catch (error) {
        console.error("Error starting consultation:", error);
    }
};

// Complete a consultation (after 30 minutes or manual completion)
export const completeConsultation = async (appointmentId: string): Promise<void> => {
    try {
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            console.error("Appointment not found:", appointmentId);
            return;
        }

        // Only complete if currently in progress
        if (appointment.consultationStatus === "in_progress") {
            appointment.consultationStatus = "completed";
            appointment.consultationEndTime = new Date();
            appointment.status = "completed"; // Also update main status
            await appointment.save();

            console.log(`Consultation completed for appointment ${appointmentId}`);

            // Create notification for both patient and doctor
            await createNotification(
                appointment.patient as mongoose.Types.ObjectId,
                "consultation_completed",
                "Consultation Completed",
                "Your consultation has been completed. You can now rate and review the doctor.",
                appointment._id as mongoose.Types.ObjectId
            );

            await createNotification(
                appointment.doctor as mongoose.Types.ObjectId,
                "consultation_completed",
                "Consultation Completed",
                "Your consultation with the patient has been completed.",
                appointment._id as mongoose.Types.ObjectId
            );
        }
    } catch (error) {
        console.error("Error completing consultation:", error);
    }
};

// Check if consultation is still active (within 3 minutes)
export const isConsultationActive = (consultationStartTime: Date): boolean => {
    const now = new Date();
    const elapsed = now.getTime() - consultationStartTime.getTime();
    const threeMinutes = 3 * 60 * 1000; // 3 minutes in milliseconds
    
    return elapsed < threeMinutes;
};

// Get remaining consultation time in minutes
export const getRemainingConsultationTime = (consultationStartTime: Date): number => {
    const now = new Date();
    const elapsed = now.getTime() - consultationStartTime.getTime();
    const threeMinutes = 3 * 60 * 1000; // 3 minutes in milliseconds
    const remaining = threeMinutes - elapsed;
    
    return Math.max(0, Math.ceil(remaining / (60 * 1000))); // Return minutes, minimum 0
};

// Check if consultation can be rated (must be completed)
export const canRateConsultation = async (appointmentId: string): Promise<boolean> => {
    try {
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) return false;

        return appointment.consultationStatus === "completed";
    } catch (error) {
        console.error("Error checking if consultation can be rated:", error);
        return false;
    }
};