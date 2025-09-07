import { useState, useEffect } from "react";
import { ratingAPI } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { FiStar, FiUser, FiCalendar, FiClock, FiEdit3, FiTrash2 } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";


interface Rating {
    _id: string;
    rating: number;
    review?: string;
    isAnonymous: boolean;
    patient: {
        _id?: string;
        name: string;
    };
    appointment: {
        _id: string;
        appointmentDate: string;
        appointmentTime: string;
        reason: string;
    };
    createdAt: string;
    canEdit?: boolean;
    canDelete?: boolean;
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


interface DoctorRatingsProps {
    doctorId: string;
    showStats?: boolean;
    limit?: number;
}


const DoctorRatings = ({ doctorId, showStats = true, limit = 5 }: DoctorRatingsProps) => {
    const { isAuthenticated } = useAuthStore();
    const [ratings, setRatings] = useState<Rating[]>([]);
    const [stats, setStats] = useState<DoctorStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {
        fetchRatings();
        if (showStats) {
            fetchStats();
        }
    }, [doctorId, showStats]);


    const fetchRatings = async () => {
        try {
            setLoading(true);
            // Use context-aware endpoint if user is authenticated, otherwise public endpoint
            const response = isAuthenticated 
                ? await ratingAPI.getDoctorRatingsWithContext(doctorId, { limit })
                : await ratingAPI.getDoctorRatings(doctorId, { limit });
            setRatings(response.data.data.ratings);
        } catch (error: any) {
            setError("Failed to load ratings");
            console.error("Error fetching ratings:", error);
        } finally {
            setLoading(false);
        }
    };


    const fetchStats = async () => {
        try {
            const response = await ratingAPI.getDoctorRatingStats(doctorId);
            setStats(response.data.data);
        } catch (error: any) {
            console.error("Error fetching stats:", error);
        }
    };

    const handleDeleteRating = async (ratingId: string) => {
        if (!confirm("Are you sure you want to delete this rating?")) return;

        try {
            await ratingAPI.deleteRating(ratingId);
            setRatings(ratings.filter(rating => rating._id !== ratingId));
            toast.success("Rating deleted successfully");
            // Refresh stats after deletion
            if (showStats) {
                fetchStats();
            }
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


    const renderRatingDistribution = () => {
        if (!stats) return null;


        return (
            <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => (
                    <div key={star} className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 w-2">{star}</span>
                        <FiStar className="w-4 h-4 text-yellow-400 fill-current" />
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-yellow-400 h-2 rounded-full"
                                style={{
                                    width: `${stats.totalRatings > 0
                                        ? (stats.ratingDistribution[star as keyof typeof stats.ratingDistribution] / stats.totalRatings) * 100
                                        : 0}%`
                                }}
                            />
                        </div>
                        <span className="text-sm text-gray-600 w-6">
                            {stats.ratingDistribution[star as keyof typeof stats.ratingDistribution]}
                        </span>
                    </div>
                ))}
            </div>
        );
    };


    if (loading) {
        return (
            <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-gray-100 rounded-lg p-4">
                            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }


    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">{error}</p>
            </div>
        );
    }


    return (
        <div className="space-y-6">
            {/* Rating Statistics */}
            {showStats && stats && (
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Rating Overview
                    </h3>
                   
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                                <div className="text-3xl font-bold text-gray-900">
                                    {stats.averageRating}
                                </div>
                                <div>
                                    {renderStars(Math.round(stats.averageRating), "w-5 h-5")}
                                    <p className="text-sm text-gray-600">
                                        Based on {stats.totalRatings} rating{stats.totalRatings !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                        </div>
                       
                        <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-3">
                                Rating Distribution
                            </h4>
                            {renderRatingDistribution()}
                        </div>
                    </div>
                </div>
            )}


            {/* Recent Ratings */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                    Recent Reviews
                </h3>
               
                {ratings.length === 0 ? (
                    <div className="text-center py-8">
                        <FiStar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No reviews yet</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {ratings.map((rating) => (
                            <div key={rating._id} className="bg-white rounded-lg p-4 border border-gray-200">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                            <FiUser className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {rating.patient.name}
                                            </p>
                                            <div className="flex items-center space-x-2">
                                                {renderStars(rating.rating)}
                                                <span className="text-sm text-gray-500">
                                                    {new Date(rating.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Edit/Delete buttons for own ratings */}
                                    {rating.canEdit && rating.canDelete && (
                                        <div className="flex space-x-2">
                                            <Link
                                                to={`/rating/${rating.appointment._id}`}
                                                className="flex items-center space-x-1 px-2 py-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                                            >
                                                <FiEdit3 className="w-4 h-4" />
                                                <span>Edit</span>
                                            </Link>
                                            <button
                                                onClick={() => handleDeleteRating(rating._id)}
                                                className="flex items-center space-x-1 px-2 py-1 text-sm text-red-600 hover:text-red-700 transition-colors"
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                                <span>Delete</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                               
                                {rating.review && (
                                    <p className="text-gray-700 mb-3">{rating.review}</p>
                                )}
                               
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                    <div className="flex items-center space-x-1">
                                        <FiCalendar className="w-4 h-4" />
                                        <span>{new Date(rating.appointment.appointmentDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <FiClock className="w-4 h-4" />
                                        <span>{rating.appointment.appointmentTime}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};


export default DoctorRatings;


