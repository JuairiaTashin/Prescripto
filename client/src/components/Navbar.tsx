import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { notificationAPI } from "../services/api";
import {
	FiUser,
	FiLogOut,
	FiMenu,
	FiX,
	FiSearch,
	FiBell,
	FiCalendar,
	FiClock,
	FiBookOpen,
	FiStar,
	FiActivity,
} from "react-icons/fi";
import { toast } from "react-hot-toast";

const Navbar = () => {
	const { user, isAuthenticated, logout } = useAuthStore();
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [unreadCount, setUnreadCount] = useState(0);
	const navigate = useNavigate();

	useEffect(() => {
		if (isAuthenticated) {
			fetchNotificationCount();
			// Fetch notification count every 30 seconds
			const interval = setInterval(fetchNotificationCount, 30000);
			return () => clearInterval(interval);
		}
	}, [isAuthenticated]);

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

	const handleLogout = () => {
		logout();
		toast.success("Logged out successfully");
		navigate("/");
		setIsMenuOpen(false);
	};

	const toggleMenu = () => {
		setIsMenuOpen(!isMenuOpen);
	};

	return (
		<nav className="bg-white shadow-md sticky top-0 z-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between h-16">
					{/* Logo */}
					<div className="flex items-center">
						<Link to="/" className="flex-shrink-0">
							<h1 className="text-2xl font-bold text-blue-600">
								Prescripto
							</h1>
						</Link>
					</div>

					{/* Desktop Menu */}
					<div className="hidden md:flex items-center space-x-8">
						<Link
							to="/"
							className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
						>
							Home
						</Link>
						<Link
							to="/doctors"
							className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1"
						>
							<FiSearch className="w-4 h-4" />
							Find Doctors
						</Link>

						{/* Newly Added Links */}
						<Link
							to="/appointments"
							className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1"
						>
							<FiCalendar className="w-4 h-4" />
							Appointments
						</Link>
						<Link
							to="/notifications"
							className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1 relative"
						>
							<FiBell className="w-4 h-4" />
							Notifications
							{unreadCount > 0 && (
								<span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
									{unreadCount > 99 ? "99+" : unreadCount}
								</span>
							)}
						</Link>
						<Link
							to="/reminders"
							className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1"
						>
							<FiClock className="w-4 h-4" />
							Reminders
						</Link>
						<Link
							to="/healthtips"
							className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1"
						>
							<FiBookOpen className="w-4 h-4" />
							Health Tips
						</Link>
						{isAuthenticated && user?.role === "patient" && (
							<Link
								to="/medical-history"
								className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1"
							>
								<FiActivity className="w-4 h-4" />
								Medical History
							</Link>
						)}
						{isAuthenticated && user?.role === "patient" && (
							<Link
								to="/ratings"
								className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1"
							>
								<FiStar className="w-4 h-4" />
								Ratings
							</Link>
						)}
						{isAuthenticated && user?.role === "doctor" && (
							<Link
								to="/create-healthtip"
								className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1"
							>
								<FiBookOpen className="w-4 h-4" />
								Create Health Tip
							</Link>
						)}

						{isAuthenticated && user?.role === "admin" && (
							<Link
								to="/admin/doctors"
								className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1"
							>
								<FiUser className="w-4 h-4" />
								Doctor Management
							</Link>
						)}

						{/* Auth Buttons */}
						{isAuthenticated ? (
							<div className="flex items-center space-x-4">
								<Link
									to="/profile"
									className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
								>
									<FiUser className="w-4 h-4" />
									<span>{user?.name}</span>
								</Link>
								<button
									onClick={handleLogout}
									className="flex items-center space-x-2 text-gray-700 hover:text-red-600 px-3 py-2 text-sm font-medium transition-colors"
								>
									<FiLogOut className="w-4 h-4" />
									<span>Logout</span>
								</button>
							</div>
						) : (
							<div className="flex items-center space-x-4">
								<Link
									to="/login"
									className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
								>
									Login
								</Link>
								<Link
									to="/register"
									className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
								>
									Sign Up
								</Link>
							</div>
						)}
					</div>

					{/* Mobile Menu Button */}
					<div className="md:hidden flex items-center">
						<button
							onClick={toggleMenu}
							className="text-gray-700 hover:text-blue-600 p-2"
						>
							{isMenuOpen ? (
								<FiX className="w-6 h-6" />
							) : (
								<FiMenu className="w-6 h-6" />
							)}
						</button>
					</div>
				</div>
			</div>

			{/* Mobile Menu */}
			{isMenuOpen && (
				<div className="md:hidden bg-white border-t border-gray-200">
					<div className="px-2 pt-2 pb-3 space-y-1">
						<Link
							to="/"
							className="block text-gray-700 hover:text-blue-600 px-3 py-2 text-base font-medium"
							onClick={() => setIsMenuOpen(false)}
						>
							Home
						</Link>
						<Link
							to="/doctors"
							className="block text-gray-700 hover:text-blue-600 px-3 py-2 text-base font-medium"
							onClick={() => setIsMenuOpen(false)}
						>
							Find Doctors
						</Link>
						<Link
							to="/appointments"
							className="block text-gray-700 hover:text-blue-600 px-3 py-2 text-base font-medium"
							onClick={() => setIsMenuOpen(false)}
						>
							Appointments
						</Link>
						<Link
							to="/notifications"
							className="block text-gray-700 hover:text-blue-600 px-3 py-2 text-base font-medium relative"
							onClick={() => setIsMenuOpen(false)}
						>
							Notifications
							{unreadCount > 0 && (
								<span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
									{unreadCount > 99 ? "99+" : unreadCount}
								</span>
							)}
						</Link>
						<Link
							to="/reminders"
							className="block text-gray-700 hover:text-blue-600 px-3 py-2 text-base font-medium"
							onClick={() => setIsMenuOpen(false)}
						>
							Reminders
						</Link>
						<Link
							to="/healthtips"
							className="block text-gray-700 hover:text-blue-600 px-3 py-2 text-base font-medium"
							onClick={() => setIsMenuOpen(false)}
						>
							Health Tips
						</Link>
						{isAuthenticated && user?.role === "patient" && (
							<Link
								to="/medical-history"
								className="block text-gray-700 hover:text-blue-600 px-3 py-2 text-base font-medium"
								onClick={() => setIsMenuOpen(false)}
							>
								Medical History
							</Link>
						)}
						{isAuthenticated && user?.role === "patient" && (
							<Link
								to="/ratings"
								className="block text-gray-700 hover:text-blue-600 px-3 py-2 text-base font-medium"
								onClick={() => setIsMenuOpen(false)}
							>
								Ratings & Reviews
							</Link>
						)}
						{isAuthenticated && user?.role === "doctor" && (
							<Link
								to="/create-healthtip"
								className="block text-gray-700 hover:text-blue-600 px-3 py-2 text-base font-medium"
								onClick={() => setIsMenuOpen(false)}
							>
								Create Health Tip
							</Link>
						)}

						{isAuthenticated && user?.role === "admin" && (
							<Link
								to="/admin/doctors"
								className="block text-gray-700 hover:text-blue-600 px-3 py-2 text-base font-medium"
								onClick={() => setIsMenuOpen(false)}
							>
								Doctor Management
							</Link>
						)}

						{isAuthenticated ? (
							<>
								<Link
									to="/profile"
									className="block text-gray-700 hover:text-blue-600 px-3 py-2 text-base font-medium"
									onClick={() => setIsMenuOpen(false)}
								>
									Profile ({user?.name})
								</Link>
								<button
									onClick={handleLogout}
									className="block w-full text-left text-gray-700 hover:text-red-600 px-3 py-2 text-base font-medium"
								>
									Logout
								</button>
							</>
						) : (
							<>
								<Link
									to="/login"
									className="block text-gray-700 hover:text-blue-600 px-3 py-2 text-base font-medium"
									onClick={() => setIsMenuOpen(false)}
								>
									Login
								</Link>
								<Link
									to="/register"
									className="block bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 text-base font-medium rounded-lg mx-3 text-center"
									onClick={() => setIsMenuOpen(false)}
								>
									Sign Up
								</Link>
							</>
						)}
					</div>
				</div>
			)}
		</nav>
	);
};

export default Navbar;
