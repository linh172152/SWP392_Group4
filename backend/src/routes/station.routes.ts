import { Router } from "express";
import {
  findNearbyStations,
  getStationDetails,
  getStationBatteries,
  searchStations,
} from "../controllers/station.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Station discovery routes
router.get("/nearby", findNearbyStations);
router.get("/search", searchStations);
router.get("/:id", getStationDetails);
router.get("/:id/batteries", getStationBatteries);

export default router;
