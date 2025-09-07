import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { appointmentAPI, paymentAPI, doctorAPI } from "../services/api";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import RescheduleModal from "../components/RescheduleModal";
import {
	FiCalendar,
	FiClock,
	FiUser,
	FiFileText,
	FiX,
	FiEdit3,
	FiCheck,
	FiAlertCircle,
	FiFilter,
	FiRefreshCw,
	FiMessageSquare,
	FiCreditCard,
	FiStar,
	FiInfo,
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

const AppointmentList = () => {
	const { user: currentUser } = useAuthStore();
	const [appointments, setAppointments] = useState<Appointment[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedStatus, setSelectedStatus] = useState("all");
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [showCancelModal, setShowCancelModal] = useState(false);
	const [showRescheduleModal, setShowRescheduleModal] = useState(false);
	const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
	const [cancellationReason, setCancellationReason] = useState("");
	const [rescheduleData, setRescheduleData] = useState({
		newDate: "",
		newTime: "",
		newSlot: "",
	});
	const [submitting, setSubmitting] = useState(false);
	const [paymentStatuses, setPaymentStatuses] = useState<{[key: string]: any}>({});
	const [availableSlots, setAvailableSlots] = useState<string[]>([]);
	const [doctorHours, setDoctorHours] = useState<{start: string; end: string} | null>(null);
	const [loadingSlots, setLoadingSlots] = useState(false);

	useEffect(() => {
		fetchAppointments();
	}, [selectedStatus, currentPage]);

	useEffect(() => {
		if (appointments.length > 0) {
			fetchPaymentStatuses();
		}
	}, [appointments]);

	const fetchAppointments = async () => {
		setLoading(true);
		try {
			const response = await appointmentAPI.getUserAppointments({
				status: selectedStatus,
				page: currentPage,
				limit: 10,
			});
			
			// Filter out appointments that were rescheduled (original appointments)
			// Only show the new appointments after rescheduling
			let filteredAppointments = response.data.data.appointments;
			
			// If showing "all" appointments, exclude cancelled appointments that were rescheduled
			if (selectedStatus === "all") {
				filteredAppointments = filteredAppointments.filter((apt: Appointment) => {
					// Hide cancelled appointments that have a rescheduledTo field (they were rescheduled)
					return !(apt.status === "cancelled" && apt.cancellationReason?.includes("Rescheduled to"));
				});
			}
			
			setAppointments(filteredAppointments);
			setTotalPages(response.data.data.pagination.totalPages);
		} catch (error: any) {
			toast.error("Failed to fetch appointments");
		} finally {
			setLoading(false);
		}
	};

	const fetchPaymentStatuses = async () => {
		const paymentPromises = appointments.map(async (apt) => {
			try {
				const paymentResponse = await paymentAPI.checkPaymentStatus(apt._id);
				return { [apt._id]: paymentResponse.data.data };
			} catch (error) {
				return { [apt._id]: null };
			}
		});

		const paymentResults = await Promise.all(paymentPromises);
		const paymentStatuses = paymentResults.reduce((acc, result) => ({ ...acc, ...result }), {});
		setPaymentStatuses(paymentStatuses);
	};

	const handleCancelAppointment = async () => {
		if (!selectedAppointment) return;

		setSubmitting(true);
		try {
			await appointmentAPI.cancelAppointment(
				selectedAppointment._id,
				cancellationReason
			);
			toast.success("Appointment cancelled successfully");
			setShowCancelModal(false);
			setCancellationReason("");
			setSelectedAppointment(null);
			fetchAppointments();
		} catch (error: any) {
			toast.error(error.response?.data?.message || "Failed to cancel appointment");
		} finally {
			setSubmitting(false);
		}
	};

	const handleRescheduleAppointment = async () => {
		if (!selectedAppointment || !rescheduleData.newDate || !rescheduleData.newTime || !rescheduleData.newSlot) {
			toast.error("Please select a date and time slot");
			return;
		}

		setSubmitting(true);
		try {
			await appointmentAPI.rescheduleAppointment(selectedAppointment._id, rescheduleData);
			toast.success("Appointment rescheduled successfully. Your payment has been transferred to the new appointment.");
			setShowRescheduleModal(false);
			setRescheduleData({ newDate: "", newTime: "", newSlot: "" });
			setSelectedAppointment(null);
			setAvailableSlots([]);
			setDoctorHours(null);
			fetchAppointments();
		} catch (error: any) {
			toast.error(error.response?.data?.message || "Failed to reschedule appointment");
		} finally {
			setSubmitting(false);
		}
	};

	const openCancelModal = (appointment: Appointment) => {
		setSelectedAppointment(appointment);
		setShowCancelModal(true);
	};

	const openRescheduleModal = async (appointment: Appointment) => {
		setSelectedAppointment(appointment);
		setRescheduleData({
			newDate: "",
			newTime: "",
			newSlot: "",
		});
		setAvailableSlots([]);
		setDoctorHours(null);
		
		// Get doctor's available hours
		try {
			const doctorResponse = await doctorAPI.getDoctorById(appointment.doctor._id);
			setDoctorHours(doctorResponse.data.data.availableHours);
		} catch (error) {
			console.error('Failed to get doctor hours:', error);
		}
		
		setShowRescheduleModal(true);
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
				return <FiEdit3 className="w-4 h-4" />;
			default:
				return <FiAlertCircle className="w-4 h-4" />;
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

	// Fetch available slots when date changes
	const fetchAvailableSlots = async (doctorId: string, date: string) => {
		if (!date) {
			setAvailableSlots([]);
			return;
		}
		
		setLoadingSlots(true);
		try {
			const response = await appointmentAPI.getAvailableSlots(doctorId, date);
			setAvailableSlots(response.data.data.availableSlots);
		} catch (error: any) {
			toast.error(error.response?.data?.message || "Failed to fetch available slots");
			setAvailableSlots([]);
		} finally {
			setLoadingSlots(false);
		}
	};

	const handleDateChange = (date: string) => {
		setRescheduleData({ 
			...rescheduleData, 
			newDate: date, 
			newTime: "", 
			newSlot: "" 
		});
		
		if (selectedAppointment && date) {
			fetchAvailableSlots(selectedAppointment.doctor._id, date);
		}
	};

	const handleTimeSlotSelect = (slot: string) => {
		setRescheduleData({
			...rescheduleData,
			newTime: slot,
			newSlot: slot,
		});
	};

	const canCancelOrReschedule = (appointment: Appointment) => {
		if (appointment.status === "cancelled" || appointment.status === "completed") {
			return false;
		}

		// Patients can reschedule anytime, doctors need 24 hours notice
		if (currentUser?.role === "patient") {
			return true;
		}

		const appointmentDateTime = new Date(appointment.appointmentDate);
		appointmentDateTime.setHours(parseInt(appointment.appointmentTime.split(':')[0]));
		appointmentDateTime.setMinutes(parseInt(appointment.appointmentTime.split(':')[1]));
		
		const now = new Date();
		const timeDifference = appointmentDateTime.getTime() - now.getTime();
		const hoursDifference = timeDifference / (1000 * 3600);

		return hoursDifference >= 24;
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-4">
						My Appointments
					</h1>
					<p className="text-gray-600">
						Manage your appointments and medical consultations
					</p>
				</div>

				{/* Filters */}
				<div className="bg-white rounded-lg shadow-sm p-6 mb-8">
					<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
						<div className="flex items-center space-x-4">
							<FiFilter className="w-5 h-5 text-gray-400" />
							<select
								value={selectedStatus}
								onChange={(e) => {
									setSelectedStatus(e.target.value);
									setCurrentPage(1);
								}}
								className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="all">All Appointments</option>
								<option value="pending">Pending</option>
								<option value="confirmed">Confirmed</option>
								<option value="completed">Completed</option>
								<option value="cancelled">Cancelled</option>
								<option value="rescheduled">Rescheduled</option>
							</select>
						</div>
						<button
							onClick={fetchAppointments}
							className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
						>
							<FiRefreshCw className="w-4 h-4" />
							Refresh
						</button>
					</div>
				</div>

				{/* Appointments List */}
				{appointments.length > 0 ? (
					<div className="space-y-6">
						{appointments.map((appointment) => (
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
														{currentUser?.role === "patient"
															? `Dr. ${appointment.doctor.name}`
															: appointment.patient.name}
													</h3>
													<p className="text-blue-600 font-medium">
														{currentUser?.role === "patient"
															? appointment.doctor.specialty
															: "Patient"}
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

											<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
												<div className="flex items-center space-x-3">
													<FiCalendar className="w-4 h-4 text-gray-400" />
													<span className="text-sm text-gray-600">
														{formatDate(appointment.appointmentDate)}
													</span>
												</div>
												<div className="flex items-center space-x-3">
													<FiClock className="w-4 h-4 text-gray-400" />
													<span className="text-sm text-gray-600">
														{appointment.appointmentTime}
													</span>
												</div>
												<div className="flex items-center space-x-3">
													<FiUser className="w-4 h-4 text-gray-400" />
													<span className="text-sm text-gray-600">
														{currentUser?.role === "patient"
															? "You"
															: appointment.patient.name}
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
														{appointment.cancellationReason.includes("Rescheduled to") ? (
															<>
																<FiEdit3 className="w-4 h-4 text-blue-400 mt-1" />
																<div>
																	<p className="text-sm font-medium text-blue-900">
																		Rescheduled:
																	</p>
																	<p className="text-sm text-blue-600">
																		{appointment.cancellationReason}
																	</p>
																	<p className="text-xs text-blue-500 mt-1">
																		✓ Payment transferred to new appointment
																	</p>
																</div>
															</>
														) : (
															<>
																<FiX className="w-4 h-4 text-red-400 mt-1" />
																<div>
																	<p className="text-sm font-medium text-red-900">
																		Cancellation Reason:
																	</p>
																	<p className="text-sm text-red-600">
																		{appointment.cancellationReason}
																	</p>
																</div>
															</>
														)}
													</div>
												)}
												
												{/* Payment Status */}
												{currentUser?.role === "patient" && paymentStatuses[appointment._id] && (
													<div className="flex items-start space-x-3">
														<FiCreditCard className="w-4 h-4 text-blue-400 mt-1" />
														<div>
															<p className="text-sm font-medium text-gray-900">
																Payment Status:
															</p>
															<span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
																paymentStatuses[appointment._id].status === "completed" ? "bg-green-100 text-green-800" :
																paymentStatuses[appointment._id].status === "pending" ? "bg-yellow-100 text-yellow-800" :
																paymentStatuses[appointment._id].status === "failed" ? "bg-red-100 text-red-800" :
																"bg-gray-100 text-gray-800"
															}`}>
																{paymentStatuses[appointment._id].status.charAt(0).toUpperCase() + paymentStatuses[appointment._id].status.slice(1)}
															</span>
															{paymentStatuses[appointment._id].status === "pending" && (
																<p className="text-xs text-gray-500 mt-1">
																	Deadline: {new Date(paymentStatuses[appointment._id].paymentDeadline).toLocaleString()}
																</p>
															)}
														</div>
													</div>
												)}
											</div>
										</div>

										{/* Action Buttons */}
										<div className="flex flex-col space-y-2">
											{/* Rating Button - Only for completed appointments by patients */}
											{currentUser?.role === "patient" && appointment.status === "completed" && (
												<Link
													to={`/rating/${appointment._id}`}
													className="flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
												>
													<FiStar className="w-4 h-4" />
													Rate Doctor
												</Link>
											)}
																							
											{/* Chat Button - Only for confirmed appointments */}
											{appointment.status === "confirmed" && (
												<Link
													to={`/livechat/${appointment._id}`}
													className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
												>
													<FiMessageSquare className="w-4 h-4" />
													Chat
												</Link>
											)}
											
											{/* Payment Button - Only for pending appointments */}
											{currentUser?.role === "patient" && 
											 paymentStatuses[appointment._id]?.status === "pending" && (
												<Link
													to={`/payment/${appointment._id}`}
													className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
												>
													<FiCreditCard className="w-4 h-4" />
													Pay Now
												</Link>
											)}
											
											{/* Existing buttons */}
											{canCancelOrReschedule(appointment) && (
												<>
													<button
														onClick={() => openRescheduleModal(appointment)}
														className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
													>
														<FiEdit3 className="w-4 h-4" />
														Reschedule
													</button>
													<button
														onClick={() => openCancelModal(appointment)}
														className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
													>
														<FiX className="w-4 h-4" />
														Cancel
													</button>
												</>
											)}
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
							No appointments found
						</h3>
						<p className="text-gray-600">
							{selectedStatus === "all"
								? "You don't have any appointments yet."
								: `No ${selectedStatus} appointments found.`}
						</p>
					</div>
				)}

				{/* Pagination */}
				{totalPages > 1 && (
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

			{/* Cancel Appointment Modal */}
			{showCancelModal && selectedAppointment && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
						<h3 className="text-lg font-semibold text-gray-900 mb-4">
							Cancel Appointment
						</h3>
						<p className="text-gray-600 mb-4">
							Are you sure you want to cancel your appointment with{" "}
							{currentUser?.role === "patient"
								? `Dr. ${selectedAppointment.doctor.name}`
								: selectedAppointment.patient.name}
							?
						</p>
						<div className="mb-4">
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Cancellation Reason (Optional)
							</label>
							<textarea
								value={cancellationReason}
								onChange={(e) => setCancellationReason(e.target.value)}
								rows={3}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
								placeholder="Please provide a reason for cancellation..."
							/>
						</div>
						<div className="flex space-x-3">
							<button
								onClick={() => {
									setShowCancelModal(false);
									setCancellationReason("");
									setSelectedAppointment(null);
								}}
								className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
							>
								Keep Appointment
							</button>
							<button
								onClick={handleCancelAppointment}
								disabled={submitting}
								className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
							>
								{submitting ? "Cancelling..." : "Cancel Appointment"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Reschedule Appointment Modal */}
			{showRescheduleModal && selectedAppointment && (
				<RescheduleModal
					selectedAppointment={selectedAppointment}
					rescheduleData={rescheduleData}
					setRescheduleData={setRescheduleData}
					handleDateChange={handleDateChange}
					handleTimeSlotSelect={handleTimeSlotSelect}
					handleRescheduleAppointment={handleRescheduleAppointment}
					setShowRescheduleModal={setShowRescheduleModal}
					setSelectedAppointment={setSelectedAppointment}
					setAvailableSlots={setAvailableSlots}
					setDoctorHours={setDoctorHours}
					submitting={submitting}
					availableSlots={availableSlots}
					doctorHours={doctorHours}
					loadingSlots={loadingSlots}
					currentUser={currentUser}
				/>
			)}
		</div>
	);
};

export default AppointmentList;
