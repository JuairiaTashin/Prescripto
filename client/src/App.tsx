import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Doctors from "./pages/Doctors";
import DoctorProfile from "./pages/DoctorProfile";
import Profile from "./pages/Profile";
import "./App.css";

function App() {
	return (
		<Router>
			<div className="min-h-screen bg-gray-50">
				<Navbar />
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/login" element={<Login />} />
					<Route path="/register" element={<Register />} />
					<Route path="/doctors" element={<Doctors />} />
					<Route path="/doctors/:id" element={<DoctorProfile />} />
					<Route path="/profile" element={<Profile />} />
				</Routes>
				<Toaster
					position="top-right"
					toastOptions={{
						duration: 4000,
						style: {
							background: "#ffffff",
							color: "#374151",
							border: "1px solid #e5e7eb",
							borderRadius: "0.75rem",
							boxShadow:
								"0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
						},
						success: {
							iconTheme: {
								primary: "#10b981",
								secondary: "#ffffff",
							},
						},
						error: {
							iconTheme: {
								primary: "#ef4444",
								secondary: "#ffffff",
							},
						},
					}}
				/>
			</div>
		</Router>
	);
}

export default App;
