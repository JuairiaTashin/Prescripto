import { Router } from "express";
import { processRemindersOnDemand } from "../services/cronService";

const router = Router();

// Manual reminder processing endpoint (for testing and manual triggers)
router.post("/process-reminders", async (req, res) => {
    try {
        const result = await processRemindersOnDemand();
        
        if (result.success) {
            res.status(200).json({
                success: true,
                message: result.message,
                timestamp: new Date().toISOString(),
            });
        } else {
            res.status(500).json({
                success: false,
                message: result.message,
                timestamp: new Date().toISOString(),
            });
        }
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to process reminders",
            error: error.message,
            timestamp: new Date().toISOString(),
        });
    }
});

// Health check endpoint for cron monitoring
router.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Cron service is running",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

export default router;
