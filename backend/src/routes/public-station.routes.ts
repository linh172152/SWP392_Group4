import { Router } from "express";
import {
  getPublicStations,
  getPublicStationDetails,
  findNearbyPublicStations,
} from "../controllers/public-station.controller";

const router = Router();

// Public station routes (no authentication required)
router.get("/", getPublicStations);
router.get("/nearby", findNearbyPublicStations);
router.get("/:id", getPublicStationDetails);

export default router;
