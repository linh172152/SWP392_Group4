import { Router } from "express";
import {
  adminAssignTicket,
  adminGetTicketDetails,
  adminListTickets,
  adminReplyTicket,
  adminUpdateTicketStatus,
} from "../controllers/support.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticateToken);
router.use(authorizeRole("ADMIN"));

router.get("/", adminListTickets);
router.get("/:id", adminGetTicketDetails);
router.post("/:id/assign", adminAssignTicket);
router.post("/:id/reply", adminReplyTicket);
router.put("/:id/status", adminUpdateTicketStatus);

export default router;


