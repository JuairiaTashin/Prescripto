import { Router } from "express";
import {
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    getNotificationCount,
} from "../controllers/NotificationController";
import { authenticateToken } from "../middleware/auth";


const router = Router();


// All routes require authentication
router.use(authenticateToken);


// Get user notifications
router.get("/", getUserNotifications);


// Get notification count
router.get("/count", getNotificationCount);


// Mark notification as read
router.put("/:id/read", markNotificationAsRead);


// Mark all notifications as read
router.put("/read-all", markAllNotificationsAsRead);


// Delete notification
router.delete("/:id", deleteNotification);


export default router;




