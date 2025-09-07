import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { doctorAPI } from "../services/api";
import { toast } from "react-hot-toast";
import type { User } from "../store/authStore";
import {
    FiUser,
    FiMail,
    FiPhone,
    FiMapPin,
    FiAward,
    FiClock,
    FiCheckCircle,
    FiArrowLeft,
    FiEye,
    FiEdit2,
    FiExternalLink,
    FiStar,
} from "react-icons/fi";
import DoctorRatings from "../components/DocrorRating";


const DoctorProfile = () => {
    const { id } = useParams<{ id: string }>();
    const { user: currentUser } = useAuthStore();
    const [doctor, setDoctor] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);


    const isOwnProfile =
        currentUser?._id === id && currentUser?.role === "doctor";


    useEffect(() => {
        const fetchDoctor = async () => {
            if (!id) return;


            setLoading(true);
            try {
                const response = await doctorAPI.getDoctorById(id);
                setDoctor(response.data.data);
            } catch (error: any) {
                toast.error("Failed to fetch doctor profile");
            } finally {
                setLoading(false);
            }
        };


        fetchDoctor();
    }, [id]);


    const getProfileImageUrl = (profilePicture?: string) => {
        if (!profilePicture)
            return "https://via.placeholder.com/150/4F46E5/FFFFFF?text=Dr";
        return profilePicture.startsWith("http")
            ? profilePicture
            : `http://localhost:5000/${profilePicture}`;
    };


    const formatDate = (dateString?: string) => {
        if (!dateString) return "Not specified";
        return new Date(dateString).toLocaleDateString();
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
                    <Link
                        to="/doctors"
                        className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                        ← Back to Doctors
                    </Link>
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <Link
                            to="/doctors"
                            className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
                        >
                            <FiArrowLeft className="w-5 h-5 mr-2" />
                            Back to Doctors
                        </Link>
                        {isOwnProfile && (
                            <div className="flex items-center space-x-4">
                                <Link
                                    to="/profile"
                                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                                >
                                    <FiEdit2 className="w-4 h-4" />
                                    <span>Edit Profile</span>
                                </Link>
                                <button className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                                    <FiEye className="w-4 h-4" />
                                    <span>Public View</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>


            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
                    <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-8 py-12">
                        <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-8">
                            <div className="relative">
                                <img
                                    src={getProfileImageUrl(
                                        doctor.profilePicture
                                    )}
                                    alt={doctor.name}
                                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-2xl"
                                />
                                {doctor.isVerified && (
                                    <div className="absolute -bottom-2 -right-2 bg-green-500 text-white rounded-full p-2 shadow-lg">
                                        <FiCheckCircle className="w-6 h-6" />
                                    </div>
                                )}
                            </div>
                            <div className="text-center lg:text-left flex-1">
                                <h1 className="text-4xl font-bold text-white mb-2">
                                    Dr. {doctor.name}
                                </h1>
                                <p className="text-blue-100 text-xl mb-3 font-medium">
                                    {doctor.specialty}
                                </p>
                                {doctor.degree && (
                                    <p className="text-blue-200 text-lg mb-4">
                                        {doctor.degree}
                                    </p>
                                )}
                                <div className="flex flex-col sm:flex-row items-center lg:items-start space-y-2 sm:space-y-0 sm:space-x-6 text-blue-100">
                                    <div className="flex items-center">
                                        <FiUser className="w-5 h-5 mr-2" />
                                        <span>
                                            {doctor.experience} years experience
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-center lg:text-right">
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
                                    <p className="text-blue-100 text-sm mb-1">
                                        Consultation Fee
                                    </p>
                                    <p className="text-white text-2xl font-bold">
                                        ৳{doctor.consultationFee}
                                    </p>
                                </div>
                                {!isOwnProfile && (
                                    <Link
                                        to={`/book-appointment/${doctor._id}`}
                                        className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 inline-block"
                                    >
                                        Book Appointment
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>


                    <div className="px-8 py-6 bg-gray-50 border-b">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <FiMapPin className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Location
                                    </p>
                                    <p className="font-medium text-gray-900 truncate">
                                        {doctor.address}
                                    </p>
                                </div>
                            </div>
                            {doctor.availableHours && (
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                        <FiClock className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Available Hours
                                        </p>
                                        <p className="font-medium text-gray-900">
                                            {doctor.availableHours.start} -{" "}
                                            {doctor.availableHours.end}
                                        </p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <FiAward className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        BMDC Number
                                    </p>
                                    <p className="font-medium text-gray-900">
                                        {doctor.bmdc}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                                <FiUser className="w-6 h-6 mr-3 text-blue-600" />
                                About Dr. {doctor.name}
                            </h2>
                            <div className="prose max-w-none">
                                <p className="text-gray-700 leading-relaxed text-lg">
                                    {doctor.bio || "No bio available"}
                                </p>
                            </div>
                        </div>


                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                                <FiAward className="w-6 h-6 mr-3 text-blue-600" />
                                Education & Experience
                            </h2>
                            <div className="space-y-4">
                                <div className="flex items-start space-x-4">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-3"></div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-lg">
                                            {doctor.degree}
                                        </h3>
                                        <p className="text-gray-600">
                                            Medical Degree
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-4">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-3"></div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-lg">
                                            {doctor.experience} Years of
                                            Experience
                                        </h3>
                                        <p className="text-gray-600">
                                            Specialized in {doctor.specialty}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>


                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                                <FiPhone className="w-6 h-6 mr-3 text-blue-600" />
                                Contact Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <FiMail className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Email
                                        </p>
                                        <p className="font-medium text-gray-900">
                                            {doctor.email}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                        <FiPhone className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Phone
                                        </p>
                                        <p className="font-medium text-gray-900">
                                            {doctor.phone}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>


                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Personal Information
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">
                                        Gender
                                    </span>
                                    <span className="font-medium text-gray-900 capitalize">
                                        {doctor.gender || "Not specified"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">
                                        Date of Birth
                                    </span>
                                    <span className="font-medium text-gray-900">
                                        {formatDate(doctor.dateOfBirth)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">
                                        Joined
                                    </span>
                                    <span className="font-medium text-gray-900">
                                        {formatDate(doctor.createdAt)}
                                    </span>
                                </div>
                            </div>
                        </div>


                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Share Profile
                            </h3>
                            <button className="w-full flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                                <FiExternalLink className="w-4 h-4" />
                                <span>Share Profile</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Ratings Section */}
                <div className="mt-8">
                    <DoctorRatings doctorId={doctor._id} showStats={true} limit={10} />
                </div>
            </div>
        </div>
    );
};


export default DoctorProfile;




