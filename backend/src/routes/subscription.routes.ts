import { Router } from "express";
import {
  getUserSubscriptions,
  createSubscription,
  getSubscriptionDetails,
  cancelSubscription,
} from "../controllers/subscription.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get("/", getUserSubscriptions);
router.post("/", createSubscription);
router.get("/:id", getSubscriptionDetails);
router.put("/:id/cancel", cancelSubscription);

export default router;
