import { Router } from "express";
import { testEmail, testWelcomeEmail } from "../controllers/test.controller";
import { testMaps, calculateDistance } from "../controllers/maps.controller";
import {
  testCloudinary,
  uploadTestImage,
  deleteTestImage,
} from "../controllers/cloudinary.controller";

const router = Router();

/**
 * @swagger
 * /api/test/email:
 *   post:
 *     summary: Test email service
 *     tags: [Test]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - subject
 *               - text
 *             properties:
 *               to:
 *                 type: string
 *                 format: email
 *               subject:
 *                 type: string
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email sent successfully
 *       500:
 *         description: Email sending failed
 */
router.post("/email", testEmail);

// Debug JWT secret
router.get("/jwt-secret", (_req, res) => {
  res.json({
    JWT_SECRET: process.env.JWT_SECRET ? "LOADED" : "NOT_LOADED",
    JWT_SECRET_LENGTH: process.env.JWT_SECRET?.length || 0,
    NODE_ENV: process.env.NODE_ENV,
  });
});

/**
 * @swagger
 * /api/test/welcome-email:
 *   post:
 *     summary: Test welcome email
 *     tags: [Test]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - name
 *             properties:
 *               to:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Welcome email sent successfully
 */
router.post("/welcome-email", testWelcomeEmail);

/**
 * @swagger
 * /api/test/maps:
 *   get:
 *     summary: Test Track-Asia maps service
 *     tags: [Test]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude coordinate
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude coordinate
 *     responses:
 *       200:
 *         description: Maps service working
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     coordinates:
 *                       type: object
 *                       properties:
 *                         lat:
 *                           type: number
 *                         lng:
 *                           type: number
 *                     geocoding:
 *                       type: object
 *                     token:
 *                       type: string
 *       400:
 *         description: Missing required parameters
 *       500:
 *         description: Maps service error
 */
router.get("/maps", testMaps);

/**
 * @swagger
 * /api/test/distance:
 *   post:
 *     summary: Calculate distance between two points
 *     tags: [Test]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lat1
 *               - lng1
 *               - lat2
 *               - lng2
 *             properties:
 *               lat1:
 *                 type: number
 *               lng1:
 *                 type: number
 *               lat2:
 *                 type: number
 *               lng2:
 *                 type: number
 *     responses:
 *       200:
 *         description: Distance calculated successfully
 */
router.post("/distance", calculateDistance);

/**
 * @swagger
 * /api/test/cloudinary:
 *   get:
 *     summary: Test Cloudinary service
 *     tags: [Test]
 *     responses:
 *       200:
 *         description: Cloudinary service working
 *       500:
 *         description: Cloudinary service error
 */
router.get("/cloudinary", testCloudinary);

/**
 * @swagger
 * /api/test/cloudinary/upload:
 *   post:
 *     summary: Upload test image to Cloudinary
 *     tags: [Test]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 */
router.post("/cloudinary/upload", uploadTestImage);

/**
 * @swagger
 * /api/test/cloudinary/{publicId}:
 *   delete:
 *     summary: Delete test image from Cloudinary
 *     tags: [Test]
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image deleted successfully
 */
router.delete("/cloudinary/:publicId", deleteTestImage);

export default router;
