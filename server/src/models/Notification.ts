import mongoose, { Document, Schema } from "mongoose";


export interface INotification extends Document {
    recipient: mongoose.Types.ObjectId;
    type: "reminder" | "appointment_completed" | "appointment_cancelled" | "appointment_rescheduled" | "appointment_booked" | "consultation_started" | "consultation_completed";
    appointment?: mongoose.Types.ObjectId;
    title: string;
    message: string;
    isRead: boolean;
    scheduledFor?: Date; // For scheduled reminders
    createdAt: Date;
    updatedAt: Date;
}


const notificationSchema: Schema<INotification> = new Schema(
    {
        recipient: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Recipient is required"],
        },
        type: {
            type: String,
            enum: ["reminder", "appointment_completed", "appointment_cancelled", "appointment_rescheduled", "appointment_booked", "consultation_started", "consultation_completed"],
            required: [true, "Notification type is required"],
        },
        appointment: {
            type: Schema.Types.ObjectId,
            ref: "Appointment",
        },
        title: {
            type: String,
            required: [true, "Notification title is required"],
        },
        message: {
            type: String,
            required: [true, "Notification message is required"],
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        scheduledFor: {
            type: Date,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);


notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ scheduledFor: 1, type: 1 });

const Notification = mongoose.model<INotification>("Notification", notificationSchema);

export default Notification;
