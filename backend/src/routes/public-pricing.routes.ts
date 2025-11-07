import { Router } from "express";
import {
  getBatteryPricing,
  getBatteryPricingById,
} from "../controllers/battery-pricing.controller";

const router = Router();

// Public pricing endpoints: read-only access, no auth required
router.get("/", getBatteryPricing);
router.get("/:id", getBatteryPricingById);

export default router;

