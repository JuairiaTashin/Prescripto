import { Router } from "express";
import {
	register,
	login,
	getProfile,
	updateProfile,
	getDoctors,
	getDoctorById,
} from "../controllers/userController";
import { authenticateToken } from "../middleware/auth";
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

export default router;
