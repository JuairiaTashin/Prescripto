import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
	_id: string;
	name: string;
	email: string;
	role: "patient" | "doctor";
	phone: string;
	address: string;
	profilePicture: string;
	dateOfBirth?: string;
	gender?: "male" | "female" | "other";
	specialty?: string;
	experience?: number;
	degree?: string;
	bmdc?: string;
	consultationFee?: number;
	bio?: string;
	availableHours?: {
		start: string;
		end: string;
	};
	isVerified?: boolean;
	createdAt: string;
	updatedAt: string;
}

interface AuthStore {
	user: User | null;
	token: string | null;
	isAuthenticated: boolean;
	login: (user: User, token: string) => void;
	logout: () => void;
	updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthStore>()(
	persist(
		(set) => ({
			user: null,
			token: null,
			isAuthenticated: false,
			login: (user, token) =>
				set({
					user,
					token,
					isAuthenticated: true,
				}),
			logout: () =>
				set({
					user: null,
					token: null,
					isAuthenticated: false,
				}),
			updateUser: (user) =>
				set((state) => ({
					...state,
					user,
				})),
		}),
		{
			name: "auth-storage",
		}
	)
);
