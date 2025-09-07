import { Router } from "express";
import {
    createChatRoom,
    getChatRoom,
    sendMessage,
    getUserChatRooms,
    endChatRoom,
} from "../controllers/LivechatController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Create a chat room
router.post("/create", createChatRoom);

// Get chat room for an appointment
router.get("/appointment/:appointmentId", getChatRoom);

// Send a message in chat room
router.post("/appointment/:appointmentId/message", sendMessage);

// Get user's chat rooms
router.get("/user", getUserChatRooms);

// End chat room (doctors only)
router.put("/appointment/:appointmentId/end", endChatRoom);

export default router;