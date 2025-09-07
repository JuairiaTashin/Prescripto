import mongoose from "mongoose";
import Payment from "../models/Payment";
import Appointment from "../models/Appointment";

export const expireOverduePayments = async (): Promise<void> => {
    try {
        // Check if MongoDB is connected before processing
        if (mongoose.connection.readyState !== 1) {
            console.log("MongoDB not connected, skipping payment expiry processing");
            return;
        }

        const now = new Date();
        const overdue = await Payment.find({ status: "pending", paymentDeadline: { $lte: now } });
        if (overdue.length === 0) return;

        for (const payment of overdue) {
            payment.status = "expired";
            payment.failedAt = now;
            payment.failureReason = "Payment deadline expired";
            await payment.save();

            // Cancel appointment due to payment failure
            if (payment.appointment) {
                await Appointment.findByIdAndUpdate(payment.appointment as mongoose.Types.ObjectId, {
                    $set: { status: "cancelled", cancellationReason: "Cancelled due to payment failure" },
                });
            }
        }
    } catch (error) {
        console.error("Error processing payment expiry:", error);
        // Don't throw the error to prevent crashing the entire process
    }
};

export const startPaymentExpiryWatcher = (): void => {
    // Run every minute
    setInterval(expireOverduePayments, 60 * 1000);
    // Run once at startup with a delay
    setTimeout(expireOverduePayments, 15000); // Wait 15 seconds before first run
};
