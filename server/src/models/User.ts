import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
	name: string;
	email: string;
	password: string;
	role: "patient" | "doctor" | "admin";
	phone: string;
	address: string;
	profilePicture: string;
	dateOfBirth?: Date;
	gender?: "male" | "female" | "other";

	specialty?: string;
	experience?: number;
	degree?: string;
	bmdc?: string;
	consultationFee?: number;
	bio?: string;
	availableHours?: {
		start: string;
		end: string;
	};
	isVerified?: boolean;
}

const userSchema: Schema<IUser> = new Schema(
	{
		name: {
			type: String,
			required: [true, "Name is required"],
			trim: true,
		},
		email: {
			type: String,
			required: [true, "Email is required"],
			unique: true,
			lowercase: true,
			trim: true,
		},
		password: {
			type: String,
			required: [true, "Password is required"],
			minlength: [6, "Password must be at least 6 characters"],
		},
		role: {
			type: String,
			enum: ["patient", "doctor", "admin"],
			required: [true, "Role is required"],
		},
		phone: {
			type: String,
			required: [true, "Phone number is required"],
		},
		address: {
			type: String,
			required: [true, "Address is required"],
		},
		profilePicture: {
			type: String,
			required: [true, "Profile picture is required"],
		},
		dateOfBirth: {
			type: Date,
		},
		gender: {
			type: String,
			enum: ["male", "female", "other"],
		},

		specialty: {
			type: String,
			enum: [
				"Physician",
				"Gynecologist",
				"Dermatologist",
				"Pediatrician",
				"Neurologist",
				"Cardiologist",
				"Orthopedic",
				"Psychiatrist",
				"Ophthalmologist",
				"ENT",
				"Urologist",
				"Gastroenterologist",
			],
			required: function (this: IUser) {
				return this.role === "doctor";
			},
		},
		experience: {
			type: Number,
			required: function (this: IUser) {
				return this.role === "doctor";
			},
		},
		degree: {
			type: String,
			required: function (this: IUser) {
				return this.role === "doctor";
			},
		},
		bmdc: {
			type: String,
			required: function (this: IUser) {
				return this.role === "doctor";
			},
			unique: true,
			sparse: true,
		},
		consultationFee: {
			type: Number,
			required: function (this: IUser) {
				return this.role === "doctor";
			},
		},
		bio: {
			type: String,
		},
		availableHours: {
			start: String,
			end: String,
		},
		isVerified: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
		versionKey: false,
	}
);

const User = mongoose.model<IUser>("User", userSchema);

export default User;
