import mongoose, { Document, Schema } from "mongoose";


export interface IReminder extends Document {
    appointment: mongoose.Types.ObjectId;
    patient: mongoose.Types.ObjectId;
    doctor: mongoose.Types.ObjectId;
    reminderTime: Date;
    type: "24h" | "1h" | "5min";
    isSent: boolean;
    createdAt: Date;
    updatedAt: Date;
}


const reminderSchema: Schema<IReminder> = new Schema(
    {
        appointment: {
            type: Schema.Types.ObjectId,
            ref: "Appointment",
            required: [true, "Appointment is required"],
        },
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
        reminderTime: {
            type: Date,
            required: [true, "Reminder time is required"],
        },
        type: {
            type: String,
            enum: ["24h", "1h", "5min"],
            required: [true, "Reminder type is required"],
        },
        isSent: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);


reminderSchema.index({ appointment: 1, type: 1 });
reminderSchema.index({ reminderTime: 1, isSent: 1 });
reminderSchema.index({ patient: 1, isSent: 1 });


const Reminder = mongoose.model<IReminder>("Reminder", reminderSchema);


export default Reminder;




