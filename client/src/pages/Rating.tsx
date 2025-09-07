import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { ratingAPI, appointmentAPI } from "../services/api";
import { toast } from "react-hot-toast";
import {
    FiStar,
    FiArrowLeft,
    FiUser,
    FiCalendar,
    FiClock,
    FiFileText,
    FiEdit3,
    FiTrash2,
    FiCheck,
    FiX,
} from "react-icons/fi";


interface RatingData {
    _id: string;
    rating: number;
    review?: string;
    isAnonymous: boolean;
    doctor: {
        _id: string;
        name: string;
        specialty: string;
    };
    appointment: {
        _id: string;
        appointmentDate: string;
        appointmentTime: string;
        reason: string;
    };
    createdAt: string;
}


interface DoctorStats {
    averageRating: number;
    totalRatings: number;
    ratingDistribution: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
    };
}


const Rating = () => {
    const { appointmentId } = useParams<{ appointmentId: string }>();
    const navigate = useNavigate();
    const { user: currentUser, isAuthenticated } = useAuthStore();
   
    const [appointment, setAppointment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState("");
    const [isAnonymous, setIsAnonymous] = useState(true);
    const [existingRating, setExistingRating] = useState<RatingData | null>(null);
    const [doctorStats, setDoctorStats] = useState<DoctorStats | null>(null);
    const [isEditing, setIsEditing] = useState(false);


    useEffect(() => {
        if (!isAuthenticated) {
            toast.error("Please login to access rating page");
            navigate("/login");
            return;
        }


        if (appointmentId) {
            fetchAppointment();
            fetchDoctorStats();
        }
    }, [appointmentId, isAuthenticated, navigate]);


    const fetchAppointment = async () => {
        try {
            setLoading(true);
            const response = await appointmentAPI.getAppointmentById(appointmentId!);
            const appointmentData = response.data.data;
            setAppointment(appointmentData);


            // Check if user is the patient
            if (appointmentData.patient._id !== currentUser?._id) {
                toast.error("You can only rate your own appointments");
                navigate("/appointments");
                return;
            }


            // Check if consultation is completed
            if (appointmentData.consultationStatus !== "completed") {
                toast.error("You can only rate doctors after the consultation is completed (3 minutes)");
                navigate("/appointments");
                return;
            }


            // Check if rating already exists
            await checkExistingRating();
        } catch (error: any) {
            toast.error("Failed to fetch appointment details");
            console.error("Error fetching appointment:", error);
        } finally {
            setLoading(false);
        }
    };


    const checkExistingRating = async () => {
        try {
            const response = await ratingAPI.getPatientRatings();
            const patientRatings = response.data.data.ratings;
            const existing = patientRatings.find(
                (rating: RatingData) => rating.appointment._id === appointmentId
            );
            if (existing) {
                setExistingRating(existing);
                setRating(existing.rating);
                setReview(existing.review || "");
                setIsAnonymous(existing.isAnonymous);
            }
        } catch (error) {
            console.error("Error checking existing rating:", error);
        }
    };


    const fetchDoctorStats = async () => {
        if (!appointment?.doctor._id) return;
       
        try {
            const response = await ratingAPI.getDoctorRatingStats(appointment.doctor._id);
            setDoctorStats(response.data.data);
        } catch (error) {
            console.error("Error fetching doctor stats:", error);
        }
    };


    const handleSubmitRating = async () => {
        if (!appointment || rating === 0) {
            toast.error("Please select a rating");
            return;
        }


        setSubmitting(true);
        try {
            const ratingData = {
                appointmentId: appointment._id,
                rating,
                review: review.trim() || undefined,
                isAnonymous,
            };


            if (existingRating && isEditing) {
                // Update existing rating
                await ratingAPI.updateRating(existingRating._id, ratingData);
                toast.success("Rating updated successfully");
                setIsEditing(false);
            } else {
                // Create new rating
                const response = await ratingAPI.createRating(ratingData);
                setExistingRating(response.data.data);
                toast.success("Rating submitted successfully");
            }


            // Refresh doctor stats
            await fetchDoctorStats();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to submit rating");
        } finally {
            setSubmitting(false);
        }
    };


    const handleDeleteRating = async () => {
        if (!existingRating) return;


        if (!confirm("Are you sure you want to delete this rating?")) return;


        try {
            await ratingAPI.deleteRating(existingRating._id);
            setExistingRating(null);
            setRating(0);
            setReview("");
            setIsAnonymous(true);
            toast.success("Rating deleted successfully");
            await fetchDoctorStats();
        } catch (error: any) {
            toast.error("Failed to delete rating");
        }
    };


    const renderStars = (rating: number, interactive = false, size = "w-6 h-6") => {
        return (
            <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => interactive && setRating(star)}
                        disabled={!interactive}
                        className={`${size} ${
                            interactive
                                ? "cursor-pointer hover:scale-110 transition-transform"
                                : "cursor-default"
                        } ${
                            star <= rating
                                ? "text-yellow-400"
                                : "text-gray-300"
                        }`}
                    >
                        <FiStar className="w-full h-full fill-current" />
                    </button>
                ))}
            </div>
        );
    };


    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }


    if (!appointment) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Appointment not found</h2>
                    <button
                        onClick={() => navigate("/appointments")}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                        ← Back to Appointments
                    </button>
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-gray-600 hover:text-blue-600 transition-colors mb-4"
                    >
                        <FiArrowLeft className="w-5 h-5 mr-2" />
                        Back
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {existingRating && !isEditing ? "Your Rating" : "Rate Your Doctor"}
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Share your experience with Dr. {appointment.doctor.name}
                    </p>
                </div>


                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Doctor Info & Stats */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Doctor Information
                            </h3>
                           
                            <div className="space-y-4">
                                <div className="flex items-center space-x-3">
                                    <FiUser className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            Dr. {appointment.doctor.name}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {appointment.doctor.specialty}
                                        </p>
                                    </div>
                                </div>
                               
                                <div className="flex items-center space-x-3">
                                    <FiCalendar className="w-5 h-5 text-gray-400" />
                                    <span className="text-sm text-gray-600">
                                        {new Date(appointment.appointmentDate).toLocaleDateString()}
                                    </span>
                                </div>
                               
                                <div className="flex items-center space-x-3">
                                    <FiClock className="w-5 h-5 text-gray-400" />
                                    <span className="text-sm text-gray-600">
                                        {appointment.appointmentTime}
                                    </span>
                                </div>
                               
                                <div className="flex items-start space-x-3">
                                    <FiFileText className="w-5 h-5 text-gray-400 mt-1" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Reason:</p>
                                        <p className="text-sm text-gray-600">{appointment.reason}</p>
                                    </div>
                                </div>
                            </div>


                            {/* Doctor Stats */}
                            {doctorStats && (
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                                        Doctor Rating Stats
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Average Rating</span>
                                            <div className="flex items-center space-x-2">
                                                {renderStars(Math.round(doctorStats.averageRating))}
                                                <span className="text-sm font-medium text-gray-900">
                                                    {doctorStats.averageRating}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Total Ratings</span>
                                            <span className="text-sm font-medium text-gray-900">
                                                {doctorStats.totalRatings}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>


                    {/* Rating Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            {existingRating && !isEditing ? (
                                // Display existing rating
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            Your Rating
                                        </h3>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                                            >
                                                <FiEdit3 className="w-4 h-4" />
                                                <span>Edit</span>
                                            </button>
                                            <button
                                                onClick={handleDeleteRating}
                                                className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:text-red-700 transition-colors"
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                                <span>Delete</span>
                                            </button>
                                        </div>
                                    </div>


                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">
                                                Rating
                                            </label>
                                            <div className="mt-1">
                                                {renderStars(existingRating.rating)}
                                            </div>
                                        </div>


                                        {existingRating.review && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">
                                                    Review
                                                </label>
                                                <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                                                    {existingRating.review}
                                                </p>
                                            </div>
                                        )}

                                        <div className="text-xs text-gray-500">
                                            Rated on {new Date(existingRating.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // Rating form
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {isEditing ? "Edit Your Rating" : "Rate Your Experience"}
                                    </h3>


                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                                            Rating *
                                        </label>
                                        <div className="mt-1">
                                            {renderStars(rating, true, "w-8 h-8")}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Click on a star to rate (1-5 stars)
                                        </p>
                                    </div>


                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                                            Review (Optional)
                                        </label>
                                        <textarea
                                            value={review}
                                            onChange={(e) => setReview(e.target.value)}
                                            placeholder="Share your experience with this doctor..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                            rows={4}
                                            maxLength={1000}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            {review.length}/1000 characters
                                        </p>
                                    </div>

                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                        <p className="text-sm text-yellow-800">
                                            📝 <strong>Note:</strong> Your review will be publicly visible but your name will remain anonymous to other users. Only you can edit or delete your own rating.
                                        </p>
                                    </div>


                                    <div className="flex space-x-3">
                                        <button
                                            onClick={handleSubmitRating}
                                            disabled={rating === 0 || submitting}
                                            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <FiCheck className="w-4 h-4" />
                                            <span>
                                                {submitting
                                                    ? "Submitting..."
                                                    : isEditing
                                                    ? "Update Rating"
                                                    : "Submit Rating"}
                                            </span>
                                        </button>


                                        {isEditing && (
                                            <button
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    setRating(existingRating?.rating || 0);
                                                    setReview(existingRating?.review || "");
                                                    setIsAnonymous(existingRating?.isAnonymous || true);
                                                }}
                                                className="flex items-center space-x-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                <FiX className="w-4 h-4" />
                                                <span>Cancel</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default Rating;


