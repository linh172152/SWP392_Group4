import { Router } from "express";
import {
  createRating,
  getRatings,
  getRatingDetails,
  updateRating,
  deleteRating,
  getStationRatings,
  getStationRatingSummary,
} from "../controllers/rating.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

// Public routes (no auth required)
router.get("/", getRatings);
router.get("/:id", getRatingDetails);
router.get("/stations/:id", getStationRatings);
router.get("/stations/:id/summary", getStationRatingSummary);

// Authenticated routes
router.post("/", authenticateToken, createRating);
router.put("/:id", authenticateToken, updateRating);
router.delete("/:id", authenticateToken, deleteRating);

export default router;
