import mongoose, { Document, Schema } from "mongoose";

export interface IHealthTip extends Document {
    doctor: mongoose.Types.ObjectId;
    title: string;
    content: string;
    category: string;
    tags: string[];
    isPublished: boolean;
    publishedAt?: Date;
    views: number;
    likes: number;
    createdAt: Date;
    updatedAt: Date;
}

const healthTipSchema: Schema<IHealthTip> = new Schema(
    {
        doctor: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Doctor is required"],
        },
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
            maxlength: [200, "Title cannot exceed 200 characters"],
        },
        content: {
            type: String,
            required: [true, "Content is required"],
            trim: true,
        },
        category: {
            type: String,
            required: [true, "Category is required"],
            enum: [
                "General Health",
                "Nutrition",
                "Exercise",
                "Mental Health",
                "Preventive Care",
                "Disease Management",
                "Lifestyle",
                "Pediatrics",
                "Women's Health",
                "Men's Health",
                "Senior Health",
                "Other"
            ],
        },
        tags: [{
            type: String,
            trim: true,
        }],
        isPublished: {
            type: Boolean,
            default: false,
        },
        publishedAt: {
            type: Date,
        },
        views: {
            type: Number,
            default: 0,
        },
        likes: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Indexes for efficient queries
healthTipSchema.index({ doctor: 1, isPublished: 1 });
healthTipSchema.index({ category: 1, isPublished: 1 });
healthTipSchema.index({ tags: 1, isPublished: 1 });
healthTipSchema.index({ publishedAt: -1 });
healthTipSchema.index({ views: -1 });
healthTipSchema.index({ likes: -1 });

// Text search index
healthTipSchema.index({ title: "text", content: "text" });

const HealthTip = mongoose.model<IHealthTip>("HealthTip", healthTipSchema);

export default HealthTip;
