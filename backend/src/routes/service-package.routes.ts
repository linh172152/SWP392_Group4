import { Router } from "express";
import {
  getServicePackages,
  getServicePackageDetails,
  createServicePackage,
  updateServicePackage,
  deleteServicePackage,
} from "../controllers/service-package.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { authorizeRole } from "../middlewares/auth.middleware";

const router = Router();

// Public routes (no auth required)
router.get("/", getServicePackages);
router.get("/:id", getServicePackageDetails);

// Admin only routes
router.post(
  "/",
  authenticateToken,
  authorizeRole("ADMIN"),
  createServicePackage
);
router.put(
  "/:id",
  authenticateToken,
  authorizeRole("ADMIN"),
  updateServicePackage
);
router.delete(
  "/:id",
  authenticateToken,
  authorizeRole("ADMIN"),
  deleteServicePackage
);

export default router;
