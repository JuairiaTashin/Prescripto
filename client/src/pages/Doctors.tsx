import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { doctorAPI } from "../services/api";
import { toast } from "react-hot-toast";
import type { User } from "../store/authStore";
import {
	FiSearch,
	FiFilter,
	FiMapPin,
	FiClock,
	FiDollarSign,
	FiStar,
	FiUser,
} from "react-icons/fi";

const specialties = [
	"All Specialties",
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

const Doctors = () => {
	const [searchParams, setSearchParams] = useSearchParams();
	const [doctors, setDoctors] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState(
		searchParams.get("search") || ""
	);
	const [selectedSpecialty, setSelectedSpecialty] = useState(
		searchParams.get("specialty") || "All Specialties"
	);
	const [showFilters, setShowFilters] = useState(false);

	const fetchDoctors = async () => {
		setLoading(true);
		try {
			const params: any = {};
			if (selectedSpecialty && selectedSpecialty !== "All Specialties") {
				params.specialty = selectedSpecialty;
			}
			if (searchTerm) {
				params.search = searchTerm;
			}

			const response = await doctorAPI.getDoctors(params);
			setDoctors(response.data.data.doctors);
		} catch (error: any) {
			toast.error("Failed to fetch doctors");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchDoctors();
	}, [selectedSpecialty, searchTerm]);

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		const params = new URLSearchParams();
		if (searchTerm) params.set("search", searchTerm);
		if (selectedSpecialty && selectedSpecialty !== "All Specialties") {
			params.set("specialty", selectedSpecialty);
		}
		setSearchParams(params);
		fetchDoctors();
	};

	const handleSpecialtyChange = (specialty: string) => {
		setSelectedSpecialty(specialty);
		const params = new URLSearchParams();
		if (searchTerm) params.set("search", searchTerm);
		if (specialty && specialty !== "All Specialties") {
			params.set("specialty", specialty);
		}
		setSearchParams(params);
	};

	const getProfileImageUrl = (profilePicture: string) => {
		if (!profilePicture)
			return "https://via.placeholder.com/150/4F46E5/FFFFFF?text=Dr";
		return profilePicture.startsWith("http")
			? profilePicture
			: `http://localhost:5000/${profilePicture}`;
	};

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-4">
						Find Doctors
					</h1>
					<p className="text-gray-600">
						Search for qualified doctors by specialty or name
					</p>
				</div>

				<div className="bg-white rounded-lg shadow-sm p-6 mb-8">
					<form
						onSubmit={handleSearch}
						className="flex flex-col md:flex-row gap-4"
					>
						<div className="flex-1 relative">
							<FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
							<input
								type="text"
								placeholder="Search doctors by name, specialty, or degree..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>
						<button
							type="button"
							onClick={() => setShowFilters(!showFilters)}
							className="md:hidden flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
						>
							<FiFilter className="w-4 h-4" />
							Filters
						</button>
						<button
							type="submit"
							className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
						>
							Search
						</button>
					</form>

					<div
						className={`mt-6 ${
							showFilters ? "block" : "hidden md:block"
						}`}
					>
						<div className="flex flex-wrap gap-2">
							{specialties.map((specialty) => (
								<button
									key={specialty}
									onClick={() =>
										handleSpecialtyChange(specialty)
									}
									className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
										selectedSpecialty === specialty
											? "bg-blue-600 text-white"
											: "bg-gray-100 text-gray-700 hover:bg-gray-200"
									}`}
								>
									{specialty}
								</button>
							))}
						</div>
					</div>
				</div>

				{loading ? (
					<div className="flex justify-center items-center py-12">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{doctors.length > 0 ? (
							doctors.map((doctor) => (
								<div
									key={doctor._id}
									className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200"
								>
									<div className="p-6">
										<div className="flex items-start space-x-4 mb-4">
											<div className="relative">
												<img
													src={getProfileImageUrl(
														doctor.profilePicture
													)}
													alt={doctor.name}
													className="w-20 h-20 rounded-full object-cover border-3 border-white shadow-md"
												/>
												{doctor.isVerified && (
													<div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1">
														<FiStar className="w-3 h-3" />
													</div>
												)}
											</div>
											<div className="flex-1 min-w-0">
												<h3 className="text-xl font-bold text-gray-900 mb-1 truncate">
													Dr. {doctor.name}
												</h3>
												<p className="text-blue-600 font-semibold text-sm mb-1">
													{doctor.specialty}
												</p>
												<p className="text-gray-600 text-sm truncate">
													{doctor.degree}
												</p>
											</div>
										</div>

										<div className="space-y-2 mb-4">
											<div className="flex items-center text-sm text-gray-600">
												<FiUser className="w-4 h-4 mr-2 text-blue-500" />
												<span>
													{doctor.experience} years
													experience
												</span>
											</div>
											<div className="flex items-center text-sm text-gray-600">
												<FiMapPin className="w-4 h-4 mr-2 text-blue-500" />
												<span className="truncate">
													{doctor.address}
												</span>
											</div>
											{doctor.availableHours && (
												<div className="flex items-center text-sm text-gray-600">
													<FiClock className="w-4 h-4 mr-2 text-blue-500" />
													<span>
														{
															doctor
																.availableHours
																.start
														}{" "}
														-{" "}
														{
															doctor
																.availableHours
																.end
														}
													</span>
												</div>
											)}
											<div className="flex items-center text-sm text-gray-600">
												<FiDollarSign className="w-4 h-4 mr-2 text-blue-500" />
												<span>
													৳{doctor.consultationFee}
												</span>
											</div>
										</div>

										{doctor.bio && (
											<p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
												{doctor.bio}
											</p>
										)}

										<div className="flex items-center justify-between pt-4 border-t border-gray-100">
											{doctor.isVerified ? (
												<div className="flex items-center text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">
													<FiStar className="w-4 h-4 mr-1" />
													<span className="font-medium">
														Verified
													</span>
												</div>
											) : (
												<div></div>
											)}
											<Link
												to={`/doctors/${doctor._id}`}
												className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
											>
												View Profile
											</Link>
										</div>
									</div>
								</div>
							))
						) : (
							<div className="col-span-full text-center py-12">
								<FiUser className="w-16 h-16 text-gray-400 mx-auto mb-4" />
								<h3 className="text-lg font-medium text-gray-900 mb-2">
									No doctors found
								</h3>
								<p className="text-gray-600">
									Try adjusting your search criteria or
									specialty filter.
								</p>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default Doctors;
