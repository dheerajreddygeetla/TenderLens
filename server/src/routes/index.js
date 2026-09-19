import { Router } from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";
import tenderRoutes from "./tender.routes.js";
import companyRoutes from "./company.routes.js";
import bidRoutes from "./bid.routes.js";
import contractRoutes from "./contract.routes.js";
import documentRoutes from "./document.routes.js";
import statsRoutes from "./stats.routes.js";
import probeRoutes from "./_probe.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/tenders", tenderRoutes);
router.use("/companies", companyRoutes);
router.use("/bids", bidRoutes);
router.use("/contracts", contractRoutes);
router.use("/documents", documentRoutes);
router.use("/stats", statsRoutes);
router.use("/_probe", probeRoutes);

export default router;
