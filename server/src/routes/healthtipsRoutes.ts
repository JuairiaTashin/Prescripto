import { Router } from "express";
import {
    createHealthTip,
    getPublishedHealthTips,
    getHealthTipById,
    getDoctorHealthTips,
    updateHealthTip,
    deleteHealthTip,
    toggleLike,
    getHealthTipCategories,
} from "../controllers/HealthtipsController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Public routes
router.get("/published", getPublishedHealthTips);
router.get("/categories", getHealthTipCategories);
router.get("/:id", getHealthTipById);

// Protected routes
router.use(authenticateToken);

// Doctor-only routes
router.post("/", createHealthTip);
router.get("/doctor", getDoctorHealthTips);
router.put("/:id", updateHealthTip);
router.delete("/:id", deleteHealthTip);

// User routes
router.post("/:id/like", toggleLike);

export default router;
