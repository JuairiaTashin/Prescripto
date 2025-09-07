import { Router } from "express";
import {
    getUserReminders,
    deleteReminder,
    getUpcomingReminders,
} from "../controllers/ReminderController";
import { authenticateToken } from "../middleware/auth";


const router = Router();


// All routes require authentication
router.use(authenticateToken);


// Get user reminders
router.get("/", getUserReminders);


// Get upcoming reminders (for dashboard)
router.get("/upcoming", getUpcomingReminders);


// Delete reminder
router.delete("/:id", deleteReminder);


export default router;
