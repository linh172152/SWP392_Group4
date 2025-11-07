import { Router } from "express";
import { getPublicPackages } from "../controllers/package.controller";

const router = Router();

router.get("/", getPublicPackages);

export default router;





