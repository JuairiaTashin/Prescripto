import mongoose, { Document, Schema } from "mongoose";

export interface IPayment extends Document {
    appointment: mongoose.Types.ObjectId;
    patient: mongoose.Types.ObjectId;
    doctor: mongoose.Types.ObjectId;
    amount: number;
    paymentMethod?: "bkash" | "card" | "aamarPay";
    status: "pending" | "completed" | "failed" | "expired";
    
    // Payment method specific fields
    bkashDetails?: {
        phoneNumber: string;
        transactionId: string;
    };
    cardDetails?: {
        cardNumber: string;
        cardholderName: string;
        expiryDate: string;
        cvv: string;
    };
    aamarPayDetails?: {
        transactionId: string;
        gatewayResponse: any;
    };
    
    // Payment processing
    paymentDeadline: Date;
    completedAt?: Date;
    failedAt?: Date;
    failureReason?: string;
    
    // Audit fields
    createdAt: Date;
    updatedAt: Date;
}

const paymentSchema: Schema<IPayment> = new Schema(
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
        amount: {
            type: Number,
            required: [true, "Payment amount is required"],
            min: [0, "Amount cannot be negative"],
        },
        paymentMethod: {
            type: String,
            enum: ["bkash", "card", "aamarPay"],
        },
        status: {
            type: String,
            enum: ["pending", "completed", "failed", "expired"],
            default: "pending",
        },
        
        // bKash specific fields
        bkashDetails: {
            phoneNumber: {
                type: String,
                validate: {
                    validator: function(this: IPayment) {
                        return this.paymentMethod !== "bkash" || (this.bkashDetails?.phoneNumber && this.bkashDetails?.transactionId);
                    },
                    message: "Phone number and transaction ID are required for bKash payments",
                },
            },
            transactionId: {
                type: String,
                trim: true,
            },
        },
        
        // Card specific fields
        cardDetails: {
            cardNumber: {
                type: String,
                validate: {
                    validator: function(this: IPayment) {
                        return this.paymentMethod !== "card" || (this.cardDetails?.cardNumber && this.cardDetails?.cardholderName && this.cardDetails?.expiryDate && this.cardDetails?.cvv);
                    },
                    message: "All card details are required for card payments",
                },
            },
            cardholderName: {
                type: String,
                trim: true,
            },
            expiryDate: {
                type: String,
                trim: true,
            },
            cvv: {
                type: String,
                trim: true,
            },
        },
        
        // aamarPay specific fields
        aamarPayDetails: {
            transactionId: {
                type: String,
                trim: true,
            },
            gatewayResponse: {
                type: Schema.Types.Mixed,
            },
        },
        
        // Payment processing
        paymentDeadline: {
            type: Date,
            required: [true, "Payment deadline is required"],
        },
        completedAt: {
            type: Date,
        },
        failedAt: {
            type: Date,
        },
        failureReason: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Indexes for efficient queries
paymentSchema.index({ appointment: 1 }, { unique: true });
paymentSchema.index({ patient: 1, status: 1 });
paymentSchema.index({ doctor: 1, status: 1 });
paymentSchema.index({ status: 1, paymentDeadline: 1 });
paymentSchema.index({ paymentMethod: 1, status: 1 });
paymentSchema.index({ createdAt: -1 });

// Pre-save middleware to set payment deadline if not provided
paymentSchema.pre("save", function(next) {
    if (!this.paymentDeadline && this.appointment) {
        // This will be set when creating payment from appointment
        next();
    } else {
        next();
    }
});

// Method to check if payment is expired
paymentSchema.methods.isExpired = function(): boolean {
    return new Date() > this.paymentDeadline && this.status === "pending";
};

// Method to mark payment as expired
paymentSchema.methods.markAsExpired = function(): void {
    this.status = "expired";
    this.failedAt = new Date();
    this.failureReason = "Payment deadline expired";
};

const Payment = mongoose.model<IPayment>("Payment", paymentSchema);

export default Payment;
