import { Router } from "express";
import {
  cancelSubscription,
  getMySubscriptions,
  subscribeToPackage,
} from "../controllers/subscription.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticateToken);
router.use(authorizeRole("DRIVER"));

router.get("/", getMySubscriptions);
router.post("/packages/:packageId/subscribe", subscribeToPackage);
router.post("/:subscriptionId/cancel", cancelSubscription);

export default router;





