import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { FiSearch, FiUser, FiCalendar, FiStar } from "react-icons/fi";

const Home = () => {
	const { user, isAuthenticated } = useAuthStore();

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
			<section className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white py-20 relative overflow-hidden">
				<div className="absolute inset-0 bg-black opacity-10"></div>
				<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center">
						<h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
							Your Health,{" "}
							<span className="text-blue-200">Our Priority</span>
						</h1>
						<p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto leading-relaxed">
							Connect with Bangladesh's finest doctors and get
							quality healthcare from the comfort of your home
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Link
								to="/doctors"
								className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
							>
								<FiSearch className="w-5 h-5" />
								Find Doctors
							</Link>
							{!isAuthenticated && (
								<Link
									to="/register"
									className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-xl transform hover:-translate-y-1"
								>
									<FiUser className="w-5 h-5" />
									Join Now
								</Link>
							)}
						</div>
					</div>
				</div>
			</section>

			<section className="py-16">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
							Why Choose{" "}
							<span className="text-blue-600">Prescripto</span>?
						</h2>
						<p className="text-xl text-gray-600">
							Your trusted healthcare companion in Bangladesh
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						<div className="bg-white p-8 rounded-xl shadow-lg text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
							<div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
								<FiSearch className="w-8 h-8 text-white" />
							</div>
							<h3 className="text-xl font-bold mb-4 text-gray-900">
								Find Expert Doctors
							</h3>
							<p className="text-gray-600 leading-relaxed">
								Search and discover qualified doctors by
								specialty, location, and expertise from across
								Bangladesh
							</p>
						</div>

						<div className="bg-white p-8 rounded-xl shadow-lg text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
							<div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
								<FiCalendar className="w-8 h-8 text-white" />
							</div>
							<h3 className="text-xl font-bold mb-4 text-gray-900">
								Easy Appointment
							</h3>
							<p className="text-gray-600 leading-relaxed">
								Book appointments with your preferred doctors
								quickly and easily with our streamlined booking
								system
							</p>
						</div>

						<div className="bg-white p-8 rounded-xl shadow-lg text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
							<div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
								<FiStar className="w-8 h-8 text-white" />
							</div>
							<h3 className="text-xl font-bold mb-4 text-gray-900">
								Quality Assured
							</h3>
							<p className="text-gray-600 leading-relaxed">
								Connect with verified doctors providing quality
								healthcare services with professional excellence
							</p>
						</div>
					</div>
				</div>
			</section>

			<section className="bg-gradient-to-r from-blue-50 to-indigo-50 py-16">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
							Medical{" "}
							<span className="text-blue-600">Specialties</span>
						</h2>
						<p className="text-xl text-gray-600">
							Find experienced doctors from various medical
							specialties
						</p>
					</div>

					<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
						{[
							{
								name: "Physician",
								color: "from-blue-500 to-blue-600",
							},
							{
								name: "Gynecologist",
								color: "from-pink-500 to-pink-600",
							},
							{
								name: "Dermatologist",
								color: "from-green-500 to-green-600",
							},
							{
								name: "Pediatrician",
								color: "from-yellow-500 to-yellow-600",
							},
							{
								name: "Neurologist",
								color: "from-purple-500 to-purple-600",
							},
							{
								name: "Cardiologist",
								color: "from-red-500 to-red-600",
							},
							{
								name: "Orthopedic",
								color: "from-indigo-500 to-indigo-600",
							},
							{
								name: "Psychiatrist",
								color: "from-teal-500 to-teal-600",
							},
							{
								name: "ENT",
								color: "from-orange-500 to-orange-600",
							},
							{
								name: "Urologist",
								color: "from-cyan-500 to-cyan-600",
							},
							{
								name: "Ophthalmologist",
								color: "from-emerald-500 to-emerald-600",
							},
							{
								name: "Gastroenterologist",
								color: "from-violet-500 to-violet-600",
							},
						].map((specialty) => (
							<Link
								key={specialty.name}
								to={`/doctors?specialty=${specialty.name}`}
								className={`bg-gradient-to-r ${specialty.color} text-white p-4 rounded-xl text-center hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:scale-105`}
							>
								<div className="text-sm font-semibold">
									{specialty.name}
								</div>
							</Link>
						))}
					</div>
				</div>
			</section>

			{isAuthenticated && user && (
				<section className="py-16">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-8 rounded-xl text-center shadow-lg">
							<h2 className="text-2xl md:text-3xl font-bold mb-4">
								Welcome back, {user.name}!
							</h2>
							<p className="text-green-100 mb-6">
								{user.role === "doctor"
									? "Manage your profile and help patients find you"
									: "Find the best doctors for your healthcare needs"}
							</p>
							<Link
								to={
									user.role === "doctor"
										? "/profile"
										: "/doctors"
								}
								className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center gap-2 shadow-md"
							>
								{user.role === "doctor" ? (
									<>
										<FiUser className="w-5 h-5" />
										Manage Profile
									</>
								) : (
									<>
										<FiSearch className="w-5 h-5" />
										Find Doctors
									</>
								)}
							</Link>
						</div>
					</div>
				</section>
			)}
		</div>
	);
};

export default Home;
