import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { FiUser, FiLogOut, FiMenu, FiX, FiSearch } from "react-icons/fi";
import { toast } from "react-hot-toast";

const Navbar = () => {
	const { user, isAuthenticated, logout } = useAuthStore();
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const navigate = useNavigate();

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
					<div className="flex items-center">
						<Link to="/" className="flex-shrink-0">
							<h1 className="text-2xl font-bold text-blue-600">
								Prescripto
							</h1>
						</Link>
					</div>

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
