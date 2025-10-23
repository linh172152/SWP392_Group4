import { Router } from "express";
import {
  getAllUsers,
  getUserDetails,
  createUser,
  updateUser,
  updateUserStatus,
  updateUserRole,
  deleteUser,
} from "../controllers/admin-user.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middlewares/auth.middleware";

const router = Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(authorizeRole("ADMIN"));

// Admin user management routes
router.get("/", getAllUsers);
router.get("/:id", getUserDetails);
router.post("/", createUser);
router.put("/:id", updateUser);
router.put("/:id/status", updateUserStatus);
router.put("/:id/role", updateUserRole);
router.delete("/:id", deleteUser);

export default router;
