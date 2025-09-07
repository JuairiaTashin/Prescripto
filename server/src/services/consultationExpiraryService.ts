import mongoose from "mongoose";
import Appointment, { IAppointment } from "../models/Appointment";
import { completeConsultation } from "./consultationService";

export const processExpiredConsultations = async (): Promise<void> => {
    try {
        // Check if MongoDB is connected before processing
        if (mongoose.connection.readyState !== 1) {
            console.log("MongoDB not connected, skipping consultation expiry processing");
            return;
        }

        const now = new Date();
        const threeMinutesAgo = new Date(now.getTime() - 3 * 60 * 1000); // 3 minutes ago

        // Find appointments that have consultations in progress for more than 3 minutes
        const expiredConsultations: IAppointment[] = await Appointment.find({
            consultationStatus: "in_progress",
            consultationStartTime: { $lte: threeMinutesAgo }
        });

        console.log(`Found ${expiredConsultations.length} expired consultations to process`);

        for (const appointment of expiredConsultations) {
            try {
                const appointmentId = String(appointment._id);
                console.log(`Completing expired consultation for appointment ${appointmentId}`);
                await completeConsultation(appointmentId);
            } catch (error) {
                console.error(`Error completing consultation for appointment ${appointment._id}:`, error);
            }
        }

        if (expiredConsultations.length > 0) {
            console.log(`Completed ${expiredConsultations.length} expired consultations`);
        }

    } catch (error) {
        console.error("Error processing expired consultations:", error);
        // Don't throw the error to prevent crashing the entire process
    }
};

export const startConsultationExpiryWatcher = (): void => {
    // Run every 30 seconds to check for expired consultations (more frequent for 3-minute consultations)
    setInterval(processExpiredConsultations, 30 * 1000);
    
    // Run once at startup with a delay
    setTimeout(processExpiredConsultations, 10000); // Wait 10 seconds before first run
    
    console.log("Consultation expiry watcher started (3-minute consultations)");
};