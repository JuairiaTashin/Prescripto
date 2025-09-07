import axios from "axios";
import { useAuthStore } from "../store/authStore";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const api = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		"Content-Type": "application/json",
	},
});

api.interceptors.request.use((config) => {
	const token = useAuthStore.getState().token;
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			useAuthStore.getState().logout();
		}
		return Promise.reject(error);
	}
);

export const authAPI = {
	register: (formData: FormData) =>
		api.post("/api/users/register", formData, {
			headers: {
				"Content-Type": "multipart/form-data",
			},
		}),
	login: (credentials: { email: string; password: string }) =>
		api.post("/api/users/login", credentials),
	getProfile: () => api.get("/api/users/profile"),
	updateProfile: (formData: FormData) =>
		api.put("/api/users/profile", formData, {
			headers: {
				"Content-Type": "multipart/form-data",
			},
		}),
};

export const doctorAPI = {
	getDoctors: (params?: {
		specialty?: string;
		search?: string;
		page?: number;
		limit?: number;
	}) => api.get("/api/users/doctors", { params }),
	getDoctorById: (id: string) => api.get(`/api/users/doctors/${id}`),
	// Admin endpoints
	adminCreateDoctor: (formData: FormData) =>
		api.post(`/api/users/admin/doctors`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		}),
	adminDeleteDoctor: (id: string) =>
		api.delete(`/api/users/admin/doctors/${id}`),
};

export const appointmentAPI = {
	getAvailableSlots: (doctorId: string, date: string) =>
		api.get("/api/appointments/slots", { params: { doctorId, date } }),
	bookAppointment: (data: {
		doctorId: string;
		appointmentDate: string;
		appointmentTime: string;
		appointmentSlot: string;
		reason: string;
		notes?: string;
	}) => api.post("/api/appointments/book", data),
	getUserAppointments: (params?: {
		status?: string;
		page?: number;
		limit?: number;
	}) => api.get("/api/appointments/user", { params }),
	getAppointmentById: (id: string) => api.get(`/api/appointments/${id}`),
	cancelAppointment: (id: string, cancellationReason?: string) =>
		api.put(`/api/appointments/${id}/cancel`, { cancellationReason }),
	rescheduleAppointment: (
		id: string,
		data: {
			newDate: string;
			newTime: string;
			newSlot: string;
		}
	) => api.put(`/api/appointments/${id}/reschedule`, data),
	updateAppointmentStatus: (id: string, status: string) =>
		api.put(`/api/appointments/${id}/status`, { status }),
};

export const notificationAPI = {
	getUserNotifications: (params?: {
		page?: number;
		limit?: number;
		unreadOnly?: boolean;
	}) => api.get("/api/notifications", { params }),
	getNotificationCount: () => api.get("/api/notifications/count"),
	markNotificationAsRead: (id: string) =>
		api.put(`/api/notifications/${id}/read`),
	markAllNotificationsAsRead: () => api.put("/api/notifications/read-all"),
	deleteNotification: (id: string) => api.delete(`/api/notifications/${id}`),
};

export const reminderAPI = {
	getUserReminders: (params?: {
		page?: number;
		limit?: number;
		includeProcessed?: boolean;
	}) => api.get("/api/reminders", { params }),
	deleteReminder: (id: string) => api.delete(`/api/reminders/${id}`),
};

export const livechatAPI = {
	createChatRoom: (appointmentId: string) =>
		api.post("/api/livechat/create", { appointmentId }),
	getChatRoom: (appointmentId: string) =>
		api.get(`/api/livechat/appointment/${appointmentId}`),
	sendMessage: (appointmentId: string, content: string) =>
		api.post(`/api/livechat/appointment/${appointmentId}/message`, {
			content,
		}),
	getUserChatRooms: (params?: { page?: number; limit?: number }) =>
		api.get("/api/livechat/user", { params }),
	endChatRoom: (appointmentId: string) =>
		api.put(`/api/livechat/appointment/${appointmentId}/end`),
};

export const healthtipsAPI = {
	createHealthTip: (data: {
		title: string;
		content: string;
		category: string;
		tags?: string[];
		isPublished?: boolean;
	}) => api.post("/api/healthtips", data),
	getPublishedHealthTips: (params?: {
		page?: number;
		limit?: number;
		category?: string;
		search?: string;
		sortBy?: string;
	}) => api.get("/api/healthtips/published", { params }),
	getHealthTipById: (id: string) => api.get(`/api/healthtips/${id}`),
	getDoctorHealthTips: (params?: {
		page?: number;
		limit?: number;
		status?: string;
	}) => api.get("/api/healthtips/doctor", { params }),
	updateHealthTip: (
		id: string,
		data: {
			title?: string;
			content?: string;
			category?: string;
			tags?: string[];
			isPublished?: boolean;
		}
	) => api.put(`/api/healthtips/${id}`, data),
	deleteHealthTip: (id: string) => api.delete(`/api/healthtips/${id}`),
	toggleLike: (id: string) => api.post(`/api/healthtips/${id}/like`),
	getCategories: () => api.get("/api/healthtips/categories"),
};

export const paymentAPI = {
	processBkashPayment: (
		appointmentId: string,
		data: {
			phoneNumber: string;
			transactionId: string;
		}
	) => api.post(`/api/payments/appointment/${appointmentId}/bkash`, data),
	processCardPayment: (
		appointmentId: string,
		data: {
			cardNumber: string;
			cardholderName: string;
			expiryDate: string;
			cvv: string;
		}
	) => api.post(`/api/payments/appointment/${appointmentId}/card`, data),
	processAamarPayPayment: (
		appointmentId: string,
		data: {
			transactionId: string;
			gatewayResponse?: any;
		}
	) => api.post(`/api/payments/appointment/${appointmentId}/aamarpay`, data),
	getPaymentDetails: (appointmentId: string) =>
		api.get(`/api/payments/appointment/${appointmentId}`),
	checkPaymentStatus: (appointmentId: string) =>
		api.get(`/api/payments/appointment/${appointmentId}/status`),
	getPaymentHistory: (params?: {
		page?: number;
		limit?: number;
		status?: string;
	}) => api.get("/api/payments/history", { params }),
};

export const ratingAPI = {
	createRating: (data: {
		appointmentId: string;
		rating: number;
		review?: string;
		isAnonymous?: boolean;
	}) => api.post("/api/ratings", data),
	getDoctorRatings: (
		doctorId: string,
		params?: {
			page?: number;
			limit?: number;
			sortBy?: string;
		}
	) => api.get(`/api/ratings/doctor/${doctorId}`, { params }),
	getDoctorRatingsWithContext: (
		doctorId: string,
		params?: {
			page?: number;
			limit?: number;
			sortBy?: string;
		}
	) => api.get(`/api/ratings/doctor/${doctorId}/with-context`, { params }),
	getDoctorRatingStats: (doctorId: string) =>
		api.get(`/api/ratings/doctor/${doctorId}/stats`),
	getPatientRatings: (params?: { page?: number; limit?: number }) =>
		api.get("/api/ratings/patient", { params }),
	getAllRatingsForDashboard: (params?: {
		page?: number;
		limit?: number;
		sortBy?: string;
	}) => api.get("/api/ratings/dashboard/all", { params }),
	getRateableAppointments: () =>
		api.get("/api/ratings/rateable-appointments"),
	updateRating: (
		ratingId: string,
		data: {
			rating?: number;
			review?: string;
			isAnonymous?: boolean;
		}
	) => api.put(`/api/ratings/${ratingId}`, data),
	deleteRating: (ratingId: string) => api.delete(`/api/ratings/${ratingId}`),
};
