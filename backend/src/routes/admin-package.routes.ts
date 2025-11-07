import { Router } from "express";
import {
  adminCreatePackage,
  adminListPackages,
  adminUpdatePackage,
} from "../controllers/package.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticateToken);
router.use(authorizeRole("ADMIN"));

router.get("/", adminListPackages);
router.post("/", adminCreatePackage);
router.put("/:packageId", adminUpdatePackage);
router.patch("/:packageId", adminUpdatePackage);

export default router;




