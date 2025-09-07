import { Request, Response } from "express";
import mongoose from "mongoose";
import Appointment, { IAppointment } from "../models/Appointment";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth";
import { createNotification } from "./NotificationController";
import { createAppointmentReminders, cancelAppointmentReminders, updateAppointmentReminders } from "./ReminderController";
import { createPaymentRecord, transferPaymentToRescheduledAppointment } from "./PaymentController";


// Generate available time slots based on doctor's available hours
const generateTimeSlots = (startTime: string, endTime: string): string[] => {
    const slots: string[] = [];
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
   
    // 3-minute intervals for quick consultations
    while (start < end) {
        slots.push(start.toTimeString().slice(0, 5));
        start.setMinutes(start.getMinutes() + 3);
    }
   
    return slots;
};


// Get available slots for a specific doctor and date
export const getAvailableSlots = async (req: Request, res: Response): Promise<void> => {
    try {
        const { doctorId, date } = req.query;
       
        if (!doctorId || !date) {
            res.status(400).json({
                success: false,
                message: "Doctor ID and date are required",
            });
            return;
        }


        const doctor = await User.findById(doctorId);
        if (!doctor || doctor.role !== "doctor") {
            res.status(404).json({
                success: false,
                message: "Doctor not found",
            });
            return;
        }


        const selectedDate = new Date(date as string);
        const today = new Date();
        today.setHours(0, 0, 0, 0);


        if (selectedDate < today) {
            res.status(400).json({
                success: false,
                message: "Cannot book appointments for past dates",
            });
            return;
        }


        // Get doctor's available hours
        const availableHours = doctor.availableHours;
        if (!availableHours?.start || !availableHours?.end) {
            res.status(400).json({
                success: false,
                message: "Doctor has not set available hours",
            });
            return;
        }


        // Generate all possible slots
        const allSlots = generateTimeSlots(availableHours.start, availableHours.end);


        // Get booked slots for the selected date
        const bookedAppointments = await Appointment.find({
            doctor: doctorId,
            appointmentDate: selectedDate,
            status: { $nin: ["cancelled"] },
        });


        const bookedSlots = bookedAppointments.map(apt => apt.appointmentSlot);


        // Filter out booked slots
        const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));


        res.status(200).json({
            success: true,
            message: "Available slots retrieved successfully",
            data: {
                availableSlots,
                doctorHours: availableHours,
                selectedDate: selectedDate.toISOString().split('T')[0],
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to get available slots",
            error: error.message,
        });
    }
};


// Book a new appointment
export const bookAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { doctorId, appointmentDate, appointmentTime, appointmentSlot, reason, notes } = req.body;
        const patientId = req.user?._id;


        if (!patientId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }


        // Validate required fields
        if (!doctorId || !appointmentDate || !appointmentTime || !appointmentSlot || !reason) {
            res.status(400).json({
                success: false,
                message: "All required fields must be provided",
            });
            return;
        }


        // Check if user is a patient
        const patient = await User.findById(patientId);
        if (!patient || patient.role !== "patient") {
            res.status(403).json({
                success: false,
                message: "Only patients can book appointments",
            });
            return;
        }


        // Check if doctor exists
        const doctor = await User.findById(doctorId);
        if (!doctor || doctor.role !== "doctor") {
            res.status(404).json({
                success: false,
                message: "Doctor not found",
            });
            return;
        }


        // Check if slot is still available
        const existingAppointment = await Appointment.findOne({
            doctor: doctorId,
            appointmentDate: new Date(appointmentDate),
            appointmentSlot,
            status: { $nin: ["cancelled"] },
        });


        if (existingAppointment) {
            res.status(400).json({
                success: false,
                message: "This slot is no longer available",
            });
            return;
        }


        // Create appointment
        const appointment = new Appointment({
            patient: patientId,
            doctor: doctorId,
            appointmentDate: new Date(appointmentDate),
            appointmentTime,
            appointmentSlot,
            reason,
            notes,
            status: "pending",
        });


        await appointment.save();


        // Create appointment reminders for the patient
        await createAppointmentReminders(appointment._id as mongoose.Types.ObjectId);

        // Create payment record for the appointment
        await createPaymentRecord(appointment._id as mongoose.Types.ObjectId);

        // Create notification for patient (appointment confirmation)
        await createNotification(
            patientId as mongoose.Types.ObjectId,
            "appointment_booked",
            "Appointment Booked Successfully",
            `Your appointment with Dr. ${doctor.name} has been scheduled for ${appointmentDate} at ${appointmentTime}. Please complete payment to confirm your appointment. You will receive reminders 24 hours, 1 hour, and 5 minutes before your appointment.`,
            appointment._id as mongoose.Types.ObjectId
        );


        // Create notification for doctor (new appointment booked)
        await createNotification(
            doctorId as mongoose.Types.ObjectId,
            "appointment_booked",
            "New Appointment Booked",
            `${patient.name} has booked an appointment with you for ${appointmentDate} at ${appointmentTime}. Reason: ${reason}`,
            appointment._id as mongoose.Types.ObjectId
        );


        // Populate patient and doctor details
        await appointment.populate([
            { path: "patient", select: "name email phone" },
            { path: "doctor", select: "name specialty" },
        ]);


        res.status(201).json({
            success: true,
            message: "Appointment booked successfully",
            data: appointment,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to book appointment",
            error: error.message,
        });
    }
};


// Get appointments for a user (patient or doctor)
export const getUserAppointments = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        const { status, page = 1, limit = 10 } = req.query;


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


        const query: any = {};
        if (user.role === "patient") {
            query.patient = userId;
        } else if (user.role === "doctor") {
            query.doctor = userId;
        }


        if (status && status !== "all") {
            query.status = status;
        } else if (user.role === "doctor") {
            // Doctors should only see confirmed (paid) appointments by default
            query.status = "confirmed";
        }


        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;


        const appointments = await Appointment.find(query)
            .populate([
                { path: "patient", select: "name email phone" },
                { path: "doctor", select: "name specialty" },
            ])
            .sort({ appointmentDate: 1, appointmentTime: 1 })
            .skip(skip)
            .limit(limitNum);


        const total = await Appointment.countDocuments(query);


        res.status(200).json({
            success: true,
            message: "Appointments retrieved successfully",
            data: {
                appointments,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(total / limitNum),
                    totalAppointments: total,
                    hasNext: pageNum < Math.ceil(total / limitNum),
                    hasPrev: pageNum > 1,
                },
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to get appointments",
            error: error.message,
        });
    }
};


// Cancel an appointment
export const cancelAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { cancellationReason } = req.body;
        const userId = req.user?._id;


        if (!userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }


        const appointment = await Appointment.findById(id).populate([
            { path: "patient", select: "name email phone" },
            { path: "doctor", select: "name specialty" },
        ]);


        if (!appointment) {
            res.status(404).json({
                success: false,
                message: "Appointment not found",
            });
            return;
        }


        // Check if user can cancel this appointment
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }


        const canCancel =
            user.role === "patient" && appointment.patient._id.toString() === userId.toString() ||
            user.role === "doctor" && appointment.doctor._id.toString() === userId.toString();


        if (!canCancel) {
            res.status(403).json({
                success: false,
                message: "You can only cancel your own appointments",
            });
            return;
        }


        // Check if appointment can be cancelled
        if (appointment.status === "cancelled") {
            res.status(400).json({
                success: false,
                message: "Appointment is already cancelled",
            });
            return;
        }

        if (appointment.status === "completed") {
            res.status(400).json({
                success: false,
                message: "Cannot cancel completed appointments",
            });
            return;
        }

        // Patients can cancel any appointment they booked (no time restrictions)
        // Doctors can only cancel appointments with 24-hour notice
        if (user.role === "doctor") {
            const appointmentDateTime = new Date(appointment.appointmentDate);
            appointmentDateTime.setHours(parseInt(appointment.appointmentTime.split(':')[0]));
            appointmentDateTime.setMinutes(parseInt(appointment.appointmentTime.split(':')[1]));
           
            const now = new Date();
            const timeDifference = appointmentDateTime.getTime() - now.getTime();
            const hoursDifference = timeDifference / (1000 * 3600);

            if (hoursDifference < 24) {
                res.status(400).json({
                    success: false,
                    message: "Doctors can only cancel appointments at least 24 hours in advance",
                });
                return;
            }
        }


        // Cancel appointment
        appointment.status = "cancelled";
        appointment.cancellationReason = cancellationReason || "Cancelled by user";
        await appointment.save();


        // Cancel appointment reminders
        await cancelAppointmentReminders(appointment._id as mongoose.Types.ObjectId);


        const patient = appointment.patient as any;
        const doctor = appointment.doctor as any;


        // Create notification for both patient and doctor
        if (user.role === "patient") {
            // Patient cancelled - notify doctor
            await createNotification(
                appointment.doctor as mongoose.Types.ObjectId,
                "appointment_cancelled",
                "Appointment Cancelled by Patient",
                `${patient.name} has cancelled their appointment scheduled for ${appointment.appointmentDate.toLocaleDateString()} at ${appointment.appointmentTime}. Reason: ${cancellationReason || 'No reason provided'}`,
                appointment._id as mongoose.Types.ObjectId
            );
        } else if (user.role === "doctor") {
            // Doctor cancelled - notify patient
            await createNotification(
                appointment.patient as mongoose.Types.ObjectId,
                "appointment_cancelled",
                "Appointment Cancelled by Doctor",
                `Dr. ${doctor.name} has cancelled your appointment scheduled for ${appointment.appointmentDate.toLocaleDateString()} at ${appointment.appointmentTime}. Reason: ${cancellationReason || 'No reason provided'}`,
                appointment._id as mongoose.Types.ObjectId
            );
        }


        res.status(200).json({
            success: true,
            message: "Appointment cancelled successfully",
            data: appointment,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to cancel appointment",
            error: error.message,
        });
    }
};


// Reschedule an appointment
export const rescheduleAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { newDate, newTime, newSlot } = req.body;
        const userId = req.user?._id;


        if (!userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }


        if (!newDate || !newTime || !newSlot) {
            res.status(400).json({
                success: false,
                message: "New date, time, and slot are required",
            });
            return;
        }


        const appointment = await Appointment.findById(id).populate([
            { path: "patient", select: "name email phone" },
            { path: "doctor", select: "name specialty" },
        ]);


        if (!appointment) {
            res.status(404).json({
                success: false,
                message: "Appointment not found",
            });
            return;
        }


        // Check if user can reschedule this appointment
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }


        const canReschedule =
            user.role === "patient" && appointment.patient._id.toString() === userId.toString() ||
            user.role === "doctor" && appointment.doctor._id.toString() === userId.toString();


        if (!canReschedule) {
            res.status(403).json({
                success: false,
                message: "You can only reschedule your own appointments",
            });
            return;
        }


        // Check if appointment can be rescheduled
        if (appointment.status === "cancelled") {
            res.status(400).json({
                success: false,
                message: "Cannot reschedule cancelled appointments",
            });
            return;
        }


        if (appointment.status === "completed") {
            res.status(400).json({
                success: false,
                message: "Cannot reschedule completed appointments",
            });
            return;
        }

        // Patients can reschedule any appointment they booked (no time restrictions)
        // Doctors can only reschedule appointments with 24-hour notice
        if (user.role === "doctor") {
            const appointmentDateTime = new Date(appointment.appointmentDate);
            appointmentDateTime.setHours(parseInt(appointment.appointmentTime.split(':')[0]));
            appointmentDateTime.setMinutes(parseInt(appointment.appointmentTime.split(':')[1]));
           
            const now = new Date();
            const timeDifference = appointmentDateTime.getTime() - now.getTime();
            const hoursDifference = timeDifference / (1000 * 3600);

            if (hoursDifference < 24) {
                res.status(400).json({
                    success: false,
                    message: "Doctors can only reschedule appointments at least 24 hours in advance",
                });
                return;
            }
        }

        // Get doctor's available hours to validate the new time
        const doctor = await User.findById(appointment.doctor._id);
        if (!doctor || !doctor.availableHours?.start || !doctor.availableHours?.end) {
            res.status(400).json({
                success: false,
                message: "Doctor has not set available hours",
            });
            return;
        }


        // Validate that new time is within doctor's available hours
        const newTimeDate = new Date(`2000-01-01T${newTime}`);
        const startTime = new Date(`2000-01-01T${doctor.availableHours.start}`);
        const endTime = new Date(`2000-01-01T${doctor.availableHours.end}`);

        if (newTimeDate < startTime || newTimeDate >= endTime) {
            res.status(400).json({
                success: false,
                message: `New time must be within doctor's available hours (${doctor.availableHours.start} - ${doctor.availableHours.end})`,
            });
            return;
        }

        // Generate all possible slots for the doctor to validate the new slot
        const allSlots = generateTimeSlots(doctor.availableHours.start, doctor.availableHours.end);
        
        if (!allSlots.includes(newSlot)) {
            res.status(400).json({
                success: false,
                message: `Invalid time slot. Available slots: ${allSlots.join(', ')}`,
            });
            return;
        }


        // Check if new slot is available
        const newAppointmentDate = new Date(newDate);
        const existingAppointment = await Appointment.findOne({
            doctor: appointment.doctor._id,
            appointmentDate: newAppointmentDate,
            appointmentSlot: newSlot,
            status: { $nin: ["cancelled"] },
            _id: { $ne: id },
        });


        if (existingAppointment) {
            res.status(400).json({
                success: false,
                message: "The new slot is not available",
            });
            return;
        }


        // Create new rescheduled appointment
        const rescheduledAppointment = new Appointment({
            patient: appointment.patient._id,
            doctor: appointment.doctor._id,
            appointmentDate: newAppointmentDate,
            appointmentTime: newTime,
            appointmentSlot: newSlot,
            reason: appointment.reason,
            notes: appointment.notes,
            status: "pending",
            rescheduledFrom: id,
        });


        await rescheduledAppointment.save();


        // Update original appointment - cancel it instead of marking as rescheduled
        appointment.status = "cancelled";
        appointment.cancellationReason = `Rescheduled to ${newDate} at ${newTime}`;
        appointment.rescheduledTo = rescheduledAppointment._id as mongoose.Types.ObjectId;
        await appointment.save();

        // Cancel appointment reminders for the original appointment
        await cancelAppointmentReminders(appointment._id as mongoose.Types.ObjectId);


        // Update appointment reminders
        await updateAppointmentReminders(rescheduledAppointment._id as mongoose.Types.ObjectId);

        // Transfer payment from original appointment to rescheduled appointment
        await transferPaymentToRescheduledAppointment(
            appointment._id as mongoose.Types.ObjectId,
            rescheduledAppointment._id as mongoose.Types.ObjectId
        );


        const patient = appointment.patient as any;
        const doctorData = appointment.doctor as any;


        // Create notifications for both patient and doctor
        if (user.role === "patient") {
            // Patient rescheduled - notify doctor about cancellation and new appointment
            await createNotification(
                appointment.doctor._id as mongoose.Types.ObjectId,
                "appointment_cancelled",
                "Appointment Cancelled and Rescheduled by Patient",
                `${patient.name} has cancelled their original appointment and rescheduled it to ${newDate} at ${newTime}.`,
                rescheduledAppointment._id as mongoose.Types.ObjectId
            );
        } else if (user.role === "doctor") {
            // Doctor rescheduled - notify patient about cancellation and new appointment
            await createNotification(
                appointment.patient._id as mongoose.Types.ObjectId,
                "appointment_cancelled",
                "Appointment Cancelled and Rescheduled by Doctor",
                `Dr. ${doctorData.name} has cancelled your original appointment and rescheduled it to ${newDate} at ${newTime}.`,
                rescheduledAppointment._id as mongoose.Types.ObjectId
            );
        }


        // Populate details for response
        await rescheduledAppointment.populate([
            { path: "patient", select: "name email phone" },
            { path: "doctor", select: "name specialty" },
        ]);


        res.status(200).json({
            success: true,
            message: "Appointment rescheduled successfully",
            data: rescheduledAppointment,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to reschedule appointment",
            error: error.message,
        });
    }
};


// Update appointment status (for doctors)
export const updateAppointmentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user?._id;


        if (!userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }


        const user = await User.findById(userId);
        if (!user || user.role !== "doctor") {
            res.status(403).json({
                success: false,
                message: "Only doctors can update appointment status",
            });
            return;
        }


        const appointment = await Appointment.findById(id).populate([
            { path: "patient", select: "name email phone" },
            { path: "doctor", select: "name specialty" },
        ]);


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
                message: "You can only update your own appointments",
            });
            return;
        }


        if (!["pending", "confirmed", "completed"].includes(status)) {
            res.status(400).json({
                success: false,
                message: "Invalid status. Allowed: pending, confirmed, completed",
            });
            return;
        }


        appointment.status = status;
        await appointment.save();


        const doctor = appointment.doctor as any;


        // Create notification when appointment status changes
        let notificationTitle = "";
        let notificationMessage = "";


        switch (status) {
            case "confirmed":
                notificationTitle = "Appointment Confirmed";
                notificationMessage = `Dr. ${doctor.name} has confirmed your appointment scheduled for ${appointment.appointmentDate.toLocaleDateString()} at ${appointment.appointmentTime}.`;
                break;
            case "completed":
                notificationTitle = "Appointment Completed";
                notificationMessage = `Your appointment with Dr. ${doctor.name} has been completed. Thank you for choosing our service.`;
                break;
        }


        if (notificationTitle && notificationMessage) {
            await createNotification(
                appointment.patient._id as mongoose.Types.ObjectId,
                status === "completed" ? "appointment_completed" : "appointment_booked",
                notificationTitle,
                notificationMessage,
                appointment._id as mongoose.Types.ObjectId
            );
        }


        res.status(200).json({
            success: true,
            message: "Appointment status updated successfully",
            data: appointment,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to update appointment status",
            error: error.message,
        });
    }
};


// Get appointment by ID
export const getAppointmentById = async (req: AuthRequest, res: Response): Promise<void> => {
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


        const appointment = await Appointment.findById(id).populate([
            { path: "patient", select: "name email phone" },
            { path: "doctor", select: "name specialty degree" },
        ]);


        if (!appointment) {
            res.status(404).json({
                success: false,
                message: "Appointment not found",
            });
            return;
        }


        // Check if user can view this appointment
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }


        const canView =
            user.role === "patient" && appointment.patient._id.toString() === userId.toString() ||
            user.role === "doctor" && appointment.doctor._id.toString() === userId.toString();


        if (!canView) {
            res.status(403).json({
                success: false,
                message: "You can only view your own appointments",
            });
            return;
        }


        res.status(200).json({
            success: true,
            message: "Appointment retrieved successfully",
            data: appointment,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to get appointment",
            error: error.message,
        });
    }
};

