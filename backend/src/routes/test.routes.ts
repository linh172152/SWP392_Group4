import { Router } from "express";
import { testEmail, testWelcomeEmail } from "../controllers/test.controller";
import { testMaps, calculateDistance } from "../controllers/maps.controller";
import {
  testCloudinary,
  uploadTestImage,
  deleteTestImage,
} from "../controllers/cloudinary.controller";

const router = Router();

// Test routes
router.post("/email", testEmail);
router.post("/welcome-email", testWelcomeEmail);

// Maps routes
router.get("/maps", testMaps);
router.post("/distance", calculateDistance);

// Cloudinary routes
router.get("/cloudinary", testCloudinary);
router.post("/cloudinary/upload", uploadTestImage);
router.delete("/cloudinary/:publicId", deleteTestImage);

export default router;
