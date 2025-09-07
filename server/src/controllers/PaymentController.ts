import { Request, Response } from "express";
import mongoose from "mongoose";
import Payment from "../models/Payment";
import Appointment from "../models/Appointment";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth";
import { createNotification } from "./NotificationController";

// Create payment record when appointment is booked
export const createPaymentRecord = async (appointmentId: mongoose.Types.ObjectId): Promise<void> => {
    try {
        const appointment = await Appointment.findById(appointmentId).populate("patient doctor");
        if (!appointment) return;

        // Check if payment already exists
        const existingPayment = await Payment.findOne({ appointment: appointmentId });
        if (existingPayment) return;

        // Get doctor's consultation fee
        const doctor = await User.findById(appointment.doctor._id);
        // Determine amount even if consultationFee is missing
        const amount: number = typeof (doctor as any)?.consultationFee === "number" ? (doctor as any).consultationFee : 0;

        // Set payment deadline to appointment date and time
        const paymentDeadline = new Date(appointment.appointmentDate);
        paymentDeadline.setHours(parseInt(appointment.appointmentTime.split(':')[0]));
        paymentDeadline.setMinutes(parseInt(appointment.appointmentTime.split(':')[1]));

        // Create payment record
        const payment = new Payment({
            appointment: appointmentId,
            patient: appointment.patient._id,
            doctor: appointment.doctor._id,
            amount,
            // paymentMethod left undefined until user selects
            status: "pending",
            paymentDeadline,
        });

        await payment.save();

        // Create notification for patient about payment
        await createNotification(
            appointment.patient._id as mongoose.Types.ObjectId,
            "reminder",
            "Payment Required",
            `Please complete payment of ৳${amount} for your appointment with Dr. ${(doctor as any)?.name || "Doctor"} before ${paymentDeadline.toLocaleString()}.`,
            appointment._id as mongoose.Types.ObjectId
        );

    } catch (error) {
        console.error("Error creating payment record:", error);
    }
};

// Process bKash payment
export const processBkashPayment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { appointmentId } = req.params;
        const { phoneNumber, transactionId } = req.body;
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }

        if (!phoneNumber || !transactionId) {
            res.status(400).json({
                success: false,
                message: "Phone number and transaction ID are required",
            });
            return;
        }

        // Find payment record
        const payment = await Payment.findOne({ appointment: appointmentId })
            .populate("appointment", "patient doctor")
            .populate("patient", "name")
            .populate("doctor", "name");

        if (!payment) {
            res.status(404).json({
                success: false,
                message: "Payment record not found",
            });
            return;
        }

        // Check if user is the patient
        if (payment.patient._id.toString() !== userId.toString()) {
            res.status(403).json({
                success: false,
                message: "You can only pay for your own appointments",
            });
            return;
        }

        // Check if payment is already completed
        if (payment.status === "completed") {
            res.status(400).json({
                success: false,
                message: "Payment is already completed",
            });
            return;
        }

        // Check if payment deadline has passed
        if (new Date() > payment.paymentDeadline) {
            payment.status = "expired";
            payment.failedAt = new Date();
            payment.failureReason = "Payment deadline expired";
            await payment.save();

            // Cancel appointment due to payment failure
            const appointment = await Appointment.findById(appointmentId);
            if (appointment) {
                appointment.status = "cancelled";
                appointment.cancellationReason = "Cancelled due to payment failure";
                await appointment.save();
            }

            res.status(400).json({
                success: false,
                message: "Payment deadline has passed. Appointment has been cancelled.",
            });
            return;
        }

        // Process bKash payment (in real app, verify with bKash API)
        payment.paymentMethod = "bkash";
        payment.bkashDetails = {
            phoneNumber: phoneNumber.trim(),
            transactionId: transactionId.trim(),
        };
        payment.status = "completed";
        payment.completedAt = new Date();
        await payment.save();

        // Update appointment status to confirmed
        const appointment = await Appointment.findById(appointmentId);
        if (appointment) {
            appointment.status = "confirmed";
            await appointment.save();
        }

        // Create notifications
        await createNotification(
            payment.patient._id as mongoose.Types.ObjectId,
            "appointment_booked",
            "Payment Completed",
            `Your payment of ৳${payment.amount} has been completed successfully. Your appointment is now confirmed.`,
            new mongoose.Types.ObjectId(appointmentId as any)
        );

        await createNotification(
            payment.doctor._id as mongoose.Types.ObjectId,
            "appointment_booked",
            "Payment Received",
            `Payment of ৳${payment.amount} has been received for appointment with ${(payment.patient as any).name}.`,
            new mongoose.Types.ObjectId(appointmentId as any)
        );

        res.status(200).json({
            success: true,
            message: "bKash payment processed successfully",
            data: payment,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to process bKash payment",
            error: error.message,
        });
    }
};

// Process card payment
export const processCardPayment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { appointmentId } = req.params;
        const { cardNumber, cardholderName, expiryDate, cvv } = req.body;
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }

        if (!cardNumber || !cardholderName || !expiryDate || !cvv) {
            res.status(400).json({
                success: false,
                message: "All card details are required",
            });
            return;
        }

        // Find payment record
        const payment = await Payment.findOne({ appointment: appointmentId })
            .populate("appointment", "patient doctor")
            .populate("patient", "name")
            .populate("doctor", "name");

        if (!payment) {
            res.status(404).json({
                success: false,
                message: "Payment record not found",
            });
            return;
        }

        // Check if user is the patient
        if (payment.patient._id.toString() !== userId.toString()) {
            res.status(403).json({
                success: false,
                message: "You can only pay for your own appointments",
            });
            return;
        }

        // Check if payment is already completed
        if (payment.status === "completed") {
            res.status(400).json({
                success: false,
                message: "Payment is already completed",
            });
            return;
        }

        // Check if payment deadline has passed
        if (new Date() > payment.paymentDeadline) {
            payment.status = "expired";
            payment.failedAt = new Date();
            payment.failureReason = "Payment deadline expired";
            await payment.save();

            // Cancel appointment due to payment failure
            const appointment = await Appointment.findById(appointmentId);
            if (appointment) {
                appointment.status = "cancelled";
                appointment.cancellationReason = "Cancelled due to payment failure";
                await appointment.save();
            }

            res.status(400).json({
                success: false,
                message: "Payment deadline has passed. Appointment has been cancelled.",
            });
            return;
        }

        // Process card payment (in real app, integrate with payment gateway)
        payment.paymentMethod = "card";
        payment.cardDetails = {
            cardNumber: cardNumber.trim(),
            cardholderName: cardholderName.trim(),
            expiryDate: expiryDate.trim(),
            cvv: cvv.trim(),
        };
        payment.status = "completed";
        payment.completedAt = new Date();
        await payment.save();

        // Update appointment status to confirmed
        const appointment = await Appointment.findById(appointmentId);
        if (appointment) {
            appointment.status = "confirmed";
            await appointment.save();
        }

        // Create notifications
        await createNotification(
            payment.patient._id as mongoose.Types.ObjectId,
            "appointment_booked",
            "Payment Completed",
            `Your card payment of ৳${payment.amount} has been completed successfully. Your appointment is now confirmed.`,
            new mongoose.Types.ObjectId(appointmentId as any)
        );

        await createNotification(
            payment.doctor._id as mongoose.Types.ObjectId,
            "appointment_booked",
            "Payment Received",
            `Card payment of ৳${payment.amount} has been received for appointment with ${(payment.patient as any).name}.`,
            new mongoose.Types.ObjectId(appointmentId as any)
        );

        res.status(200).json({
            success: true,
            message: "Card payment processed successfully",
            data: payment,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to process card payment",
            error: error.message,
        });
    }
};

// Process aamarPay payment
export const processAamarPayPayment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { appointmentId } = req.params;
        const { transactionId, gatewayResponse } = req.body;
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }

        if (!transactionId) {
            res.status(400).json({
                success: false,
                message: "Transaction ID is required",
            });
            return;
        }

        // Find payment record
        const payment = await Payment.findOne({ appointment: appointmentId })
            .populate("appointment", "patient doctor")
            .populate("patient", "name")
            .populate("doctor", "name");

        if (!payment) {
            res.status(404).json({
                success: false,
                message: "Payment record not found",
            });
            return;
        }

        // Check if user is the patient
        if (payment.patient._id.toString() !== userId.toString()) {
            res.status(403).json({
                success: false,
                message: "You can only pay for your own appointments",
            });
            return;
        }

        // Check if payment is already completed
        if (payment.status === "completed") {
            res.status(400).json({
                success: false,
                message: "Payment is already completed",
            });
            return;
        }

        // Check if payment deadline has passed
        if (new Date() > payment.paymentDeadline) {
            payment.status = "expired";
            payment.failedAt = new Date();
            payment.failureReason = "Payment deadline expired";
            await payment.save();

            // Cancel appointment due to payment failure
            const appointment = await Appointment.findById(appointmentId);
            if (appointment) {
                appointment.status = "cancelled";
                appointment.cancellationReason = "Cancelled due to payment failure";
                await appointment.save();
            }

            res.status(400).json({
                success: false,
                message: "Payment deadline has passed. Appointment has been cancelled.",
            });
            return;
        }

        // Process aamarPay payment
        payment.paymentMethod = "aamarPay";
        payment.aamarPayDetails = {
            transactionId: transactionId.trim(),
            gatewayResponse: gatewayResponse || {},
        };
        payment.status = "completed";
        payment.completedAt = new Date();
        await payment.save();

        // Update appointment status to confirmed
        const appointment = await Appointment.findById(appointmentId);
        if (appointment) {
            appointment.status = "confirmed";
            await appointment.save();
        }

        // Create notifications
        await createNotification(
            payment.patient._id as mongoose.Types.ObjectId,
            "appointment_booked",
            "Payment Completed",
            `Your aamarPay payment of ৳${payment.amount} has been completed successfully. Your appointment is now confirmed.`,
            new mongoose.Types.ObjectId(appointmentId as any)
        );

        await createNotification(
            payment.doctor._id as mongoose.Types.ObjectId,
            "appointment_booked",
            "Payment Received",
            `aamarPay payment of ৳${payment.amount} has been received for appointment with ${(payment.patient as any).name}.`,
            new mongoose.Types.ObjectId(appointmentId as any)
        );

        res.status(200).json({
            success: true,
            message: "aamarPay payment processed successfully",
            data: payment,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to process aamarPay payment",
            error: error.message,
        });
    }
};

// Get payment details
export const getPaymentDetails = async (req: AuthRequest, res: Response): Promise<void> => {
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

        // Find payment record
        let payment = await Payment.findOne({ appointment: appointmentId })
            .populate("appointment", "patient doctor appointmentDate appointmentTime")
            .populate("patient", "name")
            .populate("doctor", "name specialty");

        if (!payment) {
            // Create the payment record on the fly for older appointments
            await createPaymentRecord(new mongoose.Types.ObjectId(appointmentId));
            payment = await Payment.findOne({ appointment: appointmentId })
                .populate("appointment", "patient doctor appointmentDate appointmentTime")
                .populate("patient", "name")
                .populate("doctor", "name specialty");
            if (!payment) {
                res.status(404).json({
                    success: false,
                    message: "Payment record not found",
                });
                return;
            }
        }

        // Check if user is the patient or doctor
        const isPatient = payment.patient._id.toString() === userId.toString();
        const isDoctor = payment.doctor._id.toString() === userId.toString();

        if (!isPatient && !isDoctor) {
            res.status(403).json({
                success: false,
                message: "You can only view payments for your own appointments",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Payment details retrieved successfully",
            data: payment,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to get payment details",
            error: error.message,
        });
    }
};

// Get user's payment history
export const getUserPaymentHistory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        const { page = 1, limit = 10, status = "all" } = req.query;

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

        // Build query based on user role
        const query: any = {};
        if (user.role === "patient") {
            query.patient = userId;
        } else if (user.role === "doctor") {
            query.doctor = userId;
        }

        // Filter by status if provided
        if (status && status !== "all") {
            query.status = status;
        }

        const payments = await Payment.find(query)
            .populate("appointment", "appointmentDate appointmentTime reason")
            .populate("patient", "name")
            .populate("doctor", "name specialty")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await Payment.countDocuments(query);

        res.status(200).json({
            success: true,
            message: "Payment history retrieved successfully",
            data: {
                payments,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(total / limitNum),
                    totalPayments: total,
                    hasNext: pageNum < Math.ceil(total / limitNum),
                    hasPrev: pageNum > 1,
                },
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to get payment history",
            error: error.message,
        });
    }
};

// Check payment status
export const checkPaymentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
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

        // Find payment record
        let payment = await Payment.findOne({ appointment: appointmentId });
        if (!payment) {
            // Create the payment record on the fly for older appointments
            await createPaymentRecord(new mongoose.Types.ObjectId(appointmentId));
            payment = await Payment.findOne({ appointment: appointmentId });
            if (!payment) {
                res.status(404).json({
                    success: false,
                    message: "Payment record not found",
                });
                return;
            }
        }

        // Check if user is the patient
        if (payment.patient.toString() !== userId.toString()) {
            res.status(403).json({
                success: false,
                message: "You can only check payment status for your own appointments",
            });
            return;
        }

        // Check if payment deadline has passed
        if (new Date() > payment.paymentDeadline && payment.status === "pending") {
            payment.status = "expired";
            payment.failedAt = new Date();
            payment.failureReason = "Payment deadline expired";
            await payment.save();

            // Cancel appointment due to payment failure
            const appointment = await Appointment.findById(appointmentId);
            if (appointment) {
                appointment.status = "cancelled";
                appointment.cancellationReason = "Cancelled due to payment failure";
                await appointment.save();
            }
        }

        res.status(200).json({
            success: true,
            message: "Payment status checked successfully",
            data: {
                status: payment.status,
                amount: payment.amount,
                paymentDeadline: payment.paymentDeadline,
                isExpired: new Date() > payment.paymentDeadline,
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to check payment status",
            error: error.message,
        });
    }
};

// Transfer payment from original appointment to rescheduled appointment
export const transferPaymentToRescheduledAppointment = async (
    originalAppointmentId: mongoose.Types.ObjectId,
    newAppointmentId: mongoose.Types.ObjectId
): Promise<void> => {
    try {
        // Find the original payment record
        const originalPayment = await Payment.findOne({ appointment: originalAppointmentId });
        
        if (!originalPayment) {
            console.log("No payment record found for original appointment, creating new payment record");
            await createPaymentRecord(newAppointmentId);
            return;
        }

        // If original payment was completed, transfer it to the new appointment
        if (originalPayment.status === "completed") {
            // Create new payment record for rescheduled appointment with completed status
            const newAppointment = await Appointment.findById(newAppointmentId).populate("doctor", "name");
            if (!newAppointment) {
                console.error("New appointment not found for payment transfer");
                return;
            }

            const newPayment = new Payment({
                appointment: newAppointmentId,
                patient: originalPayment.patient,
                doctor: originalPayment.doctor,
                amount: originalPayment.amount,
                paymentMethod: originalPayment.paymentMethod,
                status: "completed", // Transfer the completed status
                bkashDetails: originalPayment.bkashDetails,
                cardDetails: originalPayment.cardDetails,
                aamarPayDetails: originalPayment.aamarPayDetails,
                paymentDeadline: originalPayment.paymentDeadline,
                completedAt: originalPayment.completedAt, // Keep original completion time
            });

            await newPayment.save();

            // Update the new appointment status to confirmed since payment is already completed
            newAppointment.status = "confirmed";
            await newAppointment.save();

            console.log(`Payment transferred from appointment ${originalAppointmentId} to ${newAppointmentId}`);
        } else if (originalPayment.status === "pending") {
            // If original payment was pending, create new payment record with extended deadline
            await createPaymentRecord(newAppointmentId);
            console.log(`New payment record created for rescheduled appointment ${newAppointmentId}`);
        }

        // Mark original payment as transferred/cancelled to avoid confusion
        originalPayment.status = "expired";
        originalPayment.failedAt = new Date();
        originalPayment.failureReason = "Appointment rescheduled - payment transferred";
        await originalPayment.save();

    } catch (error) {
        console.error("Error transferring payment to rescheduled appointment:", error);
        // Fallback: create new payment record
        await createPaymentRecord(newAppointmentId);
    }
};
