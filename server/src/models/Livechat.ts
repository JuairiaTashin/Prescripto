import mongoose, { Document, Schema } from "mongoose";

export interface IMessage extends Document {
    sender: mongoose.Types.ObjectId;
    content: string;
    timestamp: Date;
    isRead: boolean;
}

export interface IChatRoom extends Document {
    appointment: mongoose.Types.ObjectId;
    patient: mongoose.Types.ObjectId;
    doctor: mongoose.Types.ObjectId;
    messages: IMessage[];
    isActive: boolean;
    startedAt: Date;
    endedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const messageSchema: Schema<IMessage> = new Schema(
    {
        sender: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Sender is required"],
        },
        content: {
            type: String,
            required: [true, "Message content is required"],
            trim: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    {
        _id: true,
        timestamps: false,
    }
);

const chatRoomSchema: Schema<IChatRoom> = new Schema(
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
        messages: [messageSchema],
        isActive: {
            type: Boolean,
            default: true,
        },
        startedAt: {
            type: Date,
            default: Date.now,
        },
        endedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Indexes for efficient queries
chatRoomSchema.index({ appointment: 1 }, { unique: true });
chatRoomSchema.index({ patient: 1, doctor: 1 });
chatRoomSchema.index({ isActive: 1 });

const ChatRoom = mongoose.model<IChatRoom>("ChatRoom", chatRoomSchema);

export default ChatRoom;