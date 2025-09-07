import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { ratingAPI } from "../services/api";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
    FiStar,
    FiUser,
    FiCalendar,
    FiClock,
    FiFileText,
    FiEdit3,
    FiTrash2,
    FiSearch,
    FiFilter,
} from "react-icons/fi";


interface Rating {
    _id: string;
    rating: number;
    review?: string;
    isAnonymous: boolean;
    patient?: {
        _id?: string;
        name: string;
    };
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
        status: string;
    };
    createdAt: string;
    canEdit?: boolean;
    canDelete?: boolean;
}


interface Appointment {
    _id: string;
    doctor: {
        _id: string;
        name: string;
        specialty: string;
    };
    appointmentDate: string;
    appointmentTime: string;
    reason: string;
    status: string;
    hasRated: boolean;
}


const RatingDashboard = () => {
    const { isAuthenticated } = useAuthStore();
    const navigate = useNavigate();
   
    const [ratings, setRatings] = useState<Rating[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"ratings" | "rateable">("ratings");
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "rated" | "unrated">("all");


    useEffect(() => {
        if (!isAuthenticated) {
            toast.error("Please login to access rating dashboard");
            navigate("/login");
            return;
        }


        fetchData();
    }, [isAuthenticated, navigate]);


    const fetchData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                fetchRatings(),
                fetchAppointments()
            ]);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };


    const fetchRatings = async () => {
        try {
            const response = await ratingAPI.getAllRatingsForDashboard();
            setRatings(response.data.data.ratings);
        } catch (error: any) {
            console.error("Error fetching ratings:", error);
        }
    };


    const fetchAppointments = async () => {
        try {
            const response = await ratingAPI.getRateableAppointments();
            setAppointments(response.data.data.appointments);
        } catch (error: any) {
            console.error("Error fetching rateable appointments:", error);
        }
    };


    const handleDeleteRating = async (ratingId: string) => {
        if (!confirm("Are you sure you want to delete this rating?")) return;


        try {
            await ratingAPI.deleteRating(ratingId);
            setRatings(ratings.filter(rating => rating._id !== ratingId));
            toast.success("Rating deleted successfully");
        } catch (error: any) {
            toast.error("Failed to delete rating");
        }
    };


    const renderStars = (rating: number, size = "w-4 h-4") => {
        return (
            <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <FiStar
                        key={star}
                        className={`${size} ${
                            star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
                        }`}
                    />
                ))}
            </div>
        );
    };


    const getFilteredAppointments = () => {
        let filtered = appointments;


        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(apt =>
                apt.doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                apt.doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
                apt.reason.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }


        // Filter by rating status
        if (filterStatus === "rated") {
            filtered = filtered.filter(apt => apt.hasRated);
        } else if (filterStatus === "unrated") {
            filtered = filtered.filter(apt => !apt.hasRated);
        }


        return filtered;
    };


    const getFilteredRatings = () => {
        let filtered = ratings;


        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(rating =>
                rating.doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                rating.doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (rating.review && rating.review.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }


        return filtered;
    };


    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">All Ratings & Reviews</h1>
                    <p className="text-gray-600 mt-2">
                        View all doctor ratings and reviews from patients (anonymously)
                    </p>
                </div>


                {/* Tabs */}
                <div className="mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab("ratings")}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === "ratings"
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                            >
                                All Ratings ({ratings.length})
                            </button>
                            <button
                                onClick={() => setActiveTab("rateable")}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === "rateable"
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                            >
                                Rate Doctors ({getFilteredAppointments().length})
                            </button>
                        </nav>
                    </div>
                </div>


                {/* Search and Filter */}
                <div className="mb-6 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search doctors, specialties, or reviews..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                   
                    {activeTab === "rateable" && (
                        <div className="flex items-center space-x-2">
                            <FiFilter className="w-4 h-4 text-gray-400" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as any)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Appointments</option>
                                <option value="rated">Already Rated</option>
                                <option value="unrated">Not Rated</option>
                            </select>
                        </div>
                    )}
                </div>


                {/* Content */}
                {activeTab === "ratings" ? (
                    // All Ratings Tab
                    <div className="space-y-4">
                        {getFilteredRatings().length === 0 ? (
                            <div className="text-center py-12">
                                <FiStar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    No ratings found
                                </h3>
                                <p className="text-gray-600">
                                    {searchTerm ? "No ratings match your search." : "No ratings available yet."}
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {getFilteredRatings().map((rating) => (
                                    <div key={rating._id} className="bg-white rounded-lg p-6 border border-gray-200">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <FiUser className="w-6 h-6 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">
                                                        Dr. {rating.doctor.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">
                                                        {rating.doctor.specialty}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Reviewed by: {rating.patient?.name || "Anonymous Patient"}
                                                    </p>
                                                </div>
                                            </div>
                                            {/* Only show edit/delete for user's own ratings */}
                                            {rating.canEdit && rating.canDelete && (
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => navigate(`/rating/${rating.appointment._id}`)}
                                                        className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                                                    >
                                                        <FiEdit3 className="w-4 h-4" />
                                                        <span>Edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteRating(rating._id)}
                                                        className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:text-red-700 transition-colors"
                                                    >
                                                        <FiTrash2 className="w-4 h-4" />
                                                        <span>Delete</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>


                                        <div className="mb-4">
                                            <div className="flex items-center space-x-2 mb-2">
                                                {renderStars(rating.rating, "w-5 h-5")}
                                                <span className="text-sm text-gray-600">
                                                    {new Date(rating.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {rating.review && (
                                                <p className="text-gray-700">{rating.review}</p>
                                            )}
                                        </div>


                                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                                            <div className="flex items-center space-x-1">
                                                <FiCalendar className="w-4 h-4" />
                                                <span>{new Date(rating.appointment.appointmentDate).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <FiClock className="w-4 h-4" />
                                                <span>{rating.appointment.appointmentTime}</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <FiFileText className="w-4 h-4" />
                                                <span>{rating.appointment.reason}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    // Rate Doctors Tab
                    <div className="space-y-4">
                        {getFilteredAppointments().length === 0 ? (
                            <div className="text-center py-12">
                                <FiStar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    No completed appointments found
                                </h3>
                                <p className="text-gray-600">
                                    {searchTerm ? "No appointments match your search." : "Complete some consultations to rate doctors."}
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {getFilteredAppointments().map((appointment) => {
                                    const existingRating = appointment.hasRated ?
                                        ratings.find(r => r.appointment._id === appointment._id) : null;
                                    return (
                                        <div key={appointment._id} className="bg-white rounded-lg p-6 border border-gray-200">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <FiUser className="w-6 h-6 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900">
                                                            Dr. {appointment.doctor.name}
                                                        </h3>
                                                        <p className="text-sm text-gray-600">
                                                            {appointment.doctor.specialty}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => navigate(`/rating/${appointment._id}`)}
                                                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                                                        appointment.hasRated
                                                            ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                                            : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                                    }`}
                                                >
                                                    <FiStar className={`w-4 h-4 ${appointment.hasRated ? "fill-current" : ""}`} />
                                                    <span className="text-sm font-medium">
                                                        {appointment.hasRated ? "View Rating" : "Rate Doctor"}
                                                    </span>
                                                </button>
                                            </div>


                                            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                                                <div className="flex items-center space-x-1">
                                                    <FiCalendar className="w-4 h-4" />
                                                    <span>{new Date(appointment.appointmentDate).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <FiClock className="w-4 h-4" />
                                                    <span>{appointment.appointmentTime}</span>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <FiFileText className="w-4 h-4" />
                                                    <span>{appointment.reason}</span>
                                                </div>
                                            </div>


                                            {appointment.hasRated && existingRating && (
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        {renderStars(existingRating.rating, "w-4 h-4")}
                                                        <span className="text-sm text-gray-600">
                                                            Rated on {new Date(existingRating.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    {existingRating.review && (
                                                        <p className="text-sm text-gray-700">{existingRating.review}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};


export default RatingDashboard;


