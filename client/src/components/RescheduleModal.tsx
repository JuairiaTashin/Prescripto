import { useState } from "react";
import { FiInfo } from "react-icons/fi";

interface RescheduleModalProps {
	selectedAppointment: any;
	rescheduleData: any;
	setRescheduleData: any;
	handleDateChange: any;
	handleTimeSlotSelect: any;
	handleRescheduleAppointment: any;
	setShowRescheduleModal: any;
	setSelectedAppointment: any;
	setAvailableSlots: any;
	setDoctorHours: any;
	submitting: boolean;
	availableSlots: string[];
	doctorHours: any;
	loadingSlots: boolean;
	currentUser: any;
}

const RescheduleModal = ({
	selectedAppointment,
	rescheduleData,
	handleDateChange,
	handleTimeSlotSelect,
	handleRescheduleAppointment,
	setShowRescheduleModal,
	setRescheduleData,
	setSelectedAppointment,
	setAvailableSlots,
	setDoctorHours,
	submitting,
	availableSlots,
	doctorHours,
	loadingSlots,
	currentUser,
}: RescheduleModalProps) => {
	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
				<h3 className="text-lg font-semibold text-gray-900 mb-4">
					Reschedule Appointment
				</h3>
				<p className="text-gray-600 mb-4">
					Select a new date and time for your appointment with{" "}
					{currentUser?.role === "patient"
						? `Dr. ${selectedAppointment.doctor.name}`
						: selectedAppointment.patient.name}
					. Your payment will be automatically transferred to the new appointment.
				</p>
				
				{/* 3-minute consultation info */}
				<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
					<div className="flex items-center space-x-2">
						<FiInfo className="w-4 h-4 text-yellow-600" />
						<span className="text-sm font-medium text-yellow-800">
							Each consultation slot is 3 minutes long. After 3 minutes, you can rate the doctor.
						</span>
					</div>
				</div>
				
				{/* Doctor's Available Hours */}
				{doctorHours && (
					<div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
						<div className="flex items-center space-x-2">
							<FiInfo className="w-4 h-4 text-blue-600" />
							<span className="text-sm font-medium text-blue-800">
								Doctor's Available Hours: {doctorHours.start} - {doctorHours.end}
							</span>
						</div>
					</div>
				)}
				
				<div className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							New Date
						</label>
						<input
							type="date"
							value={rescheduleData.newDate}
							onChange={(e) => handleDateChange(e.target.value)}
							min={new Date().toISOString().split('T')[0]}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					
					{/* Available Time Slots */}
					{rescheduleData.newDate && (
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Available Time Slots
							</label>
							{loadingSlots ? (
								<div className="flex items-center justify-center py-4">
									<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
									<span className="ml-2 text-sm text-gray-600">Loading slots...</span>
								</div>
							) : availableSlots.length > 0 ? (
								<div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg">
									{availableSlots.map((slot) => (
										<button
											key={slot}
											onClick={() => handleTimeSlotSelect(slot)}
											className={`px-2 py-1 text-xs rounded border ${
												rescheduleData.newSlot === slot
													? "bg-blue-600 text-white border-blue-600"
													: "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"
											} transition-colors`}
										>
											{slot}
										</button>
									))}
								</div>
							) : (
								<p className="text-sm text-gray-500 py-4">
									No available slots for this date. Please select another date.
								</p>
							)}
						</div>
					)}
				</div>
				
				<div className="flex space-x-3 mt-6">
					<button
						onClick={() => {
							setShowRescheduleModal(false);
							setRescheduleData({ newDate: "", newTime: "", newSlot: "" });
							setSelectedAppointment(null);
							setAvailableSlots([]);
							setDoctorHours(null);
						}}
						className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
					>
						Cancel
					</button>
					<button
						onClick={handleRescheduleAppointment}
						disabled={submitting || !rescheduleData.newDate || !rescheduleData.newSlot}
						className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
					>
						{submitting ? "Rescheduling..." : "Reschedule"}
					</button>
				</div>
			</div>
		</div>
	);
};

export default RescheduleModal;