import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { authAPI } from "../services/api";
import { toast } from "react-hot-toast";
import {
	FiUser,
	FiMail,
	FiLock,
	FiPhone,
	FiMapPin,
	FiUpload,
	FiEye,
	FiEyeOff,
} from "react-icons/fi";

const specialties = [
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
];

const Register = () => {
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		password: "",
		confirmPassword: "",
		role: "patient" as "patient" | "doctor",
		phone: "",
		address: "",
		dateOfBirth: "",
		gender: "",
		specialty: "",
		experience: "",
		degree: "",
		bmdc: "",
		consultationFee: "",
		bio: "",
		availableHours: {
			start: "",
			end: "",
		},
	});
	const [profilePicture, setProfilePicture] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string>("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const { login } = useAuthStore();
	const navigate = useNavigate();

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>
	) => {
		const { name, value } = e.target;

		if (name.includes("availableHours.")) {
			const field = name.split(".")[1];
			setFormData({
				...formData,
				availableHours: {
					...formData.availableHours,
					[field]: value,
				},
			});
		} else {
			setFormData({
				...formData,
				[name]: value,
			});
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setProfilePicture(file);
			const url = URL.createObjectURL(file);
			setPreviewUrl(url);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		if (formData.password !== formData.confirmPassword) {
			toast.error("Passwords don't match");
			setLoading(false);
			return;
		}

		if (!profilePicture) {
			toast.error("Profile picture is required");
			setLoading(false);
			return;
		}

		try {
			const submitData = new FormData();
			submitData.append("name", formData.name);
			submitData.append("email", formData.email);
			submitData.append("password", formData.password);
			submitData.append("role", formData.role);
			submitData.append("phone", formData.phone);
			submitData.append("address", formData.address);
			submitData.append("profilePicture", profilePicture);

			if (formData.dateOfBirth)
				submitData.append("dateOfBirth", formData.dateOfBirth);
			if (formData.gender) submitData.append("gender", formData.gender);

			if (formData.role === "doctor") {
				submitData.append("specialty", formData.specialty);
				submitData.append("experience", formData.experience);
				submitData.append("degree", formData.degree);
				submitData.append("bmdc", formData.bmdc);
				submitData.append("consultationFee", formData.consultationFee);
				if (formData.bio) submitData.append("bio", formData.bio);
				if (
					formData.availableHours.start &&
					formData.availableHours.end
				) {
					submitData.append(
						"availableHours",
						JSON.stringify(formData.availableHours)
					);
				}
			}

			const response = await authAPI.register(submitData);
			const { user, token } = response.data.data;

			login(user, token);
			toast.success("Registration successful!");
			navigate("/");
		} catch (error: any) {
			toast.error(error.response?.data?.message || "Registration failed");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-2xl mx-auto">
				<h2 className="text-center text-3xl font-bold text-gray-900 mb-8">
					Create your account
				</h2>

				<div className="bg-white shadow-lg rounded-lg p-6">
					<form onSubmit={handleSubmit} className="space-y-6">
						<div className="flex justify-center mb-6">
							<div className="flex space-x-4">
								<button
									type="button"
									onClick={() =>
										setFormData({
											...formData,
											role: "patient",
										})
									}
									className={`px-6 py-2 rounded-lg font-medium ${
										formData.role === "patient"
											? "bg-blue-600 text-white"
											: "bg-gray-200 text-gray-700 hover:bg-gray-300"
									}`}
								>
									Patient
								</button>
								<button
									type="button"
									onClick={() =>
										setFormData({
											...formData,
											role: "doctor",
										})
									}
									className={`px-6 py-2 rounded-lg font-medium ${
										formData.role === "doctor"
											? "bg-blue-600 text-white"
											: "bg-gray-200 text-gray-700 hover:bg-gray-300"
									}`}
								>
									Doctor
								</button>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label
									htmlFor="name"
									className="block text-sm font-medium text-gray-700"
								>
									Full Name *
								</label>
								<div className="mt-1 relative">
									<input
										id="name"
										name="name"
										type="text"
										required
										value={formData.name}
										onChange={handleChange}
										className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
										placeholder="Enter your full name"
									/>
									<FiUser className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
								</div>
							</div>

							<div>
								<label
									htmlFor="email"
									className="block text-sm font-medium text-gray-700"
								>
									Email *
								</label>
								<div className="mt-1 relative">
									<input
										id="email"
										name="email"
										type="email"
										required
										value={formData.email}
										onChange={handleChange}
										className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
										placeholder="Enter your email"
									/>
									<FiMail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
								</div>
							</div>

							<div>
								<label
									htmlFor="password"
									className="block text-sm font-medium text-gray-700"
								>
									Password *
								</label>
								<div className="mt-1 relative">
									<input
										id="password"
										name="password"
										type={
											showPassword ? "text" : "password"
										}
										required
										value={formData.password}
										onChange={handleChange}
										className="appearance-none block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
										placeholder="Enter your password"
									/>
									<FiLock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
									<button
										type="button"
										onClick={() =>
											setShowPassword(!showPassword)
										}
										className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 hover:text-gray-600"
									>
										{showPassword ? (
											<FiEyeOff />
										) : (
											<FiEye />
										)}
									</button>
								</div>
							</div>

							<div>
								<label
									htmlFor="confirmPassword"
									className="block text-sm font-medium text-gray-700"
								>
									Confirm Password *
								</label>
								<div className="mt-1 relative">
									<input
										id="confirmPassword"
										name="confirmPassword"
										type={
											showConfirmPassword
												? "text"
												: "password"
										}
										required
										value={formData.confirmPassword}
										onChange={handleChange}
										className="appearance-none block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
										placeholder="Confirm your password"
									/>
									<FiLock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
									<button
										type="button"
										onClick={() =>
											setShowConfirmPassword(
												!showConfirmPassword
											)
										}
										className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 hover:text-gray-600"
									>
										{showConfirmPassword ? (
											<FiEyeOff />
										) : (
											<FiEye />
										)}
									</button>
								</div>
							</div>

							<div>
								<label
									htmlFor="phone"
									className="block text-sm font-medium text-gray-700"
								>
									Phone Number *
								</label>
								<div className="mt-1 relative">
									<input
										id="phone"
										name="phone"
										type="tel"
										required
										value={formData.phone}
										onChange={handleChange}
										className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
										placeholder="Enter your phone number"
									/>
									<FiPhone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
								</div>
							</div>

							<div>
								<label
									htmlFor="dateOfBirth"
									className="block text-sm font-medium text-gray-700"
								>
									Date of Birth
								</label>
								<input
									id="dateOfBirth"
									name="dateOfBirth"
									type="date"
									value={formData.dateOfBirth}
									onChange={handleChange}
									className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								/>
							</div>

							<div>
								<label
									htmlFor="gender"
									className="block text-sm font-medium text-gray-700"
								>
									Gender
								</label>
								<select
									id="gender"
									name="gender"
									value={formData.gender}
									onChange={handleChange}
									className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								>
									<option value="">Select gender</option>
									<option value="male">Male</option>
									<option value="female">Female</option>
									<option value="other">Other</option>
								</select>
							</div>
						</div>

						<div>
							<label
								htmlFor="address"
								className="block text-sm font-medium text-gray-700"
							>
								Address *
							</label>
							<div className="mt-1 relative">
								<input
									id="address"
									name="address"
									type="text"
									required
									value={formData.address}
									onChange={handleChange}
									className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
									placeholder="Enter your address"
								/>
								<FiMapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
							</div>
						</div>

						{formData.role === "doctor" && (
							<>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div>
										<label
											htmlFor="specialty"
											className="block text-sm font-medium text-gray-700"
										>
											Specialty *
										</label>
										<select
											id="specialty"
											name="specialty"
											required
											value={formData.specialty}
											onChange={handleChange}
											className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
										>
											<option value="">
												Select specialty
											</option>
											{specialties.map((specialty) => (
												<option
													key={specialty}
													value={specialty}
												>
													{specialty}
												</option>
											))}
										</select>
									</div>

									<div>
										<label
											htmlFor="experience"
											className="block text-sm font-medium text-gray-700"
										>
											Experience (years) *
										</label>
										<input
											id="experience"
											name="experience"
											type="number"
											required
											min="0"
											value={formData.experience}
											onChange={handleChange}
											className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
											placeholder="Years of experience"
										/>
									</div>

									<div>
										<label
											htmlFor="degree"
											className="block text-sm font-medium text-gray-700"
										>
											Degree *
										</label>
										<input
											id="degree"
											name="degree"
											type="text"
											required
											value={formData.degree}
											onChange={handleChange}
											className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
											placeholder="MBBS, MD, etc."
										/>
									</div>

									<div>
										<label
											htmlFor="bmdc"
											className="block text-sm font-medium text-gray-700"
										>
											BMDC Number *
										</label>
										<input
											id="bmdc"
											name="bmdc"
											type="text"
											required
											value={formData.bmdc}
											onChange={handleChange}
											className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
											placeholder="BMDC registration number"
										/>
									</div>

									<div>
										<label
											htmlFor="consultationFee"
											className="block text-sm font-medium text-gray-700"
										>
											Consultation Fee (BDT) *
										</label>
										<input
											id="consultationFee"
											name="consultationFee"
											type="number"
											required
											min="0"
											value={formData.consultationFee}
											onChange={handleChange}
											className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
											placeholder="Consultation fee"
										/>
									</div>

									<div className="grid grid-cols-2 gap-2">
										<div>
											<label
												htmlFor="availableHours.start"
												className="block text-sm font-medium text-gray-700"
											>
												Available From
											</label>
											<input
												id="availableHours.start"
												name="availableHours.start"
												type="time"
												value={
													formData.availableHours
														.start
												}
												onChange={handleChange}
												className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
											/>
										</div>
										<div>
											<label
												htmlFor="availableHours.end"
												className="block text-sm font-medium text-gray-700"
											>
												Available To
											</label>
											<input
												id="availableHours.end"
												name="availableHours.end"
												type="time"
												value={
													formData.availableHours.end
												}
												onChange={handleChange}
												className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
											/>
										</div>
									</div>
								</div>

								<div>
									<label
										htmlFor="bio"
										className="block text-sm font-medium text-gray-700"
									>
										Bio
									</label>
									<textarea
										id="bio"
										name="bio"
										rows={3}
										value={formData.bio}
										onChange={handleChange}
										className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
										placeholder="Tell us about yourself..."
									/>
								</div>
							</>
						)}

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Profile Picture *
							</label>
							<div className="flex items-center space-x-6">
								{previewUrl && (
									<img
										src={previewUrl}
										alt="Preview"
										className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
									/>
								)}
								<div className="flex-1">
									<label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
										<FiUpload className="w-5 h-5 mr-2" />
										Choose file
										<input
											type="file"
											accept="image/*"
											onChange={handleFileChange}
											className="hidden"
											required
										/>
									</label>
									<p className="text-xs text-gray-500 mt-1">
										JPG, PNG, GIF up to 5MB
									</p>
								</div>
							</div>
						</div>

						<button
							type="submit"
							disabled={loading}
							className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{loading ? "Creating account..." : "Create account"}
						</button>

						<div className="text-center">
							<span className="text-sm text-gray-600">
								Already have an account?{" "}
								<Link
									to="/login"
									className="font-medium text-blue-600 hover:text-blue-500"
								>
									Sign in
								</Link>
							</span>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};

export default Register;
