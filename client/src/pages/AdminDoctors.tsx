import { useState, useEffect } from "react";
import { doctorAPI } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { toast } from "react-hot-toast";

const isValidEmail = (e?: string) =>
	!!e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

const ConfirmDialog = ({ open, title, onCancel, onConfirm }: any) => {
	if (!open) return null;
	return (
		<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg p-6 w-full max-w-md">
				<h3 className="text-lg font-semibold mb-4">{title}</h3>
				<div className="flex justify-end gap-2">
					<button
						onClick={onCancel}
						className="px-4 py-2 rounded border"
					>
						Cancel
					</button>
					<button
						onClick={onConfirm}
						className="px-4 py-2 rounded bg-red-600 text-white"
					>
						Delete
					</button>
				</div>
			</div>
		</div>
	);
};

const AdminDoctors = () => {
	const { user } = useAuthStore();
	const [doctors, setDoctors] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [form, setForm] = useState<any>({});
	const [file, setFile] = useState<File | null>(null);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedSpecialtyFilter, setSelectedSpecialtyFilter] =
		useState("All Specialties");
	const [sortBy, setSortBy] = useState<"newest" | "experience" | "fee">(
		"newest"
	);
	// removed hoveredDoctor state — using CSS group-hover for inline details

	const fetchDoctors = async (opts?: {
		specialty?: string;
		search?: string;
	}) => {
		setLoading(true);
		try {
			const params: any = { page: 1, limit: 1000 };
			if (
				opts?.specialty &&
				opts.specialty !== "All Specialties" &&
				opts.specialty !== "all"
			)
				params.specialty = opts.specialty;
			if (opts?.search) params.search = opts.search;

			const res = await doctorAPI.getDoctors(params);
			let list = res.data.data.doctors || [];

			// client-side sort
			if (sortBy === "experience") {
				list = list.sort(
					(a: any, b: any) =>
						(b.experience || 0) - (a.experience || 0)
				);
			} else if (sortBy === "fee") {
				list = list.sort(
					(a: any, b: any) =>
						(a.consultationFee || 0) - (b.consultationFee || 0)
				);
			} else {
				// newest
				list = list.sort(
					(a: any, b: any) =>
						new Date(b.createdAt).getTime() -
						new Date(a.createdAt).getTime()
				);
			}

			setDoctors(list);
		} catch (err) {
			toast.error("Failed to fetch doctors");
		} finally {
			setLoading(false);
		}
	};

	const specialties = [
		"All Specialties",
		"Physician",
		"Gynecologist",
		"Dermatologist",
		"Pediatrician",
		"Neurologist",
		"Cardiologist",
		"Orthopedic",
		"Psychiatrist",
		"Ophthalmologist",
		"ENT",
		"Urologist",
		"Gastroenterologist",
	];

	const handleSearchSubmit = (e?: any) => {
		if (e) e.preventDefault();
		fetchDoctors({
			specialty: selectedSpecialtyFilter,
			search: searchTerm,
		});
	};

	const handleResetFilters = () => {
		setSearchTerm("");
		setSelectedSpecialtyFilter("All Specialties");
		setSortBy("newest");
		fetchDoctors();
	};

	const handleSortChange = (value: typeof sortBy) => {
		setSortBy(value);
		// re-sort current list
		let list = [...doctors];
		if (value === "experience")
			list = list.sort(
				(a: any, b: any) => (b.experience || 0) - (a.experience || 0)
			);
		else if (value === "fee")
			list = list.sort(
				(a: any, b: any) =>
					(a.consultationFee || 0) - (b.consultationFee || 0)
			);
		else
			list = list.sort(
				(a: any, b: any) =>
					new Date(b.createdAt).getTime() -
					new Date(a.createdAt).getTime()
			);
		setDoctors(list);
	};

	useEffect(() => {
		fetchDoctors();
	}, []);
	const isFormValid = () => {
		// Pure check - don't call setState here to avoid re-renders
		const required = [
			"name",
			"email",
			"password",
			"phone",
			"address",
			"specialty",
			"experience",
			"degree",
			"bmdc",
			"consultationFee",
		];
		for (const k of required) {
			const val = form[k];
			if (val === undefined || val === null || val === "") return false;
		}
		if (!isValidEmail(form.email)) return false;
		if (typeof form.password !== "string" || form.password.length < 6)
			return false;
		if (
			isNaN(Number(form.experience)) ||
			isNaN(Number(form.consultationFee))
		)
			return false;
		if (!file) return false;
		// ensure no validation errors present
		for (const v of Object.values(errors)) {
			if (v) return false;
		}
		return true;
	};

	const validateField = (name: string, value: any) => {
		let err = "";
		if (name === "name") {
			if (!value) err = "Name is required";
		}
		if (name === "email") {
			if (!value) err = "Email is required";
			else if (!isValidEmail(value)) err = "Invalid email";
		}
		if (name === "password") {
			if (!value) err = "Password is required";
			else if (value.length < 6)
				err = "Password must be at least 6 characters";
		}
		if (name === "phone") {
			if (!value) err = "Phone is required";
		}
		if (name === "address") {
			if (!value) err = "Address is required";
		}
		if (name === "specialty") {
			if (!value) err = "Specialty is required";
		}
		if (name === "experience") {
			if (value === undefined || value === "")
				err = "Experience is required";
			else if (isNaN(Number(value))) err = "Experience must be a number";
		}
		if (name === "degree") {
			if (!value) err = "Degree is required";
		}
		if (name === "bmdc") {
			if (!value) err = "BMDC is required";
		}
		if (name === "consultationFee") {
			if (value === undefined || value === "")
				err = "Consultation fee is required";
			else if (isNaN(Number(value))) err = "Fee must be a number";
		}
		setErrors((s) => ({ ...s, [name]: err }));
		return err === "";
	};

	const handleChange = (e: any) => {
		const { name, value } = e.target;
		setForm((f: any) => ({ ...f, [name]: value }));
		validateField(name, value);
	};

	const handleFile = (e: any) => {
		const f = e.target.files?.[0] || null;
		setFile(f);
		if (!f)
			setErrors((s) => ({
				...s,
				profilePicture: "Profile picture required",
			}));
		else setErrors((s) => ({ ...s, profilePicture: "" }));
	};

	const handleCreate = async (e: any) => {
		e.preventDefault();
		// client-side validation
		if (
			!form.name ||
			!form.email ||
			!form.password ||
			!form.phone ||
			!form.address
		) {
			toast.error("Please fill all required fields");
			return;
		}
		if (!isValidEmail(form.email)) {
			toast.error("Invalid email");
			return;
		}
		if (typeof form.password !== "string" || form.password.length < 6) {
			toast.error("Password must be at least 6 characters");
			return;
		}
		if (
			!form.specialty ||
			!form.experience ||
			!form.degree ||
			!form.bmdc ||
			!form.consultationFee
		) {
			toast.error("Please provide doctor-specific fields");
			return;
		}
		if (
			isNaN(Number(form.experience)) ||
			isNaN(Number(form.consultationFee))
		) {
			toast.error("Experience and Fee must be numbers");
			return;
		}
		if (!file) return toast.error("Profile picture required");

		const formData = new FormData();
		Object.keys(form).forEach((k) => formData.append(k, form[k]));
		formData.append("profilePicture", file);
		try {
			const res = await doctorAPI.adminCreateDoctor(formData);
			if (res.data.success) {
				toast.success("Doctor created");
				setForm({});
				setFile(null);
				fetchDoctors();
			}
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message || "Failed to create doctor"
			);
		}
	};

	const [confirmOpen, setConfirmOpen] = useState(false);
	const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(
		null
	);

	const handleDeleteClick = (id: string) => {
		setSelectedDeleteId(id);
		setConfirmOpen(true);
	};

	const handleCancelDelete = () => {
		setSelectedDeleteId(null);
		setConfirmOpen(false);
	};

	const handleConfirmDelete = async () => {
		if (!selectedDeleteId) return;
		try {
			const res = await doctorAPI.adminDeleteDoctor(selectedDeleteId);
			if (res.data.success) {
				toast.success("Doctor deleted");
				fetchDoctors();
			}
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message || "Failed to delete doctor"
			);
		} finally {
			setSelectedDeleteId(null);
			setConfirmOpen(false);
		}
	};

	if (!user || user.role !== "admin") return null;

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<h1 className="text-2xl font-bold mb-4">Doctor Management</h1>

				<div className="bg-white p-6 rounded-lg shadow mb-8">
					<h2 className="font-semibold mb-4">Create Doctor</h2>
					<form
						onSubmit={handleCreate}
						className="grid grid-cols-1 md:grid-cols-2 gap-4"
					>
						<div>
							<input
								name="name"
								placeholder="Name"
								value={form.name || ""}
								onChange={handleChange}
								className={`p-2 border rounded w-full ${
									errors.name ? "border-red-500" : ""
								}`}
							/>
							{errors.name && (
								<div className="text-red-500 text-sm mt-1">
									{errors.name}
								</div>
							)}
						</div>
						<div>
							<input
								name="email"
								placeholder="Email"
								value={form.email || ""}
								onChange={handleChange}
								className={`p-2 border rounded w-full ${
									errors.email ? "border-red-500" : ""
								}`}
							/>
							{errors.email && (
								<div className="text-red-500 text-sm mt-1">
									{errors.email}
								</div>
							)}
						</div>
						<div>
							<input
								name="password"
								type="password"
								placeholder="Password"
								value={form.password || ""}
								onChange={handleChange}
								className={`p-2 border rounded w-full ${
									errors.password ? "border-red-500" : ""
								}`}
							/>
							{errors.password && (
								<div className="text-red-500 text-sm mt-1">
									{errors.password}
								</div>
							)}
						</div>
						<div>
							<input
								name="phone"
								placeholder="Phone"
								value={form.phone || ""}
								onChange={handleChange}
								className={`p-2 border rounded w-full ${
									errors.phone ? "border-red-500" : ""
								}`}
							/>
							{errors.phone && (
								<div className="text-red-500 text-sm mt-1">
									{errors.phone}
								</div>
							)}
						</div>
						<div>
							<input
								name="address"
								placeholder="Address"
								value={form.address || ""}
								onChange={handleChange}
								className={`p-2 border rounded w-full ${
									errors.address ? "border-red-500" : ""
								}`}
							/>
							{errors.address && (
								<div className="text-red-500 text-sm mt-1">
									{errors.address}
								</div>
							)}
						</div>
						<div>
							<select
								name="specialty"
								title="specialty"
								aria-label="specialty"
								value={form.specialty || "Physician"}
								onChange={handleChange}
								className={`p-2 border rounded w-full ${
									errors.specialty ? "border-red-500" : ""
								}`}
							>
								<option>Physician</option>
								<option>Gynecologist</option>
								<option>Dermatologist</option>
								<option>Pediatrician</option>
								<option>Neurologist</option>
								<option>Cardiologist</option>
							</select>
							{errors.specialty && (
								<div className="text-red-500 text-sm mt-1">
									{errors.specialty}
								</div>
							)}
						</div>
						<div>
							<input
								name="experience"
								placeholder="Experience"
								value={form.experience || ""}
								onChange={handleChange}
								className={`p-2 border rounded w-full ${
									errors.experience ? "border-red-500" : ""
								}`}
							/>
							{errors.experience && (
								<div className="text-red-500 text-sm mt-1">
									{errors.experience}
								</div>
							)}
						</div>
						<div>
							<input
								name="degree"
								placeholder="Degree"
								value={form.degree || ""}
								onChange={handleChange}
								className={`p-2 border rounded w-full ${
									errors.degree ? "border-red-500" : ""
								}`}
							/>
							{errors.degree && (
								<div className="text-red-500 text-sm mt-1">
									{errors.degree}
								</div>
							)}
						</div>
						<div>
							<input
								name="bmdc"
								placeholder="BMDC"
								value={form.bmdc || ""}
								onChange={handleChange}
								className={`p-2 border rounded w-full ${
									errors.bmdc ? "border-red-500" : ""
								}`}
							/>
							{errors.bmdc && (
								<div className="text-red-500 text-sm mt-1">
									{errors.bmdc}
								</div>
							)}
						</div>
						<div>
							<input
								name="consultationFee"
								placeholder="Fee"
								value={form.consultationFee || ""}
								onChange={handleChange}
								className={`p-2 border rounded w-full ${
									errors.consultationFee
										? "border-red-500"
										: ""
								}`}
							/>
							{errors.consultationFee && (
								<div className="text-red-500 text-sm mt-1">
									{errors.consultationFee}
								</div>
							)}
						</div>
						<div className="col-span-full">
							<input
								type="file"
								title="profilePicture"
								aria-label="profilePicture"
								onChange={handleFile}
								className={`w-full ${
									errors.profilePicture
										? "border-red-500"
										: ""
								}`}
							/>
							{errors.profilePicture && (
								<div className="text-red-500 text-sm mt-1">
									{errors.profilePicture}
								</div>
							)}
						</div>
						<button
							type="submit"
							disabled={!isFormValid()}
							className={`col-span-full p-2 rounded text-white ${
								isFormValid()
									? "bg-blue-600 hover:bg-blue-700"
									: "bg-blue-600 opacity-50 cursor-not-allowed"
							}`}
						>
							Create Doctor
						</button>
					</form>
				</div>

				<div className="bg-white p-6 rounded-lg shadow">
					<div className="flex items-center justify-between mb-4">
						<h2 className="font-semibold">Existing Doctors</h2>
						<div className="flex items-center gap-2">
							<form
								onSubmit={handleSearchSubmit}
								className="flex items-center gap-2"
							>
								<input
									value={searchTerm}
									onChange={(e) =>
										setSearchTerm(e.target.value)
									}
									placeholder="Search by name, specialty"
									className="p-2 border rounded"
								/>
								<select
									aria-label="Filter by specialty"
									value={selectedSpecialtyFilter}
									onChange={(e) =>
										setSelectedSpecialtyFilter(
											e.target.value
										)
									}
									className="p-2 border rounded"
								>
									{[
										"All Specialties",
										...specialties.filter(
											(s) => s !== "All Specialties"
										),
									].map((s) => (
										<option key={s} value={s}>
											{s}
										</option>
									))}
								</select>
								<select
									aria-label="Sort doctors"
									value={sortBy}
									onChange={(e) =>
										handleSortChange(e.target.value as any)
									}
									className="p-2 border rounded"
								>
									<option value="newest">Newest</option>
									<option value="experience">
										Experience
									</option>
									<option value="fee">
										Fee (low → high)
									</option>
								</select>
								<button
									type="submit"
									className="px-3 py-2 bg-blue-600 text-white rounded"
								>
									Search
								</button>
							</form>
							<button
								onClick={() =>
									fetchDoctors({
										specialty: selectedSpecialtyFilter,
										search: searchTerm,
									})
								}
								className="px-3 py-2 border rounded"
							>
								Refresh
							</button>
							<button
								onClick={handleResetFilters}
								className="px-3 py-2 border rounded"
							>
								Reset
							</button>
						</div>
					</div>
					{loading ? (
						<div>Loading...</div>
					) : (
						<div className="space-y-4">
							<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
								{doctors.map((d) => (
									<div
										key={d._id}
										className="p-4 border rounded hover:shadow-lg transition-shadow duration-150 bg-white flex flex-col justify-between h-56"
									>
										<div>
											<div className="flex items-center justify-between">
												<div>
													<div className="font-semibold text-lg">
														Dr. {d.name}
													</div>
													<div className="text-sm text-gray-600">
														{d.specialty} •{" "}
														{d.degree}
													</div>
												</div>
												<div className="ml-4">
													<div className="text-sm text-gray-500 text-right">
														{d.experience} yrs
													</div>
													<div className="text-sm text-gray-500 text-right">
														${d.consultationFee}
													</div>
												</div>
											</div>

											<div className="mt-2 text-sm text-gray-700 max-h-20 overflow-hidden">
												{d.bio ||
													"No additional bio available."}
											</div>
										</div>

										<div className="mt-3 flex justify-end">
											<button
												onClick={() =>
													handleDeleteClick(d._id)
												}
												className="bg-red-600 text-white px-3 py-1 rounded"
											>
												Delete
											</button>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
					{/* hover card removed; inline group-hover details used instead */}
				</div>

				<ConfirmDialog
					open={confirmOpen}
					title="Delete doctor permanently?"
					onCancel={handleCancelDelete}
					onConfirm={handleConfirmDelete}
				/>
			</div>
		</div>
	);
};

export default AdminDoctors;
