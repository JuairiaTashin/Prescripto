import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { notificationAPI } from "../services/api";
import { toast } from "react-hot-toast";
import { FiBell, FiCheck, FiTrash2, FiEye, FiEyeOff } from "react-icons/fi";


interface Notification {
    _id: string;
    type: "reminder" | "appointment_completed" | "appointment_cancelled" | "appointment_rescheduled" | "appointment_booked";
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    appointment?: {
        appointmentDate: string;
        appointmentTime: string;
        reason: string;
    };
}


const NotificationList = () => {
    const { user } = useAuthStore();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);


    useEffect(() => {
        fetchNotifications();
        fetchNotificationCount();
    }, [currentPage, showUnreadOnly]);


    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await notificationAPI.getUserNotifications({
                page: currentPage,
                limit: 20,
                unreadOnly: showUnreadOnly,
            });


            if (response.data.success) {
                setNotifications(response.data.data.notifications);
                setTotalPages(response.data.data.pagination.totalPages);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to fetch notifications");
        } finally {
            setLoading(false);
        }
    };


    const fetchNotificationCount = async () => {
        try {
            const response = await notificationAPI.getNotificationCount();
            if (response.data.success) {
                setUnreadCount(response.data.data.unreadCount);
            }
        } catch (error) {
            console.error("Failed to fetch notification count:", error);
        }
    };


    const markAsRead = async (id: string) => {
        try {
            const response = await notificationAPI.markNotificationAsRead(id);
            if (response.data.success) {
                setNotifications(prev =>
                    prev.map(notif =>
                        notif._id === id ? { ...notif, isRead: true } : notif
                    )
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
                toast.success("Notification marked as read");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to mark notification as read");
        }
    };


    const markAllAsRead = async () => {
        try {
            const response = await notificationAPI.markAllNotificationsAsRead();
            if (response.data.success) {
                setNotifications(prev =>
                    prev.map(notif => ({ ...notif, isRead: true }))
                );
                setUnreadCount(0);
                toast.success("All notifications marked as read");
            }
        } catch (error: any) {
            toast.error("Failed to mark all notifications as read");
        }
    };


    const deleteNotification = async (id: string) => {
        try {
            const response = await notificationAPI.deleteNotification(id);
            if (response.data.success) {
                setNotifications(prev => prev.filter(notif => notif._id !== id));
                toast.success("Notification deleted");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete notification");
        }
    };


    const getNotificationIcon = (type: string) => {
        switch (type) {
            case "reminder":
                return <FiBell className="w-5 h-5 text-blue-500" />;
            case "appointment_completed":
                return <FiCheck className="w-5 h-5 text-green-500" />;
            case "appointment_cancelled":
                return <FiTrash2 className="w-5 h-5 text-red-500" />;
            case "appointment_rescheduled":
                return <FiEye className="w-5 h-5 text-yellow-500" />;
            default:
                return <FiBell className="w-5 h-5 text-gray-500" />;
        }
    };


    const getNotificationColor = (type: string) => {
        switch (type) {
            case "reminder":
                return "border-l-blue-500 bg-blue-50";
            case "appointment_completed":
                return "border-l-green-500 bg-green-50";
            case "appointment_cancelled":
                return "border-l-red-500 bg-red-50";
            case "appointment_rescheduled":
                return "border-l-yellow-500 bg-yellow-50";
            default:
                return "border-l-gray-500 bg-gray-50";
        }
    };


    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view notifications</h2>
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow-sm">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <FiBell className="w-6 h-6 text-blue-600" />
                                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                                {unreadCount > 0 && (
                                    <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                        {unreadCount} unread
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center space-x-3">
                                <label className="flex items-center space-x-2 text-sm text-gray-600">
                                    <input
                                        type="checkbox"
                                        checked={showUnreadOnly}
                                        onChange={(e) => setShowUnreadOnly(e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span>Show unread only</span>
                                </label>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                    >
                                        Mark all as read
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>


                    {/* Notifications List */}
                    <div className="divide-y divide-gray-200">
                        {loading ? (
                            <div className="px-6 py-8 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-2 text-gray-500">Loading notifications...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="px-6 py-8 text-center">
                                <FiBell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                                <p className="text-gray-500">
                                    {showUnreadOnly ? "You have no unread notifications" : "You have no notifications yet"}
                                </p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className={`px-6 py-4 border-l-4 ${getNotificationColor(notification.type)} ${
                                        !notification.isRead ? "bg-opacity-100" : "bg-opacity-50"
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start space-x-3 flex-1">
                                            {getNotificationIcon(notification.type)}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-2">
                                                    <h4 className={`text-sm font-medium ${
                                                        notification.isRead ? "text-gray-600" : "text-gray-900"
                                                    }`}>
                                                        {notification.title}
                                                    </h4>
                                                    {!notification.isRead && (
                                                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                                                            New
                                                        </span>
                                                    )}
                                                </div>
                                                <p className={`text-sm mt-1 ${
                                                    notification.isRead ? "text-gray-500" : "text-gray-700"
                                                }`}>
                                                    {notification.message}
                                                </p>
                                                {notification.appointment && (
                                                    <div className="mt-2 text-xs text-gray-500">
                                                        <span className="font-medium">Appointment:</span>{" "}
                                                        {new Date(notification.appointment.appointmentDate).toLocaleDateString()} at{" "}
                                                        {notification.appointment.appointmentTime}
                                                    </div>
                                                )}
                                                <p className="text-xs text-gray-400 mt-2">
                                                    {new Date(notification.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2 ml-4">
                                            {!notification.isRead && (
                                                <button
                                                    onClick={() => markAsRead(notification._id)}
                                                    className="text-gray-400 hover:text-blue-600 transition-colors"
                                                    title="Mark as read"
                                                >
                                                    <FiEyeOff className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => deleteNotification(notification._id)}
                                                className="text-gray-400 hover:text-red-600 transition-colors"
                                                title="Delete notification"
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>


                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Page {currentPage} of {totalPages}
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


export default NotificationList;




