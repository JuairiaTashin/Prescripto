import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { reminderAPI } from "../services/api";
import { toast } from "react-hot-toast";
import {
    FiBell,
    FiClock,
    FiUser,
    FiFileText,
    FiTrash2,
    FiFilter,
    FiRefreshCw,
    FiCalendar,
} from "react-icons/fi";

interface Reminder {
    _id: string;
    appointment: {
        _id: string;
        appointmentDate: string;
        appointmentTime: string;
        reason: string;
        status: string;
    };
    doctor: {
        _id: string;
        name: string;
        specialty: string;
    };
    reminderTime: string;
    type: "24h" | "1h" | "5min";
    isSent: boolean;
    createdAt: string;
}

const Reminder = () => {
    const { user: currentUser } = useAuthStore();
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showProcessed, setShowProcessed] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    useEffect(() => {
        fetchReminders();
    }, [currentPage, showProcessed]);

    const fetchReminders = async () => {
        try {
            setLoading(true);
            const response = await reminderAPI.getUserReminders({
                page: currentPage,
                limit: 20,
                includeProcessed: showProcessed,
            });

            if (response.data.success) {
                setReminders(response.data.data.reminders);
                setTotalPages(response.data.data.pagination.totalPages);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to fetch reminders");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteReminder = async (id: string) => {
        if (!confirm("Are you sure you want to delete this reminder?")) return;

        setDeleting(id);
        try {
            const response = await reminderAPI.deleteReminder(id);
            if (response.data.success) {
                setReminders(prev => prev.filter(reminder => reminder._id !== id));
                toast.success("Reminder deleted successfully");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete reminder");
        } finally {
            setDeleting(null);
        }
    };

    const getReminderTypeColor = (type: string) => {
        switch (type) {
            case "24h":
                return "bg-blue-100 text-blue-800";
            case "1h":
                return "bg-yellow-100 text-yellow-800";
            case "5min":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getReminderTypeText = (type: string) => {
        switch (type) {
            case "24h":
                return "24 Hours Before";
            case "1h":
                return "1 Hour Before";
            case "5min":
                return "5 Minutes Before";
            default:
                return "Unknown";
        }
    };

    const getReminderTypeIcon = (type: string) => {
        switch (type) {
            case "24h":
                return <FiCalendar className="w-4 h-4" />;
            case "1h":
                return <FiClock className="w-4 h-4" />;
            case "5min":
                return <FiBell className="w-4 h-4" />;
            default:
                return <FiBell className="w-4 h-4" />;
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

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (!currentUser) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view reminders</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Appointment Reminders
                    </h1>
                    <p className="text-gray-600">
                        Manage your appointment reminders and stay updated on upcoming consultations
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center space-x-4">
                            <FiFilter className="w-5 h-5 text-gray-400" />
                            <label className="flex items-center space-x-2 text-sm text-gray-600">
                                <input
                                    type="checkbox"
                                    checked={showProcessed}
                                    onChange={(e) => {
                                        setShowProcessed(e.target.checked);
                                        setCurrentPage(1);
                                    }}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span>Show processed reminders</span>
                            </label>
                        </div>
                        <button
                            onClick={fetchReminders}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <FiRefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Reminders List */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading reminders...</p>
                    </div>
                ) : reminders.length === 0 ? (
                    <div className="text-center py-12">
                        <FiBell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No reminders found
                        </h3>
                        <p className="text-gray-600">
                            {showProcessed 
                                ? "You have no processed reminders yet."
                                : "You have no active reminders. Reminders will appear here when you have upcoming appointments."
                            }
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {reminders.map((reminder) => (
                            <div
                                key={reminder._id}
                                className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${
                                    reminder.isSent ? "opacity-75" : ""
                                }`}
                            >
                                <div className="p-6">
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                        Dr. {reminder.doctor.name}
                                                    </h3>
                                                    <p className="text-blue-600 font-medium">
                                                        {reminder.doctor.specialty}
                                                    </p>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span
                                                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getReminderTypeColor(
                                                            reminder.type
                                                        )}`}
                                                    >
                                                        {getReminderTypeIcon(reminder.type)}
                                                        <span className="ml-1">
                                                            {getReminderTypeText(reminder.type)}
                                                        </span>
                                                    </span>
                                                    {reminder.isSent && (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            Sent
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                <div className="flex items-center space-x-3">
                                                    <FiCalendar className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-gray-600">
                                                        {formatDate(reminder.appointment.appointmentDate)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-3">
                                                    <FiClock className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-gray-600">
                                                        {reminder.appointment.appointmentTime}
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-3">
                                                    <FiBell className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-gray-600">
                                                        Reminder: {formatTime(reminder.reminderTime)}
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
                                                            {reminder.appointment.reason}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-3">
                                                    <FiUser className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-gray-600">
                                                        Status: <span className="capitalize">{reminder.appointment.status}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-col space-y-2">
                                            {!reminder.isSent && (
                                                <button
                                                    onClick={() => handleDeleteReminder(reminder._id)}
                                                    disabled={deleting === reminder._id}
                                                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm font-medium"
                                                >
                                                    <FiTrash2 className="w-4 h-4" />
                                                    {deleting === reminder._id ? "Deleting..." : "Delete"}
                                                </button>
                                            )}
                                            {reminder.isSent && (
                                                <span className="text-xs text-gray-500 text-center px-3 py-2">
                                                    Reminder already sent
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
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
        </div>
    );
};

export default Reminder;





