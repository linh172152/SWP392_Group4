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

// Support ticket routes
router.get("/", getUserTickets);
router.post("/", createSupportTicket);
router.get("/:id", getTicketDetails);
router.put("/:id", updateTicket);
router.get("/:id/replies", getTicketReplies);
router.post("/:id/replies", addTicketReply);
router.put("/:id/close", closeTicket);

export default router;
