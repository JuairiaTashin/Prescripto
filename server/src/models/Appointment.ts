import mongoose, { Document, Schema } from "mongoose";


export interface IAppointment extends Document {
    patient: mongoose.Types.ObjectId;
    doctor: mongoose.Types.ObjectId;
    appointmentDate: Date;
    appointmentTime: string;
    appointmentSlot: string;
    status: "pending" | "confirmed" | "cancelled" | "completed" | "rescheduled";
    consultationStatus: "not_started" | "in_progress" | "completed";
    consultationStartTime?: Date;
    consultationEndTime?: Date;
    reason: string;
    notes?: string;
    cancellationReason?: string;
    rescheduledFrom?: mongoose.Types.ObjectId;
    rescheduledTo?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}


const appointmentSchema: Schema<IAppointment> = new Schema(
    {
        patient: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Patient is required"],
        },
        doctor: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Doctor is required"],
        },
        appointmentDate: {
            type: Date,
            required: [true, "Appointment date is required"],
        },
        appointmentTime: {
            type: String,
            required: [true, "Appointment time is required"],
        },
        appointmentSlot: {
            type: String,
            required: [true, "Appointment slot is required"],
        },
        status: {
            type: String,
            enum: ["pending", "confirmed", "cancelled", "completed", "rescheduled"],
            default: "pending",
        },
        consultationStatus: {
            type: String,
            enum: ["not_started", "in_progress", "completed"],
            default: "not_started",
        },
        consultationStartTime: {
            type: Date,
        },
        consultationEndTime: {
            type: Date,
        },
        reason: {
            type: String,
            required: [true, "Appointment reason is required"],
        },
        notes: {
            type: String,
        },
        cancellationReason: {
            type: String,
        },
        rescheduledFrom: {
            type: Schema.Types.ObjectId,
            ref: "Appointment",
        },
        rescheduledTo: {
            type: Schema.Types.ObjectId,
            ref: "Appointment",
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);


// Index for efficient queries
appointmentSchema.index({ doctor: 1, appointmentDate: 1, appointmentTime: 1 });
appointmentSchema.index({ patient: 1, status: 1 });
appointmentSchema.index({ status: 1, appointmentDate: 1 });


const Appointment = mongoose.model<IAppointment>("Appointment", appointmentSchema);


export default Appointment;




