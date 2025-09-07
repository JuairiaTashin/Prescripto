import { Router } from "express";
import {
    processBkashPayment,
    processCardPayment,
    processAamarPayPayment,
    getPaymentDetails,
    getUserPaymentHistory,
    checkPaymentStatus,
} from "../controllers/PaymentController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Process payments
router.post("/appointment/:appointmentId/bkash", processBkashPayment);
router.post("/appointment/:appointmentId/card", processCardPayment);
router.post("/appointment/:appointmentId/aamarpay", processAamarPayPayment);

// Get payment information
router.get("/appointment/:appointmentId", getPaymentDetails);
router.get("/appointment/:appointmentId/status", checkPaymentStatus);
router.get("/history", getUserPaymentHistory);

export default router;
