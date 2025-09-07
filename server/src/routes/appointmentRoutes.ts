import { Router } from "express";
import {
    getAvailableSlots,
    bookAppointment,
    getUserAppointments,
    cancelAppointment,
    rescheduleAppointment,
    updateAppointmentStatus,
    getAppointmentById,
} from "../controllers/AppointmentController";
import { authenticateToken } from "../middleware/auth";


const router = Router();


// Public routes
router.get("/slots", getAvailableSlots);


// Protected routes
router.post("/book", authenticateToken, bookAppointment);
router.get("/user", authenticateToken, getUserAppointments);
router.get("/:id", authenticateToken, getAppointmentById);
router.put("/:id/cancel", authenticateToken, cancelAppointment);
router.put("/:id/reschedule", authenticateToken, rescheduleAppointment);
router.put("/:id/status", authenticateToken, updateAppointmentStatus);


export default router;




