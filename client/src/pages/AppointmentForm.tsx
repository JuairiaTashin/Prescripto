

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { doctorAPI, appointmentAPI } from "../services/api";
import { toast } from "react-hot-toast";
import type { User } from "../store/authStore";
import {
    FiCalendar,
    FiClock,
    FiUser,
    FiFileText,
    FiArrowLeft,
    FiCheck,
    FiX,
} from "react-icons/fi";


const AppointmentForm = () => {
    const { doctorId } = useParams<{ doctorId: string }>();
    const navigate = useNavigate();
    const { user: currentUser, isAuthenticated } = useAuthStore();
   
    const [doctor, setDoctor] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedSlot, setSelectedSlot] = useState("");
    const [formData, setFormData] = useState({
        reason: "",
        notes: "",
    });
    const [submitting, setSubmitting] = useState(false);


    useEffect(() => {
        if (!isAuthenticated) {
            toast.error("Please login to book appointments");
            navigate("/login");
            return;
        }


        if (currentUser?.role !== "patient") {
            toast.error("Only patients can book appointments");
            navigate("/doctors");
            return;
        }


        if (doctorId) {
            fetchDoctor();
        }
    }, [doctorId, isAuthenticated, currentUser, navigate]);


    useEffect(() => {
        if (selectedDate && doctorId) {
            fetchAvailableSlots();
        }
    }, [selectedDate, doctorId]);


    const fetchDoctor = async () => {
        if (!doctorId) return;
       
        setLoading(true);
        try {
            const response = await doctorAPI.getDoctorById(doctorId);
            setDoctor(response.data.data);
        } catch (error: any) {
            toast.error("Failed to fetch doctor details");
            navigate("/doctors");
        } finally {
            setLoading(false);
        }
    };


    const fetchAvailableSlots = async () => {
        if (!doctorId || !selectedDate) return;
       
        setSlotsLoading(true);
        try {
            const response = await appointmentAPI.getAvailableSlots(doctorId, selectedDate);
            setAvailableSlots(response.data.data.availableSlots);
            setSelectedSlot(""); // Reset selected slot when date changes
        } catch (error: any) {
            toast.error("Failed to fetch available slots");
            setAvailableSlots([]);
        } finally {
            setSlotsLoading(false);
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
       
        if (!selectedDate || !selectedSlot || !formData.reason) {
            toast.error("Please fill in all required fields");
            return;
        }


        setSubmitting(true);
        try {
            const appointmentData = {
                doctorId: doctorId!,
                appointmentDate: selectedDate,
                appointmentTime: selectedSlot,
                appointmentSlot: selectedSlot,
                reason: formData.reason,
                notes: formData.notes,
            };


            await appointmentAPI.bookAppointment(appointmentData);
            toast.success("Appointment booked successfully!");
            navigate("/appointments");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to book appointment");
        } finally {
            setSubmitting(false);
        }
    };


    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };


    const getMinDate = () => {
        const today = new Date();
        return today.toISOString().split("T")[0];
    };


    const getMaxDate = () => {
        const maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + 3); // Allow booking up to 3 months ahead
        return maxDate.toISOString().split("T")[0];
    };


    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }


    if (!doctor) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        Doctor not found
                    </h2>
                    <button
                        onClick={() => navigate("/doctors")}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                        ← Back to Doctors
                    </button>
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-gray-600 hover:text-blue-600 transition-colors mb-4"
                    >
                        <FiArrowLeft className="w-5 h-5 mr-2" />
                        Back
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Book Appointment
                    </h1>
                    <p className="text-gray-600">
                        Schedule an appointment with Dr. {doctor.name}
                    </p>
                </div>


                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Doctor Info */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <div className="text-center mb-6">
                                <img
                                    src={
                                        doctor.profilePicture
                                            ? doctor.profilePicture.startsWith("http")
                                                ? doctor.profilePicture
                                                : `http://localhost:5000/${doctor.profilePicture}`
                                            : "https://via.placeholder.com/150/4F46E5/FFFFFF?text=Dr"
                                    }
                                    alt={doctor.name}
                                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg mx-auto mb-4"
                                />
                                <h3 className="text-xl font-bold text-gray-900 mb-1">
                                    Dr. {doctor.name}
                                </h3>
                                <p className="text-blue-600 font-semibold mb-2">
                                    {doctor.specialty}
                                </p>
                                <p className="text-gray-600 text-sm">
                                    {doctor.degree}
                                </p>
                            </div>


                            <div className="space-y-3">
                                <div className="flex items-center text-sm text-gray-600">
                                    <FiClock className="w-4 h-4 mr-3 text-blue-500" />
                                    <span>
                                        {doctor.availableHours?.start} - {doctor.availableHours?.end}
                                    </span>
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                    <FiUser className="w-4 h-4 mr-3 text-blue-500" />
                                    <span>{doctor.experience} years experience</span>
                                </div>
                                <div className="pt-3 border-t border-gray-100">
                                    <p className="text-sm text-gray-600 mb-2">Consultation Fee:</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        ৳{doctor.consultationFee}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Booking Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">
                                Appointment Details
                            </h2>


                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Date Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FiCalendar className="inline w-4 h-4 mr-2" />
                                        Appointment Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        min={getMinDate()}
                                        max={getMaxDate()}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>


                                {/* Time Slot Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FiClock className="inline w-4 h-4 mr-2" />
                                        Available Time Slots (3-minute consultations) *
                                    </label>
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                                        <p className="text-sm text-blue-800">
                                            <strong>Note:</strong> Each consultation slot is 3 minutes long. After 3 minutes, 
                                            the consultation will be completed and you can rate the doctor.
                                        </p>
                                    </div>
                                    {selectedDate ? (
                                        slotsLoading ? (
                                            <div className="flex justify-center py-4">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                            </div>
                                        ) : availableSlots.length > 0 ? (
                                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto">
                                                {availableSlots.map((slot) => (
                                                    <button
                                                        key={slot}
                                                        type="button"
                                                        onClick={() => setSelectedSlot(slot)}
                                                        className={`p-3 text-sm font-medium rounded-lg border transition-all ${
                                                            selectedSlot === slot
                                                                ? "border-blue-600 bg-blue-50 text-blue-700"
                                                                : "border-gray-300 text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                                                        }`}
                                                    >
                                                        {slot}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-4 text-gray-500">
                                                <FiX className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                                <p>No available slots for this date</p>
                                                <p className="text-sm">Please select another date</p>
                                            </div>
                                        )
                                    ) : (
                                        <div className="text-center py-4 text-gray-500">
                                            <FiCalendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                            <p>Please select a date first</p>
                                        </div>
                                    )}
                                </div>


                                {/* Reason */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FiFileText className="inline w-4 h-4 mr-2" />
                                        Reason for Visit *
                                    </label>
                                    <textarea
                                        name="reason"
                                        value={formData.reason}
                                        onChange={handleChange}
                                        rows={3}
                                        required
                                        placeholder="Please describe your symptoms or reason for the appointment..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>


                                {/* Notes */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Additional Notes
                                    </label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleChange}
                                        rows={2}
                                        placeholder="Any additional information you'd like to share..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>


                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={submitting || !selectedDate || !selectedSlot || !formData.reason}
                                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                            Booking Appointment...
                                        </>
                                    ) : (
                                        <>
                                            <FiCheck className="w-5 h-5 mr-2" />
                                            Book Appointment
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default AppointmentForm;




