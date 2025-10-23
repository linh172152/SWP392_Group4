import { Router } from "express";
import {
  getUserTickets,
  createSupportTicket,
  getTicketDetails,
  updateTicket,
  getTicketReplies,
  addTicketReply,
  closeTicket,
} from "../controllers/support.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * components:
 *   schemas:
 *     SupportTicket:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         user_id:
 *           type: string
 *         subject:
 *           type: string
 *         description:
 *           type: string
 *         status:
 *           type: string
 *           enum: [OPEN, IN_PROGRESS, RESOLVED, CLOSED]
 *         priority:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, URGENT]
 *         created_at:
 *           type: string
 *           format: date-time
 *     SupportReply:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         ticket_id:
 *           type: string
 *         user_id:
 *           type: string
 *         message:
 *           type: string
 *         is_staff_reply:
 *           type: boolean
 *         created_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/support:
 *   get:
 *     summary: Get user support tickets
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, IN_PROGRESS, RESOLVED, CLOSED]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, URGENT]
 *     responses:
 *       200:
 *         description: Support tickets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SupportTicket'
 *       401:
 *         description: Unauthorized
 */
router.get("/", getUserTickets);

/**
 * @swagger
 * /api/support:
 *   post:
 *     summary: Create support ticket
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - description
 *             properties:
 *               subject:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *                 default: MEDIUM
 *     responses:
 *       201:
 *         description: Support ticket created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SupportTicket'
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 */
router.post("/", createSupportTicket);

/**
 * @swagger
 * /api/support/{id}:
 *   get:
 *     summary: Get ticket details
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ticket details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SupportTicket'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Ticket not found
 */
router.get("/:id", getTicketDetails);

/**
 * @swagger
 * /api/support/{id}:
 *   put:
 *     summary: Update ticket
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *     responses:
 *       200:
 *         description: Ticket updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Ticket not found
 */
router.put("/:id", updateTicket);

/**
 * @swagger
 * /api/support/{id}/replies:
 *   get:
 *     summary: Get ticket replies
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ticket replies retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SupportReply'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Ticket not found
 */
router.get("/:id/replies", getTicketReplies);

/**
 * @swagger
 * /api/support/{id}/replies:
 *   post:
 *     summary: Add ticket reply
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Reply added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SupportReply'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Ticket not found
 */
router.post("/:id/replies", addTicketReply);

/**
 * @swagger
 * /api/support/{id}/close:
 *   put:
 *     summary: Close ticket
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ticket closed successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Ticket not found
 */
router.put("/:id/close", closeTicket);

export default router;
