import { Router } from "express";
import {
    createRating,
    getDoctorRatings,
    getDoctorRatingsWithUserContext,
    getPatientRatings,
    updateRating,
    deleteRating,
    getDoctorRatingStats,
    getRateableAppointments,
    getAllRatingsForDashboard,
} from "../controllers/RatingController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Create a rating and review
router.post("/", createRating);

// Get ratings for a specific doctor
router.get("/doctor/:doctorId", getDoctorRatings);

// Get ratings for a specific doctor with user context (shows edit/delete permissions)
router.get("/doctor/:doctorId/with-context", getDoctorRatingsWithUserContext);

// Get rating statistics for a doctor
router.get("/doctor/:doctorId/stats", getDoctorRatingStats);

// Get all ratings globally for dashboard
router.get("/dashboard/all", getAllRatingsForDashboard);

// Get patient's own ratings
router.get("/patient", getPatientRatings);

// Get appointments that can be rated (have consultations)
router.get("/rateable-appointments", getRateableAppointments);

// Update a rating
router.put("/:ratingId", updateRating);

// Delete a rating
router.delete("/:ratingId", deleteRating);

export default router;
