import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { appointmentAPI, ratingAPI } from "../services/api";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import {
	FiCalendar,
	FiClock,
	FiUser,
	FiFileText,
	FiCheck,
	FiX,
	FiStar,
	FiFilter,
	FiRefreshCw,
	FiSearch,
	FiDownload,
	FiEye,
	FiActivity,
} from "react-icons/fi";

interface Appointment {
	_id: string;
	patient: {
		_id: string;
		name: string;
		email: string;
		phone: string;
	};
	doctor: {
		_id: string;
		name: string;
		specialty: string;
	};
	appointmentDate: string;
	appointmentTime: string;
	appointmentSlot: string;
	status: "pending" | "confirmed" | "cancelled" | "completed" | "rescheduled";
	reason: string;
	notes?: string;
	cancellationReason?: string;
	rescheduledFrom?: string;
	rescheduledTo?: string;
	createdAt: string;
}

interface PatientRating {
	_id: string;
	appointment: {
		_id: string;
		doctor: {
			_id: string;
			name: string;
			specialty: string;
		};
		appointmentDate: string;
		reason: string;
	};
	rating: number;
	review?: string;
	createdAt: string;
}

const MedicalHistory = () => {
	const { user: currentUser } = useAuthStore();
	const [appointments, setAppointments] = useState<Appointment[]>([]);
	const [patientRatings, setPatientRatings] = useState<PatientRating[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedStatus, setSelectedStatus] = useState("all");
	const [searchTerm, setSearchTerm] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [activeTab, setActiveTab] = useState<"consultations" | "ratings">("consultations");

	useEffect(() => {
		if (currentUser?.role === "patient") {
			fetchMedicalHistory();
		}
	}, [selectedStatus, currentPage, currentUser]);

	useEffect(() => {
		if (currentUser?.role === "patient" && activeTab === "ratings") {
			fetchPatientRatings();
		}
	}, [activeTab, currentUser]);

	const fetchMedicalHistory = async () => {
		setLoading(true);
		try {
			const response = await appointmentAPI.getUserAppointments({
				status: selectedStatus,
				page: currentPage,
				limit: 20,
			});
			
			// Show all appointments including cancelled/rescheduled for medical history
			setAppointments(response.data.data.appointments);
			setTotalPages(response.data.data.pagination.totalPages);
		} catch (error: any) {
			toast.error("Failed to fetch medical history");
		} finally {
			setLoading(false);
		}
	};

	const fetchPatientRatings = async () => {
		try {
			const response = await ratingAPI.getPatientRatings({
				page: 1,
				limit: 100, // Get all ratings for history
			});
			setPatientRatings(response.data.data.ratings || []);
		} catch (error: any) {
			console.error("Failed to fetch patient ratings:", error);
			setPatientRatings([]);
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "pending":
				return "bg-yellow-100 text-yellow-800";
			case "confirmed":
				return "bg-blue-100 text-blue-800";
			case "completed":
				return "bg-green-100 text-green-800";
			case "cancelled":
				return "bg-red-100 text-red-800";
			case "rescheduled":
				return "bg-purple-100 text-purple-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "pending":
				return <FiClock className="w-4 h-4" />;
			case "confirmed":
				return <FiCheck className="w-4 h-4" />;
			case "completed":
				return <FiCheck className="w-4 h-4" />;
			case "cancelled":
				return <FiX className="w-4 h-4" />;
			case "rescheduled":
				return <FiRefreshCw className="w-4 h-4" />;
			default:
				return <FiActivity className="w-4 h-4" />;
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	const formatShortDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	const renderStars = (rating: number) => {
		return (
			<div className="flex items-center space-x-1">
				{[1, 2, 3, 4, 5].map((star) => (
					<FiStar
						key={star}
						className={`w-4 h-4 ${
							star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
						}`}
					/>
				))}
				<span className="text-sm text-gray-600 ml-1">({rating})</span>
			</div>
		);
	};

	const filteredAppointments = appointments.filter(appointment =>
		appointment.doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
		appointment.doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
		appointment.reason.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const filteredRatings = patientRatings.filter(rating =>
		rating.appointment.doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
		rating.appointment.doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
		rating.appointment.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
		(rating.review && rating.review.toLowerCase().includes(searchTerm.toLowerCase()))
	);

	const getUniqueStats = () => {
		const uniqueDoctors = new Set(appointments.map(apt => apt.doctor._id)).size;
		const completedConsultations = appointments.filter(apt => apt.status === "completed").length;
		const totalConsultations = appointments.length;
		const averageRating = patientRatings.length > 0 
			? (patientRatings.reduce((sum, rating) => sum + rating.rating, 0) / patientRatings.length).toFixed(1)
			: "N/A";

		return { uniqueDoctors, completedConsultations, totalConsultations, averageRating };
	};

	if (currentUser?.role !== "patient") {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
					<p className="text-gray-600">Only patients can view medical history.</p>
				</div>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	const stats = getUniqueStats();

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-4">
						Medical History
					</h1>
					<p className="text-gray-600">
						Complete record of your consultations, treatments, and healthcare journey
					</p>
				</div>

				{/* Statistics Cards */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
					<div className="bg-white rounded-lg shadow-sm p-6">
						<div className="flex items-center">
							<div className="p-3 rounded-full bg-blue-100">
								<FiUser className="w-6 h-6 text-blue-600" />
							</div>
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-600">Unique Doctors</p>
								<p className="text-2xl font-bold text-gray-900">{stats.uniqueDoctors}</p>
							</div>
						</div>
					</div>
					<div className="bg-white rounded-lg shadow-sm p-6">
						<div className="flex items-center">
							<div className="p-3 rounded-full bg-green-100">
								<FiCheck className="w-6 h-6 text-green-600" />
							</div>
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-600">Completed</p>
								<p className="text-2xl font-bold text-gray-900">{stats.completedConsultations}</p>
							</div>
						</div>
					</div>
					<div className="bg-white rounded-lg shadow-sm p-6">
						<div className="flex items-center">
							<div className="p-3 rounded-full bg-purple-100">
								<FiCalendar className="w-6 h-6 text-purple-600" />
							</div>
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-600">Total Consultations</p>
								<p className="text-2xl font-bold text-gray-900">{stats.totalConsultations}</p>
							</div>
						</div>
					</div>
					<div className="bg-white rounded-lg shadow-sm p-6">
						<div className="flex items-center">
							<div className="p-3 rounded-full bg-yellow-100">
								<FiStar className="w-6 h-6 text-yellow-600" />
							</div>
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-600">Average Rating</p>
								<p className="text-2xl font-bold text-gray-900">{stats.averageRating}</p>
							</div>
						</div>
					</div>
				</div>

				{/* Tabs */}
				<div className="bg-white rounded-lg shadow-sm mb-8">
					<div className="border-b border-gray-200">
						<nav className="-mb-px flex space-x-8 px-6">
							<button
								onClick={() => setActiveTab("consultations")}
								className={`py-4 px-1 border-b-2 font-medium text-sm ${
									activeTab === "consultations"
										? "border-blue-500 text-blue-600"
										: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
								}`}
							>
								<FiCalendar className="w-4 h-4 inline-block mr-2" />
								Consultation History
							</button>
							<button
								onClick={() => setActiveTab("ratings")}
								className={`py-4 px-1 border-b-2 font-medium text-sm ${
									activeTab === "ratings"
										? "border-blue-500 text-blue-600"
										: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
								}`}
							>
								<FiStar className="w-4 h-4 inline-block mr-2" />
								My Ratings & Reviews
							</button>
						</nav>
					</div>

					{/* Filters and Search */}
					<div className="p-6 border-b border-gray-200">
						<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
							<div className="flex items-center space-x-4">
								<div className="relative">
									<FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
									<input
										type="text"
										placeholder="Search doctors, specialties, or reasons..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
									/>
								</div>
								{activeTab === "consultations" && (
									<div className="flex items-center space-x-2">
										<FiFilter className="w-4 h-4 text-gray-400" />
										<select
											value={selectedStatus}
											onChange={(e) => {
												setSelectedStatus(e.target.value);
												setCurrentPage(1);
											}}
											className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
										>
											<option value="all">All Status</option>
											<option value="completed">Completed</option>
											<option value="cancelled">Cancelled</option>
											<option value="pending">Pending</option>
											<option value="confirmed">Confirmed</option>
										</select>
									</div>
								)}
							</div>
							<button
								onClick={activeTab === "consultations" ? fetchMedicalHistory : fetchPatientRatings}
								className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
							>
								<FiRefreshCw className="w-4 h-4" />
								Refresh
							</button>
						</div>
					</div>
				</div>

				{/* Content */}
				{activeTab === "consultations" ? (
					/* Consultation History */
					filteredAppointments.length > 0 ? (
						<div className="space-y-6">
							{filteredAppointments.map((appointment) => (
								<div
									key={appointment._id}
									className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
								>
									<div className="p-6">
										<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
											<div className="flex-1">
												<div className="flex items-start justify-between mb-4">
													<div>
														<h3 className="text-lg font-semibold text-gray-900 mb-1">
															Dr. {appointment.doctor.name}
														</h3>
														<p className="text-blue-600 font-medium">
															{appointment.doctor.specialty}
														</p>
													</div>
													<div className="flex items-center space-x-2">
														<span
															className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
																appointment.status
															)}`}
														>
															{getStatusIcon(appointment.status)}
															<span className="ml-1 capitalize">
																{appointment.status}
															</span>
														</span>
													</div>
												</div>

												<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
													<div className="flex items-center space-x-3">
														<FiCalendar className="w-4 h-4 text-gray-400" />
														<span className="text-sm text-gray-600">
															{formatDate(appointment.appointmentDate)}
														</span>
													</div>
													<div className="flex items-center space-x-3">
														<FiClock className="w-4 h-4 text-gray-400" />
														<span className="text-sm text-gray-600">
															{appointment.appointmentTime} (3 min consultation)
														</span>
													</div>
												</div>

												<div className="space-y-2">
													<div className="flex items-start space-x-3">
														<FiFileText className="w-4 h-4 text-gray-400 mt-1" />
														<div>
															<p className="text-sm font-medium text-gray-900">
																Reason for Visit:
															</p>
															<p className="text-sm text-gray-600">
																{appointment.reason}
															</p>
														</div>
													</div>
													{appointment.notes && (
														<div className="flex items-start space-x-3">
															<FiFileText className="w-4 h-4 text-gray-400 mt-1" />
															<div>
																<p className="text-sm font-medium text-gray-900">
																	Notes:
																</p>
																<p className="text-sm text-gray-600">
																	{appointment.notes}
																</p>
															</div>
														</div>
													)}
													{appointment.cancellationReason && (
														<div className="flex items-start space-x-3">
															<FiX className="w-4 h-4 text-red-400 mt-1" />
															<div>
																<p className="text-sm font-medium text-red-900">
																	{appointment.cancellationReason.includes("Rescheduled") ? "Rescheduled:" : "Cancellation Reason:"}
																</p>
																<p className="text-sm text-red-600">
																	{appointment.cancellationReason}
																</p>
															</div>
														</div>
													)}
													<div className="flex items-center space-x-3">
														<FiCalendar className="w-4 h-4 text-gray-400" />
														<span className="text-xs text-gray-500">
															Booked on: {formatShortDate(appointment.createdAt)}
														</span>
													</div>
												</div>
											</div>

											{/* Action Buttons */}
											<div className="flex flex-col space-y-2">
												{appointment.status === "completed" && (
													<Link
														to={`/rating/${appointment._id}`}
														className="flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
													>
														<FiStar className="w-4 h-4" />
														Rate & Review
													</Link>
												)}
												<Link
													to={`/appointments`}
													className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
												>
													<FiEye className="w-4 h-4" />
													View Details
												</Link>
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="text-center py-12">
							<FiCalendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
							<h3 className="text-lg font-medium text-gray-900 mb-2">
								No consultation history found
							</h3>
							<p className="text-gray-600">
								{searchTerm 
									? "No consultations match your search criteria."
									: "You haven't had any consultations yet."}
							</p>
						</div>
					)
				) : (
					/* Ratings History */
					filteredRatings.length > 0 ? (
						<div className="space-y-6">
							{filteredRatings.map((rating) => (
								<div
									key={rating._id}
									className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
								>
									<div className="p-6">
										<div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
											<div className="flex-1">
												<div className="flex items-start justify-between mb-4">
													<div>
														<h3 className="text-lg font-semibold text-gray-900 mb-1">
															Dr. {rating.appointment.doctor.name}
														</h3>
														<p className="text-blue-600 font-medium">
															{rating.appointment.doctor.specialty}
														</p>
													</div>
													<div className="text-right">
														{renderStars(rating.rating)}
														<p className="text-xs text-gray-500 mt-1">
															Rated on: {formatShortDate(rating.createdAt)}
														</p>
													</div>
												</div>

												<div className="space-y-3">
													<div className="flex items-center space-x-3">
														<FiCalendar className="w-4 h-4 text-gray-400" />
														<span className="text-sm text-gray-600">
															Consultation: {formatShortDate(rating.appointment.appointmentDate)}
														</span>
													</div>
													<div className="flex items-start space-x-3">
														<FiFileText className="w-4 h-4 text-gray-400 mt-1" />
														<div>
															<p className="text-sm font-medium text-gray-900">
																Consultation Reason:
															</p>
															<p className="text-sm text-gray-600">
																{rating.appointment.reason}
															</p>
														</div>
													</div>
													{rating.review && (
														<div className="flex items-start space-x-3">
															<FiFileText className="w-4 h-4 text-gray-400 mt-1" />
															<div>
																<p className="text-sm font-medium text-gray-900">
																	Your Review:
																</p>
																<p className="text-sm text-gray-600 italic">
																	"{rating.review}"
																</p>
															</div>
														</div>
													)}
												</div>
											</div>

											{/* Action Buttons */}
											<div className="flex flex-col space-y-2">
												<Link
													to={`/rating/${rating.appointment._id}`}
													className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
												>
													<FiStar className="w-4 h-4" />
													Edit Rating
												</Link>
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="text-center py-12">
							<FiStar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
							<h3 className="text-lg font-medium text-gray-900 mb-2">
								No ratings found
							</h3>
							<p className="text-gray-600">
								{searchTerm 
									? "No ratings match your search criteria."
									: "You haven't rated any doctors yet."}
							</p>
						</div>
					)
				)}

				{/* Pagination for Consultations */}
				{activeTab === "consultations" && totalPages > 1 && (
					<div className="flex justify-center mt-8">
						<div className="flex space-x-2">
							<button
								onClick={() => setCurrentPage(currentPage - 1)}
								disabled={currentPage === 1}
								className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Previous
							</button>
							{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
								<button
									key={page}
									onClick={() => setCurrentPage(page)}
									className={`px-3 py-2 border rounded-lg text-sm font-medium ${
										currentPage === page
											? "border-blue-600 bg-blue-600 text-white"
											: "border-gray-300 text-gray-700 hover:bg-gray-50"
									}`}
								>
									{page}
								</button>
							))}
							<button
								onClick={() => setCurrentPage(currentPage + 1)}
								disabled={currentPage === totalPages}
								className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Next
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default MedicalHistory;