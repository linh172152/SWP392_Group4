import { Router } from "express";
import {
  getUserVehicles,
  addVehicle,
  getVehicleDetails,
  updateVehicle,
  deleteVehicle,
} from "../controllers/vehicle.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Vehicle management routes
router.get("/", getUserVehicles);
router.post("/", addVehicle);
router.get("/:id", getVehicleDetails);
router.put("/:id", updateVehicle);
router.delete("/:id", deleteVehicle);

export default router;
