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
};
