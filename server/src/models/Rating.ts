import mongoose, { Document, Schema } from "mongoose";

export interface IRating extends Document {
    patient: mongoose.Types.ObjectId;
    doctor: mongoose.Types.ObjectId;
    appointment: mongoose.Types.ObjectId;
    rating: number; // 1-5 stars
    review?: string; // Optional text review
    isAnonymous: boolean; // Whether to show patient name or keep anonymous
    createdAt: Date;
    updatedAt: Date;
}

const ratingSchema: Schema<IRating> = new Schema(
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
        appointment: {
            type: Schema.Types.ObjectId,
            ref: "Appointment",
            required: [true, "Appointment is required"],
        },
        rating: {
            type: Number,
            required: [true, "Rating is required"],
            min: [1, "Rating must be at least 1"],
            max: [5, "Rating must be at most 5"],
        },
        review: {
            type: String,
            trim: true,
            maxlength: [1000, "Review cannot exceed 1000 characters"],
        },
        isAnonymous: {
            type: Boolean,
            default: true, // Default to anonymous
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Ensure one rating per appointment
ratingSchema.index({ appointment: 1 }, { unique: true });

// Indexes for efficient queries
ratingSchema.index({ doctor: 1 });
ratingSchema.index({ patient: 1 });
ratingSchema.index({ rating: 1 });
ratingSchema.index({ createdAt: -1 });

// Virtual for formatted date
ratingSchema.virtual("formattedDate").get(function () {
    return this.createdAt.toLocaleDateString();
});

// Ensure virtual fields are serialized
ratingSchema.set("toJSON", { virtuals: true });

const Rating = mongoose.model<IRating>("Rating", ratingSchema);

export default Rating;
