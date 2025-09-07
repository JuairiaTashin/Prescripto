import { Router } from "express";
import {
	register,
	login,
	getProfile,
	updateProfile,
	getDoctors,
	getDoctorById,
	adminCreateDoctor,
	adminDeleteDoctor,
} from "../controllers/userController";
import { authenticateToken, authorizeRole } from "../middleware/auth";
import { upload } from "../middleware/upload";

const router = Router();

router.post("/register", upload.single("profilePicture"), register);
router.post("/login", login);
router.get("/profile", authenticateToken, getProfile);
router.put(
	"/profile",
	authenticateToken,
	upload.single("profilePicture"),
	updateProfile
);
router.get("/doctors", getDoctors);
router.get("/doctors/:id", getDoctorById);
// Admin routes for managing doctors
router.post(
	"/admin/doctors",
	authenticateToken,
	authorizeRole("admin"),
	upload.single("profilePicture"),
	adminCreateDoctor
);
router.delete(
	"/admin/doctors/:id",
	authenticateToken,
	authorizeRole("admin"),
	adminDeleteDoctor
);

export default router;
