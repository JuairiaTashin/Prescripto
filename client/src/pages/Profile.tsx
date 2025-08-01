import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { authAPI } from "../services/api";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import {
	FiUser,
	FiMail,
	FiPhone,
	FiMapPin,
	FiEdit2,
	FiSave,
	FiX,
	FiUpload,
	FiCalendar,
	FiAward,
	FiClock,
	FiDollarSign,
	FiEye,
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

const Profile = () => {
	const { user, updateUser } = useAuthStore();
	const [isEditing, setIsEditing] = useState(false);
	const [loading, setLoading] = useState(false);
	const [formData, setFormData] = useState({
		name: "",
		phone: "",
		address: "",
		dateOfBirth: "",
		gender: "",
		specialty: "",
		experience: "",
		degree: "",
		consultationFee: "",
		bio: "",
		availableHours: {
			start: "",
			end: "",
		},
	});
	const [profilePicture, setProfilePicture] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string>("");

	useEffect(() => {
		if (user) {
			setFormData({
				name: user.name || "",
				phone: user.phone || "",
				address: user.address || "",
				dateOfBirth: user.dateOfBirth
					? user.dateOfBirth.split("T")[0]
					: "",
				gender: user.gender || "",
				specialty: user.specialty || "",
				experience: user.experience?.toString() || "",
				degree: user.degree || "",
				consultationFee: user.consultationFee?.toString() || "",
				bio: user.bio || "",
				availableHours: {
					start: user.availableHours?.start || "",
					end: user.availableHours?.end || "",
				},
			});
		}
	}, [user]);

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

		try {
			const submitData = new FormData();
			submitData.append("name", formData.name);
			submitData.append("phone", formData.phone);
			submitData.append("address", formData.address);

			if (formData.dateOfBirth)
				submitData.append("dateOfBirth", formData.dateOfBirth);
			if (formData.gender) submitData.append("gender", formData.gender);

			if (profilePicture) {
				submitData.append("profilePicture", profilePicture);
			}

			if (user?.role === "doctor") {
				if (formData.specialty)
					submitData.append("specialty", formData.specialty);
				if (formData.experience)
					submitData.append("experience", formData.experience);
				if (formData.degree)
					submitData.append("degree", formData.degree);
				if (formData.consultationFee)
					submitData.append(
						"consultationFee",
						formData.consultationFee
					);
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

			const response = await authAPI.updateProfile(submitData);
			updateUser(response.data.data);
			toast.success("Profile updated successfully!");
			setIsEditing(false);
			setProfilePicture(null);
			setPreviewUrl("");
		} catch (error: any) {
			toast.error(
				error.response?.data?.message || "Profile update failed"
			);
		} finally {
			setLoading(false);
		}
	};

	const getProfileImageUrl = () => {
		if (previewUrl) return previewUrl;
		if (user?.profilePicture) {
			return user.profilePicture.startsWith("http")
				? user.profilePicture
				: `http://localhost:5000/${user.profilePicture}`;
		}
		return user?.role === "doctor"
			? "https://via.placeholder.com/150/4F46E5/FFFFFF?text=Dr"
			: "https://via.placeholder.com/150/6B7280/FFFFFF?text=User";
	};

	if (!user) {
		return (
			<div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
				<div className="max-w-md mx-auto text-center">
					<p className="text-gray-600">
						Please log in to view your profile.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-4xl mx-auto">
				<div className="bg-white shadow-lg rounded-lg overflow-hidden">
					<div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
						<div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
							<div className="relative">
								<img
									src={getProfileImageUrl()}
									alt={user.name}
									className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
								/>
								{isEditing && (
									<label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 shadow-lg">
										<FiUpload className="w-4 h-4" />
										<input
											title="Upload Profile Picture"
											type="file"
											accept="image/*"
											onChange={handleFileChange}
											className="hidden"
										/>
									</label>
								)}
							</div>
							<div className="text-center sm:text-left">
								<h1 className="text-2xl font-bold text-white">
									{user.name}
								</h1>
								<p className="text-blue-100 capitalize">
									{user.role}
								</p>
								{user.role === "doctor" && user.specialty && (
									<p className="text-blue-200">
										{user.specialty}
									</p>
								)}
							</div>
							<div className="sm:ml-auto">
								{!isEditing ? (
									<div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
										<button
											onClick={() => setIsEditing(true)}
											className="flex items-center space-x-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
										>
											<FiEdit2 className="w-4 h-4" />
											<span>Edit Profile</span>
										</button>
										{user.role === "doctor" && (
											<Link
												to={`/doctors/${user._id}`}
												className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors"
											>
												<FiEye className="w-4 h-4" />
												<span>Preview Public</span>
											</Link>
										)}
									</div>
								) : (
									<div className="flex space-x-2">
										<button
											onClick={handleSubmit}
											disabled={loading}
											className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
										>
											<FiSave className="w-4 h-4" />
											<span>
												{loading ? "Saving..." : "Save"}
											</span>
										</button>
										<button
											onClick={() => {
												setIsEditing(false);
												setProfilePicture(null);
												setPreviewUrl("");
											}}
											className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
										>
											<FiX className="w-4 h-4" />
											<span>Cancel</span>
										</button>
									</div>
								)}
							</div>
						</div>
					</div>

					<div className="p-6">
						<form onSubmit={handleSubmit}>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										<FiUser className="inline w-4 h-4 mr-2" />
										Full Name
									</label>
									{isEditing ? (
										<input
											title="Full Name"
											type="text"
											name="name"
											value={formData.name}
											onChange={handleChange}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									) : (
										<p className="px-3 py-2 bg-gray-50 rounded-lg">
											{user.name}
										</p>
									)}
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										<FiMail className="inline w-4 h-4 mr-2" />
										Email
									</label>
									<p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-600">
										{user.email}
									</p>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										<FiPhone className="inline w-4 h-4 mr-2" />
										Phone
									</label>
									{isEditing ? (
										<input
											title="Phone Number"
											type="tel"
											name="phone"
											value={formData.phone}
											onChange={handleChange}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									) : (
										<p className="px-3 py-2 bg-gray-50 rounded-lg">
											{user.phone}
										</p>
									)}
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										<FiCalendar className="inline w-4 h-4 mr-2" />
										Date of Birth
									</label>
									{isEditing ? (
										<input
											title="Date of Birth"
											type="date"
											name="dateOfBirth"
											value={formData.dateOfBirth}
											onChange={handleChange}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									) : (
										<p className="px-3 py-2 bg-gray-50 rounded-lg">
											{user.dateOfBirth
												? new Date(
														user.dateOfBirth
												  ).toLocaleDateString()
												: "Not specified"}
										</p>
									)}
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Gender
									</label>
									{isEditing ? (
										<select
											title="Gender"
											name="gender"
											value={formData.gender}
											onChange={handleChange}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
										>
											<option value="">
												Select gender
											</option>
											<option value="male">Male</option>
											<option value="female">
												Female
											</option>
											<option value="other">Other</option>
										</select>
									) : (
										<p className="px-3 py-2 bg-gray-50 rounded-lg capitalize">
											{user.gender || "Not specified"}
										</p>
									)}
								</div>

								<div className="md:col-span-2">
									<label className="block text-sm font-medium text-gray-700 mb-2">
										<FiMapPin className="inline w-4 h-4 mr-2" />
										Address
									</label>
									{isEditing ? (
										<input
											title="Address"
											type="text"
											name="address"
											value={formData.address}
											onChange={handleChange}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									) : (
										<p className="px-3 py-2 bg-gray-50 rounded-lg">
											{user.address}
										</p>
									)}
								</div>

								{user.role === "doctor" && (
									<>
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">
												<FiAward className="inline w-4 h-4 mr-2" />
												Specialty
											</label>
											{isEditing ? (
												<select
													title="Specialty"
													name="specialty"
													value={formData.specialty}
													onChange={handleChange}
													className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
												>
													<option value="">
														Select specialty
													</option>
													{specialties.map(
														(specialty) => (
															<option
																key={specialty}
																value={
																	specialty
																}
															>
																{specialty}
															</option>
														)
													)}
												</select>
											) : (
												<p className="px-3 py-2 bg-gray-50 rounded-lg">
													{user.specialty}
												</p>
											)}
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">
												Experience (years)
											</label>
											{isEditing ? (
												<input
													title="Experience"
													type="number"
													name="experience"
													value={formData.experience}
													onChange={handleChange}
													min="0"
													className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
												/>
											) : (
												<p className="px-3 py-2 bg-gray-50 rounded-lg">
													{user.experience} years
												</p>
											)}
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">
												Degree
											</label>
											{isEditing ? (
												<input
													title="Degree"
													type="text"
													name="degree"
													value={formData.degree}
													onChange={handleChange}
													className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
												/>
											) : (
												<p className="px-3 py-2 bg-gray-50 rounded-lg">
													{user.degree}
												</p>
											)}
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">
												BMDC Number
											</label>
											<p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-600">
												{user.bmdc}
											</p>
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">
												<FiDollarSign className="inline w-4 h-4 mr-2" />
												Consultation Fee (BDT)
											</label>
											{isEditing ? (
												<input
													title="Consultation Fee"
													type="number"
													name="consultationFee"
													value={
														formData.consultationFee
													}
													onChange={handleChange}
													min="0"
													className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
												/>
											) : (
												<p className="px-3 py-2 bg-gray-50 rounded-lg">
													৳{user.consultationFee}
												</p>
											)}
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">
												<FiClock className="inline w-4 h-4 mr-2" />
												Available Hours
											</label>
											{isEditing ? (
												<div className="grid grid-cols-2 gap-2">
													<input
														title="Available Start Time"
														type="time"
														name="availableHours.start"
														value={
															formData
																.availableHours
																.start
														}
														onChange={handleChange}
														className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
													/>
													<input
														title="Available End Time"
														type="time"
														name="availableHours.end"
														value={
															formData
																.availableHours
																.end
														}
														onChange={handleChange}
														className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
													/>
												</div>
											) : (
												<p className="px-3 py-2 bg-gray-50 rounded-lg">
													{user.availableHours
														?.start &&
													user.availableHours?.end
														? `${user.availableHours.start} - ${user.availableHours.end}`
														: "Not specified"}
												</p>
											)}
										</div>

										<div className="md:col-span-2">
											<label className="block text-sm font-medium text-gray-700 mb-2">
												Bio
											</label>
											{isEditing ? (
												<textarea
													name="bio"
													value={formData.bio}
													onChange={handleChange}
													rows={3}
													className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
													placeholder="Tell us about yourself..."
												/>
											) : (
												<p className="px-3 py-2 bg-gray-50 rounded-lg">
													{user.bio ||
														"No bio available"}
												</p>
											)}
										</div>
									</>
								)}
							</div>
						</form>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Profile;
