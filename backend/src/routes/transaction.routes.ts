import { Router } from "express";
import {
  getUserTransactions,
  getTransactionDetails,
  getTransactionStats,
  createRefundRequest,
} from "../controllers/transaction.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Transaction management routes
router.get("/", getUserTransactions);
router.get("/stats", getTransactionStats);
router.get("/:id", getTransactionDetails);
router.post("/refund", createRefundRequest);

export default router;
